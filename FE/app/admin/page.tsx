"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LayoutDashboard, Users, ShoppingCart, PackageSearch } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { productService } from "@/services/productService"
import { userService } from "@/services/userService"
import { orderService } from "@/services/orderService"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts"
import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Award } from "lucide-react"
import { useSession } from "next-auth/react"

export default function AdminDashboardPage() {
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["admin_products"],
    queryFn: () => productService.getProducts()
  })

  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN"

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["admin_users"],
    queryFn: () => userService.getAllUsers(),
    enabled: isAdmin
  })

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["admin_orders"],
    queryFn: () => orderService.getAllOrders()
  })

  const safeOrders = Array.isArray(orders) ? orders : []
  // Chỉ tính doanh thu từ các đơn hàng không bị hủy
  const validOrders = safeOrders.filter(o => o.status !== 'CANCELLED')
  
  // Tính doanh thu tháng này
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthlyOrders = validOrders.filter(o => new Date(o.createdAt) >= startOfMonth)
  const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + (order.grandTotal || 0), 0)

  const newOrders = safeOrders.filter(o => o.status === 'PENDING').length

  const safeUsers = Array.isArray(users) ? users : []
  const safeProducts = Array.isArray(products) ? products : []

  const stats = [
    { title: `Doanh Thu Tháng ${now.getMonth() + 1}`, value: `${monthlyRevenue.toLocaleString("vi-VN")} đ`, icon: LayoutDashboard, color: "text-blue-600", bg: "bg-blue-100", loading: loadingOrders },
    { title: "Khách Hàng", value: safeUsers.length.toString(), icon: Users, color: "text-indigo-600", bg: "bg-indigo-100", loading: loadingUsers },
    { title: "Đơn Hàng Mới", value: newOrders.toString(), icon: ShoppingCart, color: "text-emerald-600", bg: "bg-emerald-100", loading: loadingOrders },
    { title: "Sản Phẩm", value: safeProducts.length.toString(), icon: PackageSearch, color: "text-orange-600", bg: "bg-orange-100", loading: loadingProducts },
  ]

  // --- Data Processing for Charts ---
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toISOString().split('T')[0]
  }).reverse()

  const revenueData = last7Days.map(date => {
    // Chỉ tính doanh thu theo ngày từ các đơn hàng không bị hủy
    const dailyOrders = validOrders.filter(o => o.createdAt.startsWith(date))
    const total = dailyOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0)
    return {
      date: new Date(date).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit' }),
      revenue: total,
      rawDate: date
    }
  })

  const topProducts = useMemo(() => {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const productMap = new Map<number, { name: string; quantity: number }>()

    safeOrders
      .filter(o => new Date(o.createdAt) >= oneWeekAgo)
      .forEach(order => {
        order.items.forEach(item => {
          const current = productMap.get(item.medicineId) || { name: item.medicineName, quantity: 0 }
          productMap.set(item.medicineId, {
            name: item.medicineName,
            quantity: current.quantity + item.quantity
          })
        })
      })

    return Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
  }, [safeOrders])

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

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800">Doanh thu theo thời gian</CardTitle>
              <p className="text-xs text-slate-500 font-medium mt-1">Số liệu 7 ngày gần nhất</p>
            </div>
            <TrendingUp className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent className="h-[350px] p-0 pr-6 pb-4">
            {loadingOrders ? (
              <div className="h-full w-full flex items-center justify-center">
                <Skeleton className="h-[300px] w-full m-6" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }}
                    tickFormatter={(value) => `${(value / 1000).toLocaleString()}k`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`${value.toLocaleString('vi-VN')} đ`, 'Doanh thu']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563eb"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800">Sản phẩm bán chạy</CardTitle>
              <p className="text-xs text-slate-500 font-medium mt-1">Trong 1 tuần qua</p>
            </div>
            <Award className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent className="p-0">
            {loadingOrders ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
              </div>
            ) : topProducts.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {topProducts.map((product, i) => (
                  <div key={i} className="flex items-center justify-between p-4 px-6 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-orange-100 text-orange-600' :
                        i === 1 ? 'bg-slate-100 text-slate-600' :
                          'bg-slate-50 text-slate-400'
                        }`}>
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-700 truncate max-w-[150px]">
                          {product.name}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Dược phẩm</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none font-black text-[11px] px-3">
                      {product.quantity}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-2">
                <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                  <PackageSearch size={24} />
                </div>
                <p className="text-sm font-bold text-slate-400">Chưa có dữ liệu bán hàng</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
