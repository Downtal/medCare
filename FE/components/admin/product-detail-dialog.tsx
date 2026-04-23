"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, ExternalLink, Pill, FileText, ClipboardList, Info, ShieldCheck, Thermometer } from "lucide-react"
import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface ProductDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: any
  onEdit: (product: any) => void
}

export function ProductDetailDialog({ open, onOpenChange, product, onEdit }: ProductDetailDialogProps) {
  const [activeImage, setActiveImage] = useState(product?.primaryImageUrl)

  useEffect(() => {
    setActiveImage(product?.primaryImageUrl)
  }, [product])

  if (!product) return null

  // Combine primary image and other images into a gallery list, filter out duplicates
  const gallery = [product.primaryImageUrl, ...(product.imageUrls || [])].filter((url, index, self) => url && self.indexOf(url) === index)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] lg:max-w-[1500px] w-full max-h-[92vh] overflow-y-auto rounded-[2.5rem] p-0 border-none shadow-2xl">
        <div className="flex flex-col lg:flex-row h-full">
          {/* Left side: Images */}
          <div className="lg:w-1/3 bg-slate-50 p-8 flex flex-col gap-6 border-r">
            <div className="relative aspect-square rounded-2xl bg-white border shadow-sm overflow-hidden flex items-center justify-center p-4 transition-all duration-500">
              <Image 
                src={activeImage || "/placeholder.svg"} 
                alt={product.name} 
                fill 
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-contain p-4 transition-all duration-500 animate-in fade-in zoom-in-95"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {gallery.map((url: string, index: number) => (
                <button 
                  key={index} 
                  onClick={() => setActiveImage(url)}
                  className={cn(
                    "relative w-20 h-20 rounded-xl bg-white border overflow-hidden transition-all duration-200 hover:border-blue-500 hover:shadow-md",
                    activeImage === url ? "border-2 border-blue-500 shadow-md scale-105" : "border-slate-200"
                  )}
                >
                  <Image 
                    src={url} 
                    alt={`img-${index}`} 
                    fill 
                    sizes="80px"
                    className="object-contain p-2" 
                  />
                </button>
              ))}
            </div>
            
            <div className="space-y-4 pt-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Trạng thái</span>
                <Badge className={product.isDeleted ? "bg-rose-500" : "bg-emerald-500"}>
                  {product.isDeleted ? "Đã xóa" : "Đang bán"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Right side: Info */}
          <div className="flex-1 flex flex-col">
            <DialogHeader className="p-8 pb-4">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-blue-200 text-blue-600 font-bold bg-blue-50">
                      {product.brand || "Brand"}
                    </Badge>
                    {product.requiresPrescription && (
                      <Badge className="bg-rose-100 text-rose-600 border-rose-200 font-bold">
                        <ShieldCheck className="w-3 h-3 mr-1" /> Thuốc kê đơn
                      </Badge>
                    )}
                  </div>
                  <DialogTitle className="text-3xl font-black text-slate-800 leading-tight">
                    {product.name}
                  </DialogTitle>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" className="rounded-xl" onClick={() => window.open(`/san-pham/${product.slug}`, "_blank")}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700 font-bold rounded-xl px-6" onClick={() => onEdit(product)}>
                    <Edit className="mr-2 h-4 w-4" /> Chỉnh sửa
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mt-4">
                <div className="text-3xl font-black text-blue-700">
                  {Number(product.price).toLocaleString("vi-VN")} đ
                </div>
                {product.originalPrice && product.originalPrice > product.price && (
                  <div className="text-lg text-slate-400 line-through font-medium">
                    {Number(product.originalPrice).toLocaleString("vi-VN")} đ
                  </div>
                )}
                {product.discountPercentage > 0 && (
                  <Badge className="bg-orange-500 font-black h-7">-{product.discountPercentage}%</Badge>
                )}
              </div>
            </DialogHeader>

            <div className="px-8 flex-1">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="bg-slate-100 p-1 rounded-xl h-12 w-fit mb-6">
                  <TabsTrigger value="overview" className="rounded-lg font-bold">Tổng quan</TabsTrigger>
                  <TabsTrigger value="medical" className="rounded-lg font-bold">Y khoa</TabsTrigger>
                  <TabsTrigger value="instructions" className="rounded-lg font-bold">HDSD</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 pb-8">
                  <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quy cách đóng gói</p>
                      <p className="font-bold text-slate-700 flex items-center gap-2 italic uppercase border-l-4 border-blue-500 pl-3">
                         {product.packingUnit || "Không rõ"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Xuất xứ</p>
                      <p className="font-bold text-slate-700">{product.countryOfOrigin || "Chưa rõ"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Số đăng ký</p>
                      <p className="font-bold text-slate-700">{product.registrationNumber || "N/A"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã SKU</p>
                      <p className="font-bold text-slate-700">{product.sourceSku || "N/A"}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="flex items-center gap-2 font-black text-slate-800 uppercase text-xs tracking-tight">
                      <Pill className="h-4 w-4 text-blue-500" /> Thành phần hoạt chất
                    </h4>
                    <div 
                      className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 font-bold italic prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: product.activeIngredients || "Đang cập nhật..." }}
                    />
                  </div>

                  <div className="space-y-2">
                    <h4 className="flex items-center gap-2 font-black text-slate-800 uppercase text-xs tracking-tight">
                      <Info className="h-4 w-4 text-indigo-500" /> Mô tả sản phẩm
                    </h4>
                    <div 
                      className="text-sm text-slate-600 leading-relaxed prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: product.description || "Chưa có mô tả chi tiết." }}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="medical" className="space-y-6 pb-8 animate-in fade-in zoom-in-95">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-blue-50/50 p-5 rounded-3xl border border-blue-100 space-y-3">
                         <h4 className="font-black text-blue-700 flex items-center gap-2 text-sm">
                            <Thermometer className="h-4 w-4" /> Chỉ định
                         </h4>
                         <div 
                            className="text-sm text-slate-700 font-medium leading-relaxed italic prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: product.indications || "Liên hệ dược sĩ để biết thêm chi tiết." }}
                         />
                      </div>
                      <div className="bg-rose-50/50 p-5 rounded-3xl border border-rose-100 space-y-3">
                         <h4 className="font-black text-rose-700 flex items-center gap-2 text-sm">
                            <ShieldCheck className="h-4 w-4" /> Chống chỉ định
                         </h4>
                         <div 
                            className="text-sm text-slate-700 font-medium leading-relaxed italic prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: product.contraindications || "Theo chỉ dẫn của bác sĩ." }}
                         />
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h4 className="font-black text-slate-800 text-sm flex items-center gap-2">
                         <ClipboardList className="h-4 w-4 text-amber-500" /> Tác dụng phụ
                      </h4>
                      <div 
                        className="text-sm text-slate-600 bg-slate-50 p-4 rounded-2xl border prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: product.sideEffects || "Hiếm gặp các tác dụng phụ không mong muốn." }}
                      />
                   </div>
                </TabsContent>

                <TabsContent value="instructions" className="space-y-6 pb-8">
                   <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 space-y-4">
                      <h4 className="font-black text-emerald-700 text-sm flex items-center gap-2">
                         <FileText className="h-4 w-4" /> Cách dùng & Liều lượng
                      </h4>
                      <div 
                        className="text-sm text-slate-700 font-medium leading-relaxed prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: product.usageInstruction || "Đọc kỹ hướng dẫn sử dụng trước khi dùng." }}
                      />
                   </div>

                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thận trọng</p>
                         <div 
                            className="text-xs text-slate-600 italic prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: product.precautions || "Không có lưu ý đặc biệt." }}
                         />
                      </div>
                      <div className="space-y-2">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bảo quản</p>
                         <div 
                            className="text-xs text-slate-600 italic prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: product.storageConditions || "Nơi khô ráo, tránh ánh nắng trực tiếp." }}
                         />
                      </div>
                   </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
