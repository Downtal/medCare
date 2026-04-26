"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Minimize2, Maximize2, Send, Bot, User, Sparkles, AlertCircle, ThumbsUp, ThumbsDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useChat } from "@/hooks/use-chat";
import { ProductCarousel } from "./product-carousel";

const QUICK_ACTIONS = [
  "Tôi bị đau bụng",
  "Gợi ý combo trị cảm",
  "Hướng dẫn dùng thuốc hạ sốt",
  "Tư vấn thực phẩm chức năng"
];

export function AIChatbot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const { messages, append, isLoading, submitFeedback } = useChat();
  const [feedbackTarget, setFeedbackTarget] = useState<{log_id: number} | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleFeedback = (logId: number, rating: boolean) => {
    if (rating) {
      submitFeedback(logId, true);
    } else {
      setFeedbackTarget({ log_id: logId });
    }
  };

  const submitNegativeFeedback = (reason: string) => {
    if (feedbackTarget) {
      submitFeedback(feedbackTarget.log_id, false, reason);
      setFeedbackTarget(null);
    }
  };

  // Hide on checkout page
  if (pathname === "/thanh-toan" || pathname === "/checkout") return null;

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;
    await append(text);
    setInput("");
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, isLoading]);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              height: isMinimized ? "64px" : "600px"
            }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className={cn(
              "mb-4 w-[650px] overflow-hidden rounded-2xl border bg-background shadow-2xl transition-all duration-300 ease-in-out",
              isMinimized && "border-primary/50 bg-primary/5"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-primary p-4 text-primary-foreground cursor-pointer" onClick={() => isMinimized && setIsMinimized(false)}>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-semibold leading-none">Dược sĩ số MedCare</h3>
                  {!isMinimized && <span className="text-[10px] opacity-80">Sẵn sàng tư vấn 24/7</span>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMinimized(!isMinimized);
                  }}
                >
                  {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </Button>
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

            {!isMinimized && (
              <>
                {/* Chat content */}
                <div className="flex h-[450px] flex-col bg-slate-50/50 p-4 overflow-y-auto scrollbar-hide" ref={scrollRef}>
                  <div className="flex flex-col gap-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex max-w-[90%] flex-col gap-1 group",
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
                    {isLoading && messages[messages.length-1].role === 'user' && (
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

                  {/* Quick Actions */}
                  {messages.length === 1 && (
                    <div className="mt-6 flex flex-wrap gap-2">
                      {QUICK_ACTIONS.map(action => (
                        <Button 
                          key={action} 
                          variant="outline" 
                          size="sm" 
                          className="rounded-full bg-white text-[12px] hover:bg-primary hover:text-white transition-colors"
                          onClick={() => handleSend(action)}
                        >
                          {action}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Input area */}
                <div className="border-t bg-background p-4">
                  <form 
                    className="flex items-center gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                  >
                    <Input 
                      placeholder="Nhập triệu chứng hoặc câu hỏi..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="rounded-full border-slate-200"
                    />
                    <Button 
                      type="submit" 
                      size="icon" 
                      className="rounded-full h-10 w-10 shrink-0"
                      disabled={!input.trim() || isLoading}
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
              </>
            )}

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
