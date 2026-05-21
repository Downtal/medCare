import { ReactNode } from "react"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { QueryProvider } from "@/components/providers/query-provider"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu, Pill } from "lucide-react"
import Link from "next/link"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth()
  
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "PHARMACIST")) {
    redirect("/")
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-50/50 overflow-hidden">
      {/* Desktop Sidebar */}
      <AdminSidebar className="hidden lg:flex shrink-0" />

      {/* Content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-50 shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-200 shrink-0">
              <Pill className="h-5 w-5" />
            </div>
            <span className="text-base font-black text-blue-600 tracking-tight">MedCare Admin</span>
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-700 hover:bg-slate-50 rounded-xl">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 border-r border-slate-200 bg-white">
              <SheetHeader className="sr-only">
                <SheetTitle>Admin Navigation</SheetTitle>
              </SheetHeader>
              <AdminSidebar className="w-full h-full border-r-0 shadow-none px-4" />
            </SheetContent>
          </Sheet>
        </header>

        {/* Main Admin Pages */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  )
}

