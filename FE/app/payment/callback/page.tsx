"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import Link from "next/link"

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("Đang xử lý kết quả thanh toán...")
  
  const responseCode = searchParams.get("vnp_ResponseCode")
  const orderCode = searchParams.get("vnp_TxnRef")?.split("-")[0]
  const amount = searchParams.get("vnp_Amount")
  const transactionNo = searchParams.get("vnp_TransactionNo")

  useEffect(() => {
    if (responseCode === "00") {
      setStatus("success")
      setMessage("Thanh toán đơn hàng thành công qua VNPay!")
    } else {
      setStatus("error")
      setMessage("Thanh toán không thành công hoặc đã bị hủy.")
    }
  }, [responseCode])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-lg border-none">
          <CardContent className="pt-10 pb-10 text-center">
            {status === "loading" && (
              <div className="space-y-4">
                <Loader2 className="h-16 w-16 text-blue-600 animate-spin mx-auto" />
                <h1 className="text-xl font-bold">Đang xử lý...</h1>
                <p className="text-muted-foreground">{message}</p>
              </div>
            )}

            {status === "success" && (
              <div className="space-y-6">
                <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold text-slate-800">Thanh toán thành công!</h1>
                  <p className="text-slate-600">Cảm ơn bạn đã sử dụng dịch vụ của MedCare.</p>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-sm text-left border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mã đơn hàng:</span>
                    <span className="font-bold text-slate-800">{orderCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mã giao dịch:</span>
                    <span className="font-medium text-slate-700">{transactionNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số tiền:</span>
                    <span className="font-bold text-blue-600">
                      {amount ? (parseInt(amount) / 100).toLocaleString("vi-VN") : "0"}đ
                    </span>
                  </div>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 font-bold" asChild>
                    <Link href="/tai-khoan/don-hang">Xem chi tiết đơn hàng</Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/">Tiếp tục mua sắm</Link>
                  </Button>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="space-y-6">
                <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                  <XCircle className="h-10 w-10 text-red-600" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold text-slate-800">Thanh toán thất bại</h1>
                  <p className="text-slate-600">{message}</p>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                  <Button className="w-full bg-slate-800 hover:bg-slate-900 font-bold" asChild>
                    <Link href="/thanh-toan">Thử thanh toán lại</Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/">Quay về trang chủ</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  )
}
