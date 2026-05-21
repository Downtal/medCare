"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User, Sparkles, AlertCircle, ThumbsUp, ThumbsDown, Image as ImageIcon, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useChat } from "@/hooks/use-chat";
import { ProductCarousel } from "./product-carousel";
import { toast } from "sonner";
import Tesseract from "tesseract.js";

const QUICK_ACTIONS = [
  "Tôi bị đau bụng",
  "Gợi ý combo trị cảm",
  "Hướng dẫn dùng thuốc hạ sốt",
  "Tư vấn thực phẩm chức năng"
];

import { useChatStore } from "@/lib/store/useChatStore";

export function AIChatbot() {
  const pathname = usePathname();
  const { isOpen, closeChat, openChat, initialMessage, clearInitialMessage } = useChatStore();
  const [input, setInput] = useState("");
  const { messages, append, isLoading, submitFeedback } = useChat();
  const [feedbackTarget, setFeedbackTarget] = useState<{ log_id: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle initial message (from OCR scan)
  useEffect(() => {
    if (initialMessage && !isLoading) {
      handleSend(initialMessage);
      clearInitialMessage();
    }
  }, [initialMessage, isLoading]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, isLoading]);

  const handleFeedback = (logId: number, rating: boolean) => {
    if (rating) {
      submitFeedback(logId, true);
      toast.success("Cảm ơn bạn đã đánh giá hữu ích!");
    } else {
      setFeedbackTarget({ log_id: logId });
    }
  };

  const submitNegativeFeedback = (reason: string) => {
    if (feedbackTarget) {
      submitFeedback(feedbackTarget.log_id, false, reason);
      setFeedbackTarget(null);
      toast.info("Cảm ơn góp ý của bạn để MedCare cải thiện hơn.");
    }
  };

  // Hide on authentication, admin, and consultation pages
  const isAuthPage = pathname === "/dang-nhap" || pathname === "/dang-ky";
  const isCheckoutPage = pathname === "/thanh-toan" || pathname === "/checkout";
  const isAdminPage = pathname?.startsWith("/admin");
  const isConsultationPage = pathname === "/tu-van";

  if (isAuthPage || isCheckoutPage || isAdminPage || isConsultationPage) return null;

  const toggleChat = () => {
    if (isOpen) closeChat();
    else openChat();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setOcrProgress(0);
    toast.info("Đang quét nội dung đơn thuốc...");

    try {
      const result = await Tesseract.recognize(file, 'vie+eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.floor(m.progress * 100));
          }
        }
      });

      const text = result.data.text.trim();
      if (text.length < 10) {
        toast.error("Không thể đọc được nội dung ảnh. Vui lòng chụp rõ hơn.");
      } else {
        const prompt = `Phân tích nội dung đơn thuốc sau:\n\n${text}`;
        handleSend(prompt);
      }
    } catch (err) {
      toast.error("Có lỗi khi quét ảnh.");
    } finally {
      setIsScanning(false);
      setOcrProgress(0);
    }
  };

  const handleSend = async (text: string = input) => {
    const messageToSend = typeof text === 'string' ? text : input;
    if (!messageToSend.trim() || isLoading) return;
    setInput("");
    await append(messageToSend);

  };


  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] flex flex-col items-end max-w-[calc(100vw-2rem)] sm:max-w-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              height: "600px"
            }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="mb-4 w-[calc(100vw-2rem)] sm:w-[450px] md:w-[650px] overflow-hidden rounded-2xl border bg-background shadow-2xl transition-all duration-300 ease-in-out"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-primary p-4 text-primary-foreground">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-semibold leading-none">Dược sĩ số MedCare</h3>
                  <span className="text-[10px] opacity-80">Sẵn sàng tư vấn 24/7</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleChat();
                  }}
                >
                  <X size={18} />
                </Button>
              </div>
            </div>
                {/* Chat content */}
                <div className="flex h-[450px] flex-col bg-slate-50/50 p-4 overflow-y-auto scrollbar-hide" ref={scrollRef}>
                  <div className="flex flex-col gap-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex max-w-[85%] md:max-w-[70%] flex-col gap-1 group",
                          msg.role === "user" ? "self-end items-end" : "self-start items-start"
                        )}
                      >
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-2 text-sm shadow-sm",
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground rounded-tr-none"
                              : "bg-white border rounded-tl-none"
                          )}
                        >
                          <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-p:my-1 prose-headings:my-2 prose-li:my-0.5">
                            <ReactMarkdown>
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        </div>

                        {/* Render Carousel if products suggested */}
                        {msg.list_product_ids && msg.list_product_ids.length > 0 && (
                          <ProductCarousel ids={msg.list_product_ids} />
                        )}

                        {/* Feedback Buttons */}
                        {msg.role === "assistant" && msg.log_id && (
                          <div className={cn(
                            "flex gap-2 mt-1 transition-opacity",
                            msg.rating !== undefined ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                          )}>
                            <button
                              onClick={() => handleFeedback(msg.log_id!, true)}
                              className={cn(
                                "p-1 rounded hover:bg-slate-200 transition-colors",
                                msg.rating === true ? "text-green-600 bg-green-50" : "text-slate-400"
                              )}
                            >
                              <ThumbsUp size={12} />
                            </button>
                            <button
                              onClick={() => handleFeedback(msg.log_id!, false)}
                              className={cn(
                                "p-1 rounded hover:bg-slate-200 transition-colors",
                                msg.rating === false ? "text-red-600 bg-red-50" : "text-slate-400"
                              )}
                            >
                              <ThumbsDown size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {isLoading && messages[messages.length - 1].role === 'user' && (
                      <div className="flex self-start items-start gap-2">
                        <div className="h-8 w-8 rounded-full bg-slate-200 animate-pulse flex items-center justify-center">
                          <Sparkles size={14} className="text-primary animate-spin" />
                        </div>
                        <div className="bg-white border rounded-2xl rounded-tl-none px-4 py-2 text-sm text-slate-400">
                          Dược sĩ đang phân tích...
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dynamic Quick Actions */}
                  {!isLoading && (
                    <ScrollArea className="w-full mt-4">
                      <div className="flex gap-2 pb-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {(messages[messages.length - 1]?.quick_actions || (messages.length === 1 ? QUICK_ACTIONS : [])).map(action => (
                          <Button
                            key={action}
                            variant="outline"
                            size="sm"
                            className="rounded-full whitespace-nowrap bg-white text-[12px] font-bold border-primary/20 text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                            onClick={() => handleSend(action)}
                          >
                            {action}
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>

                {/* Input area */}
                <div className="border-t bg-background p-4 relative">
                  {isScanning && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 overflow-hidden">
                      <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${ocrProgress}%` }}
                      />
                    </div>
                  )}

                  <form
                    className="flex items-center gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "rounded-full h-10 w-10 shrink-0 text-slate-400 hover:text-primary hover:bg-primary/5",
                        isScanning && "text-primary animate-pulse"
                      )}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isScanning || isLoading}
                    >
                      {isScanning ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20} />}
                    </Button>

                    <Input
                      placeholder={isScanning ? `Đang quét: ${ocrProgress}%...` : "Nhập triệu chứng hoặc câu hỏi..."}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="rounded-full border-slate-200"
                      disabled={isScanning}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="rounded-full h-10 w-10 shrink-0"
                      disabled={!input.trim() || isLoading || isScanning}
                    >
                      <Send size={18} />
                    </Button>
                  </form>

                  {/* Disclaimer */}
                  <div className="mt-2 flex items-start gap-1 text-[10px] text-slate-400 leading-tight">
                    <AlertCircle size={10} className="shrink-0 mt-0.5" />
                    <p>Thông tin từ AI chỉ mang tính chất tham khảo, không thay thế chỉ định của bác sĩ.</p>
                  </div>
                </div>


            {/* Negative Feedback Reason Overlay */}
            {feedbackTarget && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px] animate-in fade-in duration-200">
                <Card className="w-[280px] p-4 shadow-xl border-primary/20 scale-in-95 animate-in">
                  <h4 className="text-sm font-semibold mb-3">Tại sao bạn không hài lòng?</h4>
                  <div className="flex flex-col gap-2">
                    {["Sai thông tin", "Tư vấn nguy hiểm", "Khó hiểu", "Lý do khác"].map(reason => (
                      <Button
                        key={reason}
                        variant="outline"
                        size="sm"
                        className="justify-start text-xs h-8 hover:bg-primary/5 hover:text-primary"
                        onClick={() => submitNegativeFeedback(reason)}
                      >
                        {reason}
                      </Button>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-xs h-8 text-slate-400"
                      onClick={() => setFeedbackTarget(null)}
                    >
                      Hủy bỏ
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleChat}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-colors",
          isOpen ? "bg-slate-200 text-slate-600" : "bg-primary text-primary-foreground"
        )}
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </motion.button>
    </div>
  );
}
