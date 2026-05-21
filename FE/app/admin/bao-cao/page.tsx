"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { orderService } from "@/services/orderService"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from "recharts"
import {
  TrendingUp, Users, ShoppingBag, DollarSign, Package, Clock,
  ChevronRight, ArrowUpRight, ArrowDownRight, Filter, Download,
  Trophy, Activity, Wallet, RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, cn } from "@/lib/utils"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

export default function ReportPage() {
  const [days, setDays] = useState(30)

  const { data: stats, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin_statistics", days],
    queryFn: () => orderService.getStatistics(days)
  })

  if (isLoading) return <ReportSkeleton />

  if (!stats) return <div className="p-10 text-center font-bold text-slate-500">Không có dữ liệu báo cáo</div>

  return (
    <div className="p-8 space-y-10 bg-[#f8fafc] min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Báo cáo & Phân tích</h1>
          <p className="text-slate-500 font-medium">
            Thống kê dữ liệu trong {days === 7 ? "7 ngày qua" : days === 30 ? "30 ngày qua" : "90 ngày qua"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="h-12 px-6 rounded-xl font-bold bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} /> Cập nhật
          </Button>

          <Select value={days.toString()} onValueChange={(v) => setDays(parseInt(v))}>
            <SelectTrigger className="h-12 w-[180px] rounded-xl font-bold bg-white border-slate-200 text-slate-600">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Lọc theo" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-100 shadow-xl">
              <SelectItem value="7" className="font-bold">7 ngày qua</SelectItem>
              <SelectItem value="30" className="font-bold">30 ngày qua</SelectItem>
              <SelectItem value="90" className="font-bold">90 ngày qua</SelectItem>
            </SelectContent>
          </Select>

          <Button className="h-12 px-6 rounded-xl font-black bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-100 transition-all active:scale-95">
            <Download className="mr-2 h-4 w-4" /> Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng doanh thu"
          value={formatCurrency(stats.totalRevenue)}
          icon={<DollarSign className="h-6 w-6 text-blue-600" />}
          trend={`${(stats.revenueGrowth ?? 0) >= 0 ? "+" : ""}${(stats.revenueGrowth ?? 0).toFixed(1)}%`}
          positive={(stats.revenueGrowth ?? 0) >= 0}
          description="Doanh thu thực tế (đã trừ hủy đơn)"
          color="blue"
        />
        <StatCard
          title="Tổng đơn hàng"
          value={stats.totalOrders.toLocaleString()}
          icon={<ShoppingBag className="h-6 w-6 text-emerald-600" />}
          trend={`${(stats.ordersGrowth ?? 0) >= 0 ? "+" : ""}${(stats.ordersGrowth ?? 0).toFixed(1)}%`}
          positive={(stats.ordersGrowth ?? 0) >= 0}
          description="Tất cả các trạng thái"
          color="emerald"
        />
        <StatCard
          title="Đơn trung bình (AOV)"
          value={formatCurrency(stats.averageOrderValue)}
          icon={<Wallet className="h-6 w-6 text-amber-600" />}
          trend={`${(stats.aovGrowth ?? 0) >= 0 ? "+" : ""}${(stats.aovGrowth ?? 0).toFixed(1)}%`}
          positive={(stats.aovGrowth ?? 0) >= 0}
          description="Giá trị trên mỗi đơn hàng"
          color="amber"
        />
        <StatCard
          title="Đơn hoàn tất"
          value={stats.completedOrders.toLocaleString()}
          icon={<Package className="h-6 w-6 text-indigo-600" />}
          trend={`${(stats.completionGrowth ?? 0) >= 0 ? "+" : ""}${(stats.completionGrowth ?? 0).toFixed(1)}%`}
          positive={(stats.completionGrowth ?? 0) >= 0}
          description="Đã thanh toán & giao hàng"
          color="indigo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Trend Chart */}
        <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="p-8 pb-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black text-slate-800">Xu hướng Doanh thu</CardTitle>
                <CardDescription className="font-medium text-slate-400">Thống kê dữ liệu thực tế theo thời gian</CardDescription>
              </div>
              <div className="p-3 bg-blue-50 rounded-2xl">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-6">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.revenueTrend}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="period"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                    dy={10}
                    tickFormatter={(val) => format(new Date(val), "dd/MM")}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                    tickFormatter={(val) => `${val / 1000000}M`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                    formatter={(val: number) => [formatCurrency(val), "Doanh thu"]}
                    labelFormatter={(label) => format(new Date(label), "eeee, dd/MM", { locale: vi })}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Distribution */}
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="text-2xl font-black text-slate-800">Thanh toán</CardTitle>
            <CardDescription className="font-medium text-slate-400">Phân bổ theo phương thức</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(stats.paymentMethodDistribution).map(([name, value]) => ({ name, value }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {Object.entries(stats.paymentMethodDistribution).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-8 space-y-4">
              {Object.entries(stats.paymentMethodDistribution).map(([name, value], idx) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="font-bold text-slate-600">{name}</span>
                  </div>
                  <span className="font-black text-slate-900">{value} đơn</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Products */}
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black text-slate-800">Sản phẩm tiêu biểu</CardTitle>
                <CardDescription className="font-medium text-slate-400">Dựa trên doanh thu & số lượng</CardDescription>
              </div>
              <Trophy className="h-8 w-8 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-8 pb-8 space-y-4">
              {stats.topProducts.map((p, idx) => (
                <div key={p.productId} className="group p-5 rounded-3xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-black text-slate-800 group-hover:text-blue-700 transition-colors">{p.productName}</p>
                      <p className="text-sm font-bold text-slate-400">Đã bán: <span className="text-slate-600">{p.quantitySold} sản phẩm</span></p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-blue-600">{formatCurrency(p.totalRevenue)}</p>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Doanh thu</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Status Breakdown */}
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black text-slate-800">Trạng thái vận hành</CardTitle>
                <CardDescription className="font-medium text-slate-400">Phân tích dòng đơn hàng</CardDescription>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="grid grid-cols-2 gap-4">
              <StatusBox label="Chờ xử lý" value={stats.pendingOrders} color="amber" />
              <StatusBox label="Đang giao" value={stats.shippingOrders} color="blue" />
              <StatusBox label="Hoàn tất" value={stats.completedOrders} color="emerald" />
              <StatusBox label="Tỉ lệ hủy" value="2.4%" color="rose" />
            </div>


          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, trend, positive, description, color }: any) {
  const colorMap: any = {
    blue: "bg-blue-50 border-blue-100 text-blue-600",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-600",
    amber: "bg-amber-50 border-amber-100 text-amber-600",
    indigo: "bg-indigo-50 border-indigo-100 text-indigo-600"
  }

  return (
    <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
      <CardContent className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className={`p-4 rounded-2xl ${colorMap[color] || colorMap.blue}`}>
            {icon}
          </div>
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black ${positive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {trend}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest">{title}</p>
          <p className="text-3xl font-black text-slate-900">{value}</p>
        </div>
        <p className="text-xs font-medium text-slate-400">{description}</p>
      </CardContent>
    </Card>
  )
}

function StatusBox({ label, value, color }: any) {
  const colors: any = {
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100"
  }
  return (
    <div className={`p-6 rounded-3xl border ${colors[color]} flex flex-col items-center justify-center gap-1`}>
      <span className="text-2xl font-black">{value}</span>
      <span className="text-[10px] font-black uppercase tracking-wider opacity-70">{label}</span>
    </div>
  )
}

function ReportSkeleton() {
  return (
    <div className="p-8 space-y-10 bg-[#f8fafc] min-h-screen">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-4 w-48 rounded-lg" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-12 w-32 rounded-xl" />
          <Skeleton className="h-12 w-32 rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 rounded-3xl" />)}
      </div>
      <div className="grid grid-cols-3 gap-8">
        <Skeleton className="col-span-2 h-[450px] rounded-3xl" />
        <Skeleton className="h-[450px] rounded-3xl" />
      </div>
    </div>
  )
}
