"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Upload, FileText, Camera, ShieldCheck, 
  Clock, AlertCircle, ArrowRight, Loader2,
  CheckCircle2, X
} from "lucide-react"
import { prescriptionService } from "@/services/prescriptionService"
import { toast } from "sonner"
import Image from "next/image"

export default function PrescriptionPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chỉ chọn tệp hình ảnh.")
      return
    }
    const url = URL.createObjectURL(file)
    setSelectedFile(file)
    setPreviewUrl(url)
  }

  const handleUpload = async () => {
    if (status !== "authenticated") {
      toast.error("Vui lòng đăng nhập để gửi đơn thuốc.")
      router.push("/dang-nhap?callbackUrl=/toa-thuoc")
      return
    }

    if (!selectedFile) return
    setIsUploading(true)
    try {
      await prescriptionService.uploadPrescription(selectedFile)
      toast.success("Tải đơn thuốc lên thành công!")
      // Redirect to history after success
      router.push("/tai-khoan/don-thuoc")
    } catch (error) {
      toast.error("Không thể tải đơn thuốc lên. Vui lòng thử lại.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-10">
          <Badge className="mb-4 bg-blue-100 text-blue-600 border-none font-bold px-4 py-1">
            Dịch vụ y tế chuyên nghiệp
          </Badge>
          <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Gửi đơn thuốc trực tuyến</h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
            Tải lên đơn thuốc của bạn để được các Dược sĩ MedCare thẩm định và hỗ trợ đặt hàng thuốc kê đơn nhanh chóng.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Side: Upload Area */}
          <div className="lg:col-span-7">
            <Card className="rounded-[40px] border-none shadow-2xl shadow-blue-900/5 overflow-hidden bg-white">
              <CardContent className="p-8">
                {!previewUrl ? (
                  <div 
                    className="group relative border-2 border-dashed border-slate-200 rounded-[32px] p-12 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleFileSelect} 
                    />
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                        <Upload className="h-10 w-10 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-black text-slate-800 mb-2">Nhấn để tải ảnh đơn thuốc</h3>
                      <p className="text-slate-400 text-sm font-medium mb-6">Hỗ trợ định dạng JPG, PNG, WEBP (Tối đa 5MB)</p>
                      <Button variant="outline" className="rounded-full px-8 border-slate-200 font-bold text-slate-600">
                        <Camera className="w-4 h-4 mr-2" /> Chọn từ thiết bị
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="relative aspect-[4/3] w-full rounded-[32px] overflow-hidden border border-slate-100 bg-slate-50 group">
                      <Image src={previewUrl} alt="Preview" fill className="object-contain p-4" />
                      <button 
                        onClick={() => {setPreviewUrl(null); setSelectedFile(null)}}
                        className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur shadow-lg rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <Button 
                      className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-lg font-black shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                      onClick={handleUpload}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                          Đang xử lý đơn thuốc...
                        </>
                      ) : (
                        <>
                          Gửi đơn thuốc ngay <ArrowRight className="ml-2 w-5 h-5" />
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Side: Guidelines & Trust */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
              <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                Hướng dẫn chụp ảnh
              </h4>
              <ul className="space-y-4">
                <GuidelineItem text="Chụp chính diện, rõ nét tất cả các mặt của đơn thuốc." />
                <GuidelineItem text="Đảm bảo thấy rõ thông tin bệnh nhân, bác sĩ và ngày kê đơn." />
                <GuidelineItem text="Đơn thuốc phải còn hiệu lực (trong vòng 30 ngày)." />
              </ul>
            </div>

            <div className="bg-emerald-50 rounded-[32px] p-6 border border-emerald-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <ShieldCheck className="h-6 w-6 text-emerald-600" />
                </div>
                <h4 className="font-black text-emerald-900">Cam kết bảo mật</h4>
              </div>
              <p className="text-sm text-emerald-700 font-medium leading-relaxed">
                Thông tin y tế của bạn được MedCare bảo mật tuyệt đối theo tiêu chuẩn HIPAA. Chỉ Dược sĩ chuyên môn mới được quyền tiếp nhận và xử lý đơn thuốc này.
              </p>
            </div>

            <div className="flex items-center gap-4 p-4 bg-slate-100/50 rounded-2xl border border-slate-200/50">
              <Clock className="w-5 h-5 text-slate-400" />
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Thời gian thẩm định trung bình: 15-30 phút</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

function GuidelineItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <CheckCircle2 className="w-4 h-4 text-blue-500 mt-1 shrink-0" />
      <span className="text-sm text-slate-600 font-medium">{text}</span>
    </li>
  )
}
