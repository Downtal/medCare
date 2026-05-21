import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { v4 as uuidv4 } from 'uuid';
import { getApiBaseUrl, API_ENDPOINTS } from '@/lib/config';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  list_product_ids?: number[];
  detected_symptoms?: string[];
  quick_actions?: string[];
  log_id?: number;
  rating?: boolean;
}

export function useChat() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    // Initialize or retrieve session ID
    let sId = sessionStorage.getItem('medcare_chat_session');
    if (!sId) {
      sId = uuidv4();
      sessionStorage.setItem('medcare_chat_session', sId);
    }
    setSessionId(sId);

    // Initial message
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Xin chào! Tôi là **Dược sĩ số MedCare**. Tôi có thể giúp gì cho sức khỏe của bạn hôm nay?'
      }
    ]);
  }, []);

  const submitFeedback = useCallback(async (logId: number, rating: boolean, reason?: string) => {
    try {
      await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.AI}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log_id: logId, rating, reason }),
      });

      setMessages(prev => prev.map(m =>
        m.log_id === logId ? { ...m, rating } : m
      ));
    } catch (e) {
      console.error("Feedback failed", e);
    }
  }, []);

  const append = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const botMsgId = (Date.now() + 1).toString();
    const botMsg: Message = { id: botMsgId, role: 'assistant', content: '' };
    setMessages(prev => [...prev, botMsg]);

    try {
      const response = await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.AI}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': session?.user?.id || '',
        },
        body: JSON.stringify({
          message: content,
          session_id: sessionId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Chat stream failed: ${response.status} - ${errorText}`);
        throw new Error(`Failed to fetch stream: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          // SSE format: data: content
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();

              if (data.includes('|||')) {
                // Final metadata chunk
                const [textPart, jsonPart] = data.split('|||');
                fullContent += textPart;

                try {
                  // Sanitize for control characters that break JSON.parse
                  const sanitizedJson = jsonPart.replace(/[\x00-\x1F\x7F-\x9F]/g, (match) => {
                    if (match === '\n') return '\\n';
                    if (match === '\r') return '\\r';
                    if (match === '\t') return '\\t';
                    return '';
                  });
                  const metadata = JSON.parse(sanitizedJson);
                  setMessages(prev => prev.map(m =>
                    m.id === botMsgId
                      ? {
                        ...m,
                        content: fullContent,
                        list_product_ids: metadata.list_product_ids,
                        detected_symptoms: metadata.detected_symptoms,
                        quick_actions: metadata.quick_actions,
                        log_id: metadata.log_id
                      }
                      : m
                  ));
                } catch (e) {
                  console.error("Failed to parse metadata", e);
                }
              } else {
                fullContent += data;
                setMessages(prev => prev.map(m =>
                  m.id === botMsgId ? { ...m, content: fullContent } : m
                ));
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => prev.map(m =>
        m.id === botMsgId ? { ...m, content: 'Xin lỗi, tôi đang gặp trục trặc kỹ thuật. Vui lòng thử lại sau.' } : m
      ));
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, session, sessionId]);

  return { messages, append, isLoading, submitFeedback };
}
