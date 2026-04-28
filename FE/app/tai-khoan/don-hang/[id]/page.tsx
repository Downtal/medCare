"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
   ChevronLeft,
   Package,
   Truck,
   MapPin,
   CreditCard,
   Clock,
   CheckCircle2,
   AlertCircle,
   FileText,
   Calendar,
   User,
   Phone,
   MessageSquare,
   Star,
   Loader2,
   XCircle,
   ShoppingBag,
   Copy,
   ChevronRight,
   Home,
   Store,
   MapPinHouse,
   ExternalLink
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Order, orderService } from "@/services/orderService"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

export default function OrderDetailPage() {
   const { id } = useParams()
   const router = useRouter()
   const [order, setOrder] = useState<Order | null>(null)
   const [loading, setLoading] = useState(true)
   const [showReviewDialog, setShowReviewDialog] = useState(false)
   const [reviewRating, setReviewRating] = useState(5)
   const [reviewComment, setReviewComment] = useState("")

   useEffect(() => {
      const fetchOrderDetail = async () => {
         try {
            setLoading(true)
            const data = await orderService.getOrderByCode(id as string)
            setOrder(data)
         } catch (error) {
            console.error("Failed to fetch order detail:", error)
            toast.error("Không thể tải thông tin đơn hàng")
         } finally {
            setLoading(false)
         }
      }

      if (id) {
         fetchOrderDetail()
      }
   }, [id])

   const getStatusLabel = (status: string) => {
      switch (status) {
         case "PENDING": return "Đang xử lý"
         case "CONFIRMED": return "Đã xác nhận"
         case "SHIPPING": return "Đang giao hàng"
         case "DELIVERED": return "Đã giao"
         case "CANCELLED": return "Đã hủy"
         case "RETURNED": return "Đã trả hàng"
         default: return status
      }
   }

   if (loading) {
      return (
         <div className="min-h-screen flex flex-col bg-slate-50">
            <Header />
            <main className="flex-1 flex items-center justify-center">
               <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                  <p className="text-slate-500 font-medium">Đang tải chi tiết đơn hàng...</p>
               </div>
            </main>
            <Footer />
         </div>
      )
   }

   if (!order) {
      return (
         <div className="min-h-screen flex flex-col bg-slate-50">
            <Header />
            <main className="flex-1 flex items-center justify-center p-4">
               <Card className="max-w-md w-full text-center p-8 rounded-3xl">
                  <div className="bg-rose-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                     <AlertCircle className="h-8 w-8 text-rose-500" />
                  </div>
                  <h2 className="text-xl font-bold mb-2">Không tìm thấy đơn hàng</h2>
                  <p className="text-slate-500 mb-6">Mã đơn hàng không tồn tại hoặc đã bị xóa.</p>
                  <Button onClick={() => router.push("/tai-khoan?tab=orders")} className="w-full rounded-full bg-blue-600">
                     Quay lại danh sách
                  </Button>
               </Card>
            </main>
            <Footer />
         </div>
      )
   }

   return (
      <div className="min-h-screen flex flex-col bg-blue-50/30">
         <Header />

         <main className="flex-1 container mx-auto px-4 py-6">
            <div className="max-w-7xl mx-auto">
               {/* Breadcrumbs */}
               <div className="flex items-center gap-2 text-sm text-slate-500 mb-6 font-medium">
                  <Link href="/" className="hover:text-blue-600">Trang chủ</Link>
                  <ChevronRight className="h-3 w-3" />
                  <Link href="/tai-khoan/ho-so" className="hover:text-blue-600">Cá nhân</Link>
                  <ChevronRight className="h-3 w-3" />
                  <Link href="/tai-khoan/don-hang" className="hover:text-blue-600">Đơn hàng của tôi</Link>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-slate-900">Chi tiết đơn hàng</span>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                     {/* Header Box */}
                     <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                        <CardContent className="p-6">
                           <div className="flex flex-wrap items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                 <h1 className="text-lg font-black text-slate-900">Đơn hàng {format(new Date(order.createdAt), "dd/MM/yyyy", { locale: vi })}</h1>
                                 <Separator orientation="vertical" className="h-4 bg-slate-200" />
                                 <div className="text-sm text-slate-500 flex items-center gap-1.5">
                                    Nhận tại cửa hàng • <span className="font-bold text-slate-800">#{order.orderCode}</span>
                                    <button className="text-blue-500 hover:underline flex items-center gap-1 ml-1" onClick={() => {
                                       navigator.clipboard.writeText(order.orderCode);
                                       toast.success("Đã sao chép mã đơn hàng");
                                    }}>
                                       Sao chép
                                    </button>
                                 </div>
                              </div>
                              <div className="flex items-center gap-2">
                                 <div className={`h-2 w-2 rounded-full ${order.status === 'DELIVERED' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                 <span className={`text-sm font-black uppercase tracking-tight ${order.status === 'DELIVERED' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {getStatusLabel(order.status)}
                                 </span>
                              </div>
                           </div>

                           <Separator className="my-6 border-slate-50" />

                           {/* Tracking Status Box */}
                           <div className={cn(
                              "rounded-2xl p-6 border transition-all duration-500",
                              order.status === 'DELIVERED' ? "bg-emerald-50 border-emerald-100" : 
                              order.status === 'CANCELLED' ? "bg-rose-50 border-rose-100" :
                              order.status === 'SHIPPING' ? "bg-blue-50 border-blue-100" :
                              "bg-amber-50 border-amber-100"
                           )}>
                              <div className="flex items-start gap-4">
                                 <div className={cn(
                                    "p-2 rounded-full mt-1 animate-pulse",
                                    order.status === 'DELIVERED' ? "bg-emerald-500" : 
                                    order.status === 'CANCELLED' ? "bg-rose-500" :
                                    order.status === 'SHIPPING' ? "bg-blue-500" :
                                    "bg-amber-500"
                                 )}>
                                    {order.status === 'DELIVERED' ? <CheckCircle2 className="h-4 w-4 text-white" /> : 
                                     order.status === 'CANCELLED' ? <XCircle className="h-4 w-4 text-white" /> :
                                     order.status === 'SHIPPING' ? <Truck className="h-4 w-4 text-white" /> :
                                     <Clock className="h-4 w-4 text-white" />}
                                 </div>
                                 <div>
                                    <p className={cn(
                                       "text-sm font-bold mb-1",
                                       order.status === 'DELIVERED' ? "text-emerald-600" : 
                                       order.status === 'CANCELLED' ? "text-rose-600" :
                                       order.status === 'SHIPPING' ? "text-blue-600" :
                                       "text-amber-600"
                                    )}>
                                       {order.status === 'DELIVERED' ? 'Giao hàng thành công' : 
                                        order.status === 'CANCELLED' ? 'Đơn hàng đã hủy' :
                                        order.status === 'SHIPPING' ? 'Đang trên đường giao' :
                                        order.status === 'CONFIRMED' ? 'Đã xác nhận & Chuẩn bị hàng' : 'Chờ xác nhận'}
                                    </p>
                                    <h2 className="text-xl font-black text-slate-900 mb-2">
                                       {order.status === 'DELIVERED' ? 'Kiện hàng đã được giao' : 
                                        order.status === 'CANCELLED' ? 'Đơn hàng đã bị hủy bỏ' :
                                        order.status === 'SHIPPING' ? 'Shipper đang giao hàng' :
                                        order.status === 'CONFIRMED' ? 'Đang chuẩn bị sản phẩm' : 'Đang xử lý đơn hàng'}
                                    </h2>
                                    <p className="text-sm text-slate-500 font-medium">
                                       {order.status === 'DELIVERED' ? 'Cảm ơn bạn đã tin tưởng và mua sắm tại MedCare.' : 
                                        order.status === 'CANCELLED' ? 'Đơn hàng đã được hủy theo yêu cầu hoặc do vấn đề thanh toán.' :
                                        order.status === 'SHIPPING' ? 'Kiện hàng đang được chuyển tới bạn. Vui lòng để ý điện thoại nhé!' :
                                        order.status === 'CONFIRMED' ? 'Dược sĩ đang kiểm tra và đóng gói sản phẩm cho bạn.' : 
                                        'Hệ thống đã ghi nhận đơn hàng và sẽ sớm liên hệ xác nhận.'}
                                    </p>
                                 </div>
                              </div>
                           </div>

                           <div className="grid md:grid-cols-2 gap-8 mt-8">
                              <div className="space-y-4">
                                 <div className="flex items-center gap-2 text-slate-400">
                                    <User className="h-4 w-4" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Thông tin người nhận</span>
                                 </div>
                                 <div className="pl-6">
                                    <p className="font-black text-slate-900 text-lg">{order.recipientName}</p>
                                    <p className="text-slate-500 font-medium mt-1">{order.recipientPhone}</p>
                                 </div>
                              </div>
                              <div className="space-y-4">
                                 <div className="flex items-center gap-2 text-slate-400">
                                    <MapPinHouse className="h-4 w-4" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Nhận hàng tại</span>
                                 </div>
                                 <div className="pl-6">
                                    <p className="font-bold text-slate-800 leading-relaxed">{order.recipientAddress}</p>

                                 </div>
                              </div>
                           </div>
                        </CardContent>
                     </Card>

                     {/* Product List Box */}
                     <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                        <div className="px-6 py-5 border-b border-slate-50">
                           <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Danh sách sản phẩm</h3>
                        </div>
                        <CardContent className="p-0">
                           <div className="divide-y divide-slate-50">
                              {order.items.map((item, idx) => (
                                 <div key={item.medicineId || idx} className="p-6 flex items-center gap-6 group hover:bg-slate-50/50 transition-all">
                                    <div className="relative h-20 w-20 rounded-xl overflow-hidden border border-slate-100 bg-white shrink-0 group-hover:border-blue-100 transition-colors">
                                       <Image
                                          src={item.imageUrl || "/placeholder.svg"}
                                          alt={item.medicineName}
                                          fill
                                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                                       />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                       <h4 className="font-bold text-slate-800 text-[15px] leading-snug line-clamp-2 mb-2">
                                          {item.medicineName}
                                       </h4>
                                       <div className="text-xs text-slate-400 font-medium">
                                          Quy cách: Hộp 10 vỉ x 10 viên
                                       </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                       <p className="font-black text-slate-900 text-base">{item.unitPrice.toLocaleString("vi-VN")}đ</p>
                                       <p className="text-xs text-slate-500 font-bold mt-1">x{item.quantity} Viên</p>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </CardContent>
                     </Card>
                  </div>

                  <div className="space-y-6">
                     {/* Payment Summary Sidebar */}
                     <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white sticky top-6">
                        <div className="p-6 border-b border-slate-50">
                           <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Thông tin thanh toán</h3>
                        </div>
                        <CardContent className="p-6 space-y-4">
                           <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-500 font-medium">Tổng tiền</span>
                              <span className="font-black text-slate-900">{order.totalPrice.toLocaleString("vi-VN")}đ</span>
                           </div>
                           <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-500 font-medium">Giảm giá trực tiếp</span>
                              <span className="font-black text-rose-500">0đ</span>
                           </div>
                           <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-500 font-medium flex items-center gap-1">
                                 Giảm giá voucher
                                 <AlertCircle className="h-3.5 w-3.5 text-slate-300" />
                              </span>
                              <span className="font-black text-rose-500">-{order.discountAmount?.toLocaleString("vi-VN") || 0}đ</span>
                           </div>
                           <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-500 font-medium">Phí vận chuyển</span>
                              <span className="font-black text-blue-600">{order.shippingFee === 0 ? 'Miễn phí' : `${order.shippingFee.toLocaleString("vi-VN")}đ`}</span>
                           </div>

                           <Separator className="my-2 bg-slate-50" />

                           <div className="flex justify-between items-end">
                              <span className="text-sm font-bold text-slate-800">Thành tiền</span>
                              <span className="text-2xl font-black text-blue-600 leading-none">{order.grandTotal.toLocaleString("vi-VN")}đ</span>
                           </div>

                           <div className="mt-8 space-y-3">
                              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Phương thức thanh toán</p>
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                                    <div className="bg-blue-50 p-2 rounded-xl">
                                       <CreditCard className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <p className="text-xs font-bold text-slate-700">
                                       {order.paymentMethod === 'VNPAY' ? 'Thanh toán qua VNPAY' : 'Thanh toán bằng tiền mặt'}
                                    </p>
                                 </div>
                                 {order.paymentStatus === 'PAID' && (
                                    <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-1 rounded-full">
                                       <CheckCircle2 className="h-3 w-3" />
                                       Đã thanh toán
                                    </div>
                                 )}
                              </div>
                           </div>

                           <Button className="w-full rounded-full bg-blue-600 hover:bg-blue-700 h-14 font-black text-base shadow-xl shadow-blue-500/20 mt-6 transition-all hover:-translate-y-1 active:translate-y-0">
                              Mua lại
                           </Button>

                           {order.status === 'DELIVERED' && (
                              <Button 
                                onClick={() => setShowReviewDialog(true)}
                                className="w-full rounded-full bg-emerald-600 hover:bg-emerald-700 h-14 font-black text-base shadow-xl shadow-emerald-500/20 mt-3 transition-all hover:-translate-y-1 active:translate-y-0"
                              >
                                 <Star className="w-5 h-5 mr-2" />
                                 Đánh giá đơn hàng
                              </Button>
                           )}

                           <Button variant="outline" className="w-full rounded-full border-slate-200 text-slate-600 h-12 font-bold text-sm mt-3">
                              Liên hệ hỗ trợ
                           </Button>
                        </CardContent>
                     </Card>
                  </div>
               </div>
            </div>
         </main>

         <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
            <DialogContent className="sm:max-w-[450px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
               <div className="bg-emerald-600 p-8 text-white relative overflow-hidden">
                  <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
                     <Star className="h-32 w-32 fill-current" />
                  </div>
                  <DialogHeader>
                     <DialogTitle className="text-2xl font-black mb-2">Đánh giá đơn hàng</DialogTitle>
                     <DialogDescription className="text-emerald-50/80 font-medium leading-relaxed">
                        Chia sẻ cảm nhận của bạn về sản phẩm và dịch vụ để MedCare ngày càng hoàn thiện hơn nhé!
                     </DialogDescription>
                  </DialogHeader>
               </div>
               
               <div className="p-8 space-y-8 bg-white">
                  <div className="flex flex-col items-center gap-4">
                     <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Đánh giá của bạn</p>
                     <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                           <button
                              key={star}
                              onClick={() => setReviewRating(star)}
                              className="transition-all transform hover:scale-110 active:scale-95"
                           >
                              <Star
                                 className={`h-10 w-10 ${
                                    star <= reviewRating
                                       ? "text-amber-400 fill-amber-400"
                                       : "text-slate-200"
                                 }`}
                              />
                           </button>
                        ))}
                     </div>
                     <span className="text-lg font-black text-slate-800">
                        {reviewRating === 5 ? "Rất hài lòng 😍" : 
                         reviewRating === 4 ? "Hài lòng 😊" : 
                         reviewRating === 3 ? "Bình thường 😐" : 
                         reviewRating === 2 ? "Không hài lòng ☹️" : "Rất kém 😡"}
                     </span>
                  </div>

                  <div className="space-y-3">
                     <div className="flex items-center justify-between">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Lời nhắn cho MedCare</label>
                        <span className="text-[10px] text-slate-300 font-bold">{reviewComment.length}/500</span>
                     </div>
                     <Textarea
                        placeholder="Nhập cảm nhận của bạn về sản phẩm và dịch vụ..."
                        className="min-h-[120px] rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-blue-500/20 transition-all font-medium resize-none p-4"
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        maxLength={500}
                     />
                  </div>

                  <DialogFooter className="sm:flex-col gap-3">
                     <Button 
                        onClick={() => {
                           toast.success("Cảm ơn bạn đã gửi đánh giá!");
                           setShowReviewDialog(false);
                        }}
                        className="w-full rounded-full bg-blue-600 hover:bg-blue-700 h-14 font-black text-base shadow-xl shadow-blue-500/20 transition-all active:scale-95"
                     >
                        Gửi đánh giá ngay
                     </Button>
                     <Button 
                        variant="ghost" 
                        onClick={() => setShowReviewDialog(false)}
                        className="w-full rounded-full text-slate-400 font-bold h-10 hover:text-slate-600"
                     >
                        Để sau
                     </Button>
                  </DialogFooter>
               </div>
            </DialogContent>
         </Dialog>

         <Footer />
      </div>
   )
}
