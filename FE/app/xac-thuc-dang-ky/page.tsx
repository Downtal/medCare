"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ShieldCheck, CheckCircle2, Loader2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getApiBaseUrl } from "@/lib/config"

function VerifyRegistrationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailParam = searchParams.get("email") || ""
  const autoSend = searchParams.get("autoSend") === "true"

  const [email, setEmail] = useState(emailParam)
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const hasAutoSent = useRef(false)

  useEffect(() => {
    if (!email) {
      router.push("/dang-nhap")
      return
    }

    if (autoSend && !hasAutoSent.current) {
      hasAutoSent.current = true
      handleResendOtp()
    }
  }, [email, autoSend, router])

  const handleResendOtp = async () => {
    if (!email) return
    setResending(true)
    setError(null)
    setMessage(null)
    try {
      const response = await fetch(`${getApiBaseUrl()}/auth-service/api/auth/resend-verification-otp?email=${encodeURIComponent(email)}`, {
        method: "POST"
      })
      if (response.ok) {
        setMessage("Mã xác thực mới đã được gửi vào email của bạn.")
      } else {
        const text = await response.text()
        setError(text || "Không thể gửi lại mã xác thực.")
      }
    } catch (err) {
      setError("Không thể kết nối đến máy chủ.")
    } finally {
      setResending(false)
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const otpCode = otp.join("")
    if (otpCode.length < 6) { 
      setError("Vui lòng nhập đầy đủ mã OTP")
      return 
    }

    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch(`${getApiBaseUrl()}/auth-service/api/auth/verify-registration?email=${encodeURIComponent(email)}&otp=${otpCode}`, {
        method: "POST"
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => router.push("/dang-nhap"), 2000)
      } else {
        const text = await response.text()
        setError(text || "Mã xác thực không chính xác hoặc đã hết hạn.")
      }
    } catch (err) {
      setError("Không thể kết nối đến máy chủ để xác minh mã OTP.")
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-verify-${index + 1}`)
      if (nextInput) (nextInput as HTMLInputElement).focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-verify-${index - 1}`)
      if (prevInput) (prevInput as HTMLInputElement).focus()
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-500 flex-col items-center justify-center p-12">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/5 animate-pulse" />
        <div className="absolute -bottom-24 -left-12 w-80 h-80 rounded-full bg-white/5 animate-pulse delay-500" />

        <Link href="/" className="flex items-center gap-3 mb-10 z-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-lg">
            <ShieldCheck className="h-7 w-7 text-teal-600" />
          </div>
          <span className="text-3xl font-bold text-white tracking-tight">MedCare</span>
        </Link>

        {/* Status indicator */}
        <div className="z-10 text-white w-full max-w-xs text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-6 mx-auto backdrop-blur-sm border border-white/30">
            <CheckCircle2 className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-4">
            {success ? "Hoàn tất đăng ký" : "Xác thực email"}
          </h3>
          <p className="text-teal-50/90 leading-relaxed">
            {success 
              ? "Chúc mừng! Tài khoản của bạn đã được kích hoạt thành công."
              : "Chúng tôi vừa gửi một mã xác thực 6 chữ số đến email của bạn. Vui lòng kiểm tra hộp thư."}
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-background overflow-y-auto">
        <div className="w-full max-w-md">
          {!success ? (
            <div className="w-full text-center">
              <h1 className="text-3xl font-bold mb-2">Xác nhận mã OTP</h1>
              <p className="text-muted-foreground mb-8">
                Vui lòng nhập mã xác thực gửi tới <br/><b>{email}</b>
              </p>
              
              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div className="flex gap-2 justify-center">
                  {otp.map((digit, i) => (
                    <input 
                      key={i} 
                      id={`otp-verify-${i}`} 
                      type="text" 
                      maxLength={1} 
                      value={digit} 
                      onChange={(e) => handleOtpChange(i, e.target.value)} 
                      onKeyDown={(e) => handleOtpKeyDown(i, e)} 
                      className="w-12 h-14 text-center text-xl font-bold rounded-lg border-2 bg-background focus:border-primary outline-none transition-all" 
                    />
                  ))}
                </div>
                
                {error && <p className="text-destructive text-sm font-medium">{error}</p>}
                {message && <p className="text-green-600 text-sm font-medium">{message}</p>}
                
                <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Xác thực & Hoàn tất"}
                </Button>
                
                <div className="space-y-2 pt-4">
                  <button 
                    type="button" 
                    onClick={handleResendOtp} 
                    disabled={resending}
                    className="text-sm text-primary hover:underline font-medium block w-full flex items-center justify-center"
                  >
                    {resending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Gửi lại mã mới
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Tuyệt vời!</h1>
              <p className="text-muted-foreground mb-10 leading-relaxed">
                Mã xác thực chính xác. Tài khoản của bạn đã được kích hoạt thành công.
              </p>
              <Button asChild className="w-full h-12 text-base font-semibold">
                <Link href="/dang-nhap">Đăng nhập ngay</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VerifyRegistrationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>}>
      <VerifyRegistrationForm />
    </Suspense>
  )
}
