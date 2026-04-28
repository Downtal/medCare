"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Package,
  Search,
  ShoppingBag,
  ChevronRight,
  Clock,
  Loader2,
  Copy,
  Star,
  X
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { orderService } from "@/services/orderService"
import { toast } from "sonner"
import { useQuery } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { getApiBaseUrl } from "@/lib/config"

export default function OrdersPage() {
  const { data: session } = useSession()
  const [filter, setFilter] = useState("ALL")
  const [search, setSearch] = useState("")

  const { data: orders = [], isLoading: loading } = useQuery({
    queryKey: ["my-orders", session?.user?.userId],
    queryFn: async () => {
      const data = await orderService.getMyOrders()
      return Array.isArray(data) ? data : []
    },
    enabled: !!session?.user?.accessToken,
    staleTime: 30000, // 30 seconds
  })

  // Review states
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<any | null>(null)
  const [selectedItemToRate, setSelectedItemToRate] = useState<any | null>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState("")
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

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

  const handleReviewSubmit = async () => {
    if (!selectedItemToRate || !session) return
    
    setIsSubmittingReview(true)
    try {
      const res = await fetch(`${getApiBaseUrl()}/review-service/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.user.accessToken}`
        },
        body: JSON.stringify({
          productId: selectedItemToRate.medicineId,
          productSlug: selectedItemToRate.medicineSlug || `product-${selectedItemToRate.medicineId}`,
          productName: selectedItemToRate.medicineName,
          productImage: selectedItemToRate.imageUrl,
          guestName: session.user.fullName,
          phoneNumber: (session.user as any)?.phone,
          email: session.user.email,
          rating: reviewRating,
          comment: reviewComment
        })
      })

      if (res.ok) {
        toast.success(`Đã gửi đánh giá cho ${selectedItemToRate.medicineName}!`)
        setSelectedItemToRate(null)
        setReviewComment("")
        setReviewRating(5)
      } else {
        toast.error("Không thể gửi đánh giá. Vui lòng thử lại sau.")
      }
    } catch (error) {
      console.error(error)
      toast.error("Có lỗi xảy ra khi gửi đánh giá.")
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const filteredOrders = orders.filter(o => {
    const matchesFilter = filter === "ALL" || o.status === filter
    const matchesSearch = o.orderCode.toLowerCase().includes(search.toLowerCase()) ||
      o.items.some(item => item.medicineName.toLowerCase().includes(search.toLowerCase()))
    return matchesFilter && matchesSearch
  })

  return (
    <>
      <Card className="animate-in fade-in slide-in-from-right-4 duration-500 border-none shadow-sm rounded-3xl overflow-hidden bg-white">
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="px-8 py-6 border-b border-slate-100">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Đơn hàng của tôi</h2>
        </div>

        <Tabs defaultValue="ALL" className="w-full" onValueChange={setFilter}>
          <TabsList className="bg-transparent h-auto p-0 gap-0 w-full justify-between overflow-x-auto no-scrollbar flex-nowrap border-b-0">
            {[
              { value: "ALL", label: "Tất cả" },
              { value: "PENDING", label: "Đang xử lý" },
              { value: "SHIPPING", label: "Đang giao" },
              { value: "DELIVERED", label: "Đã giao" },
              { value: "CANCELLED", label: "Đã hủy" },
              { value: "RETURNED", label: "Trả hàng" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-none px-6 py-4 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 border-b-2 border-transparent bg-transparent shadow-none transition-all text-[13px] font-bold uppercase tracking-tight flex-1"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="p-4 bg-slate-50/50">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tìm theo tên đơn, mã đơn, hoặc tên sản phẩm..."
              className="pl-11 pr-4 bg-white border-slate-200 rounded-full focus-visible:ring-blue-500/20 h-12 shadow-sm italic text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <CardContent className="p-6 space-y-6 bg-slate-50/30">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <p className="text-slate-500 font-bold animate-pulse">Đang đồng bộ đơn hàng...</p>
          </div>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden group"
            >
              <div className="px-6 py-4 border-b border-slate-50 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-2 rounded-xl">
                    <Package className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-[13px] font-black text-slate-900 uppercase">
                    Ngày đặt: {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                  <Separator orientation="vertical" className="h-4 bg-slate-200" />
                  <span className="text-xs text-slate-400 font-bold italic">
                    Nhận tại cửa hàng • <span className="text-slate-800 font-black">#{order.orderCode}</span>
                  </span>
                  <button className="text-blue-500 hover:text-blue-700 transition-colors" title="Sao chép mã đơn" onClick={() => {
                    navigator.clipboard.writeText(order.orderCode);
                    toast.success("Đã sao chép mã đơn hàng");
                  }}>
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${order.status === 'DELIVERED' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span className={`text-xs font-black uppercase tracking-tight ${order.status === 'DELIVERED' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>
              </div>

              <div className="p-0">
                <div className="divide-y divide-slate-50">
                  {order.items.map((item, idx) => (
                    <div key={item.medicineId || idx} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                      <div className="relative h-16 w-16 rounded-xl overflow-hidden border border-slate-100 bg-white shrink-0 group-hover:border-blue-100 transition-colors">
                        <Image
                          src={item.imageUrl || "/placeholder.svg"}
                          alt={item.medicineName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 text-sm leading-snug line-clamp-1 mb-1">
                          {item.medicineName}
                        </h4>
                        <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-wider">
                          <p className="text-blue-600">{item.unitPrice.toLocaleString("vi-VN")}đ</p>
                          <span className="text-slate-300">•</span>
                          <p className="text-slate-500">Số lượng: {item.quantity}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50/30 flex items-center justify-between">
                <Link href={`/tai-khoan/don-hang/${order.orderCode}`} className="text-blue-600 text-sm font-bold flex items-center hover:underline">
                  Xem chi tiết
                  <ChevronRight className="h-4 w-4 ml-0.5" />
                </Link>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Thành tiền:</p>
                    <p className="text-lg font-black text-blue-600 leading-none mt-1">{order.grandTotal.toLocaleString("vi-VN")}đ</p>
                  </div>
                  {order.status === 'DELIVERED' && (
                    <Button 
                      onClick={() => setSelectedOrderForReview(order)}
                      variant="outline" 
                      className="rounded-full border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 px-6 h-11 font-bold text-sm transition-all"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Đánh giá
                    </Button>
                  )}
                  <Button className="rounded-full bg-blue-600 hover:bg-blue-700 px-8 h-11 font-bold text-sm shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0">
                    Mua lại
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 py-20 px-4 text-center">
            <div className="bg-slate-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Không tìm thấy đơn hàng</h3>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto text-sm italic">
              {search ? `Không tìm thấy kết quả cho "${search}"` : "Bạn chưa có đơn hàng nào ở trạng thái này."}
            </p>
            {search && (
              <Button variant="outline" onClick={() => setSearch("")} className="rounded-full border-blue-200 text-blue-600 font-bold">
                Xóa tìm kiếm
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>

    {/* Order Review Dialog - Step 1: Select Product */}
    <Dialog open={!!selectedOrderForReview && !selectedItemToRate} onOpenChange={(open) => !open && setSelectedOrderForReview(null)}>
      <DialogContent className="sm:max-w-[550px] rounded-[32px] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-8 bg-emerald-600 text-white relative overflow-hidden">
           <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
              <Star className="h-32 w-32 fill-current" />
           </div>
           <DialogTitle className="text-2xl font-black">Chọn sản phẩm đánh giá</DialogTitle>
           <p className="text-emerald-50/80 font-medium text-sm mt-2">Đơn hàng #{selectedOrderForReview?.orderCode}</p>
        </DialogHeader>
        <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto no-scrollbar bg-slate-50/50">
           {selectedOrderForReview?.items.map((item: any, idx: number) => (
              <div 
                key={idx} 
                onClick={() => setSelectedItemToRate(item)}
                className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4 cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all group"
              >
                 <div className="relative h-16 w-16 rounded-xl overflow-hidden border border-slate-50 shrink-0">
                    <Image src={item.imageUrl || "/placeholder.svg"} alt={item.medicineName} fill className="object-cover" />
                 </div>
                 <div className="flex-1">
                    <h4 className="font-bold text-slate-800 text-sm line-clamp-2 group-hover:text-emerald-600 transition-colors">{item.medicineName}</h4>
                    <p className="text-xs text-slate-400 font-medium mt-1">Số lượng: {item.quantity}</p>
                 </div>
                 <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
              </div>
           ))}
        </div>
        <DialogFooter className="p-6 bg-white border-t border-slate-50">
           <Button variant="ghost" onClick={() => setSelectedOrderForReview(null)} className="w-full rounded-full font-bold text-slate-400 hover:text-slate-600">
              Đóng
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Order Review Dialog - Step 2: Rate Form */}
    <Dialog open={!!selectedItemToRate} onOpenChange={(open) => !open && setSelectedItemToRate(null)}>
      <DialogContent className="sm:max-w-[500px] rounded-[32px] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-8 bg-blue-600 text-white relative overflow-hidden text-center">
           <DialogTitle className="text-2xl font-black">Bạn thấy sản phẩm thế nào?</DialogTitle>
           <p className="text-blue-50/80 font-medium text-sm mt-2">Chia sẻ cảm nhận của bạn về sản phẩm nhé!</p>
        </DialogHeader>
        
        <div className="p-8 space-y-6 bg-white">
           <div className="flex flex-col items-center gap-4">
              <div className="relative h-20 w-20 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm">
                 <Image src={selectedItemToRate?.imageUrl || "/placeholder.svg"} alt="Product" fill className="object-cover" />
              </div>
              <h3 className="font-bold text-slate-800 text-center line-clamp-1">{selectedItemToRate?.medicineName}</h3>
              
              <div className="flex gap-2 my-2">
                 {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setReviewRating(s)} className="transition-transform hover:scale-110 active:scale-95">
                       <Star className={`w-10 h-10 ${s <= reviewRating ? "fill-yellow-400 text-yellow-400" : "fill-slate-100 text-slate-100"}`} />
                    </button>
                 ))}
              </div>
              <span className="text-lg font-black text-slate-800">
                 {reviewRating === 5 ? "Tuyệt vời 😍" : 
                  reviewRating === 4 ? "Hài lòng 😊" : 
                  reviewRating === 3 ? "Bình thường 😐" : 
                  reviewRating === 2 ? "Tệ ☹️" : "Rất tệ 😡"}
              </span>
           </div>

           <div className="space-y-3">
              <div className="flex items-center justify-between">
                 <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Nội dung đánh giá</label>
                 <span className="text-[10px] text-slate-300 font-bold">{reviewComment.length}/500</span>
              </div>
              <Textarea
                 placeholder="Vui lòng chia sẻ cảm nhận của bạn về sản phẩm này..."
                 className="min-h-[120px] rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-blue-500/20 transition-all font-medium resize-none p-4"
                 value={reviewComment}
                 onChange={(e) => setReviewComment(e.target.value)}
                 maxLength={500}
              />
           </div>

           <DialogFooter className="flex flex-col gap-3 sm:flex-col">
              <Button 
                onClick={handleReviewSubmit}
                disabled={isSubmittingReview}
                className="w-full h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-base font-black shadow-lg shadow-blue-500/20 transition-all active:scale-95"
              >
                 {isSubmittingReview ? "Đang gửi..." : "Gửi đánh giá ngay"}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setSelectedItemToRate(null)}
                className="w-full rounded-full text-slate-400 font-bold h-10 hover:text-slate-600"
              >
                 Quay lại
              </Button>
           </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
