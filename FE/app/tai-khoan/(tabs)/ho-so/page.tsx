"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pencil, Save, X, Loader2, User, Phone, Mail, Calendar, UserCircle, ShieldCheck } from "lucide-react"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { getApiBaseUrl } from "@/lib/config"
import { format } from "date-fns"
import type { UserProfileDto } from "@/lib/types"

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const [user, setUser] = useState<UserProfileDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: ""
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (session?.user?.accessToken) {
      fetchProfile()
    }
  }, [session?.user?.accessToken])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${getApiBaseUrl()}/user-service/api/users/profiles/me`, {
        headers: { Authorization: `Bearer ${session?.user?.accessToken}` }
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data)
        setEditForm({
          fullName: data.fullName || "",
          email: data.email || "",
          phone: data.phone || "",
          dateOfBirth: data.dateOfBirth || "",
          gender: data.gender || ""
        })
      }
    } catch (error) {
      console.error("Fetch profile error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (!session?.user?.accessToken) return
    setSaving(true)
    try {
      const res = await fetch(`${getApiBaseUrl()}/user-service/api/users/profiles/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.user.accessToken}`
        },
        body: JSON.stringify(editForm)
      })

      if (res.ok) {
        const data = await res.json()
        setUser(data)
        setIsEditing(false)
        toast.success("Cập nhật thông tin thành công!")
        await update({ name: data.fullName })
      } else {
        try {
          const errorData = await res.json()
          toast.error(errorData.message || "Cập nhật thất bại")
        } catch (e) {
          toast.error("Cập nhật thất bại")
        }
      }
    } catch (error) {
      toast.error("Lỗi kết nối")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl shadow-sm border border-slate-100">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
        <p className="text-slate-500 font-bold">Đang tải hồ sơ...</p>
      </div>
    )
  }

  return (
    <Card className="border-none shadow-sm rounded-3xl overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500 bg-white">
      <CardHeader className="bg-slate-50 border-b border-slate-100 px-8 py-6 flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Hồ sơ cá nhân</CardTitle>
        <div className="flex gap-3">

          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="rounded-full px-5 border-blue-200 text-blue-600 hover:bg-blue-50">
              <Pencil className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-8">
        {isEditing ? (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Họ và tên</Label>
              <Input
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                className="rounded-xl border-slate-200 focus-visible:ring-blue-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Số điện thoại</Label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="rounded-xl border-slate-200 focus-visible:ring-blue-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Email</Label>
              <Input
                value={editForm.email}
                disabled
                className="rounded-xl bg-slate-50 border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Ngày sinh</Label>
              <Input
                type="date"
                value={editForm.dateOfBirth}
                onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                className="rounded-xl border-slate-200 focus-visible:ring-blue-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Giới tính</Label>
              <div className="flex gap-4 mt-1">
                {["MALE", "FEMALE", "OTHER"].map((g) => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="gender"
                      value={g}
                      checked={editForm.gender === g}
                      onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                      className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                    />
                    <span className="text-sm font-bold text-slate-600 group-hover:text-blue-600 transition-colors">
                      {g === "MALE" ? "Nam" : g === "FEMALE" ? "Nữ" : "Khác"}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-4">
              <Button variant="ghost" onClick={() => setIsEditing(false)} className="rounded-full px-8 font-bold">Hủy</Button>
              <Button onClick={handleUpdateProfile} disabled={saving} className="rounded-full px-8 bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-500/20">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lưu thay đổi
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 p-3 rounded-2xl">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Họ và tên</p>
                  <p className="text-lg text-slate-800 font-black">{user?.fullName || "Chưa cập nhật"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 p-3 rounded-2xl">
                  <Phone className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Số điện thoại</p>
                  <p className="text-lg text-slate-800 font-black">{user?.phone || "Chưa cập nhật"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 p-3 rounded-2xl">
                  <UserCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Giới tính</p>
                  <p className="text-lg text-slate-800 font-black">
                    {user?.gender === "MALE" ? "Nam" : user?.gender === "FEMALE" ? "Nữ" : user?.gender === "OTHER" ? "Khác" : "Chưa cập nhật"}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 p-3 rounded-2xl">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Email</p>
                  <p className="text-lg text-slate-800 font-black">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 p-3 rounded-2xl">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Ngày sinh</p>
                  <p className="text-lg text-slate-800 font-black">
                    {user?.dateOfBirth ? format(new Date(user.dateOfBirth), "dd/MM/yyyy") : "Chưa cập nhật"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
