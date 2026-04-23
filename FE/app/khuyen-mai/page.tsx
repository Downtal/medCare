"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Gift, Tag, TrendingUp, Ticket, Info } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useQuery } from "@tanstack/react-query"
import { voucherService, Voucher } from "@/services/voucherService"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

import { useState, useMemo } from "react"

export default function PromotionsPage() {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PERCENT' | 'FIXED' | 'FREESHIP' | 'MINE'>('ALL')

  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ["public_vouchers"],
    queryFn: () => voucherService.getActiveVouchers()
  })

  const { data: session } = useSession()
  const router = useRouter()

  const { data: savedVouchers = [], isLoading: isLoadingSaved } = useQuery({
    queryKey: ["saved_vouchers", session?.user?.userId],
    queryFn: () => voucherService.getSavedVouchers(Number(session?.user?.userId)),
    enabled: !!session?.user?.userId
  })

  const filteredVouchers = useMemo(() => {
    if (activeFilter === 'MINE') return savedVouchers;
    if (activeFilter === 'ALL') return vouchers;
    return vouchers.filter((v: Voucher) => v.discountType === activeFilter);
  }, [vouchers, savedVouchers, activeFilter])

  const saveMutation = useMutation({
    mutationFn: (code: string) => {
      const uId = session?.user?.userId || session?.user?.id;
      if (!uId) throw new Error("Chưa đăng nhập")
      return voucherService.saveVoucher(Number(uId), code)
    },
    onSuccess: () => {
      toast.success("Lưu mã giảm giá thành công!")
    },
    onError: (err: any) => {
      if (err.message === "Chưa đăng nhập") {
        toast.error("Vui lòng đăng nhập để lưu mã giảm giá")
        router.push("/dang-nhap")
      } else {
        toast.error(err.response?.data?.message || err.message || "Không thể lưu mã giảm giá")
      }
    }
  })

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success("Đã sao chép mã: " + code)
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <main className="flex-1">
        <section className="relative h-[300px] flex items-center justify-center overflow-hidden bg-primary">
          <div className="absolute inset-0 bg-primary opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          <div className="container relative z-10 mx-auto px-4 text-center">
            <Badge className="mb-4 bg-white/20 text-white border-white/30 backdrop-blur-md px-4 py-1">
               <Gift className="h-4 w-4 mr-2" /> Chương trình ưu đãi hấp dẫn
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 drop-shadow-lg tracking-tight">KHO VOUCHER CỰC KHỦNG</h1>
            <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto font-medium">
              Tiết kiệm tối đa khi mua sắm tại MedCare. Lấy mã ngay, ưu đãi liền tay!
            </p>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
               <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                  <Ticket className="text-primary h-8 w-8" /> Mã Giảm Giá Đang Có
               </h2>
               <div className="flex flex-wrap gap-2">
                  <Button 
                    variant={activeFilter === 'ALL' ? 'default' : 'outline'} 
                    onClick={() => setActiveFilter('ALL')}
                    className="rounded-xl border-slate-200 font-bold"
                  >
                    Tất cả
                  </Button>
                  <Button 
                    variant={activeFilter === 'FREESHIP' ? 'default' : 'outline'} 
                    onClick={() => setActiveFilter('FREESHIP')}
                    className="rounded-xl border-slate-200 font-bold"
                  >
                    Freeship
                  </Button>
                  <Button 
                    variant={activeFilter === 'PERCENT' ? 'default' : 'outline'} 
                    onClick={() => setActiveFilter('PERCENT')}
                    className="rounded-xl border-slate-200 font-bold"
                  >
                    Giảm %
                  </Button>
                  <Button 
                    variant={activeFilter === 'FIXED' ? 'default' : 'outline'} 
                    onClick={() => setActiveFilter('FIXED')}
                    className="rounded-xl border-slate-200 font-bold"
                  >
                    Giá trị cao
                  </Button>

               </div>
            </div>

            {isLoading ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[1,2,3].map(i => <div key={i} className="h-48 bg-white rounded-3xl animate-pulse shadow-sm" />)}
               </div>
            ) : filteredVouchers.length === 0 ? (
               <div className="bg-white rounded-[2.5rem] p-20 text-center shadow-xl border border-dashed border-slate-300">
                  <Info className="h-16 w-16 text-slate-300 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-slate-400">Không tìm thấy mã giảm giá phù hợp</h3>
                  <p className="text-slate-400 mt-2">Vui lòng thử bộ lọc khác hoặc quay lại sau!</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredVouchers.map((voucher: Voucher) => (
                    <div key={voucher.id} className="relative group p-1">
                      <div className="bg-white rounded-[2rem] overflow-hidden shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col h-full transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                        
                        {/* Top: Branding & Discount */}
                        <div className={cn(
                          "p-6 flex items-center gap-4 text-white relative",
                          voucher.discountType === 'FREESHIP' ? "bg-gradient-to-r from-blue-500 to-blue-600" : "bg-gradient-to-r from-rose-500 to-rose-600"
                        )}>
                          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                            <Ticket className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-widest opacity-80 leading-none mb-1">
                              {voucher.discountType === 'FREESHIP' ? "Miễn phí vận chuyển" : "Mã giảm giá"}
                            </div>
                            <div className="text-2xl font-black tracking-tight leading-none">
                              {voucher.discountType === 'PERCENT' ? `Giảm ${voucher.discountValue}%` : 
                               voucher.discountType === 'FIXED' ? `Giảm ${voucher.discountValue.toLocaleString()}đ` : "FREESHIP"}
                            </div>
                          </div>
                          
                          {/* Circle cuts for ticket look */}
                          <div className="absolute -bottom-3 -left-3 w-6 h-6 rounded-full bg-slate-50" />
                          <div className="absolute -bottom-3 -right-3 w-6 h-6 rounded-full bg-slate-50" />
                        </div>

                        {/* Middle: Info */}
                        <div className="p-6 flex-1 flex flex-col bg-white">
                          <h3 className="font-bold text-slate-800 text-lg mb-2 line-clamp-1">
                            {voucher.title}
                          </h3>
                          
                          <div className="space-y-2 mb-6 text-xs text-slate-500 font-medium">
                            <p className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              HSD: {voucher.endAt ? new Date(voucher.endAt).toLocaleDateString("vi-VN") : "Vô thời hạn"}
                            </p>
                            <p className="flex items-center gap-2">
                              <Tag className="h-3 w-3" />
                              {voucher.minOrderValue ? `Đơn từ ${voucher.minOrderValue.toLocaleString()}đ` : "Mọi đơn hàng"}
                            </p>
                            {voucher.maxDiscount && (
                              <p className="flex items-center gap-2 text-rose-500">
                                <TrendingUp className="h-3 w-3" />
                                Giảm tối đa {voucher.maxDiscount.toLocaleString()}đ
                              </p>
                            )}
                          </div>

                          {/* Usage Progress */}
                          <div className="mt-auto pt-4 border-t border-slate-50">
                            <div className="flex justify-between items-end mb-4">
                              <div className="bg-slate-50 rounded-lg px-3 py-1.5 border border-dashed border-slate-200 font-mono font-bold text-slate-700 text-sm tracking-widest">
                                {voucher.code}
                              </div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase">
                                Còn {voucher.usageLimit - (voucher.usedCount || 0)} lượt
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button 
                                variant="outline"
                                className="flex-1 rounded-xl h-10 text-[10px] font-black uppercase tracking-wider border-slate-200"
                                onClick={() => copyToClipboard(voucher.code)}
                              >
                                Sao chép
                              </Button>
                              <Button 
                                className={cn("flex-1 rounded-xl h-10 text-[10px] font-black uppercase tracking-wider shadow-md",
                                  voucher.discountType === 'FREESHIP' ? "bg-blue-600 hover:bg-blue-700 shadow-blue-100" : "bg-rose-600 hover:bg-rose-700 shadow-rose-100"
                                )}
                                onClick={() => saveMutation.mutate(voucher.code)}
                                disabled={(voucher.usedCount || 0) >= (voucher.usageLimit || 0) || saveMutation.isPending}
                              >
                                {(voucher.usedCount || 0) >= (voucher.usageLimit || 0) ? "Đã hết" : "Lưu mã"}
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Footer tiny text */}
                        <div className="bg-slate-50/50 px-6 py-2 border-t border-slate-50">
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter text-center italic">
                              {voucher.excludePrescriptionDrugs ? "* Không áp dụng cho thuốc kê đơn" : "* Áp dụng tất cả sản phẩm"}
                           </p>
                        </div>
                      </div>
                    </div>
                  ))}
               </div>
            )}
          </div>
        </section>

        <section className="bg-white py-24">
          <div className="container mx-auto px-4">
             <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                   <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-4">SỬ DỤNG VOUCHER DỄ DÀNG</h2>
                   <div className="h-1.5 w-20 bg-primary mx-auto rounded-full" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                   {[
                      { step: 1, title: "Lấy Mã", desc: "Lựa chọn Voucher ưu đãi nhất và nhấn Sao chép mã." },
                      { step: 2, title: "Mua Sắm", desc: "Thêm các dược phẩm, thực phẩm chức năng vào giỏ hàng." },
                      { step: 3, title: "Áp Dụng", desc: "Nhập mã tại bước Thanh toán để nhận ưu đãi tức thì." }
                   ].map(s => (
                      <div key={s.step} className="text-center space-y-4">
                         <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center text-2xl font-black mx-auto shadow-lg shadow-primary/5">
                            {s.step}
                         </div>
                         <h4 className="font-black text-slate-800">{s.title}</h4>
                         <p className="text-sm text-slate-500 font-medium leading-relaxed">{s.desc}</p>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
