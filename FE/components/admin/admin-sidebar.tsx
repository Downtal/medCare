"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { logoutUser } from "@/lib/logout"
import {
  LayoutDashboard,
  PackageSearch,
  Tags,
  ShoppingCart,
  Users,
  MessageSquareShare,
  LineChart,
  LogOut,
  Pill,
  Ticket,
  MessageSquare,
  FileText
} from "lucide-react"

const sidebarItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Sản phẩm", href: "/admin/san-pham", icon: PackageSearch },
  { name: "Danh mục", href: "/admin/danh-muc", icon: Tags },
  { name: "Đơn hàng", href: "/admin/don-hang", icon: ShoppingCart },
  { name: "Toa thuốc", href: "/admin/don-thuoc", icon: FileText },
  { name: "Vouchers", href: "/admin/vouchers", icon: Ticket },
  { name: "Đánh giá", href: "/admin/danh-gia", icon: MessageSquare },
  { name: "Người dùng", href: "/admin/nguoi-dung", icon: Users },
  { name: "Kho hàng", href: "/admin/kho-hang", icon: Pill },
  { name: "Chatbot Knowledge", href: "/admin/chatbot", icon: MessageSquareShare },
  { name: "Báo cáo", href: "/admin/bao-cao", icon: LineChart },
]

export function AdminSidebar({ className }: { className?: string }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role

  const filteredItems = sidebarItems.filter(item => {
    if (role === 'PHARMACIST') {
      return !['/admin/nguoi-dung'].includes(item.href)
    }
    return true
  })

  return (
    <div className={cn("flex h-screen w-64 flex-col gap-y-5 bg-white border-r border-slate-200 px-6 py-8 shadow-sm", className)}>
      <div className="flex items-center justify-center mb-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-200 shrink-0">
            <Pill className="h-6 w-6" />
          </div>
          <span className="text-xl font-black text-blue-600 tracking-tight">MedCare Admin</span>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
        {filteredItems.map((item) => {
          const isCurrent = item.href === "/admin" 
            ? pathname === "/admin" 
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200",
                isCurrent
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  isCurrent ? "text-white" : "text-slate-400 group-hover:text-blue-600"
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-100">
        <button
          onClick={() => logoutUser(session?.user?.accessToken)}
          className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 transition-all hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-5 w-5 text-slate-400 group-hover:text-red-600 shrink-0 transition-colors" />
          Đăng xuất
        </button>
      </div>
    </div>
  )
}
