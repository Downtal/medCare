"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, Package, MapPin, CreditCard, Clock, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { getApiBaseUrl, API_ENDPOINTS } from "@/lib/config"
import { useSession } from "next-auth/react"

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams()
  const orderCode = searchParams.get("code")
  const { data: session } = useSession()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (orderCode) {
      fetch(`${getApiBaseUrl()}${API_ENDPOINTS.ORDER}/orders/${orderCode}`, {
        headers: {
          'Authorization': `Bearer ${session?.user?.accessToken}`
        }
      })
        .then(res => res.json())
        .then(data => {
          setOrder(data)
          setLoading(false)
        })
        .catch(err => {
          console.error("Failed to fetch order details:", err)
          setLoading(false)
        })
    }
  }, [orderCode, session])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center space-y-4">
          <h1 className="text-2xl font-bold">Không tìm thấy thông tin đơn hàng</h1>
          <Button asChild>
            <Link href="/">Quay về trang chủ</Link>
          </Button>
        </main>
        <Footer />
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Đang chờ xác nhận</Badge>
      case "PROCESSING": return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Đang xử lý</Badge>
      case "SHIPPING": return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Đang giao hàng</Badge>
      case "DELIVERED": return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Đã giao hàng</Badge>
      case "CANCELLED": return <Badge variant="destructive">Đã hủy</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            {/* Success Message */}
            <Card className="mb-8 border-green-200 bg-green-50/50">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold mb-2 text-slate-800">Đặt hàng thành công!</h1>
                <p className="text-slate-600 mb-4">
                  Cảm ơn bạn đã mua hàng tại MedCare. Đơn hàng của bạn đang được xử lý.
                </p>
                <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-100 shadow-sm">
                  <span className="text-sm text-slate-500">Mã đơn hàng:</span>
                  <span className="font-bold text-lg text-blue-600">{order.orderCode}</span>
                </div>
              </CardContent>
            </Card>

            {/* Order Details */}
            <Card className="mb-6 border-none shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6 space-y-6">
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-slate-400" />
                      <span className="font-bold text-slate-700">Trạng thái đơn hàng</span>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  <Separator className="bg-slate-100" />

                  {/* Delivery Info */}
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        <span className="font-bold text-slate-700">Địa chỉ nhận hàng</span>
                      </div>
                      <div className="pl-7 space-y-1 text-sm">
                        <p className="font-bold text-slate-800">
                          {order.recipientName} - {order.recipientPhone}
                        </p>
                        <p className="text-slate-600 leading-relaxed">{order.recipientAddress}</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                        <span className="font-bold text-slate-700">Thanh toán</span>
                      </div>
                      <div className="pl-7 text-sm space-y-1">
                        <p className="font-medium text-slate-700">{order.paymentMethod === 'COD' ? 'Tiền mặt khi nhận hàng (COD)' : 'Thanh toán trực tuyến (VNPay)'}</p>
                        <Badge variant="outline" className={order.status === 'PAID' ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-600'}>
                          {order.status === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card className="mb-6 border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  Sản phẩm đã đặt
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {order.items?.map((item: any) => (
                    <div key={item.medicineId} className="flex gap-4">
                      <div className="relative h-16 w-16 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 shrink-0">
                        <Image src={item.imageUrl || "/placeholder.svg"} alt={item.medicineName} fill className="object-cover" />
                      </div>
                      <div className="flex-1 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-800">{item.medicineName}</p>
                          <p className="text-sm text-slate-500">Số lượng: {item.quantity}</p>
                        </div>
                        <p className="font-bold text-slate-900">{item.subTotal?.toLocaleString("vi-VN")}đ</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-6 bg-slate-100" />

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Tạm tính</span>
                    <span>{order.totalPrice?.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Phí vận chuyển</span>
                    <span className="text-green-600 font-medium">
                      {order.shippingFee === 0 ? "Miễn phí" : `${order.shippingFee?.toLocaleString("vi-VN")}đ`}
                    </span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Giảm giá</span>
                      <span className="text-red-600">-{order.discountAmount?.toLocaleString("vi-VN")}đ</span>
                    </div>
                  )}
                  <div className="pt-2 flex items-center justify-between font-bold text-xl text-slate-900">
                    <span>Tổng cộng</span>
                    <span className="text-blue-600">{order.grandTotal?.toLocaleString("vi-VN")}đ</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" asChild>
                <Link href="/tai-khoan/don-hang">Theo dõi đơn hàng</Link>
              </Button>
              <Button className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold" asChild>
                <Link href="/">Tiếp tục mua sắm</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
