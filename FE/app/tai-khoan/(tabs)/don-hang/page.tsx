"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Package,
  Search,
  ShoppingBag,
  ChevronRight,
  Clock,
  Loader2,
  Copy
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { orderService } from "@/services/orderService"
import { toast } from "sonner"
import { useQuery } from "@tanstack/react-query"

export default function OrdersPage() {
  const { data: session } = useSession()
  const [filter, setFilter] = useState("ALL")
  const [search, setSearch] = useState("")

  const { data: orders = [], isLoading: loading } = useQuery({
    queryKey: ["my-orders", session?.user?.userId],
    queryFn: async () => {
      const data = await orderService.getMyOrders()
      return Array.isArray(data) ? data : []
    },
    enabled: !!session?.user?.accessToken,
    staleTime: 30000, // 30 seconds
  })

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING": return "Đang xử lý"
      case "CONFIRMED": return "Đã xác nhận"
      case "SHIPPING": return "Đang giao hàng"
      case "DELIVERED": return "Đã giao"
      case "CANCELLED": return "Đã hủy"
      case "RETURNED": return "Đã trả hàng"
      default: return status
    }
  }

  const filteredOrders = orders.filter(o => {
    const matchesFilter = filter === "ALL" || o.status === filter
    const matchesSearch = o.orderCode.toLowerCase().includes(search.toLowerCase()) ||
      o.items.some(item => item.medicineName.toLowerCase().includes(search.toLowerCase()))
    return matchesFilter && matchesSearch
  })

  return (
    <Card className="animate-in fade-in slide-in-from-right-4 duration-500 border-none shadow-sm rounded-3xl overflow-hidden bg-white">
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="px-8 py-6 border-b border-slate-100">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Đơn hàng của tôi</h2>
        </div>

        <Tabs defaultValue="ALL" className="w-full" onValueChange={setFilter}>
          <TabsList className="bg-transparent h-auto p-0 gap-0 w-full justify-between overflow-x-auto no-scrollbar flex-nowrap border-b-0">
            {[
              { value: "ALL", label: "Tất cả" },
              { value: "PENDING", label: "Đang xử lý" },
              { value: "SHIPPING", label: "Đang giao" },
              { value: "DELIVERED", label: "Đã giao" },
              { value: "CANCELLED", label: "Đã hủy" },
              { value: "RETURNED", label: "Trả hàng" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-none px-6 py-4 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 border-b-2 border-transparent bg-transparent shadow-none transition-all text-[13px] font-bold uppercase tracking-tight flex-1"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="p-4 bg-slate-50/50">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tìm theo tên đơn, mã đơn, hoặc tên sản phẩm..."
              className="pl-11 pr-4 bg-white border-slate-200 rounded-full focus-visible:ring-blue-500/20 h-12 shadow-sm italic text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <CardContent className="p-6 space-y-6 bg-slate-50/30">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <p className="text-slate-500 font-bold animate-pulse">Đang đồng bộ đơn hàng...</p>
          </div>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden group"
            >
              <div className="px-6 py-4 border-b border-slate-50 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-2 rounded-xl">
                    <Package className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-[13px] font-black text-slate-900 uppercase">
                    Ngày đặt: {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                  <Separator orientation="vertical" className="h-4 bg-slate-200" />
                  <span className="text-xs text-slate-400 font-bold italic">
                    Nhận tại cửa hàng • <span className="text-slate-800 font-black">#{order.orderCode}</span>
                  </span>
                  <button className="text-blue-500 hover:text-blue-700 transition-colors" title="Sao chép mã đơn" onClick={() => {
                    navigator.clipboard.writeText(order.orderCode);
                    toast.success("Đã sao chép mã đơn hàng");
                  }}>
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${order.status === 'DELIVERED' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span className={`text-xs font-black uppercase tracking-tight ${order.status === 'DELIVERED' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>
              </div>

              <div className="p-0">
                <div className="divide-y divide-slate-50">
                  {order.items.map((item, idx) => (
                    <div key={item.medicineId || idx} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                      <div className="relative h-16 w-16 rounded-xl overflow-hidden border border-slate-100 bg-white shrink-0 group-hover:border-blue-100 transition-colors">
                        <Image
                          src={item.imageUrl || "/placeholder.svg"}
                          alt={item.medicineName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 text-sm leading-snug line-clamp-1 mb-1">
                          {item.medicineName}
                        </h4>
                        <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-wider">
                          <p className="text-blue-600">{item.unitPrice.toLocaleString("vi-VN")}đ</p>
                          <span className="text-slate-300">•</span>
                          <p className="text-slate-500">Số lượng: {item.quantity}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50/30 flex items-center justify-between">
                <Link href={`/tai-khoan/don-hang/${order.orderCode}`} className="text-blue-600 text-sm font-bold flex items-center hover:underline">
                  Xem chi tiết
                  <ChevronRight className="h-4 w-4 ml-0.5" />
                </Link>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Thành tiền:</p>
                    <p className="text-lg font-black text-blue-600 leading-none mt-1">{order.grandTotal.toLocaleString("vi-VN")}đ</p>
                  </div>
                  <Button className="rounded-full bg-blue-600 hover:bg-blue-700 px-8 h-11 font-bold text-sm shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0">
                    Mua lại
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 py-20 px-4 text-center">
            <div className="bg-slate-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Không tìm thấy đơn hàng</h3>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto text-sm italic">
              {search ? `Không tìm thấy kết quả cho "${search}"` : "Bạn chưa có đơn hàng nào ở trạng thái này."}
            </p>
            {search && (
              <Button variant="outline" onClick={() => setSearch("")} className="rounded-full border-blue-200 text-blue-600 font-bold">
                Xóa tìm kiếm
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
