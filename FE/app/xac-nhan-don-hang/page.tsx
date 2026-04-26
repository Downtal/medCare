"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, Package, MapPin, CreditCard, Clock, Loader2, ArrowRight, Home, ListOrdered, AlertTriangle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { getApiBaseUrl, API_ENDPOINTS } from "@/lib/config"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams()
  
  // Handle both direct code (COD) and VNPAY response
  const vnpResponseCode = searchParams.get("vnp_ResponseCode")
  const vnpTxnRef = searchParams.get("vnp_TxnRef")
  const directCode = searchParams.get("code")
  
  const orderCode = directCode || vnpTxnRef
  
  const { data: session } = useSession()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (orderCode) {
      const fetchOrder = async () => {
        try {
          const res = await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.ORDER}/orders/${orderCode}`, {
            headers: {
              'Authorization': `Bearer ${session?.user?.accessToken}`
            }
          })
          if (!res.ok) throw new Error("Failed to fetch")
          const data = await res.json()
          setOrder(data)
        } catch (err) {
          console.error("Failed to fetch order details:", err)
          setError("Không tìm thấy thông tin đơn hàng.")
        } finally {
          setLoading(false)
        }
      }
      fetchOrder()
    } else {
      setLoading(false)
    }
  }, [orderCode, session])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="h-12 w-12 text-primary" />
          </motion.div>
          <p className="mt-4 text-slate-500 font-bold animate-pulse">Đang tải thông tin đơn hàng...</p>
        </main>
        <Footer />
      </div>
    )
  }

  // Handle VNPAY Failure
  if (vnpResponseCode && vnpResponseCode !== "00") {
     return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md w-full bg-white rounded-[32px] p-8 shadow-xl shadow-blue-900/5 text-center border border-red-50"
          >
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-2">Thanh toán thất bại</h1>
            <p className="text-slate-500 font-medium mb-8 leading-relaxed">
              Giao dịch của bạn đã bị hủy hoặc gặp lỗi từ phía ngân hàng. Đừng lo lắng, giỏ hàng của bạn vẫn được giữ nguyên.
            </p>
            <div className="grid gap-3">
              <Button className="h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 font-bold" asChild>
                <Link href="/thanh-toan">Thử thanh toán lại</Link>
              </Button>
              <Button variant="outline" className="h-14 rounded-2xl border-2 font-bold" asChild>
                <Link href="/">Quay về trang chủ</Link>
              </Button>
            </div>
          </motion.div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!order || error) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center space-y-6">
          <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center text-slate-400">
            <Package className="w-12 h-12" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Không tìm thấy đơn hàng</h1>
          <Button size="lg" className="rounded-2xl px-8 h-14 font-bold shadow-lg" asChild>
            <Link href="/">Quay về trang chủ</Link>
          </Button>
        </main>
        <Footer />
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-bold px-3 py-1">Chờ xác nhận</Badge>
      case "PROCESSING": return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-bold px-3 py-1">Đang xử lý</Badge>
      case "SHIPPING": return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-none font-bold px-3 py-1">Đang giao hàng</Badge>
      case "DELIVERED": return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none font-bold px-3 py-1">Đã giao hàng</Badge>
      case "CANCELLED": return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none font-bold px-3 py-1">Đã hủy</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="max-w-4xl mx-auto">
            
            {/* Header Status */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-center mb-12"
            >
              <div className="inline-flex p-3 bg-green-100 rounded-3xl mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">Cảm ơn bạn đã tin dùng!</h1>
              <p className="text-slate-500 font-medium text-lg max-w-lg mx-auto leading-relaxed">
                Đơn hàng <span className="text-blue-600 font-black">#{order.orderCode}</span> của bạn đã được tiếp nhận và đang trong quá trình chuẩn bị.
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-5 gap-8 items-start">
              
              {/* Left Column: Details */}
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-3 space-y-6"
              >
                {/* Delivery Information */}
                <Card className="border-none shadow-xl shadow-blue-900/5 rounded-[32px] overflow-hidden">
                  <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-8">
                    <CardTitle className="flex items-center gap-3 text-xl font-black text-slate-800">
                      <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-blue-600" />
                      </div>
                      Thông tin nhận hàng
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="grid sm:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Người nhận</p>
                        <div className="space-y-1">
                          <p className="font-black text-slate-900 text-lg">{order.recipientName}</p>
                          <p className="font-bold text-slate-600">{order.recipientPhone}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Thanh toán</p>
                        <div className="space-y-2">
                          <p className="font-bold text-slate-900">{order.paymentMethod === 'COD' ? 'Tiền mặt (COD)' : 'VNPay'}</p>
                          <Badge className={order.status === 'PAID' ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}>
                            {order.status === 'PAID' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4 pt-4 border-t border-slate-50">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Địa chỉ giao hàng</p>
                      <p className="font-bold text-slate-700 leading-relaxed text-lg italic">
                        "{order.recipientAddress}"
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Products List */}
                <Card className="border-none shadow-xl shadow-blue-900/5 rounded-[32px] overflow-hidden">
                  <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-8">
                    <CardTitle className="flex items-center gap-3 text-xl font-black text-slate-800">
                      <div className="w-10 h-10 bg-purple-100 rounded-2xl flex items-center justify-center">
                        <Package className="w-5 h-5 text-purple-600" />
                      </div>
                      Chi tiết sản phẩm
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="space-y-6">
                      {order.items?.map((item: any) => (
                        <div key={item.medicineId} className="flex gap-6 items-center">
                          <div className="relative h-20 w-20 rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 p-2 shrink-0">
                            <Image src={item.imageUrl || "/placeholder.svg"} alt={item.medicineName} fill className="object-contain" />
                          </div>
                          <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <div>
                              <p className="font-black text-slate-800 leading-tight mb-1">{item.medicineName}</p>
                              <p className="text-sm text-slate-500 font-bold">Số lượng: <span className="text-blue-600">{item.quantity}</span></p>
                            </div>
                            <p className="font-black text-slate-900 text-lg">{(item.subTotal || 0).toLocaleString("vi-VN")}đ</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Right Column: Summary & Actions */}
              <motion.div 
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="lg:col-span-2 space-y-6"
              >
                {/* Summary Card */}
                <Card className="border-none shadow-2xl shadow-blue-900/10 rounded-[32px] bg-slate-900 text-white overflow-hidden">
                  <div className="p-8">
                    <h3 className="text-xl font-black mb-8 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-400" />
                      Tổng kết đơn hàng
                    </h3>
                    
                    <div className="space-y-4 mb-10">
                      <div className="flex justify-between items-center text-slate-400 font-bold">
                        <span>Tạm tính</span>
                        <span className="text-white">{(order.totalPrice || 0).toLocaleString("vi-VN")}đ</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400 font-bold">
                        <span>Phí vận chuyển</span>
                        <span className="text-green-400">
                          {order.shippingFee === 0 ? "Miễn phí" : `${(order.shippingFee || 0).toLocaleString("vi-VN")}đ`}
                        </span>
                      </div>
                      {order.discountAmount > 0 && (
                        <div className="flex justify-between items-center text-slate-400 font-bold">
                          <span>Giảm giá</span>
                          <span className="text-red-400">-{order.discountAmount.toLocaleString("vi-VN")}đ</span>
                        </div>
                      )}
                      <Separator className="bg-white/10" />
                      <div className="flex justify-between items-center pt-4">
                        <span className="text-lg font-bold">Tổng thanh toán</span>
                        <span className="text-3xl font-black text-blue-400">{(order.grandTotal || 0).toLocaleString("vi-VN")}đ</span>
                      </div>
                    </div>

                    {getStatusBadge(order.status)}
                  </div>
                </Card>

                {/* Action Buttons */}
                <div className="grid gap-4">
                  <Button className="h-16 rounded-[24px] bg-primary hover:bg-primary/90 font-black text-lg shadow-xl shadow-primary/20" asChild>
                    <Link href="/">
                      Tiếp tục mua sắm <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="h-14 rounded-[24px] border-2 font-bold bg-white" asChild>
                      <Link href="/tai-khoan/don-hang">
                        <ListOrdered className="mr-2 w-4 h-4" /> Đơn hàng
                      </Link>
                    </Button>
                    <Button variant="outline" className="h-14 rounded-[24px] border-2 font-bold bg-white" asChild>
                      <Link href="/">
                        <Home className="mr-2 w-4 h-4" /> Trang chủ
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Contact Help */}
                <div className="p-8 bg-blue-50 rounded-[32px] border border-blue-100 text-center">
                  <p className="text-sm text-blue-600 font-black uppercase tracking-widest mb-2">Hỗ trợ 24/7</p>
                  <p className="text-slate-600 font-medium mb-4 text-sm">Nếu bạn cần hỗ trợ về đơn hàng, hãy liên hệ ngay với chúng tôi.</p>
                  <Link href="/lien-he" className="text-primary font-black flex items-center justify-center gap-2 hover:underline">
                    Gửi yêu cầu hỗ trợ <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
