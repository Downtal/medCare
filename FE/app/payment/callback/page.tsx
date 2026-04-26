"use client"

import { useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { motion } from "framer-motion"

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    // Redirect to the unified confirmation page with all VNPAY parameters
    const params = searchParams.toString()
    router.replace(`/xac-nhan-don-hang?${params}`)
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 className="h-12 w-12 text-primary" />
      </motion.div>
      <p className="mt-4 text-slate-500 font-bold animate-pulse">
        Đang xử lý kết quả thanh toán...
      </p>
    </div>
  )
}
