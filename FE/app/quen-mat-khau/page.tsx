"use client"

import { useState } from "react"
import Link from "next/link"
import { ShieldCheck, ArrowRight, Loader2, Mail, CheckCircle2, Eye, EyeOff, ArrowLeft, KeyRound, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getApiBaseUrl } from "@/lib/config"

type Step = "email" | "otp" | "newPassword" | "success"

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email")
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState("")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [otpError, setOtpError] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [pwErrors, setPwErrors] = useState<{ new?: string; confirm?: string }>({})
  const [resendTimer, setResendTimer] = useState(0)

  const startResendTimer = () => {
    setResendTimer(60)
    const interval = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) { clearInterval(interval); return 0 }
        return t - 1
      })
    }, 1000)
  }

  const handleEmailSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!email) { setEmailError("Vui lòng nhập email"); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError("Email không hợp lệ"); return }
    setEmailError("")
    setLoading(true)

    try {
      const response = await fetch(`${getApiBaseUrl()}/auth-service/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        startResendTimer()
        setStep("otp")
      } else {
        const text = await response.text()
        try {
          const body = JSON.parse(text)
          setEmailError(body.message || "Có lỗi xảy ra, vui lòng thử lại.")
        } catch {
          setEmailError(text || "Có lỗi xảy ra, vui lòng thử lại.")
        }
      }
    } catch (err) {
      setEmailError("Không thể kết nối đến máy chủ.")
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    setOtpError("")
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    const newOtp = [...otp]
    pasted.split("").forEach((ch, i) => { if (i < 6) newOtp[i] = ch })
    setOtp(newOtp)
    document.getElementById(`otp-${Math.min(pasted.length, 5)}`)?.focus()
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const otpCode = otp.join("")
    if (otpCode.length < 6) { setOtpError("Vui lòng nhập đầy đủ mã OTP"); return }
    setOtpError("")
    setLoading(true)

    try {
      const response = await fetch(`${getApiBaseUrl()}/auth-service/api/auth/verify-otp?email=${email}&otp=${otpCode}`, {
        method: "POST"
      })

      if (response.ok) {
        setStep("newPassword")
      } else {
        const text = await response.text()
        try {
          const body = JSON.parse(text)
          setOtpError(body.message || "Mã OTP không chính xác hoặc đã hết hạn.")
        } catch {
          setOtpError(text || "Mã OTP không chính xác hoặc đã hết hạn.")
        }
      }
    } catch (err) {
      setOtpError("Không thể xác minh mã OTP.")
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: typeof pwErrors = {}
    if (!newPassword) errs.new = "Vui lòng nhập mật khẩu mới"
    else if (newPassword.length < 8) errs.new = "Mật khẩu phải ít nhất 8 ký tự"
    else if (!/[A-Z]/.test(newPassword)) errs.new = "Mật khẩu phải chứa ít nhất một chữ cái viết hoa"

    if (!confirmPassword) errs.confirm = "Vui lòng xác nhận mật khẩu"
    else if (confirmPassword !== newPassword) errs.confirm = "Mật khẩu không khớp"
    if (Object.keys(errs).length) { setPwErrors(errs); return }
    setPwErrors({})
    setLoading(true)

    try {
      const response = await fetch(`${getApiBaseUrl()}/auth-service/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp: otp.join(""),
          newPassword
        }),
      })

      if (response.ok) {
        setStep("success")
      } else {
        const text = await response.text()
        try {
          const body = JSON.parse(text)
          setPwErrors({ new: body.message || "Có lỗi xảy ra khi đặt lại mật khẩu." })
        } catch {
          setPwErrors({ new: text || "Có lỗi xảy ra khi đặt lại mật khẩu." })
        }
      }
    } catch (err) {
      setPwErrors({ new: "Không thể kết nối đến máy chủ." })
    } finally {
      setLoading(false)
    }
  }

  const stepConfig = [
    { id: "email", label: "Xác minh email", num: 1 },
    { id: "otp", label: "Nhập mã OTP", num: 2 },
    { id: "newPassword", label: "Mật khẩu mới", num: 3 },
  ]

  const currentStepNum = stepConfig.findIndex((s) => s.id === step) + 1

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-violet-700 via-purple-600 to-indigo-600 flex-col items-center justify-center p-12">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/5 animate-pulse" />
        <div className="absolute -bottom-24 -left-12 w-80 h-80 rounded-full bg-white/5 animate-pulse delay-500" />
        <div className="absolute top-1/4 left-1/4 w-40 h-40 rounded-full bg-violet-400/10 animate-pulse delay-1000" />

        <Link href="/" className="flex items-center gap-3 mb-12 z-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-lg">
            <ShieldCheck className="h-7 w-7 text-violet-600" />
          </div>
          <span className="text-3xl font-bold text-white tracking-tight">MedCare</span>
        </Link>

        {/* Steps visual */}
        <div className="z-10 space-y-5 w-full max-w-xs mb-10">
          {stepConfig.map((s, i) => {
            const done = currentStepNum > s.num
            const active = currentStepNum === s.num && step !== "success"
            return (
              <div key={s.id} className="flex items-center gap-4">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${done ? "bg-white border-white" : active ? "bg-white/20 border-white" : "bg-white/5 border-white/30"
                  }`}>
                  {done ? (
                    <CheckCircle2 className="h-5 w-5 text-violet-600" />
                  ) : (
                    <span className={`text-sm font-bold ${active ? "text-white" : "text-white/40"}`}>{s.num}</span>
                  )}
                </div>
                <div>
                  <p className={`font-medium text-sm ${active ? "text-white" : done ? "text-white/80" : "text-white/40"}`}>
                    {s.label}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="z-10 text-center">
          <div className="w-20 h-20 rounded-full bg-white/15 flex items-center justify-center mx-auto mb-5 border border-white/20">
            {step === "email" && <Mail className="h-10 w-10 text-white" />}
            {step === "otp" && <Smartphone className="h-10 w-10 text-white" />}
            {(step === "newPassword" || step === "success") && <KeyRound className="h-10 w-10 text-white" />}
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Khôi phục mật khẩu</h2>
          <p className="text-violet-200 text-sm max-w-xs leading-relaxed">
            Đừng lo lắng! Chúng tôi sẽ giúp bạn lấy lại quyền truy cập vào tài khoản trong vài bước đơn giản.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 bg-background">
        <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <ShieldCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-primary">MedCare</span>
        </Link>

        <div className="w-full max-w-md">
          {/* Back link */}
          {step !== "success" && (
            <Link
              href={step === "email" ? "/dang-nhap" : "#"}
              onClick={step !== "email" ? (e) => { e.preventDefault(); if (step === "otp") setStep("email"); else if (step === "newPassword") setStep("otp") } : undefined}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 group transition-colors"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              {step === "email" ? "Quay lại đăng nhập" : "Quay lại bước trước"}
            </Link>
          )}

          {/* Step: Email */}
          {step === "email" && (
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Quên mật khẩu?</h1>
              <p className="text-muted-foreground mb-8">
                Nhập email đăng ký của bạn. Chúng tôi sẽ gửi mã xác minh để đặt lại mật khẩu.
              </p>
              <form onSubmit={handleEmailSubmit} className="space-y-5" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium">Địa chỉ email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setEmailError("") }}
                      className={`h-12 pl-10 text-base ${emailError ? "border-destructive" : ""}`}
                    />
                  </div>
                  {emailError && <p className="text-destructive text-xs">{emailError}</p>}
                </div>
                <Button type="submit" className="w-full h-12 text-base font-semibold gap-2 group" disabled={loading}>
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Đang gửi mã...</>
                  ) : (
                    <>Gửi mã xác minh <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></>
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* Step: OTP */}
          {step === "otp" && (
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Nhập mã OTP</h1>
              <p className="text-muted-foreground mb-2">
                Chúng tôi đã gửi mã 6 chữ số đến
              </p>
              <p className="font-semibold text-foreground mb-8">{email}</p>
              <form onSubmit={handleOtpSubmit} className="space-y-6" noValidate>
                <div className="space-y-2">
                  <div className="flex gap-2 justify-between" onPaste={handleOtpPaste}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        id={`otp-${i}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className={`w-12 h-14 text-center text-xl font-bold rounded-lg border-2 bg-background outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 ${digit ? "border-primary text-primary" : "border-border"
                          } ${otpError ? "border-destructive" : ""}`}
                      />
                    ))}
                  </div>
                  {otpError && <p className="text-destructive text-xs text-center">{otpError}</p>}
                </div>
                <Button type="submit" className="w-full h-12 text-base font-semibold gap-2 group" disabled={loading}>
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Đang xác minh...</>
                  ) : (
                    <>Xác minh mã <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></>
                  )}
                </Button>
                <div className="text-center text-sm">
                  {resendTimer > 0 ? (
                    <span className="text-muted-foreground">
                      Gửi lại mã sau <span className="font-semibold text-primary">{resendTimer}s</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleEmailSubmit as any}
                      className="text-primary font-semibold hover:underline"
                    >
                      Gửi lại mã OTP
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Step: New Password */}
          {step === "newPassword" && (
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Đặt mật khẩu mới</h1>
              <p className="text-muted-foreground mb-8">
                Tạo mật khẩu mạnh để bảo vệ tài khoản của bạn.
              </p>
              <form onSubmit={handlePasswordSubmit} className="space-y-5" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword" className="text-sm font-medium">Mật khẩu mới</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNew ? "text" : "password"}
                      placeholder="Tối thiểu 8 ký tự và chứa ít nhất 1 chữ cái viết hoa "
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setPwErrors((er) => ({ ...er, new: undefined })) }}
                      className={`h-12 pr-12 text-base ${pwErrors.new ? "border-destructive" : ""}`}
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {pwErrors.new && <p className="text-destructive text-xs">{pwErrors.new}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">Xác nhận mật khẩu</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setPwErrors((er) => ({ ...er, confirm: undefined })) }}
                      className={`h-12 pr-12 text-base ${pwErrors.confirm ? "border-destructive" : confirmPassword && confirmPassword === newPassword ? "border-success" : ""
                        }`}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {pwErrors.confirm && <p className="text-destructive text-xs">{pwErrors.confirm}</p>}
                </div>
                <Button type="submit" className="w-full h-12 text-base font-semibold gap-2 group" disabled={loading}>
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Đang cập nhật...</>
                  ) : (
                    <>Cập nhật mật khẩu <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></>
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* Step: Success */}
          {step === "success" && (
            <div className="text-center py-6">
              <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6 border-4 border-success/20">
                <CheckCircle2 className="h-12 w-12 text-success" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-3">Thành công!</h1>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Mật khẩu của bạn đã được cập nhật thành công. Bây giờ bạn có thể đăng nhập với mật khẩu mới.
              </p>
              <Button asChild className="w-full h-12 text-base font-semibold gap-2 group">
                <Link href="/dang-nhap">
                  Đăng nhập ngay
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <p className="mt-4 text-sm text-muted-foreground">
                <Link href="/" className="text-primary hover:underline">← Về trang chủ</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
