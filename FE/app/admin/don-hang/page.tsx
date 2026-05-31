"use client"

import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ShoppingCart,
  Search,
  Eye,
  ClipboardList,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  FileImage,
  Package,
  History,
  Filter,
  ListFilter,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/admin/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import Image from "next/image"
import { orderService, Order, OrderStatus } from "@/services/orderService"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export default function AdminOrdersPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [dateFilter, setDateFilter] = useState("all")
  const [dayFilterType, setDayFilterType] = useState("today")
  const [monthFilterType, setMonthFilterType] = useState("thisMonth")
  const [specificDate, setSpecificDate] = useState("")
  const [specificMonth, setSpecificMonth] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const resetFilters = () => {
    setSearchQuery("")
    setSelectedStatus("all")
    setSortBy("newest")
    setDateFilter("all")
    setDayFilterType("today")
    setMonthFilterType("thisMonth")
    setSpecificDate("")
    setSpecificMonth("")
    setCurrentPage(1)
  }

  const isFiltered = searchQuery !== "" || selectedStatus !== "all" || sortBy !== "newest" || dateFilter !== "all"

  // Dialog States
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const { data: orders = [], isLoading: isLoadingAll } = useQuery({
    queryKey: ["admin_orders"],
    queryFn: () => orderService.getAllOrders()
  })

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: OrderStatus }) =>
      orderService.updateOrderStatus(id, status),
    onSuccess: (_, variables) => {
      const msg = variables.status === 'CANCELLED' ? "Đã từ chối đơn hàng" : "Đã cập nhật trạng thái đơn hàng"
      toast.success(msg)
      queryClient.invalidateQueries({ queryKey: ["admin_orders"] })
      setIsDetailsOpen(false)
    },
    onError: () => toast.error("Lỗi khi cập nhật trạng thái")
  })

  const statusConfig: Record<OrderStatus, { label: string, color: string, icon: any }> = {
    PENDING: { label: "Chờ xác nhận", color: "bg-amber-50 text-amber-600 border-amber-100", icon: Clock },
    CONFIRMED: { label: "Đã xác nhận", color: "bg-blue-50 text-blue-600 border-blue-100", icon: ClipboardList },
    SHIPPING: { label: "Đang giao", color: "bg-indigo-50 text-indigo-600 border-indigo-100", icon: Truck },
    DELIVERED: { label: "Đã giao", color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: CheckCircle2 },
    CANCELLED: { label: "Đã hủy/Từ chối", color: "bg-rose-50 text-rose-600 border-rose-100", icon: XCircle },
    PAID: { label: "Chờ xác nhận (Đã TT)", color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: CheckCircle2 },
  }

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "orderCode",
      header: "Mã đơn hàng",
      cell: ({ row }) => (
        <span className="font-black text-slate-800 tracking-tight">#{row.original.orderCode}</span>
      )
    },
    {
      accessorKey: "recipientName",
      header: "Khách hàng",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800">{row.original.recipientName}</span>
          <span className="text-[11px] text-slate-500">{row.original.recipientPhone}</span>
        </div>
      )
    },
    {
      accessorKey: "grandTotal",
      header: "Tổng tiền",
      cell: ({ row }) => (
        <span className="font-black text-blue-600">{(row.getValue("grandTotal") as number).toLocaleString("vi-VN")}đ</span>
      )
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const status = row.original.status
        const cfg = statusConfig[status] || statusConfig.PENDING
        
        if (status === 'PAID') {
          return (
            <Badge className="px-2.5 py-1 rounded-full border shadow-none font-bold text-[11px] flex items-center gap-1.5 w-fit bg-amber-50 text-amber-600 border-amber-100">
              <Clock className="w-3 h-3" />
              <span>Chờ xác nhận <span className="text-emerald-600 ml-0.5">(VNPAY)</span></span>
            </Badge>
          )
        }

        return (
          <Badge className={cn("px-2.5 py-1 rounded-full border shadow-none font-bold text-[11px] flex items-center gap-1.5 w-fit", cfg.color)}>
            <cfg.icon className="w-3 h-3" />
            {cfg.label}
          </Badge>
        )
      }
    },
    {
      accessorKey: "createdAt",
      header: "Ngày đặt",
      cell: ({ row }) => (
        <span className="text-slate-500 text-sm">{new Date(row.original.createdAt).toLocaleString("vi-VN")}</span>
      )
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-blue-50 text-blue-600 rounded-lg"
          onClick={() => {
            setSelectedOrder(row.original)
            setIsDetailsOpen(true)
          }}
        >
          <Eye className="w-4 h-4" />
        </Button>
      )
    }
  ]

  const filteredAndSortedOrders = useMemo(() => {
    if (!Array.isArray(orders)) return [];

    let result = orders.filter(o => {
      const matchesSearch =
        o.orderCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.recipientPhone.includes(searchQuery)

      const matchesStatus = selectedStatus === "all" || o.status === selectedStatus

      let matchesDate = true
      if (dateFilter !== "all") {
        const orderDate = new Date(o.createdAt)
        const now = new Date()
        
        if (dateFilter === "day") {
          if (dayFilterType === "today") {
            matchesDate = orderDate.toDateString() === now.toDateString()
          } else if (dayFilterType === "custom" && specificDate) {
            const [year, month, day] = specificDate.split('-').map(Number)
            if (year && month && day) {
              matchesDate = orderDate.getFullYear() === year && 
                            orderDate.getMonth() === month - 1 && 
                            orderDate.getDate() === day
            } else {
              matchesDate = false
            }
          }
        } else if (dateFilter === "last7days") {
          const sevenDaysAgo = new Date()
          sevenDaysAgo.setDate(now.getDate() - 7)
          matchesDate = orderDate >= sevenDaysAgo && orderDate <= now
        } else if (dateFilter === "month") {
          if (monthFilterType === "thisMonth") {
            matchesDate = orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear()
          } else if (monthFilterType === "custom" && specificMonth) {
            const [year, month] = specificMonth.split('-').map(Number)
            if (year && month) {
              matchesDate = orderDate.getFullYear() === year && orderDate.getMonth() === month - 1
            } else {
              matchesDate = false
            }
          }
        }
      }

      return matchesSearch && matchesStatus && matchesDate
    })

    result.sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return a.grandTotal - b.grandTotal
        case "price-desc":
          return b.grandTotal - a.grandTotal
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        default:
          return 0
      }
    })

    return result
  }, [orders, searchQuery, selectedStatus, sortBy, dateFilter, specificDate, specificMonth, dayFilterType, monthFilterType])

  const totalPages = Math.ceil(filteredAndSortedOrders.length / itemsPerPage)
  const paginatedRows = filteredAndSortedOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="p-10 space-y-8 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            Quản lý Đơn hàng
            <ShoppingCart className="w-8 h-8 text-blue-600" />
          </h1>
          <p className="text-slate-500 font-medium mt-1">Theo dõi, xác nhận và quản trị hoạt động bán hàng.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Tìm mã đơn, tên khách, số điện thoại..."
              className="pl-12 h-14 bg-slate-50 border-none rounded-2xl font-bold focus-visible:ring-blue-100"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
          {isFiltered && (
            <Button 
              variant="ghost" 
              onClick={resetFilters}
              className="h-14 px-6 rounded-2xl font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-all flex items-center gap-2 shrink-0 border-none"
            >
              <X className="h-4 w-4" />
              Xóa tất cả lọc
            </Button>
          )}
        </div>

        <div className="flex flex-col md:flex-row flex-wrap gap-4">
          {/* Date Filter */}
          <div className="flex flex-wrap items-center gap-2 flex-[2] min-w-[300px]">
            <Select value={dateFilter} onValueChange={(v) => { setDateFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold w-full max-w-[180px]">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <SelectValue placeholder="Thời gian" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
                <SelectItem value="all">Tất cả thời gian</SelectItem>
                <SelectItem value="day">Theo Ngày</SelectItem>
                <SelectItem value="last7days">7 ngày qua</SelectItem>
                <SelectItem value="month">Theo Tháng</SelectItem>
              </SelectContent>
            </Select>

            {dateFilter === "day" && (
              <Select value={dayFilterType} onValueChange={(v) => { setDayFilterType(v); setCurrentPage(1); }}>
                <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold w-[140px] shrink-0">
                  <SelectValue placeholder="Tùy chọn" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  <SelectItem value="today">Hôm nay</SelectItem>
                  <SelectItem value="custom">Ngày cụ thể...</SelectItem>
                </SelectContent>
              </Select>
            )}

            {dateFilter === "day" && dayFilterType === "custom" && (
              <Input 
                type="date" 
                value={specificDate} 
                onChange={(e) => { setSpecificDate(e.target.value); setCurrentPage(1); }}
                className="h-12 bg-slate-50 border-none rounded-2xl font-bold w-[140px] sm:w-[150px] px-3 shrink-0 text-sm"
              />
            )}

            {dateFilter === "month" && (
              <Select value={monthFilterType} onValueChange={(v) => { setMonthFilterType(v); setCurrentPage(1); }}>
                <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold w-[140px] shrink-0">
                  <SelectValue placeholder="Tùy chọn" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  <SelectItem value="thisMonth">Tháng này</SelectItem>
                  <SelectItem value="custom">Tháng cụ thể...</SelectItem>
                </SelectContent>
              </Select>
            )}

            {dateFilter === "month" && monthFilterType === "custom" && (
              <Input 
                type="month" 
                value={specificMonth} 
                onChange={(e) => { setSpecificMonth(e.target.value); setCurrentPage(1); }}
                className="h-12 bg-slate-50 border-none rounded-2xl font-bold w-[140px] sm:w-[150px] px-3 shrink-0 text-sm"
              />
            )}
          </div>

          {/* Status Filter */}
          <div className="flex-1 min-w-[200px]">
            <Select value={selectedStatus} onValueChange={(v) => { setSelectedStatus(v); setCurrentPage(1); }}>
              <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold w-full">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-blue-500" />
                  <SelectValue placeholder="Tất cả trạng thái" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectSeparator />
                {Object.entries(statusConfig).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort Filter */}
          <div className="flex-1 min-w-[200px]">
            <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setCurrentPage(1); }}>
              <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold w-full">
                <div className="flex items-center gap-2">
                  <ListFilter className="h-4 w-4 text-blue-500" />
                  <SelectValue placeholder="Sắp xếp" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
                <SelectItem value="newest">Mới nhất (Mặc định)</SelectItem>
                <SelectItem value="oldest">Cũ nhất</SelectItem>
                <SelectSeparator />
                <SelectItem value="price-asc">Tổng tiền: Thấp đến Cao</SelectItem>
                <SelectItem value="price-desc">Tổng tiền: Cao đến Thấp</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
        <DataTable
          columns={columns}
          data={paginatedRows}
          loading={isLoadingAll}
          hidePagination={true}
          onRowClick={(order) => {
            setSelectedOrder(order)
            setIsDetailsOpen(true)
          }}
        />

        {/* Advanced Pagination UI */}
        <div className="flex items-center justify-between px-8 py-6 bg-white border-t border-slate-50">
          <div className="text-sm font-bold text-slate-400">
            Hiển thị <span className="text-slate-800">{paginatedRows.length}</span> / {filteredAndSortedOrders.length} đơn hàng
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl h-10 font-bold border-slate-200"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Trước
            </Button>

            <div className="flex items-center gap-1">
              {(() => {
                const total = totalPages;
                const current = currentPage;
                const renderBtn = (p: number) => (
                  <Button
                    key={p}
                    variant={p === current ? "default" : "outline"}
                    onClick={() => setCurrentPage(p)}
                    className={cn(
                      "w-10 h-10 p-0 rounded-full font-bold transition-all shadow-none border-none",
                      p === current
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
                        : "bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                    )}
                  >
                    {p}
                  </Button>
                );

                const pages = [];
                if (total <= 7) {
                  for (let i = 1; i <= total; i++) pages.push(renderBtn(i));
                } else {
                  pages.push(renderBtn(1));
                  if (current > 4) pages.push(<span key="ell1" className="px-1 text-slate-300">...</span>);
                  const start = Math.max(2, current - 2);
                  const end = Math.min(total - 1, current + 2);
                  for (let i = start; i <= end; i++) pages.push(renderBtn(i));
                  if (current < total - 3) pages.push(<span key="ell2" className="px-1 text-slate-300">...</span>);
                  pages.push(renderBtn(total));
                }
                return pages;
              })()}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="rounded-xl h-10 font-bold border-slate-200"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              Tiếp <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-[95vw] lg:max-w-[1400px] w-full max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden bg-white border-none shadow-2xl rounded-[2.5rem]">
          {selectedOrder && (
            <>
              <DialogHeader className="p-10 pb-6 bg-slate-50 border-b border-slate-100">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                        <Package className="w-6 h-6" />
                      </div>
                      <DialogTitle className="text-3xl font-black text-slate-800 tracking-tight">Đơn hàng #{selectedOrder.orderCode}</DialogTitle>
                    </div>
                    <DialogDescription className="font-bold text-slate-400 flex items-center gap-2">
                      <History className="w-4 h-4" />
                      Đặt lúc: {new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}
                    </DialogDescription>
                  </div>
                  <Badge className={cn("px-5 py-2.5 rounded-2xl border-none shadow-lg font-black text-[11px] uppercase tracking-wider", 
                    selectedOrder.status === 'PAID' ? "bg-amber-50 text-amber-600" : statusConfig[selectedOrder.status].color)}>
                    {selectedOrder.status === 'PAID' ? (
                      <>CHỜ XÁC NHẬN <span className="text-emerald-600 ml-1">(VNPAY)</span></>
                    ) : (
                      statusConfig[selectedOrder.status].label
                    )}
                  </Badge>
                </div>
              </DialogHeader>

              <style jsx global>{`
                .custom-scrollbar-slim::-webkit-scrollbar {
                  width: 4px;
                }
                .custom-scrollbar-slim::-webkit-scrollbar-track {
                  background: transparent;
                }
                .custom-scrollbar-slim::-webkit-scrollbar-thumb {
                  background: #e2e8f0;
                  border-radius: 10px;
                }
                .custom-scrollbar-slim::-webkit-scrollbar-thumb:hover {
                  background: #94a3b8;
                }
              `}</style>

              <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-[1fr_500px]">
                {/* Left Column: Products (Scrollable) */}
                <div className="p-6 overflow-y-auto custom-scrollbar-slim space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-black text-[11px] uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                      SẢN PHẨM ({selectedOrder.items.length})
                    </h4>
                    <div className="space-y-3">
                      {selectedOrder.items.map((item) => (
                        <div key={item.id} className="flex gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100 group">
                          <div className="relative h-16 w-16 bg-white border border-slate-100 rounded-xl overflow-hidden shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                            <Image src={item.imageUrl || "/placeholder.svg"} alt={item.medicineName} fill className="object-contain p-2" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-slate-800 leading-tight line-clamp-1">{item.medicineName}</p>
                            <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase">{item.quantity} đơn vị × {item.unitPrice.toLocaleString("vi-VN")}đ</p>
                            <p className="text-[14px] font-black text-blue-600 mt-1">{item.subTotal.toLocaleString("vi-VN")}đ</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Shipping Info & Order Summary (Fixed/Non-scrolling) */}
                <div className="p-6 space-y-6 border-l border-slate-50 bg-slate-50/5">
                  <div className="space-y-4">
                    <h4 className="font-black text-[11px] uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                      THÔNG TIN GIAO HÀNG
                    </h4>
                    <div className="p-5 bg-white rounded-[2rem] space-y-3 border border-slate-100/50 shadow-sm">
                      <div className="space-y-1">
                        <p className="font-black text-slate-800 text-lg">{selectedOrder.recipientName}</p>
                        <p className="text-sm text-slate-500 font-bold">{selectedOrder.recipientPhone}</p>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium">{selectedOrder.recipientAddress}</p>
                      {selectedOrder.note && (
                        <div className="mt-2 p-3 bg-amber-50/50 border border-amber-100/50 rounded-xl">
                          <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">GHI CHÚ:</span>
                          <p className="text-sm text-slate-700 mt-1 italic leading-tight">{selectedOrder.note}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                        <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 font-black rounded-lg text-[10px]">THU HỘ (COD)</Badge>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{selectedOrder.paymentMethod}</span>
                      </div>
                    </div>
                  </div>

                  {selectedOrder.prescriptionImageUrl && (
                    <div className="space-y-4">
                      <h4 className="font-black text-[11px] uppercase text-slate-400 tracking-[0.2em]">TOA THUỐC</h4>
                      <div className="relative aspect-[3/4] rounded-[2rem] overflow-hidden border border-slate-200 bg-white group transition-all hover:border-blue-200 shadow-sm">
                        <Image src={selectedOrder.prescriptionImageUrl} alt="Toa" fill className="object-contain p-4" />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                          <Button variant="secondary" size="sm" className="font-black rounded-xl px-4 bg-white text-slate-900 shadow-xl" onClick={() => window.open(selectedOrder.prescriptionImageUrl, '_blank')}>
                            Phóng to
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Summary Block */}
                  <div className="p-6 bg-slate-900 text-white rounded-[2rem] space-y-4 shadow-2xl relative overflow-hidden">
                    <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-blue-600/20 blur-3xl rounded-full" />
                    <div className="flex justify-between text-[10px] font-bold opacity-50 uppercase tracking-widest">
                      <span>Tạm tính</span>
                      <span>{selectedOrder.totalPrice.toLocaleString("vi-VN")}đ</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold opacity-50 uppercase tracking-widest">
                      <span>Phí vận chuyển</span>
                      <span>{selectedOrder.shippingFee.toLocaleString("vi-VN")}đ</span>
                    </div>
                    {selectedOrder.discountAmount ? (
                      <div className="flex justify-between text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                        <span>Giảm giá</span>
                        <span>-{selectedOrder.discountAmount.toLocaleString("vi-VN")}đ</span>
                      </div>
                    ) : null}
                    <div className="h-px bg-white/10 my-2" />
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">TỔNG CỘNG</span>
                      <span className="text-3xl font-black text-blue-400 leading-none">{selectedOrder.grandTotal.toLocaleString("vi-VN")}<span className="text-[10px] ml-1 opacity-60">đ</span></span>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="p-6 bg-white border-t border-slate-100 flex items-center justify-between">
                <Button variant="ghost" className="font-bold rounded-2xl px-6 text-slate-400 hover:text-slate-600" onClick={() => setIsDetailsOpen(false)}>Quay lại</Button>
                <div className="flex items-center gap-3">
                  {(selectedOrder.status === 'PENDING' || selectedOrder.status === 'PAID') && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => updateStatusMutation.mutate({ id: selectedOrder.id, status: 'CANCELLED' })}
                        className="font-bold text-rose-600 hover:bg-rose-50 rounded-2xl h-14 px-8 border-rose-100"
                      >
                        TỪ CHỐI ĐƠN
                      </Button>
                      <Button
                        onClick={() => updateStatusMutation.mutate({ id: selectedOrder.id, status: 'CONFIRMED' })}
                        className="bg-blue-600 font-black rounded-2xl px-10 h-14 text-white shadow-xl shadow-blue-100"
                      >
                        XÁC NHẬN ĐƠN
                      </Button>
                    </>
                  )}
                  {selectedOrder.status === 'CONFIRMED' && (
                    <Button
                      onClick={() => updateStatusMutation.mutate({ id: selectedOrder.id, status: 'SHIPPING' })}
                      className="bg-indigo-600 font-black rounded-2xl px-10 h-14 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100"
                    >
                      GIAO CHO VẬN CHUYỂN
                    </Button>
                  )}
                  {selectedOrder.status === 'SHIPPING' && (
                    <Button
                      onClick={() => updateStatusMutation.mutate({ id: selectedOrder.id, status: 'DELIVERED' })}
                      className="bg-emerald-600 font-black rounded-2xl px-10 h-14 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-100"
                    >
                      XÁC NHẬN ĐÃ GIAO
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
