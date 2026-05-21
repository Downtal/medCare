"use client"

import React, { useState, useEffect, useRef } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Phone,
  MessageSquare,
  Video,
  Clock,
  CheckCircle,
  Stethoscope,
  Mail,
  Star,
  ShieldCheck,
  Users,
  ArrowRight,
  Send,
  Zap,
  User2,
  Bot,
  User,
  Sparkles,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Image as ImageIcon,
  Loader2,
  Info,
  ChevronRight,
  Plus,
  ExternalLink,
  Heart,
  X
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useChat } from "@/hooks/use-chat"
import { ProductCarousel } from "@/components/chat/product-carousel"
import ReactMarkdown from "react-markdown"
import { toast } from "sonner"
import Tesseract from "tesseract.js"
import { cn } from "@/lib/utils"
import { getApiBaseUrl } from "@/lib/config"
import { CurrencyUtils } from "@/lib/currency"

const pharmacists = [
  {
    id: 1,
    name: "Dược sĩ Nguyễn Văn An",
    title: "Dược sĩ cao cấp",
    experience: "15 năm kinh nghiệm",
    specialty: "Thuốc kê đơn, bệnh mãn tính",
    image: null,
    rating: 4.9,
    consultations: 1250,
    available: true,
  },
  {
    id: 2,
    name: "Dược sĩ Trần Thị Bình",
    title: "Dược sĩ chuyên khoa",
    experience: "12 năm kinh nghiệm",
    specialty: "Da liễu, dị ứng",
    image: null,
    rating: 4.8,
    consultations: 980,
    available: true,
  },
  {
    id: 3,
    name: "Dược sĩ Lê Minh Châu",
    title: "Dược sĩ",
    experience: "8 năm kinh nghiệm",
    specialty: "Dinh dưỡng, vitamin",
    image: null,
    rating: 4.7,
    consultations: 650,
    available: false,
  },
]

const consultationMethods = [
  {
    icon: MessageSquare,
    title: "Chat Trực Tuyến",
    description: "Tư vấn qua tin nhắn văn bản, hình ảnh toa thuốc.",
    time: "Phản hồi < 5 phút",
    price: "Miễn phí",
    color: "blue",
  },
  {
    icon: Phone,
    title: "Gọi Điện Thoại",
    description: "Kết nối trực tiếp qua tổng đài ưu tiên.",
    time: "Kết nối ngay",
    price: "Miễn phí",
    color: "green",
  },
  {
    icon: Video,
    title: "Video Call",
    description: "Tư vấn trực quan sinh động 1-1.",
    time: "Đặt lịch trước",
    price: "Miễn phí",
    color: "purple",
  },
]

export default function ConsultationPage() {
  const [input, setInput] = useState("")
  const { messages, append, isLoading, submitFeedback } = useChat()
  const [feedbackTarget, setFeedbackTarget] = useState<{ log_id: number } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [isScanning, setIsScanning] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [suggestedProducts, setSuggestedProducts] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [isChatActive, setIsChatActive] = useState(false)

  // Get unique suggested product IDs in the conversation
  const allProductIds = Array.from(
    new Set(
      messages
        .filter(msg => msg.role === 'assistant' && msg.list_product_ids)
        .flatMap(msg => msg.list_product_ids!)
    )
  )

  // Fetch product info for the sidebar
  useEffect(() => {
    if (allProductIds.length === 0) {
      setSuggestedProducts([])
      return
    }

    const fetchProducts = async () => {
      try {
        setLoadingProducts(true)
        const validIds = allProductIds.filter(id => id && id > 0).slice(0, 8)
        const promises = validIds.map(id =>
          fetch(`${getApiBaseUrl()}/product-service/api/products/${id}`)
            .then(res => res.ok ? res.json() : null)
        )
        const results = (await Promise.all(promises)).filter(p => p !== null)
        setSuggestedProducts(results)
      } catch (error) {
        console.error("Failed to fetch sidebar products", error)
      } finally {
        setLoadingProducts(false)
      }
    }

    fetchProducts()
  }, [JSON.stringify(allProductIds)])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      })
    }
  }, [messages, isLoading, isChatActive])

  // Lock and unlock page scrolling
  useEffect(() => {
    if (isChatActive) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [isChatActive])

  const handleFeedback = (logId: number, rating: boolean) => {
    if (rating) {
      submitFeedback(logId, true)
      toast.success("Cảm ơn bạn đã đánh giá hữu ích!")
    } else {
      setFeedbackTarget({ log_id: logId })
    }
  }

  const submitNegativeFeedback = (reason: string) => {
    if (feedbackTarget) {
      submitFeedback(feedbackTarget.log_id, false, reason)
      setFeedbackTarget(null)
      toast.info("Cảm ơn góp ý của bạn để MedCare cải thiện hơn.")
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsScanning(true)
    setOcrProgress(0)
    toast.info("Đang quét nội dung đơn thuốc...")

    try {
      const result = await Tesseract.recognize(file, 'vie+eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.floor(m.progress * 100))
          }
        }
      })

      const text = result.data.text.trim()
      if (text.length < 10) {
        toast.error("Không thể đọc được nội dung ảnh. Vui lòng chụp rõ hơn.")
      } else {
        const prompt = `Phân tích nội dung đơn thuốc sau:\n\n${text}`
        handleSend(prompt)
      }
    } catch (err) {
      toast.error("Có lỗi khi quét ảnh.")
    } finally {
      setIsScanning(false)
      setOcrProgress(0)
    }
  }

  const handleSend = async (text: string = input) => {
    const messageToSend = typeof text === 'string' ? text : input
    if (!messageToSend.trim() || isLoading) return
    setInput("")
    await append(messageToSend)
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
      <Header />

      <main className="flex-1">

        {/* Modern Hero Section */}
        <section className="relative pt-20 pb-20 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-1/3 h-full bg-accent/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
          </div>

          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
              >
                <Badge variant="secondary" className="mb-6 px-4 py-1.5 rounded-full bg-primary/10 text-primary border-none font-black text-xs uppercase tracking-widest">
                  <Zap className="w-3 h-3 mr-2 fill-current" />
                  Phản hồi trong vòng 60 giây
                </Badge>
                <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight text-slate-900 tracking-tight">
                  Tư vấn chuyên sâu <br /> cùng <span className="text-primary italic">Dược sĩ MedCare</span>
                </h1>
                <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-xl font-medium">
                  Giải đáp mọi thắc mắc về thuốc, cách phối hợp điều trị và dinh dưỡng. An tâm tuyệt đối với đội ngũ dược sĩ chuyên nghiệp.
                </p>

                <div className="flex flex-wrap gap-4 mb-12">
                  <Button
                    size="lg"
                    className="rounded-2xl px-10 h-16 text-lg font-black shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      document.getElementById("ai-chat-section")?.scrollIntoView({ behavior: "smooth" })
                    }}
                  >
                    Trò chuyện với AI <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-2xl px-10 h-16 text-lg font-black border-2 bg-white transition-all hover:bg-slate-50"
                    onClick={() => {
                      document.getElementById("pharmacists-section")?.scrollIntoView({ behavior: "smooth" })
                    }}
                  >
                    Xem hồ sơ dược sĩ
                  </Button>
                </div>

                <div className="flex items-center gap-12 pt-8 border-t border-slate-200">
                  <div className="flex flex-col">
                    <span className="text-3xl font-black text-slate-900">10k+</span>
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-tighter">Ca tư vấn/tháng</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-3xl font-black text-slate-900">4.9/5</span>
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-tighter">Độ hài lòng</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-3xl font-black text-slate-900">24/7</span>
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-tighter">Luôn sẵn sàng</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="relative hidden lg:block"
              >
                <div className="relative aspect-[4/5] rounded-[60px] overflow-hidden shadow-2xl shadow-blue-900/10 border-8 border-white group">
                  <Image
                    src="/pharmacist-consult.png"
                    alt="Pharmacist"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                  <div className="absolute bottom-8 left-8 right-8 p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20">
                    <p className="text-white font-black text-xl mb-1">Dược sĩ Nguyễn Văn An</p>
                    <p className="text-white/80 font-medium text-sm">Trưởng bộ phận tư vấn chuyên môn MedCare</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Large Embedded AI Chatbot Section */}
        <section id="ai-chat-section" className="py-16 bg-slate-50 border-t border-slate-100">
          <div className="container mx-auto px-4">
            {/* Inactive Chat State: Presentation Card */}
            {!isChatActive && (
              <Card className="border-none shadow-2xl rounded-[48px] overflow-hidden bg-white p-8 md:p-16 text-center max-w-3xl mx-auto border border-blue-50/60 relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/30 rounded-full blur-2xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-100/30 rounded-full blur-2xl" />
                
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-blue-600 rounded-[30px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-500/20">
                    <Bot className="w-10 h-10 text-white animate-bounce" />
                  </div>
                  
                  <Badge variant="secondary" className="mb-4 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 border-none font-black text-xs uppercase tracking-widest">
                    Hỗ trợ y tế thông minh
                  </Badge>
                  
                  <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">
                    Trò chuyện với Dược sĩ AI MedCare
                  </h3>
                  
                  <p className="text-slate-500 font-medium text-base md:text-lg mb-8 max-w-xl mx-auto leading-relaxed">
                    Giải đáp nhanh chóng các thắc mắc về triệu chứng sức khỏe, liều lượng dùng thuốc và gợi ý sản phẩm phù hợp tức thì trong giao diện toàn màn hình chuyên biệt.
                  </p>
                  
                  <Button
                    size="lg"
                    className="rounded-2xl px-12 h-16 text-lg font-black bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/30 transition-transform active:scale-95 flex items-center gap-3 mx-auto"
                    onClick={() => setIsChatActive(true)}
                  >
                    Bắt đầu tư vấn ngay
                    <MessageSquare className="w-5 h-5 fill-current" />
                  </Button>
                </div>
              </Card>
            )}

            {/* Active Chat State: Full-Screen Locked Focus Workspace */}
            <AnimatePresence>
              {isChatActive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 md:p-6"
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="w-full max-w-6xl"
                  >
                    <Card className="border-none shadow-2xl rounded-[40px] overflow-hidden bg-white relative flex flex-col h-[90vh] md:h-[80vh]">
                      {/* Header */}
                      <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white border-b border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                            <Bot size={24} />
                          </div>
                          <div>
                            <h3 className="font-black text-lg leading-none">Dược sĩ số MedCare AI</h3>
                            <span className="text-xs opacity-80 flex items-center gap-1.5 mt-1">
                              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                              Đang hoạt động • Chế độ tập trung
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="border-white/30 text-white rounded-full bg-white/10 px-4 py-1 hidden sm:inline-flex">
                            Giao diện chuyên sâu
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-full text-white hover:bg-white/20"
                            onClick={() => setIsChatActive(false)}
                          >
                            <X size={24} />
                          </Button>
                        </div>
                      </div>

                      {/* Main Split Grid */}
                      <div className="grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 flex-1 min-h-0">
                        {/* Left Column: Chat Log and Inputs (8/12) */}
                        <div className="lg:col-span-8 flex flex-col min-h-0 h-full">
                          {/* Chat content */}
                          <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6" ref={scrollRef}>
                            <div className="flex flex-col gap-6">
                              {messages.map((msg) => (
                                <div
                                  key={msg.id}
                                  className={cn(
                                    "flex max-w-[85%] md:max-w-[80%] flex-col gap-1.5 group",
                                    msg.role === "user" ? "self-end items-end" : "self-start items-start"
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "rounded-3xl px-5 py-3 text-sm shadow-sm",
                                      msg.role === "user"
                                        ? "bg-blue-600 text-white rounded-tr-none"
                                        : "bg-white border border-slate-100 rounded-tl-none text-slate-800"
                                    )}
                                  >
                                    <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-p:my-1 prose-headings:my-2 prose-li:my-0.5">
                                      <ReactMarkdown>
                                        {msg.content}
                                      </ReactMarkdown>
                                    </div>
                                  </div>

                                  {/* Render Carousel on mobile ONLY, hidden on desktop since we have a dedicated sidebar */}
                                  {msg.list_product_ids && msg.list_product_ids.length > 0 && (
                                    <div className="w-full max-w-md mt-1 lg:hidden">
                                      <ProductCarousel ids={msg.list_product_ids} />
                                    </div>
                                  )}

                                  {/* Feedback Buttons */}
                                  {msg.role === "assistant" && msg.log_id && (
                                    <div className={cn(
                                      "flex gap-2 mt-1 transition-opacity",
                                      msg.rating !== undefined ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                    )}>
                                      <button
                                        onClick={() => handleFeedback(msg.log_id!, true)}
                                        disabled={msg.rating !== undefined}
                                        className={cn(
                                          "p-1 rounded-full hover:bg-slate-100 transition-colors",
                                          msg.rating === true ? "text-green-600 bg-green-50" : "text-slate-400"
                                        )}
                                      >
                                        <ThumbsUp size={14} />
                                      </button>
                                      <button
                                        onClick={() => handleFeedback(msg.log_id!, false)}
                                        disabled={msg.rating !== undefined}
                                        className={cn(
                                          "p-1 rounded-full hover:bg-slate-100 transition-colors",
                                          msg.rating === false ? "text-red-500 bg-red-50" : "text-slate-400"
                                        )}
                                      >
                                        <ThumbsDown size={14} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}

                              {/* Quick Actions for start */}
                              {messages.length === 1 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {["Tôi bị đau bụng", "Gợi ý combo trị cảm", "Hướng dẫn dùng thuốc hạ sốt", "Tư vấn thực phẩm chức năng"].map((action, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => handleSend(action)}
                                      className="text-xs px-4 py-2.5 rounded-full border border-slate-200 bg-white hover:border-blue-600 hover:text-blue-600 transition-all font-semibold shadow-xs"
                                    >
                                      {action}
                                    </button>
                                  ))}
                                </div>
                              )}

                              {isLoading && (
                                <div className="flex items-center gap-2 text-slate-400 self-start bg-white border border-slate-100 rounded-3xl rounded-tl-none px-5 py-3 shadow-xs">
                                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                  <span className="text-xs font-bold">Dược sĩ AI đang phân tích...</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Input Area */}
                          <div className="p-6 border-t border-slate-100 bg-white">
                            {isScanning && (
                              <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-2xl flex items-center gap-3 text-xs font-bold">
                                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                                <span>Đang nhận diện đơn thuốc (OCR): {ocrProgress}%</span>
                              </div>
                            )}

                            <form
                              onSubmit={(e) => {
                                e.preventDefault()
                                handleSend()
                              }}
                              className="flex items-center gap-3"
                            >
                              <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                className="hidden"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-12 w-12 rounded-full shrink-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isLoading || isScanning}
                              >
                                <ImageIcon size={20} />
                              </Button>
                              <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Nhập triệu chứng hoặc câu hỏi tại đây..."
                                className="flex-1 h-12 rounded-2xl bg-slate-50 border-none px-5 font-medium placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-600"
                                disabled={isLoading || isScanning}
                              />
                              <Button
                                type="submit"
                                size="icon"
                                className="rounded-2xl h-12 w-12 shrink-0 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20"
                                disabled={!input.trim() || isLoading || isScanning}
                              >
                                <Send size={18} />
                              </Button>
                            </form>

                            {/* Disclaimer */}
                            <div className="mt-3 flex items-start gap-1 text-[11px] text-slate-400 leading-tight">
                              <AlertCircle size={12} className="shrink-0 mt-0.5" />
                              <p>Thông tin từ AI chỉ mang tính chất tham khảo, không thay thế chỉ định của bác sĩ chuyên khoa.</p>
                            </div>
                          </div>
                        </div>

                        {/* Right Column: Suggested Products & Health Tips Sidebar (4/12) */}
                        <div className="lg:col-span-4 bg-slate-50/20 p-6 flex flex-col overflow-y-auto h-full">
                          {/* Suggested Products Header */}
                          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                            <h4 className="text-sm font-black text-slate-950 uppercase tracking-wider flex items-center gap-2">
                              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                              Sản phẩm gợi ý
                            </h4>
                            {suggestedProducts.length > 0 && (
                              <span className="text-[10px] bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-black">
                                {suggestedProducts.length} sản phẩm
                              </span>
                            )}
                          </div>

                          {loadingProducts ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-10">
                              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                              <span className="text-xs font-bold text-slate-400">Đang đồng bộ sản phẩm...</span>
                            </div>
                          ) : suggestedProducts.length > 0 ? (
                            <div className="flex flex-col gap-3 flex-1">
                              <p className="text-[11px] font-medium text-slate-400 italic mb-2">
                                Dựa trên nội dung tư vấn, đây là các sản phẩm y tế phù hợp nhất cho bạn:
                              </p>
                              <div className="flex flex-col gap-3">
                                {suggestedProducts.map((product, idx) => (
                                  <div 
                                    key={product.id}
                                    className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl shadow-xs hover:shadow-md transition-shadow group relative overflow-hidden"
                                  >
                                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-50 shrink-0 border border-slate-100">
                                      <Image
                                        src={product.primaryImageUrl || "/placeholder-medicine.png"}
                                        alt={product.name}
                                        fill
                                        className="object-cover"
                                      />
                                      {product.requiresPrescription && (
                                        <span className="absolute bottom-0 inset-x-0 bg-red-600 text-white text-[8px] text-center font-black py-0.5 uppercase tracking-tighter">
                                          Kê đơn
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-between h-16">
                                      <h5 className="text-[12px] font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                                        {product.name}
                                      </h5>
                                      <div className="flex items-center justify-between mt-1">
                                        <span className="text-xs font-black text-blue-600">
                                          {CurrencyUtils.formatVND(product.price)}
                                        </span>
                                        <Link href={`/san-pham/${product.slug}`} target="_blank" className="text-slate-400 hover:text-blue-600 flex items-center gap-1 text-[10px] font-bold">
                                          Chi tiết <ExternalLink size={10} />
                                        </Link>
                                      </div>
                                    </div>
                                    {idx === 0 && (
                                      <div className="absolute top-0 right-0 bg-amber-500 text-white text-[8px] font-black px-2 py-0.5 rounded-bl-xl uppercase tracking-tighter">
                                        Ưu tiên
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            // Empty Suggested Products - Display Interactive FAQs / Topics
                            <div className="flex flex-col gap-4 flex-1">
                              <div className="text-center py-6 px-4 bg-white border border-slate-100 rounded-3xl">
                                <Bot className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-[11px] text-slate-400 font-bold leading-normal">
                                  Dược sĩ AI sẽ gợi ý sản phẩm phù hợp tại đây dựa trên nội dung bạn nhắn.
                                </p>
                              </div>

                              {/* Interactive Topics */}
                              <div className="mt-4 flex-1">
                                <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">Chủ đề tư vấn gợi ý</h5>
                                <div className="flex flex-col gap-2.5">
                                  {[
                                    "Cách xử lý khi bị ngộ độc thực phẩm?",
                                    "Dấu hiệu cảnh báo cơ thể thiếu hụt canxi?",
                                    "Phối hợp thuốc cảm cúm như thế nào đúng cách?",
                                    "Làm sao giảm cơn đau dạ dày nhanh nhất?"
                                  ].map((prompt, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => handleSend(prompt)}
                                      className="text-left text-xs p-3.5 rounded-2xl border border-slate-100 bg-white hover:border-blue-600 hover:text-blue-600 transition-all font-bold shadow-xs text-slate-600 hover:bg-blue-50/10 leading-snug"
                                    >
                                      {prompt}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Commit Section at bottom of sidebar */}
                          <div className="mt-6 pt-4 border-t border-slate-100 space-y-3 shrink-0">
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                              <ShieldCheck className="w-3.5 h-3.5 text-green-500 shrink-0" />
                              <span>Bảo mật thông tin tư vấn 100%</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                              <Stethoscope className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <span>Đội ngũ cố vấn chuyên môn y tế</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Negative Feedback Reason Overlay */}
                      {feedbackTarget && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px] animate-in fade-in duration-200">
                          <Card className="w-[300px] p-6 shadow-2xl border-none rounded-3xl scale-in-95 animate-in bg-white">
                            <h4 className="text-sm font-black mb-4 text-slate-800">Tại sao bạn không hài lòng?</h4>
                            <div className="flex flex-col gap-2">
                              {["Sai thông tin", "Tư vấn nguy hiểm", "Khó hiểu", "Lý do khác"].map(reason => (
                                <Button
                                  key={reason}
                                  variant="outline"
                                  size="sm"
                                  className="justify-start text-xs h-9 rounded-xl hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 font-bold"
                                  onClick={() => submitNegativeFeedback(reason)}
                                >
                                  {reason}
                                </Button>
                              ))}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2 text-xs h-9 rounded-xl text-slate-400 hover:text-slate-600 font-bold"
                                onClick={() => setFeedbackTarget(null)}
                              >
                                Hủy bỏ
                              </Button>
                            </div>
                          </Card>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Methods Grid */}
        <section className="py-24 bg-white border-y border-slate-100">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6">Đa dạng hình thức kết nối</h2>
              <p className="text-slate-500 font-medium text-lg">Chúng tôi tối ưu hóa mọi kênh liên lạc để bạn nhận được lời khuyên y tế nhanh nhất.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {consultationMethods.map((method, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -10 }}
                  className="p-10 bg-slate-50 rounded-[40px] border border-slate-100 transition-all hover:bg-white hover:shadow-2xl hover:shadow-blue-900/5 group"
                >
                  <div className={cn(
                    "w-16 h-16 rounded-3xl flex items-center justify-center mb-8 transition-all",
                    method.color === "blue" ? "bg-blue-100 group-hover:bg-blue-600 group-hover:text-white text-blue-600" :
                    method.color === "green" ? "bg-green-100 group-hover:bg-green-600 group-hover:text-white text-green-600" :
                    "bg-purple-100 group-hover:bg-purple-600 group-hover:text-white text-purple-600"
                  )}>
                    <method.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-4">{method.title}</h3>
                  <p className="text-slate-500 font-medium mb-8 leading-relaxed">{method.description}</p>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{method.time}</p>
                      <p className={cn(
                        "text-lg font-black",
                        method.color === "blue" ? "text-blue-600" :
                        method.color === "green" ? "text-green-600" :
                        "text-purple-600"
                      )}>{method.price}</p>
                    </div>
                    <Button variant="outline" className="rounded-2xl border-2 font-bold px-6">Bắt đầu</Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pharmacists Showcase */}
        <section id="pharmacists-section" className="py-24 bg-slate-50/50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div className="max-w-xl">
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Gặp gỡ chuyên gia</h2>
                <p className="text-slate-500 font-medium text-lg leading-relaxed">Đội ngũ dược sĩ MedCare đều sở hữu chứng chỉ hành nghề và tối thiểu 5 năm kinh nghiệm thực tiễn.</p>
              </div>
              <Button variant="link" className="text-primary font-black text-lg group p-0">
                Tất cả dược sĩ <ChevronRight className="ml-1 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>

            <div className="grid lg:grid-cols-3 gap-10">
              {pharmacists.map((pharma, i) => (
                <motion.div
                  key={pharma.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-blue-900/5 transition-all"
                >
                  <div className="relative w-full aspect-square rounded-[32px] overflow-hidden mb-8 bg-slate-100 flex items-center justify-center">
                    {pharma.image ? (
                      <Image src={pharma.image} alt={pharma.name} fill className="object-cover" />
                    ) : (
                      <User2 className="w-20 h-20 text-slate-300" />
                    )}
                    {pharma.available ? (
                      <div className="absolute top-4 right-4 bg-green-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        TRỰC TUYẾN
                      </div>
                    ) : (
                      <div className="absolute top-4 right-4 bg-slate-400 text-white text-[10px] font-black px-3 py-1.5 rounded-full">NGOẠI TUYẾN</div>
                    )}
                  </div>

                  <div className="mb-8">
                    <h3 className="text-2xl font-black text-slate-900 mb-1">{pharma.name}</h3>
                    <p className="text-primary font-bold text-sm mb-4">{pharma.title}</p>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1 px-3 py-1 bg-amber-50 rounded-full">
                        <Star className="w-3 h-3 text-amber-500 fill-current" />
                        <span className="text-xs font-black text-amber-700">{pharma.rating}</span>
                      </div>
                      <div className="flex items-center gap-1 px-3 py-1 bg-slate-50 rounded-full">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span className="text-xs font-black text-slate-600">{pharma.consultations} tư vấn</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-green-500" />
                      <p className="text-sm font-bold text-slate-600">{pharma.specialty}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-slate-300" />
                      <p className="text-sm font-bold text-slate-400">{pharma.experience}</p>
                    </div>
                  </div>

                  <Button className="w-full h-14 rounded-2xl font-black" disabled={!pharma.available}>
                    Kết nối ngay
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-8 leading-tight">Gửi câu hỏi cho chúng tôi</h2>
                <p className="text-lg text-slate-500 font-medium mb-10 leading-relaxed">
                  Nếu bạn không cần tư vấn trực tiếp ngay lập tức, hãy để lại câu hỏi. Đội ngũ chuyên môn sẽ nghiên cứu và trả lời chi tiết qua Email/Zalo của bạn.
                </p>
                <div className="space-y-6">
                  {[
                    "Bảo mật thông tin cá nhân tuyệt đối",
                    "Được trả lời bởi dược sĩ có chuyên môn phù hợp",
                    "Kèm theo tài liệu hướng dẫn sử dụng thuốc chi tiết"
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-bold text-slate-700">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Card className="border-none shadow-2xl shadow-blue-900/10 rounded-[48px] overflow-hidden">
                <CardContent className="p-10 md:p-14">
                  <form className="space-y-8">
                    <div className="grid md:grid-cols-2 gap-6">
                      <Input placeholder="Họ và tên *" className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold" />
                      <Input placeholder="Số điện thoại *" className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold" />
                    </div>
                    <Input placeholder="Chủ đề bạn muốn tư vấn (VD: Thuốc dạ dày) *" className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold" />
                    <Textarea placeholder="Mô tả chi tiết triệu chứng hoặc thắc mắc của bạn..." rows={5} className="rounded-[32px] bg-slate-50 border-none p-6 font-bold resize-none" />
                    <Button className="w-full h-16 rounded-[24px] font-black text-lg shadow-xl shadow-primary/20">
                      Gửi yêu cầu tư vấn <Send className="ml-2 w-5 h-5" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  )
}
