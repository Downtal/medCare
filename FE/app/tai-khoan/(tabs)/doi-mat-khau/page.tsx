"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Loader2, 
  KeyRound, 
  AlertCircle 
} from "lucide-react"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { getApiBaseUrl } from "@/lib/config"

export default function ChangePasswordPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [errors, setErrors] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user?.accessToken) return

    // Validation
    const newErrors = { oldPassword: "", newPassword: "", confirmPassword: "" }
    let hasError = false

    if (!form.oldPassword) {
      newErrors.oldPassword = "Vui lòng nhập mật khẩu cũ"
      hasError = true
    }
    if (form.newPassword.length < 8) {
      newErrors.newPassword = "Mật khẩu mới phải có ít nhất 8 ký tự"
      hasError = true
    }
    if (form.newPassword !== form.confirmPassword) {
      newErrors.confirmPassword = "Xác nhận mật khẩu không khớp"
      hasError = true
    }

    if (hasError) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${getApiBaseUrl()}/auth-service/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.user.accessToken}`,
        },
        body: JSON.stringify({
          oldPassword: form.oldPassword,
          newPassword: form.newPassword
        }),
      })

      if (res.ok) {
        toast.success("Đổi mật khẩu thành công!")
        setForm({ oldPassword: "", newPassword: "", confirmPassword: "" })
      } else {
        const errorData = await res.json()
        toast.error(errorData.message || "Đổi mật khẩu thất bại")
      }
    } catch (error) {
      toast.error("Lỗi kết nối")
    } finally {
      setLoading(false)
    }
  }

  const provider = (session?.user as any)?.provider;
  if (provider && provider !== "LOCAL") {
    return (
      <Card className="animate-in fade-in slide-in-from-right-4 duration-500 border-none shadow-sm rounded-3xl overflow-hidden bg-white">
        <CardHeader className="bg-slate-50 border-b border-slate-100 px-8 py-6 flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Đổi mật khẩu</CardTitle>
        </CardHeader>
        <CardContent className="p-16 flex flex-col items-center justify-center text-center">
          <div className="bg-blue-50 p-6 rounded-full mb-6">
            <ShieldCheck className="h-16 w-16 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-3">Tài khoản liên kết</h3>
          <p className="text-slate-500 max-w-md">
            Tài khoản này đang được đăng nhập bằng <span className="font-bold text-blue-600 capitalize">{provider.toLowerCase()}</span>. <br/>Bạn không cần đổi mật khẩu tại đây.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="animate-in fade-in slide-in-from-right-4 duration-500 border-none shadow-sm rounded-3xl overflow-hidden bg-white">
      <CardHeader className="bg-slate-50 border-b border-slate-100 px-8 py-6 flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Đổi mật khẩu</CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <div className="max-w-md mx-auto">
          <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100/50 mb-8 flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800">Bảo mật tài khoản</p>
              <p className="text-xs text-slate-500 font-medium italic">Sử dụng mật khẩu mạnh để bảo vệ thông tin của bạn.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className={`text-sm font-bold ml-1 ${errors.oldPassword ? "text-rose-500" : "text-slate-700"}`}>Mật khẩu hiện tại</Label>
              <div className="relative">
                <Input
                  type={showOld ? "text" : "password"}
                  placeholder="Nhập mật khẩu hiện tại"
                  value={form.oldPassword}
                  onChange={e => setForm({...form, oldPassword: e.target.value})}
                  className={`rounded-2xl border-slate-200 h-12 focus-visible:ring-blue-500/20 pr-12 ${errors.oldPassword ? "border-rose-200 bg-rose-50/30" : ""}`}
                />
                <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600">
                  {showOld ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.oldPassword && <p className="text-xs text-rose-500 font-bold ml-1">{errors.oldPassword}</p>}
            </div>

            <Separator className="border-slate-50" />

            <div className="space-y-2">
              <Label className={`text-sm font-bold ml-1 ${errors.newPassword ? "text-rose-500" : "text-slate-700"}`}>Mật khẩu mới</Label>
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  placeholder="Tối thiểu 8 ký tự"
                  value={form.newPassword}
                  onChange={e => setForm({...form, newPassword: e.target.value})}
                  className={`rounded-2xl border-slate-200 h-12 focus-visible:ring-blue-500/20 pr-12 ${errors.newPassword ? "border-rose-200 bg-rose-50/30" : ""}`}
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600">
                  {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.newPassword && <p className="text-xs text-rose-500 font-bold ml-1">{errors.newPassword}</p>}
            </div>

            <div className="space-y-2">
              <Label className={`text-sm font-bold ml-1 ${errors.confirmPassword ? "text-rose-500" : "text-slate-700"}`}>Xác nhận mật khẩu</Label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu mới"
                  value={form.confirmPassword}
                  onChange={e => setForm({...form, confirmPassword: e.target.value})}
                  className={`rounded-2xl border-slate-200 h-12 focus-visible:ring-blue-500/20 pr-12 ${errors.confirmPassword ? "border-rose-200 bg-rose-50/30" : ""}`}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600">
                  {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-rose-500 font-bold ml-1">{errors.confirmPassword}</p>}
            </div>

            <Button type="submit" disabled={loading} className="w-full rounded-full bg-blue-600 hover:bg-blue-700 h-14 font-black text-base shadow-xl shadow-blue-500/20 mt-8 transition-all hover:-translate-y-1 active:translate-y-0">
              {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Cập nhật mật khẩu
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
