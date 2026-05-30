"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Check, ShoppingCart, Loader2, FileText, X, AlertCircle, ImageIcon, ArrowLeft, CheckCircle2, BrainCircuit, ScanSearch } from "lucide-react"
import Image from "next/image"
import Tesseract from "tesseract.js"
import { aiService } from "@/services/aiService"
import { productService } from "@/services/productService"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { useRouter, useSearchParams } from "next/navigation"
import { useCartStore } from "@/lib/store/useCartStore"
import Link from "next/link"
import { useSession } from "next-auth/react"

interface SuggestedProduct {
  id: number;
  name: string;
  score: number;
  details?: any;
}

interface ExtractedMedicine {
  original_name: string;
  dosage?: string;
  quantity?: string;
  unit?: string;
  suggested_products: SuggestedProduct[];
  selectedProductId?: number;
}

function PrescriptionSearchContent() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [processStep, setProcessStep] = useState<"idle" | "scanning" | "analyzing" | "searching">("idle")
  const [scanProgress, setScanProgress] = useState(0)
  const [results, setResults] = useState<ExtractedMedicine[]>([])
  const [rawText, setRawText] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addItem } = useCartStore()
  const { data: session } = useSession()

  useEffect(() => {
    // 1. Check sessionStorage first (for cleaner URL flow)
    const pendingText = sessionStorage.getItem("pending_ocr_text")
    if (pendingText) {
      sessionStorage.removeItem("pending_ocr_text") // Clear it immediately
      setRawText(pendingText)
      analyzeText(pendingText)
      return
    }

    // 2. Fallback to URL searchParams (if manual link or refresh with param)
    const textFromUrl = searchParams.get("text")
    if (textFromUrl && !isProcessing && results.length === 0) {
      setRawText(textFromUrl)
      analyzeText(textFromUrl)
    }
  }, [searchParams])

  const analyzeText = async (text: string) => {
    try {
      setIsProcessing(true)
      setProcessStep("analyzing")
      const aiRes = await aiService.extractMedicinesFromText(text, session?.user?.accessToken)
      const extractedMedicines: ExtractedMedicine[] = aiRes.extracted_medicines

      setProcessStep("searching")
      const enrichedResults = await Promise.all(extractedMedicines.map(async (med) => {
        const enrichedProducts = await Promise.all(med.suggested_products.map(async (p) => {
          try {
            const detail = await productService.getProductById(p.id)
            return { ...p, details: detail }
          } catch (e) {
            return p
          }
        }))

        return {
          ...med,
          suggested_products: enrichedProducts,
          selectedProductId: enrichedProducts.length > 0 ? enrichedProducts[0].id : undefined
        }
      }))

      setResults(enrichedResults)
      setIsProcessing(false)
      setProcessStep("idle")
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Lỗi phân tích AI. Vui lòng thử lại.")
      setIsProcessing(false)
      setProcessStep("idle")
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        startAnalysis(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const startAnalysis = async (imgToProcess: string) => {
    try {
      setIsProcessing(true)
      setProcessStep("scanning")
      const ocrResult = await Tesseract.recognize(imgToProcess, 'vie+eng', {
        logger: m => { if (m.status === 'recognizing text') setScanProgress(Math.round(m.progress * 100)) }
      })
      await analyzeText(ocrResult.data.text)
    } catch (error) {
      toast.error("Lỗi trong quá trình quét ảnh.")
      setIsProcessing(false)
    }
  }

  const handleAddAllToCart = async () => {
    let count = 0
    for (const med of results) {
      const selected = med.suggested_products.find(p => p.id === med.selectedProductId)
      if (selected?.details) {
        const details = selected.details
        await addItem({
          medicineId: Number(details.id),
          name: details.name || "",
          slug: details.slug || "",
          imageUrl: details.primaryImageUrl || "/placeholder.svg",
          quantity: 1,
          unit: details.packingUnit ? details.packingUnit.split(' ')[0] || "Hộp" : "Hộp",
          unitPrice: details.price || 0,
          totalPrice: details.price || 0,
          packingUnit: details.packingUnit || "",
          stockQuantity: details.stockQuantity || 100,
          requiresPrescription: details.requiresPrescription || false
        }, session?.user?.accessToken)
        count++
      }
    }
    if (count > 0) {
      toast.success(`Đã thêm ${count} sản phẩm vào giỏ hàng`)
      router.push("/gio-hang")
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Kết quả tìm kiếm bằng ảnh</h1>
      </div>

      {!results.length && !isProcessing ? (
        <Card className="border-dashed border-2 rounded-2xl p-12 text-center bg-white/50">
          <div className="max-w-md mx-auto space-y-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <ImageIcon className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Bắt đầu tìm kiếm</h3>
              <p className="text-slate-500">Tải lên hình ảnh đơn thuốc hoặc bao bì thuốc để AI giúp bạn tìm sản phẩm phù hợp.</p>
            </div>
            <Button onClick={() => fileInputRef.current?.click()} className="h-12 px-8 rounded-xl font-bold">
              Chọn ảnh từ thiết bị
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          </div>
        </Card>
      ) : isProcessing ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border shadow-sm px-4">
          <div className="w-full max-w-md space-y-6">
            <h3 className="text-xl font-bold text-slate-800 text-center mb-8">
              MedCare đang xử lý yêu cầu của bạn
            </h3>
            
            <div className="space-y-4">
              {/* Step 1: Scanning */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${processStep === 'scanning' ? 'bg-primary/5 border border-primary/20 shadow-sm' : processStep === 'analyzing' || processStep === 'searching' ? 'bg-slate-50 border border-slate-100 opacity-70' : 'opacity-50'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${processStep === 'scanning' ? 'bg-primary text-white shadow-md shadow-primary/20 animate-pulse' : processStep === 'analyzing' || processStep === 'searching' ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {processStep === 'analyzing' || processStep === 'searching' ? <CheckCircle2 className="w-5 h-5" /> : <ScanSearch className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <h4 className={`font-bold ${processStep === 'scanning' ? 'text-primary' : 'text-slate-700'}`}>Nhận dạng hình ảnh (OCR)</h4>
                  {processStep === 'scanning' && <p className="text-sm text-slate-500">Đang quét ảnh ({scanProgress}%)...</p>}
                  {(processStep === 'analyzing' || processStep === 'searching') && <p className="text-sm text-slate-500">Hoàn tất</p>}
                </div>
                {processStep === 'scanning' && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
              </motion.div>

              {/* Step 2: Analyzing */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${processStep === 'analyzing' ? 'bg-primary/5 border border-primary/20 shadow-sm' : processStep === 'searching' ? 'bg-slate-50 border border-slate-100 opacity-70' : 'opacity-40 grayscale'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${processStep === 'analyzing' ? 'bg-primary text-white shadow-md shadow-primary/20 animate-pulse' : processStep === 'searching' ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {processStep === 'searching' ? <CheckCircle2 className="w-5 h-5" /> : <BrainCircuit className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <h4 className={`font-bold ${processStep === 'analyzing' ? 'text-primary' : 'text-slate-700'}`}>Gemini AI phân tích</h4>
                  {processStep === 'analyzing' && <p className="text-sm text-slate-500">Đang trích xuất tên thuốc...</p>}
                  {processStep === 'searching' && <p className="text-sm text-slate-500">Hoàn tất</p>}
                </div>
                {processStep === 'analyzing' && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
              </motion.div>

              {/* Step 3: Searching */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${processStep === 'searching' ? 'bg-primary/5 border border-primary/20 shadow-sm' : 'opacity-40 grayscale'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${processStep === 'searching' ? 'bg-primary text-white shadow-md shadow-primary/20 animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                  <Search className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className={`font-bold ${processStep === 'searching' ? 'text-primary' : 'text-slate-700'}`}>Đối chiếu kho hàng</h4>
                  {processStep === 'searching' && <p className="text-sm text-slate-500">Đang tìm sản phẩm phù hợp...</p>}
                </div>
                {processStep === 'searching' && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
              </motion.div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Grouped Results */}
          <div className="space-y-12">
            {results.map((med, medIdx) => (
              <div key={medIdx} className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">
                  {medIdx + 1}. {med.original_name} {med.dosage && `- ${med.dosage}`}
                </h3>

                <div className="space-y-3">
                  {med.suggested_products.map((product) => {
                    const details = product.details
                    if (!details) return null
                    const isSelected = med.selectedProductId === product.id

                    return (
                      <div
                        key={product.id}
                        onClick={() => {
                          const newResults = [...results]
                          newResults[medIdx].selectedProductId = product.id
                          setResults(newResults)
                        }}
                        className={`flex items-center gap-6 p-4 rounded-xl border transition-all cursor-pointer bg-white group ${isSelected ? "border-primary ring-1 ring-primary/20 shadow-md" : "border-slate-100 hover:border-slate-200"
                          }`}
                      >
                        {/* Radio Input */}
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? "border-primary bg-primary" : "border-slate-300"
                          }`}>
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />}
                        </div>

                        {/* Image */}
                        <a
                          href={details.slug ? `/san-pham/${details.slug}` : `/san-pham/${details.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="relative w-20 h-20 bg-white rounded-lg overflow-hidden shrink-0 border border-slate-100 hover:border-blue-400 hover:shadow-sm transition-all"
                        >
                          <Image src={details.primaryImageUrl || "/placeholder.svg"} alt={details.name} fill className="object-contain p-1" />
                        </a>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-700 text-sm line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                            {details.name}
                          </h4>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            {details.requiresPrescription && (
                              <span className="text-[10px] font-bold text-red-500 border border-red-200 px-1.5 py-0.5 rounded inline-block">Cần kê đơn</span>
                            )}
                            <a
                              href={details.slug ? `/san-pham/${details.slug}` : `/san-pham/${details.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-blue-500 hover:text-blue-700 hover:underline inline-flex items-center gap-1 font-semibold"
                            >
                              Xem chi tiết ↗
                            </a>
                          </div>
                        </div>

                        {/* Price & Unit */}
                        <div className="text-right flex flex-col items-end gap-3 min-w-[140px]">
                          <span className="text-lg font-bold text-blue-700">
                            {details.price?.toLocaleString("vi-VN")}đ
                          </span>
                          <div className="flex items-center gap-1 text-slate-600 text-sm border px-3 py-1 rounded-md bg-slate-50">
                            <span>{details.packingUnit || "Hộp"}</span>
                            <X className="w-3 h-3 text-slate-400 rotate-45 ml-1" />
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {med.suggested_products.length === 0 && (
                    <div className="bg-slate-50 p-6 rounded-xl border border-dashed flex flex-col items-center justify-center text-slate-400">
                      <Search className="w-8 h-8 mb-2 opacity-30" />
                      <p className="text-sm font-medium italic">Rất tiếc, MedCare chưa có sản phẩm này trong kho hàng.</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Action Bar */}
          <div className="sticky bottom-8 bg-white/90 backdrop-blur p-6 rounded-2xl border shadow-2xl flex items-center justify-between gap-6 z-10 animate-in slide-in-from-bottom-4">
            <div className="hidden md:block">
              <p className="text-sm text-slate-500">Đã chọn các sản phẩm phù hợp nhất.</p>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
              <Button variant="outline" onClick={() => router.back()} className="h-12 px-6 rounded-xl font-bold flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Quay lại
              </Button>
              <Button onClick={handleAddAllToCart} className="flex-1 md:flex-none h-12 px-10 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 flex items-center gap-3">
                <ShoppingCart className="w-5 h-5" /> Thêm vào giỏ hàng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PrescriptionSearchPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header />
      <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>}>
        <PrescriptionSearchContent />
      </Suspense>
      <Footer />
    </div>
  )
}
