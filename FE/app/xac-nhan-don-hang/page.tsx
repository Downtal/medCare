"use client"

import { useEffect, useState, useRef } from "react"
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
  const vnpOrderInfo = searchParams.get("vnp_OrderInfo")

  // Robust order code detection
  let orderCode = directCode

  if (!orderCode && vnpTxnRef) {
    // VNPay TxnRef often has a timestamp suffix (e.g. MC123-1714...)
    // We only need the part before the hyphen
    orderCode = vnpTxnRef.split("-")[0]
  }

  // Fallback: extract order code from OrderInfo if TxnRef is missing or doesn't yield a code
  if (!orderCode && vnpOrderInfo) {
    const match = vnpOrderInfo.match(/MC\d+/i)
    if (match) orderCode = match[0]
  }

  const { data: session, status: sessionStatus } = useSession()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isNotified, setIsNotified] = useState(false)
  const hasNotified = useRef(false)

  useEffect(() => {
    console.log("OrderConfirmation: sessionStatus =", sessionStatus, "orderCode =", orderCode)

    const fetchOrderData = async () => {
      try {
        // 1. If returning from VNPay, trigger active verification first
        if (vnpResponseCode && orderCode) {
          try {
            const callbackUrl = `${getApiBaseUrl()}${API_ENDPOINTS.PAYMENT}/payment/vnpay-callback${window.location.search}`
            await fetch(callbackUrl, {
              headers: {
                ...(session?.user?.accessToken ? { 'Authorization': `Bearer ${session.user.accessToken}` } : {})
              }
            })
            console.log("Payment callback verification triggered")

            // Clear cart items if success
            if (vnpResponseCode === "00") {
              const { useCartStore } = require("@/lib/store/useCartStore")
              const removeItem = useCartStore.getState().removeItem
              // We need order details to know what to remove
              const orderRes = await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.ORDER}/orders/${orderCode}`, {
                headers: {
                  ...(session?.user?.accessToken ? { 'Authorization': `Bearer ${session.user.accessToken}` } : {})
                }
              })
              if (orderRes.ok) {
                const orderData = await orderRes.json()
                orderData.items.forEach((item: any) => {
                  removeItem(item.medicineId, session?.user?.accessToken)
                })
              }
            }
          } catch (e) {
            console.error("Failed to trigger payment callback verification", e)
          }
        }

        // 2. Fetch order details
        const url = `${getApiBaseUrl()}${API_ENDPOINTS.ORDER}/orders/${orderCode}`
        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${session?.user?.accessToken}`
          }
        })

        if (!res.ok) {
          const errorText = await res.text()
          throw new Error(`Failed to fetch order: ${res.status}`)
        }

        const data = await res.json()

        // UI Optimization: If we know it's a success from URL, override status in UI state
        // to avoid waiting for slow IPN/DB updates
        if (vnpResponseCode === "00") {
          data.status = "PAID"
        }

        setOrder(data)

        if (!isNotified && !hasNotified.current) {
          const { toast } = await import("sonner")
          if (vnpResponseCode === "00") {
            hasNotified.current = true
            setIsNotified(true)
            toast.success("Thanh toán thành công!", {
              description: "Đơn hàng của bạn đã được thanh toán và đang xử lý."
            })
          } else if (!vnpResponseCode) {
            hasNotified.current = true
            setIsNotified(true)
            toast.success("Đặt hàng thành công!", {
              description: "Vui lòng chuẩn bị tiền mặt khi nhận hàng."
            })
          }
        }
      } catch (err: any) {
        console.error("Detailed fetch error:", err)
        setError(err.message || "Không tìm thấy thông tin đơn hàng.")
      } finally {
        setLoading(false)
      }
    }

    if (sessionStatus === "authenticated" && orderCode) {
      fetchOrderData()
    } else if (sessionStatus === "unauthenticated") {
      setLoading(false)
      setError("Vui lòng đăng nhập để xem thông tin đơn hàng.")
    } else if (sessionStatus !== "loading" && !orderCode) {
      setLoading(false)
      setError("Thiếu mã đơn hàng.")
    }
  }, [orderCode, session, sessionStatus, vnpResponseCode, isNotified])

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
              <Button
                className="h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 font-bold"
                onClick={() => {
                  if (order?.items) {
                    const { useCartStore } = require("@/lib/store/useCartStore")
                    const addItem = useCartStore.getState().addItem
                    order.items.forEach((item: any) => {
                      addItem({
                        medicineId: item.medicineId,
                        name: item.medicineName,
                        price: item.unitPrice,
                        unitPrice: item.unitPrice,
                        quantity: item.quantity,
                        imageUrl: item.imageUrl,
                        unit: item.unit || 'Hộp'
                      }, session?.user?.accessToken)
                    })
                    const router = require("next/navigation").useRouter
                    window.location.href = "/gio-hang"
                  }
                }}
              >
                Thử thanh toán lại
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
      case "PAID": return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none font-black px-4 py-1.5 text-xs uppercase tracking-wider">Đã thanh toán</Badge>
      default: return <Badge variant="outline" className="border-slate-200 text-slate-700 font-bold">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-4xl mx-auto">

            {/* Header Status */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-center mb-8"
            >
              <div className="inline-flex p-2 bg-green-100 rounded-2xl mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight">
                {order.status === 'PAID' ? 'Thanh toán thành công!' : 'Đặt hàng thành công!'}
              </h1>
              <p className="text-slate-500 font-medium text-base max-w-lg mx-auto leading-relaxed">
                {order.status === 'PAID'
                  ? `Đơn hàng #${order.orderCode} của bạn đã được thanh toán và đang trong quá trình chuẩn bị.`
                  : `Đơn hàng #${order.orderCode} của bạn đã được tiếp nhận. Chúng tôi sẽ sớm liên hệ để giao hàng.`}
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-5 gap-6 items-start">

              {/* Left Column: Details */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-3 space-y-4"
              >
                {/* Delivery Information */}
                <Card className="border-none shadow-xl shadow-blue-900/5 rounded-[24px] overflow-hidden">
                  <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-5 md:p-6">
                    <CardTitle className="flex items-center gap-3 text-lg font-black text-slate-800">
                      <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-blue-600" />
                      </div>
                      Thông tin nhận hàng
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 md:p-6 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Người nhận</p>
                        <div className="space-y-0.5">
                          <p className="font-black text-slate-900 text-base">{order.recipientName}</p>
                          <p className="font-bold text-slate-600 text-sm">{order.recipientPhone}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thanh toán</p>
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900 text-sm">{order.paymentMethod === 'COD' ? 'Tiền mặt (COD)' : 'VNPay'}</p>
                          <Badge className={order.status === 'PAID' ? 'bg-emerald-500 text-white hover:bg-emerald-600 border-none font-bold' : 'bg-amber-500 text-white hover:bg-amber-600 border-none font-bold'}>
                            {order.status === 'PAID' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 pt-3 border-t border-slate-50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Địa chỉ giao hàng</p>
                      <p className="font-bold text-slate-700 leading-relaxed text-sm italic">
                        "{order.recipientAddress}"
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Products List */}
                <Card className="border-none shadow-xl shadow-blue-900/5 rounded-[24px] overflow-hidden">
                  <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-5 md:p-6">
                    <CardTitle className="flex items-center gap-3 text-lg font-black text-slate-800">
                      <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Package className="w-4 h-4 text-purple-600" />
                      </div>
                      Chi tiết sản phẩm
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 md:p-6">
                    <div className="space-y-4">
                      {order.items?.map((item: any) => (
                        <div key={item.medicineId} className="flex gap-4 items-center">
                          <div className="relative h-14 w-14 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 p-1 shrink-0">
                            <Image src={item.imageUrl || "/placeholder.svg"} alt={item.medicineName} fill className="object-contain" />
                          </div>
                          <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-1">
                            <div>
                              <p className="font-black text-slate-800 leading-tight text-sm mb-0.5">{item.medicineName}</p>
                              <p className="text-xs text-slate-500 font-bold">Số lượng: <span className="text-blue-600">{item.quantity}</span></p>
                            </div>
                            <p className="font-black text-slate-900 text-base">{(item.subTotal || 0).toLocaleString("vi-VN")}đ</p>
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
                className="lg:col-span-2 space-y-4"
              >
                {/* Summary Card */}
                <Card className="border border-slate-100 shadow-2xl shadow-blue-900/10 rounded-[24px] bg-white text-slate-800 overflow-hidden">
                  <div className="p-5 md:p-6">
                    <h3 className="text-lg font-black mb-4 flex items-center gap-2 text-slate-800">
                      <Clock className="w-4 h-4 text-blue-600" />
                      Tổng kết đơn hàng
                    </h3>

                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between items-center text-slate-500 font-bold text-sm">
                        <span>Tạm tính</span>
                        <span className="text-slate-800">{(order.totalPrice || 0).toLocaleString("vi-VN")}đ</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-500 font-bold text-sm">
                        <span>Phí vận chuyển</span>
                        <span className="text-emerald-600 font-extrabold">
                          {order.shippingFee === 0 ? "Miễn phí" : `${(order.shippingFee || 0).toLocaleString("vi-VN")}đ`}
                        </span>
                      </div>
                      {order.discountAmount > 0 && (
                        <div className="flex justify-between items-center text-slate-500 font-bold text-sm">
                          <span>Giảm giá</span>
                          <span className="text-red-500">-{order.discountAmount.toLocaleString("vi-VN")}đ</span>
                        </div>
                      )}
                      <Separator className="bg-slate-100" />
                      <div className="flex justify-between items-center pt-3">
                        <span className="text-base font-black text-slate-800">Tổng thanh toán</span>
                        <span className="text-2xl font-black text-blue-600">{(order.grandTotal || 0).toLocaleString("vi-VN")}đ</span>
                      </div>
                    </div>

                  </div>
                </Card>

                {/* Action Buttons */}
                <div className="grid gap-3">
                  <Button className="h-12 sm:h-14 rounded-[20px] bg-primary hover:bg-primary/90 font-black text-base shadow-xl shadow-primary/20" asChild>
                    <Link href="/">
                      Tiếp tục mua sắm <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="h-12 rounded-[20px] border-2 font-bold bg-white" asChild>
                      <Link href="/tai-khoan/don-hang">
                        <ListOrdered className="mr-1.5 w-4 h-4" /> Đơn hàng
                      </Link>
                    </Button>
                    <Button variant="outline" className="h-12 rounded-[20px] border-2 font-bold bg-white" asChild>
                      <Link href="/">
                        <Home className="mr-1.5 w-4 h-4" /> Trang chủ
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Contact Help */}
                <div className="p-5 md:p-6 bg-blue-50 rounded-[24px] border border-blue-100 text-center">
                  <p className="text-xs text-blue-600 font-black uppercase tracking-widest mb-1">Hỗ trợ 24/7</p>
                  <p className="text-slate-600 font-bold mb-3 text-xs">Nếu bạn cần hỗ trợ về đơn hàng, hãy liên hệ ngay với chúng tôi.</p>
                  <Link href="/lien-he" className="text-primary font-black text-xs flex items-center justify-center gap-2 hover:underline">
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
