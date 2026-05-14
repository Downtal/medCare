"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { User, Package, MapPin, FileCheck, Ticket, Star, Lock, LogOut, ChevronRight, Activity, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"
import { logoutUser } from "@/lib/logout"

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const user = session?.user

  const menuItems = [
    { id: "ho-so", label: "Thông tin cá nhân", icon: User, path: "/tai-khoan/ho-so" },
    { id: "suc-khoe", label: "Sức khỏe cá nhân", icon: Activity, path: "/tai-khoan/suc-khoe" },
    { id: "don-hang", label: "Đơn hàng của tôi", icon: Package, path: "/tai-khoan/don-hang" },
    { id: "dia-chi", label: "Quản lý số địa chỉ", icon: MapPin, path: "/tai-khoan/dia-chi" },
    { id: "don-thuoc", label: "Đơn thuốc của tôi", icon: FileCheck, path: "/tai-khoan/don-thuoc" },
    { id: "voucher", label: "Voucher của tôi", icon: Ticket, path: "/tai-khoan/voucher" },
    { id: "danh-gia", label: "Đánh giá của tôi", icon: Star, path: "/tai-khoan/danh-gia" },
    { id: "doi-mat-khau", label: "Đổi mật khẩu", icon: Lock, path: "/tai-khoan/doi-mat-khau" },
  ]

  const isAdmin = user?.role === "ADMIN" || user?.role === "PHARMACIST"

  const filteredMenuItems = isAdmin
    ? [
      { id: "admin", label: "Trang quản trị", icon: ShieldCheck, path: "/admin" },
      ...menuItems.filter(item => !["voucher", "danh-gia", "suc-khoe", "don-thuoc", "dia-chi", "don-hang"].includes(item.id))
    ]
    : menuItems


  const handleLogout = async () => {
    await logoutUser(session?.user?.accessToken)
  }

  return (
    <div className="min-h-screen flex flex-col bg-blue-50/30">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-80 shrink-0 space-y-6">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-700" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="h-16 w-16 rounded-full border-2 border-white/30 bg-white/20 flex items-center justify-center overflow-hidden shrink-0">
                  {user?.image ? (
                    <Image src={user.image} alt="Avatar" width={64} height={64} className="object-cover h-full w-full" />
                  ) : (
                    <User className="h-8 w-8 text-white" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-lg truncate">{user?.name || "Khách hàng MedCare"}</p>
                  <p className="text-xs text-white/70 truncate">{user?.email}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-2">
                {filteredMenuItems.map((item) => {
                  const isActive = pathname === item.path
                  return (
                    <Link
                      key={item.id}
                      href={item.path}
                      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all ${isActive
                          ? "bg-blue-50 text-blue-700 font-bold"
                          : "text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={`h-5 w-5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                        <span className="text-[15px]">{item.label}</span>
                      </div>
                      <ChevronRight className={`h-4 w-4 transition-transform ${isActive ? "translate-x-1" : "text-slate-300"}`} />
                    </Link>
                  )
                })}

                <Separator className="my-2 mx-4 bg-slate-100" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-rose-600 hover:bg-rose-50 transition-all font-bold"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="text-[15px]">Đăng xuất</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {children}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
