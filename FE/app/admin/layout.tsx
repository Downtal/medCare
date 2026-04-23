import { ReactNode } from "react"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { QueryProvider } from "@/components/providers/query-provider"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth()
  
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "PHARMACIST")) {
    redirect("/")
  }

  return (
    <div className="flex h-screen bg-slate-50/50">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}

