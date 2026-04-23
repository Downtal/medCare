"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LayoutDashboard, Users, ShoppingCart, PackageSearch } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { productService } from "@/services/productService"
import { userService } from "@/services/userService"
import { orderService } from "@/services/orderService"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminDashboardPage() {
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["admin_products"],
    queryFn: () => productService.getProducts()
  })

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["admin_users"],
    queryFn: () => userService.getAllUsers()
  })

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["admin_orders"],
    queryFn: () => orderService.getAllOrders()
  })

  const safeOrders = Array.isArray(orders) ? orders : []
  const totalRevenue = safeOrders.reduce((sum, order) => sum + (order.grandTotal || 0), 0)
  const newOrders = safeOrders.filter(o => o.status === 'PENDING' || o.status === 'PENDING_PRESCRIPTION').length

  const safeUsers = Array.isArray(users) ? users : []
  const safeProducts = Array.isArray(products) ? products : []

  const stats = [
    { title: "Tổng Doanh Thu", value: `${totalRevenue.toLocaleString("vi-VN")} đ`, icon: LayoutDashboard, color: "text-blue-600", bg: "bg-blue-100", loading: loadingOrders },
    { title: "Khách Hàng", value: safeUsers.length.toString(), icon: Users, color: "text-indigo-600", bg: "bg-indigo-100", loading: loadingUsers },
    { title: "Đơn Hàng Mới", value: newOrders.toString(), icon: ShoppingCart, color: "text-emerald-600", bg: "bg-emerald-100", loading: loadingOrders },
    { title: "Sản Phẩm", value: safeProducts.length.toString(), icon: PackageSearch, color: "text-orange-600", bg: "bg-orange-100", loading: loadingProducts },
  ]

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-[1600px] mx-auto min-h-screen">
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Tổng Quan Hệ Thống</h1>
        <p className="text-slate-500 text-sm font-medium">Theo dõi hiệu suất và số liệu kinh doanh MedCare.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-slate-600">{stat.title}</CardTitle>
              <div className={`p-2 rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {stat.loading ? (
                <Skeleton className="h-9 w-24 rounded-lg" />
              ) : (
                <div className="text-3xl font-black text-slate-800">{stat.value}</div>
              )}
              <p className="text-xs font-semibold text-emerald-600 mt-2 bg-emerald-50 inline-block px-2 py-0.5 rounded-md">
                Cập nhật theo thời gian thực
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts section remains same (Placeholder) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-800">Doanh thu theo thời gian</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center bg-slate-50 rounded-xl m-6 mt-0 border border-dashed border-slate-200">
            <p className="text-slate-400 font-medium">Khu vực biểu đồ (Đang phát triển)</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-800">Sản phẩm bán chạy</CardTitle>
          </CardHeader>
           <CardContent className="h-[300px] flex items-center justify-center bg-slate-50 rounded-xl m-6 mt-0 border border-dashed border-slate-200">
            <p className="text-slate-400 font-medium">Danh sách Top bán (Đang phát triển)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
