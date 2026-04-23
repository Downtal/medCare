"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, ShieldCheck, CheckCircle2, ArrowRight, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { getApiBaseUrl } from "@/lib/config"

const passwordRules = [
  { label: "Ít nhất 8 ký tự", test: (p: string) => p.length >= 8 },
  { label: "Có chữ in hoa", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Có chữ số", test: (p: string) => /[0-9]/.test(p) },
]

type Step = "form" | "otp" | "success"

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("form")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [form, setForm] = useState({
    fullname: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [errors, setErrors] = useState<Partial<typeof form & { agreed: string; api: string; otp: string }>>({})

  const validate = () => {
    const e: typeof errors = {}
    if (!form.fullname.trim()) e.fullname = "Vui lòng nhập họ và tên"
    if (!form.phone.trim()) e.phone = "Vui lòng nhập số điện thoại"
    else if (!/^(0|84)[3|5|7|8|9][0-9]{8}$/.test(form.phone))
      e.phone = "Số điện thoại không hợp lệ"
    if (!form.email.trim()) e.email = "Vui lòng nhập email"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email không hợp lệ"
    if (!form.password) e.password = "Vui lòng nhập mật khẩu"
    else if (form.password.length < 8) e.password = "Mật khẩu phải ít nhất 8 ký tự"
    else if (!/[A-Z]/.test(form.password)) e.password = "Mật khẩu phải chứa ít nhất một chữ cái viết hoa"

    if (!form.confirmPassword) e.confirmPassword = "Vui lòng xác nhận mật khẩu"
    else if (form.confirmPassword !== form.password) e.confirmPassword = "Mật khẩu không khớp"
    if (!agreed) e.agreed = "Bạn phải đồng ý với điều khoản"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setErrors((prev) => ({ ...prev, api: undefined }))

    try {
      const response = await fetch(`${getApiBaseUrl()}/auth-service/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.email,
          password: form.password,
          email: form.email,
          phone: form.phone,
          fullName: form.fullname,
          dateOfBirth: ""
        }),
      })

      if (response.ok) {
        setStep("otp")
      } else {
        const errorData = await response.json().catch(() => null)
        setErrors((prev) => ({
          ...prev,
          api: errorData?.message || "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.",
        }))
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        api: "Không thể kết nối đến máy chủ. Vui lòng thử lại sau.",
      }))
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const otpCode = otp.join("")
    if (otpCode.length < 6) { setErrors(prev => ({ ...prev, otp: "Vui lòng nhập đầy đủ mã OTP" })); return }

    setLoading(true)
    setErrors(prev => ({ ...prev, otp: undefined }))

    try {
      const response = await fetch(`${getApiBaseUrl()}/auth-service/api/auth/verify-registration?email=${form.email}&otp=${otpCode}`, {
        method: "POST"
      })

      if (response.ok) {
        setStep("success")
        setTimeout(() => router.push("/dang-nhap"), 2000)
      } else {
        const text = await response.text()
        setErrors(prev => ({ ...prev, otp: text || "Mã xác thực không chính xác hoặc đã hết hạn." }))
      }
    } catch (err) {
      setErrors(prev => ({ ...prev, otp: "Không thể xác minh mã OTP." }))
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
      const nextInput = document.getElementById(`otp-reg-${index + 1}`)
      if (nextInput) (nextInput as HTMLInputElement).focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-reg-${index - 1}`)
      if (prevInput) (prevInput as HTMLInputElement).focus()
    }
  }

  const update = (field: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }))
  }

  const passwordStrength = passwordRules.filter((r) => r.test(form.password)).length

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
            {step === "form" ? "Đăng ký thành viên" : step === "otp" ? "Xác thực email" : "Hoàn tất đăng ký"}
          </h3>
          <p className="text-teal-50/90 leading-relaxed">
            {step === "form" && "Tạo tài khoản ngay để nhận hàng ngàn ưu đãi hấp dẫn từ nhà thuốc MedCare."}
            {step === "otp" && "Chúng tôi vừa gửi một mã xác thực 6 chữ số đến email của bạn. Vui lòng kiểm tra hộp thư."}
            {step === "success" && "Chúc mừng! Tài khoản của bạn đã được kích hoạt thành công."}
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-background overflow-y-auto">
        <div className="w-full max-w-md">
          {step === "form" && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-2">Tạo tài khoản</h1>
                <p className="text-muted-foreground">
                  Đã có tài khoản? <Link href="/dang-nhap" className="text-primary font-semibold hover:underline">Đăng nhập</Link>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="fullname">Họ và tên <span className="text-destructive">*</span></Label>
                  <Input id="fullname" placeholder="Nguyễn Văn A" value={form.fullname} onChange={(e) => update("fullname", e.target.value)} className={errors.fullname ? "border-destructive h-11" : "h-11"} />
                  {errors.fullname && <p className="text-destructive text-xs">{errors.fullname}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Số điện thoại <span className="text-destructive">*</span></Label>
                    <Input id="phone" type="tel" placeholder="091..." value={form.phone} onChange={(e) => update("phone", e.target.value)} className={errors.phone ? "border-destructive h-11" : "h-11"} />
                    {errors.phone && <p className="text-destructive text-xs">{errors.phone}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                    <Input id="email" type="email" placeholder="email@..." value={form.email} onChange={(e) => update("email", e.target.value)} className={errors.email ? "border-destructive h-11" : "h-11"} />
                    {errors.email && <p className="text-destructive text-xs">{errors.email}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Mật khẩu <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => update("password", e.target.value)} className={errors.password ? "border-destructive h-11 pr-10" : "h-11 pr-10"} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  </div>
                  {errors.password && <p className="text-destructive text-xs">{errors.password}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Xác nhận mật khẩu <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input id="confirmPassword" type={showConfirm ? "text" : "password"} value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} className={errors.confirmPassword ? "border-destructive h-11 pr-10" : "h-11 pr-10"} />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  </div>
                </div>

                {form.password && (
                  <div className="flex gap-1.5 pt-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full ${i < passwordStrength ? (passwordStrength === 1 ? "bg-red-500" : passwordStrength === 2 ? "bg-yellow-500" : "bg-green-500") : "bg-muted"}`} />
                    ))}
                  </div>
                )}

                <div className="flex items-start gap-2 pt-2">
                  <Checkbox id="terms" checked={agreed} onCheckedChange={(c) => setAgreed(!!c)} />
                  <Label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer leading-tight">
                    Tôi đồng ý với <Link href="/dieu-khoan" className="text-primary hover:underline">Điều khoản</Link> và <Link href="/chinh-sach" className="text-primary hover:underline">Chính sách bảo mật</Link>
                  </Label>
                </div>
                {errors.agreed && <p className="text-destructive text-xs">{errors.agreed}</p>}
                {errors.api && <p className="p-3 bg-red-100 text-red-600 rounded text-center text-sm font-medium">{errors.api}</p>}

                <Button type="submit" className="w-full h-12 text-base font-semibold mt-4" disabled={loading}>
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Tạo tài khoản"}
                </Button>
              </form>
            </>
          )}

          {step === "otp" && (
            <div className="w-full text-center">
              <h1 className="text-3xl font-bold mb-2">Xác nhận mã OTP</h1>
              <p className="text-muted-foreground mb-8">Vui lòng nhập mã xác thực gửi tới <b>{form.email}</b></p>
              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div className="flex gap-2 justify-center">
                  {otp.map((digit, i) => (
                    <input key={i} id={`otp-reg-${i}`} type="text" maxLength={1} value={digit} onChange={(e) => handleOtpChange(i, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(i, e)} className="w-12 h-14 text-center text-xl font-bold rounded-lg border-2 bg-background focus:border-primary outline-none transition-all" />
                  ))}
                </div>
                {errors.otp && <p className="text-destructive text-sm font-medium">{errors.otp}</p>}
                <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Xác thực & Hoàn tất"}
                </Button>
                <div className="space-y-2 pt-4">
                  <button type="button" onClick={handleSubmit} className="text-sm text-primary hover:underline font-medium block w-full">Gửi lại mã mới</button>
                </div>
              </form>
            </div>
          )}

          {step === "success" && (
            <div className="text-center py-10">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Tuyệt vời!</h1>
              <p className="text-muted-foreground mb-10 leading-relaxed">Mã xác thực chính xác. Tài khoản của bạn đã được kích hoạt thành công.</p>
              <Button asChild className="w-full h-12 text-base font-semibold"><Link href="/dang-nhap">Đăng nhập ngay</Link></Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
