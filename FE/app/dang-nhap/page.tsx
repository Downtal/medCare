"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Eye, EyeOff, ShieldCheck, Bot, Pill, HeartPulse, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  const successToken = searchParams.get("token")
  const successRefreshToken = searchParams.get("refresh_token")
  
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: "", password: "", remember: false })
  const [errors, setErrors] = useState<{ email?: string; password?: string; api?: string }>({})

  useEffect(() => {
    if (successToken && successRefreshToken) {
      setLoading(true)
      signIn("credentials", {
        token: successToken,
        refreshToken: successRefreshToken,
        redirect: false,
      }).then((result) => {
        if (result?.error) {
          setErrors((prev) => ({ ...prev, api: "Đăng nhập thất bại. Vui lòng thử lại." }))
          setLoading(false)
        } else {
          router.push(callbackUrl)
          router.refresh()
        }
      }).catch(() => {
        setErrors((prev) => ({ ...prev, api: "Không thể kết nối đến máy chủ." }))
        setLoading(false)
      })
    }
  }, [successToken, successRefreshToken, callbackUrl, router])

  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail")
    if (rememberedEmail) {
      setForm((f) => ({ ...f, email: rememberedEmail, remember: true }))
    }
  }, [])

  const validate = () => {
    const newErrors: typeof errors = {}
    if (!form.email) newErrors.email = "Vui lòng nhập email hoặc số điện thoại"
    if (!form.password) newErrors.password = "Vui lòng nhập mật khẩu"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setErrors((prev) => ({ ...prev, api: undefined }))

    // Xử lý ghi nhớ email
    if (form.remember) {
      localStorage.setItem("rememberedEmail", form.email)
    } else {
      localStorage.removeItem("rememberedEmail")
    }

    try {
      const result = await signIn("credentials", {
        username: form.email,
        password: form.password,
        redirect: false, // Xử lý redirect thủ công để bắt lỗi
      })

      if (result?.error) {
        const authCode = result.code || result.error

        if (authCode.includes("PENDING_VERIFICATION")) {
          const emailParts = authCode.split(":")
          const extractedEmail = emailParts.length > 1 ? emailParts[1] : form.email
          router.push(`/xac-thuc-dang-ky?email=${encodeURIComponent(extractedEmail)}&autoSend=true`)
          return
        }

        if (authCode === "ACCOUNT_BLOCKED") {
          setErrors((prev) => ({
            ...prev,
            api: "Tài khoản của bạn hiện đang bị khóa.",
          }))
          return
        }
        if (result.error.toLowerCase().includes("chưa được xác thực") || result.error.includes("PENDING")) {
          // Tự động chuyển hướng và yêu cầu gửi OTP ngay
          router.push(`/xac-thuc-dang-ky?email=${encodeURIComponent(form.email)}&autoSend=true`)
          return
        }

        setErrors((prev) => ({
          ...prev,
          api: "Tài khoản hoặc mật khẩu không chính xác.",
        }))
      } else {
        // Đăng nhập thành công → redirect về trang được yêu cầu
        const session = await (await import("next-auth/react")).getSession()
        const userRole = session?.user?.role

        if (userRole === "ADMIN" || userRole === "STAFF") {
          router.push("/admin")
        } else {
          router.push(callbackUrl)
        }
        router.refresh() // Refresh để Header cập nhật session
      }
    } catch {
      setErrors((prev) => ({
        ...prev,
        api: "Không thể kết nối đến máy chủ. Vui lòng thử lại sau.",
      }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 flex-col items-center justify-center p-12">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5 animate-pulse" />
        <div className="absolute -bottom-32 -right-16 w-80 h-80 rounded-full bg-white/5 animate-pulse delay-300" />
        <div className="absolute top-1/3 right-10 w-32 h-32 rounded-full bg-cyan-400/20 animate-pulse delay-700" />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 mb-12 z-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-lg">
            <ShieldCheck className="h-7 w-7 text-blue-600" />
          </div>
          <span className="text-3xl font-bold text-white tracking-tight">MedCare</span>
        </Link>

        {/* Illustration Icons */}
        <div className="relative z-10 grid grid-cols-3 gap-6 mb-10">
          {[
            { icon: Bot, label: "Trợ lý AI" },
            { icon: Pill, label: "Thuốc chính hãng" },
            { icon: HeartPulse, label: "Chăm sóc sức khỏe" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20 shadow-lg hover:bg-white/25 transition-all duration-300">
                <Icon className="h-8 w-8 text-white" />
              </div>
              <span className="text-white/80 text-xs font-medium text-center">{label}</span>
            </div>
          ))}
        </div>

        <h2 className="text-3xl font-bold text-white text-center z-10 mb-4">
          Chào mừng trở lại!
        </h2>
        <p className="text-blue-100 text-center z-10 max-w-sm leading-relaxed">
          Đăng nhập để truy cập nhà thuốc trực tuyến uy tín hàng đầu Việt Nam. Chăm sóc sức khỏe bạn và gia đình mọi lúc mọi nơi.
        </p>

        {/* Trust badges */}
        <div className="flex items-center gap-6 mt-10 z-10">
          {["10.000+ sản phẩm", "Giao nhanh 2h", "Dược sĩ 24/7"].map((b) => (
            <div key={b} className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-300" />
              <span className="text-white/80 text-xs">{b}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 bg-background">
        {/* Mobile Logo */}
        <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <ShieldCheck className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-primary">MedCare</span>
        </Link>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Đăng nhập</h1>
            <p className="text-muted-foreground">
              Chưa có tài khoản?{" "}
              <Link href="/dang-ky" className="text-primary font-semibold hover:underline underline-offset-4">
                Đăng ký
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email field */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">
                Email hoặc số điện thoại
              </Label>
              <Input
                id="email"
                type="text"
                placeholder="example@email.com"
                value={form.email}
                onChange={(e) => {
                  setForm((f) => ({ ...f, email: e.target.value }))
                  if (errors.email) setErrors((er) => ({ ...er, email: undefined }))
                }}
                className={`h-12 text-base transition-all ${errors.email
                  ? "border-destructive ring-1 ring-destructive/30"
                  : "focus:ring-2 focus:ring-primary/20"
                  }`}
              />
              {errors.email && (
                <p className="text-destructive text-xs mt-1 flex items-center gap-1">
                  <span className="inline-block w-3.5 h-3.5 rounded-full bg-destructive/15 text-destructive text-[10px] font-bold flex items-center justify-center">!</span>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">
                Mật khẩu
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu"
                  value={form.password}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, password: e.target.value }))
                    if (errors.password) setErrors((er) => ({ ...er, password: undefined }))
                  }}
                  className={`h-12 text-base pr-12 transition-all ${errors.password
                    ? "border-destructive ring-1 ring-destructive/30"
                    : "focus:ring-2 focus:ring-primary/20"
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-destructive text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={form.remember}
                  onCheckedChange={(c) => setForm((f) => ({ ...f, remember: !!c }))}
                />
                <Label htmlFor="remember" className="text-sm cursor-pointer text-muted-foreground">
                  Ghi nhớ đăng nhập
                </Label>
              </div>
              <Link
                href="/quen-mat-khau"
                className="text-sm text-primary hover:underline underline-offset-4 font-medium"
              >
                Quên mật khẩu?
              </Link>
            </div>

            {/* API Error Message */}
            {errors.api && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-destructive text-sm font-medium text-center">
                  {errors.api}
                </p>
              </div>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold gap-2 group transition-all duration-200"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  Đăng nhập
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-3 text-muted-foreground">hoặc tiếp tục với</span>
              </div>
            </div>

            {/* Social login */}
            <div className="grid grid-cols-2 gap-3">
              <a
                href="http://localhost:8080/auth-service/oauth2/authorization/google"
                className="flex items-center justify-center gap-2 h-11 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-sm font-medium"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </a>

              <a
                href="http://localhost:8080/auth-service/oauth2/authorization/facebook"
                className="flex items-center justify-center gap-2 h-11 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-sm font-medium"
              >
                <svg className="h-5 w-5" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </a>
            </div>
          </form>
        </div>

        <p className="mt-8 text-xs text-muted-foreground text-center">
          Bằng cách đăng nhập, bạn đồng ý với{" "}
          <Link href="/dieu-khoan-su-dung" className="underline underline-offset-2 hover:text-foreground">
            Điều khoán sử dụng
          </Link>{" "}
          và{" "}
          <Link href="/chinh-sach-bao-mat" className="underline underline-offset-2 hover:text-foreground">
            Chính sách bảo mật
          </Link>
        </p>
      </div>
    </div>
  )
}
