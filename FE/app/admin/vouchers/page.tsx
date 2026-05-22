"use client"

import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Ticket, Plus, Search, Edit, Trash, Calendar, Percent, Banknote, RotateCcw, XCircle, Trash2, MoreVertical, ChevronLeft, ChevronRight, Clock, Info, Layers, Package, UserCheck, ShieldCheck, X, Check, ChevronsUpDown } from "lucide-react"
import { productService } from "@/services/productService"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/admin/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { voucherService, Voucher, DiscountType } from "@/services/voucherService"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Switch } from "@/components/ui/switch"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

const voucherSchema = z.object({
  code: z.string().min(3, "Mã tối thiểu 3 ký tự").max(50, "Mã tối đa 50 ký tự").toUpperCase(),
  title: z.string().min(3, "Tiêu đề tối thiểu 3 ký tự"),
  description: z.string().optional(),
  discountType: z.enum(["FIXED", "PERCENT", "FREESHIP"]),
  discountValue: z.coerce.number().min(0, "Giá trị giảm phải >= 0"),
  maxDiscount: z.coerce.number().optional().default(0),
  minOrderValue: z.coerce.number().optional().default(0),
  usageLimit: z.coerce.number().min(1, "Lượt sử dụng tối đa phải >= 1").default(999999),
  limitPerUser: z.coerce.number().min(1, "Lượt dùng mỗi khách phải >= 1").default(1),
  excludePrescriptionDrugs: z.boolean().default(true),
  applicableProductId: z.coerce.number().optional().nullable(),
  applicableCategoryId: z.coerce.number().optional().nullable(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  isActive: z.boolean().default(true),
})

type VoucherFormValues = z.infer<typeof voucherSchema>

export default function AdminVouchersPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState("active")
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false)
  const [isHardDeleteDialogOpen, setIsHardDeleteDialogOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedType, setSelectedType] = useState<string>("ALL")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [sortBy, setSortBy] = useState<string>("newest")
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Local UI states for conditional visibility
  const [isProductLimited, setIsProductLimited] = useState(false)
  const [isCategoryLimited, setIsCategoryLimited] = useState(false)

  // Fetch products and categories for limits
  const { data: productsData = [] } = useQuery({
    queryKey: ["admin_products_all"],
    queryFn: () => productService.getProducts()
  })
  const products = Array.isArray(productsData) ? productsData : (productsData as any)?.content || []

  const { data: categoryTree = [] } = useQuery({
    queryKey: ["admin_category_tree"],
    queryFn: () => productService.getCategoryTree()
  })

  // Flatten categories for select with hierarchy
  const flatCategories = useMemo(() => {
    const list: any[] = []
    const flatten = (items: any, level = 0) => {
      if (!items) return
      const arr = Array.isArray(items) ? items : items.content || []
      if (!Array.isArray(arr)) return

      arr.forEach(cat => {
        list.push({
          id: cat.id,
          name: cat.name,
          displayName: level > 0 ? `── ${cat.name}` : cat.name,
          level
        })
        if (cat.children && cat.children.length > 0) {
          flatten(cat.children, level + 1)
        }
      })
    }
    flatten(categoryTree)
    return list
  }, [categoryTree])

  const resetFilters = () => {
    setSearchQuery("")
    setSelectedType("ALL")
    setStatusFilter("ALL")
    setSortBy("newest")
    setCurrentPage(1)
  }

  const isFiltered = searchQuery !== "" || selectedType !== "ALL" || statusFilter !== "ALL" || sortBy !== "newest"

  const { data: vouchers = [], isLoading: isLoadingActive } = useQuery({
    queryKey: ["admin_vouchers"],
    queryFn: () => voucherService.getAllVouchers()
  })

  const { data: trashedVouchers = [], isLoading: isLoadingTrashed } = useQuery({
    queryKey: ["admin_trashed_vouchers"],
    queryFn: () => voucherService.getTrashedVouchers(),
    enabled: activeTab === "trash"
  })

  const form = useForm<VoucherFormValues>({
    resolver: zodResolver(voucherSchema),
    defaultValues: {
      code: "",
      title: "",
      description: "",
      discountType: "FIXED",
      discountValue: 0,
      maxDiscount: 0,
      minOrderValue: 0,
      usageLimit: 999999,
      limitPerUser: 1,
      excludePrescriptionDrugs: true,
      applicableProductId: null,
      applicableCategoryId: null,
      startAt: "",
      endAt: "",
      isActive: true,
    }
  })

  const mutation = useMutation({
    mutationFn: (values: VoucherFormValues) => {
      if (editingVoucher?.id) {
        return voucherService.updateVoucher(editingVoucher.id, values as any)
      }
      return voucherService.createVoucher(values as any)
    },
    onSuccess: () => {
      toast.success(editingVoucher ? "Đã cập nhật voucher" : "Đã tạo voucher mới")
      queryClient.invalidateQueries({ queryKey: ["admin_vouchers"] })
      setIsDialogOpen(false)
      form.reset()
    },
    onError: () => toast.error("Đã xảy ra lỗi")
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => voucherService.deleteVoucher(id),
    onSuccess: () => {
      toast.success("Đã đưa voucher vào thùng rác")
      queryClient.invalidateQueries({ queryKey: ["admin_vouchers"] })
      queryClient.invalidateQueries({ queryKey: ["admin_trashed_vouchers"] })
      setIsDeleteDialogOpen(false)
    },
    onError: () => toast.error("Lỗi khi xóa")
  })

  const restoreMutation = useMutation({
    mutationFn: (id: number) => voucherService.restoreVoucher(id),
    onSuccess: () => {
      toast.success("Đã khôi phục voucher")
      queryClient.invalidateQueries({ queryKey: ["admin_vouchers"] })
      queryClient.invalidateQueries({ queryKey: ["admin_trashed_vouchers"] })
      setIsRestoreDialogOpen(false)
    },
    onError: () => toast.error("Lỗi khi khôi phục")
  })

  const hardDeleteMutation = useMutation({
    mutationFn: (id: number) => voucherService.hardDeleteVoucher(id),
    onSuccess: () => {
      toast.success("Đã xóa vĩnh viễn voucher")
      queryClient.invalidateQueries({ queryKey: ["admin_trashed_vouchers"] })
      setIsHardDeleteDialogOpen(false)
    },
    onError: () => toast.error("Lỗi khi xóa vĩnh viễn")
  })

  const currentList = (activeTab === "active" ? vouchers : trashedVouchers) || []

  const filteredAndSortedVouchers = useMemo(() => {
    let result = currentList.filter(v => {
      const matchesSearch =
        (v.code || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.title || "").toLowerCase().includes(searchQuery.toLowerCase())

      const matchesType = selectedType === "ALL" || v.discountType === selectedType

      const matchesStatus = statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && v.isActive) ||
        (statusFilter === "LOCKED" && !v.isActive)

      return matchesSearch && matchesType && matchesStatus
    })

    result.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      if (sortBy === "oldest") return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
      if (sortBy === "value-high") return b.discountValue - a.discountValue
      if (sortBy === "value-low") return a.discountValue - b.discountValue
      return 0
    })

    return result
  }, [currentList, searchQuery, selectedType, sortBy, statusFilter])

  const totalPages = Math.ceil(filteredAndSortedVouchers.length / itemsPerPage)
  const paginatedRows = filteredAndSortedVouchers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const columns: ColumnDef<Voucher>[] = [
    {
      accessorKey: "code",
      header: "Mã Code",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Ticket className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-slate-800 tracking-wider text-base">{row.getValue("code")}</span>
            <span className="text-xs text-slate-400 font-medium truncate w-40">{row.original.title}</span>
          </div>
        </div>
      )
    },
    {
      accessorKey: "discountType",
      header: "Loại ưu đãi",
      cell: ({ row }) => {
        const type = row.getValue("discountType") as DiscountType
        const value = row.original.discountValue
        return (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{type}</span>
            <span className="font-bold text-slate-800">
              {type === "PERCENT" ? `Giảm ${value}%` : type === "FIXED" ? `Giảm ${value.toLocaleString("vi-VN")}đ` : "Miễn phí vận chuyển"}
            </span>
          </div>
        )
      }
    },
    {
      accessorKey: "usageLimit",
      header: "Sử dụng",
      cell: ({ row }) => {
        const used = row.original.usedCount || 0
        const limit = row.original.usageLimit || 0
        const percentage = limit > 0 ? (used / limit) * 100 : 0
        return (
          <div className="flex flex-col gap-1 w-24">
            <div className="flex justify-between text-[10px] font-bold">
              <span>{used}/{limit}</span>
              <span>{Math.round(percentage)}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 transition-all" style={{ width: `${percentage}%` }} />
            </div>
          </div>
        )
      }
    },
    {
      id: "conditions",
      header: "Điều kiện",
      cell: ({ row }) => {
        const minOrder = row.original.minOrderValue || 0
        const maxDiscount = row.original.maxDiscount || 0
        const excludePres = row.original.excludePrescriptionDrugs
        return (
          <div className="flex flex-col gap-1">
            <div className="text-xs font-medium text-slate-600">
              {minOrder > 0 ? `Đơn từ ${minOrder.toLocaleString("vi-VN")}đ` : "Mọi đơn hàng"}
            </div>
            {maxDiscount > 0 && row.original.discountType === "PERCENT" && (
              <div className="text-[11px] text-slate-400 font-bold italic">Giảm tối đa {maxDiscount.toLocaleString("vi-VN")}đ</div>
            )}
            {excludePres && (
              <Badge variant="outline" className="text-[9px] border-rose-100 text-rose-500 bg-rose-50/30 w-fit h-4 px-1">Loại trừ thuốc kê đơn</Badge>
            )}
          </div>
        )
      }
    },
    {
      accessorKey: "endAt",
      header: "Hiệu lực",
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar className="w-3 h-3" />
            <span className="font-medium">{row.original.startAt ? new Date(row.original.startAt).toLocaleDateString("vi-VN") : "Bất kì"}</span>
            <span>-</span>
            <span className="font-medium">{row.original.endAt ? new Date(row.original.endAt).toLocaleDateString("vi-VN") : "Không hạn"}</span>
          </div>
          {row.original.isActive ? <Badge className="bg-emerald-50 text-emerald-600 text-[10px] w-fit border-none font-bold">● Đang kích hoạt</Badge> : <Badge className="bg-slate-50 text-slate-400 text-[10px] w-fit border-none font-bold">○ Đã khóa</Badge>}
        </div>
      )
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const v = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-lg">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-none p-2" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuLabel className="text-[10px] uppercase text-slate-400 font-black px-2 py-1.5">Hành động</DropdownMenuLabel>
              {activeTab === "active" ? (
                <>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation()
                    setEditingVoucher(v)
                    form.reset({
                      ...v as any,
                      applicableProductId: v.applicableProductId || null,
                      applicableCategoryId: v.applicableCategoryId || null,
                      startAt: v.startAt ? v.startAt.slice(0, 16) : "",
                      endAt: v.endAt ? v.endAt.slice(0, 16) : "",
                    })
                    setIsProductLimited(!!v.applicableProductId)
                    setIsCategoryLimited(!!v.applicableCategoryId)
                    setIsDialogOpen(true)
                  }} className="rounded-lg cursor-pointer">
                    <Edit className="mr-2 h-4 w-4 text-blue-600" /> Chỉnh sửa
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation()
                    setSelectedId(v.id!)
                    setIsDeleteDialogOpen(true)
                  }} className="text-rose-600 focus:bg-rose-50 font-bold rounded-lg cursor-pointer">
                    <Trash className="mr-2 h-4 w-4" /> Bỏ vào thùng rác
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation()
                    setSelectedId(v.id!)
                    setIsRestoreDialogOpen(true)
                  }} className="text-emerald-600 font-bold rounded-lg cursor-pointer">
                    <RotateCcw className="mr-2 h-4 w-4" /> Khôi phục
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation()
                    setSelectedId(v.id!)
                    setIsHardDeleteDialogOpen(true)
                  }} className="text-rose-600 focus:bg-rose-50 font-black rounded-lg cursor-pointer">
                    <XCircle className="mr-2 h-4 w-4" /> XÓA VĨNH VIỄN
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    }
  ]

  return (
    <div className="p-10 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      {/* Top Header Card */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCurrentPage(1); }} className="w-[300px]">
            <TabsList className="bg-slate-100 p-1 rounded-2xl h-12">
              <TabsTrigger value="active" className="rounded-xl font-bold px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Đang chạy</TabsTrigger>
              <TabsTrigger value="trash" className="rounded-xl font-bold px-6 data-[state=active]:bg-rose-50 data-[state=active]:text-rose-600 data-[state=active]:shadow-sm">Thùng rác</TabsTrigger>
            </TabsList>
          </Tabs>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              {activeTab === "active" ? "Cấu hình Khuyến mãi" : "Thùng rác Voucher"}
            </h1>
            <p className="text-slate-500 font-medium">
              {activeTab === "active" ? "Quản lý mã Voucher, chương trình giảm giá và Freeship." : "Xem lại hoặc xóa vĩnh viễn các voucher đã xóa tạm."}
            </p>
          </div>
        </div>

        {activeTab === "active" && (
          <Button className="h-14 px-8 bg-blue-600 font-black rounded-2xl gap-2 shadow-2xl shadow-blue-200 hover:scale-[1.02] transition-all" onClick={() => {
            setEditingVoucher(null)
            form.reset()
            setIsProductLimited(false)
            setIsCategoryLimited(false)
            setIsDialogOpen(true)
          }}>
            <Plus className="w-6 h-6 text-white" /> TẠO VOUCHER MỚI
          </Button>
        )}
      </div>

      {/* Filter Card */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-5">
        {activeTab === "active" ? (
          <div className="flex flex-col gap-5">
            {/* Row 1: Search Bar */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  placeholder="Tìm theo mã code, tên voucher hoặc tiêu đề khuyến mãi..."
                  className="pl-12 h-14 rounded-2xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-blue-100 font-bold w-full transition-all text-sm"
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
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

            {/* Row 2: Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold min-w-[180px] px-6 shadow-sm hover:bg-slate-100 transition-all text-xs">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                    <SelectValue placeholder="Trạng thái" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                  <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                  <SelectItem value="LOCKED">Đang bị khóa</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedType} onValueChange={(v) => { setSelectedType(v); setCurrentPage(1); }}>
                <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold min-w-[180px] px-6 shadow-sm hover:bg-slate-100 transition-all text-xs">
                  <div className="flex items-center gap-3">
                    <Percent className="w-4 h-4 text-slate-400" />
                    <SelectValue placeholder="Loại Voucher" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  <SelectItem value="ALL">Tất cả loại</SelectItem>
                  <SelectItem value="FIXED">Giá tiền cố định</SelectItem>
                  <SelectItem value="PERCENT">Phần trăm (%)</SelectItem>
                  <SelectItem value="FREESHIP">Miễn phí vận chuyển</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setCurrentPage(1); }}>
                <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold min-w-[180px] px-6 shadow-sm hover:bg-slate-100 transition-all text-xs">
                  <div className="flex items-center gap-3">
                    <RotateCcw className="w-4 h-4 text-slate-400" />
                    <SelectValue placeholder="Sắp xếp theo" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  <SelectItem value="newest">Ngày tạo: Mới nhất</SelectItem>
                  <SelectItem value="oldest">Ngày tạo: Cũ nhất</SelectItem>
                  <SelectItem value="value-high">Giá trị: Cao đến thấp</SelectItem>
                  <SelectItem value="value-low">Giá trị: Thấp đến cao</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="relative w-full max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
            <Input
              placeholder="Tìm voucher đã xóa..."
              className="pl-12 h-14 rounded-2xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-rose-100 font-bold w-full transition-all"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
        <DataTable
          columns={columns}
          data={paginatedRows}
          hidePagination={true}
          loading={isLoadingActive || isLoadingTrashed}
          onRowClick={(v) => {
            setSelectedVoucher(v)
            setIsDetailsOpen(true)
          }}
        />

        <div className="flex items-center justify-between px-8 py-6 bg-white border-t">
          <div className="text-sm font-bold text-slate-400">
            Hiển thị <span className="text-slate-800">{paginatedRows.length}</span> / {filteredAndSortedVouchers.length} voucher
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] lg:max-w-[1100px] w-full max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden border-none shadow-2xl rounded-[2rem]">
          <DialogHeader className="p-6 px-8 bg-slate-50 border-b border-slate-100">
            <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">{editingVoucher ? "Cập nhật mã giảm giá" : "Tạo mã giảm giá mới"}</DialogTitle>
            <DialogDescription className="font-bold text-slate-400 text-xs">Thiết lập quy tắc và giá trị ưu đãi cho khách hàng.</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(v => mutation.mutate(v))} className="p-8 px-10 space-y-6 flex-1 overflow-y-auto custom-scrollbar-slim">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-slate-700">Tiêu đề Voucher</FormLabel>
                    <FormControl>
                      <Input placeholder="VD: Giảm 50k tri ân khách hàng" {...field} className="h-12 rounded-xl bg-slate-50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-slate-700">Mô tả (Điều kiện)</FormLabel>
                    <FormControl>
                      <Input placeholder="VD: Áp dụng cho đơn hàng từ 200k..." {...field} className="h-12 rounded-xl bg-slate-50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700">Mã Code (In hoa)</FormLabel>
                      <FormControl>
                        <Input placeholder="VD: MEDCARE50" {...field} value={field.value ?? ""} className="h-12 rounded-xl bg-slate-50 border-none focus-visible:bg-white transition-all text-xl font-black tracking-widest text-blue-700 uppercase" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="discountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700">Loại ưu đãi</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-xl bg-slate-50">
                            <SelectValue placeholder="Chọn loại..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-none shadow-2xl">
                          <SelectItem value="FIXED">Số tiền cố định (đ)</SelectItem>
                          <SelectItem value="PERCENT">Phần trăm (%)</SelectItem>
                          <SelectItem value="FREESHIP">Miễn phí vận chuyển</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="discountValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-primary italic">Giá trị giảm</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} value={field.value ?? ""} className="h-12 bg-primary/5 border-primary/20 text-primary font-black rounded-xl" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxDiscount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-500 italic">Giảm tối đa</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} value={field.value ?? ""} className="h-12 bg-slate-50 rounded-xl" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="minOrderValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-500 italic">Đơn tối thiểu</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} value={field.value ?? ""} className="h-12 bg-slate-50 rounded-xl" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="usageLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700">Tổng mã phát hành</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} value={field.value ?? ""} className="h-12 rounded-xl bg-slate-50" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="limitPerUser"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700">Mỗi khách dùng tối đa</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} value={field.value ?? ""} className="h-12 rounded-xl bg-slate-50" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 h-14">
                    <FormLabel className="font-bold text-slate-700 m-0">Giới hạn theo Sản phẩm</FormLabel>
                    <Switch
                      checked={isProductLimited}
                      onCheckedChange={(val) => {
                        setIsProductLimited(val)
                        if (val) {
                          setIsCategoryLimited(false)
                          form.setValue("applicableCategoryId", null)
                        }
                        if (!val) form.setValue("applicableProductId", null)
                      }}
                    />
                  </div>
                  {isProductLimited && (
                    <FormField
                      control={form.control}
                      name="applicableProductId"
                      render={({ field }) => (
                        <FormItem className="flex flex-col animate-in fade-in slide-in-from-top-2 duration-300">
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "h-14 w-full justify-between rounded-2xl bg-white border border-slate-200 font-bold text-slate-800 shadow-sm",
                                    !field.value && "text-slate-400"
                                  )}
                                >
                                  <span className="truncate">
                                    {field.value
                                      ? products.find((p: any) => p.id === field.value)?.name
                                      : "Chọn sản phẩm áp dụng..."}
                                  </span>
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[450px] p-0 rounded-2xl border-none shadow-2xl z-[100]">
                              <Command>
                                <CommandInput placeholder="Tìm tên sản phẩm..." className="h-12" />
                                <CommandList>
                                  <CommandEmpty>Không tìm thấy sản phẩm.</CommandEmpty>
                                  <CommandGroup className="max-h-[300px] overflow-y-auto">
                                    {products.map((p: any) => (
                                      <CommandItem
                                        value={p.name}
                                        key={p.id}
                                        onSelect={() => field.onChange(p.id)}
                                        className="cursor-pointer py-3"
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            p.id === field.value ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {p.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 h-14">
                    <FormLabel className="font-bold text-slate-700 m-0">Giới hạn theo Danh mục</FormLabel>
                    <Switch
                      checked={isCategoryLimited}
                      onCheckedChange={(val) => {
                        setIsCategoryLimited(val)
                        if (val) {
                          setIsProductLimited(false)
                          form.setValue("applicableProductId", null)
                        }
                        if (!val) form.setValue("applicableCategoryId", null)
                      }}
                    />
                  </div>
                  {isCategoryLimited && (
                    <FormField
                      control={form.control}
                      name="applicableCategoryId"
                      render={({ field }) => (
                        <FormItem className="animate-in fade-in slide-in-from-top-2 duration-300">
                          <Select
                            onValueChange={(v) => field.onChange(v === "none" ? null : Number(v))}
                            value={field.value ? field.value.toString() : "none"}
                          >
                            <FormControl>
                              <SelectTrigger className="h-14 rounded-2xl bg-white border border-slate-200 font-bold shadow-sm">
                                <SelectValue placeholder="Chọn danh mục áp dụng..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-2xl border-none shadow-2xl max-h-[300px] z-[100]">
                              <SelectItem value="none" className="font-bold">-- Tất cả danh mục --</SelectItem>
                              {flatCategories.map((c: any) => (
                                <SelectItem
                                  key={c.id}
                                  value={c.id.toString()}
                                  className={cn(
                                    "cursor-pointer",
                                    c.level === 0 ? "font-black text-slate-800" : "text-slate-500 pl-6"
                                  )}
                                >
                                  {c.displayName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="excludePrescriptionDrugs"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 h-12">
                      <div className="space-y-0.5">
                        <FormLabel className="font-bold text-slate-700 m-0">Không áp dụng thuốc kê đơn</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 h-12">
                      <FormLabel className="font-bold text-slate-700 m-0">Kích hoạt</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="startAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700">Ngày bắt đầu</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} className="h-12 rounded-xl bg-slate-50" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700">Ngày kết thúc</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} className="h-12 rounded-xl bg-slate-50" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="pt-6 border-t mt-8">
                <Button type="button" variant="ghost" className="font-bold rounded-2xl h-14 px-8" onClick={() => setIsDialogOpen(false)}>Hủy bỏ</Button>
                <Button className="rounded-2xl bg-blue-600 font-black h-14 px-12 text-white shadow-xl shadow-blue-100" type="submit" disabled={mutation.isPending}>
                  {editingVoucher ? "LƯU THAY ĐỔI" : "PHÁT HÀNH VOUCHER NGAY"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* AlertDialogs for Delete/Restore/HardDelete */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Bỏ vào thùng rác?</AlertDialogTitle>
            <AlertDialogDescription>
              Voucher sẽ bị ẩn khỏi hệ thống nhưng bạn vẫn có thể khôi phục từ thùng rác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Hủy</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-rose-600" onClick={() => selectedId && deleteMutation.mutate(selectedId)}>
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold font-black text-emerald-600 tracking-tight">Khôi phục Voucher?</AlertDialogTitle>
            <AlertDialogDescription>Mã giảm giá này sẽ hoạt động trở lại bình thường.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Hủy</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-emerald-600 font-bold" onClick={() => selectedId && restoreMutation.mutate(selectedId)}>PHỤC HỒI NGAY</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isHardDeleteDialogOpen} onOpenChange={setIsHardDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-rose-600">XÓA VĨNH VIỄN?</AlertDialogTitle>
            <AlertDialogDescription>Hành động này không thể khôi phục. Mọi dữ liệu liên quan đến voucher này sẽ biến mất hoàn toàn.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Hủy</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-rose-600 font-black" onClick={() => selectedId && hardDeleteMutation.mutate(selectedId)}>XÓA HOÀN TOÀN</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Voucher Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-[95vw] lg:max-w-[1400px] w-full max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem]">
          {selectedVoucher && (
            <>
              <DialogHeader className="p-6 px-8 bg-slate-50 border-b border-slate-100">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                      <Ticket className="w-6 h-6" />
                    </div>
                    <div>
                      <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">{selectedVoucher.code}</DialogTitle>
                      <DialogDescription className="font-bold text-blue-600 text-xs mt-0.5">{selectedVoucher.title}</DialogDescription>
                    </div>
                  </div>
                  <Badge className={cn("px-3 py-1 rounded-lg border-none font-black text-[9px] uppercase tracking-wider", selectedVoucher.isActive ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400")}>
                    {selectedVoucher.isActive ? "● Hoạt động" : "○ Đã khóa"}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar-slim">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="text-[13px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      GIÁ TRỊ ƯU ĐÃI
                    </h4>
                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                      <div className="text-xs font-bold text-slate-500 mb-1">Loại: <span className="text-blue-600 uppercase">{selectedVoucher.discountType}</span></div>
                      <div className="text-3xl font-black text-slate-800">
                        {selectedVoucher.discountType === "PERCENT" ? `${selectedVoucher.discountValue}%` : selectedVoucher.discountType === "FIXED" ? `${selectedVoucher.discountValue.toLocaleString("vi-VN")}đ` : "FREESHIP"}
                      </div>
                      {selectedVoucher.maxDiscount > 0 && (
                        <div className="mt-1 text-xs font-bold text-slate-400 italic">Giảm tối đa {selectedVoucher.maxDiscount.toLocaleString("vi-VN")}đ</div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[13px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      THỜI HẠN
                    </h4>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-400">Bắt đầu:</span>
                          <span className="text-slate-800 font-black">{selectedVoucher.startAt ? new Date(selectedVoucher.startAt).toLocaleString("vi-VN") : "---"}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-400">Kết thúc:</span>
                          <span className="text-slate-800 font-black">{selectedVoucher.endAt ? new Date(selectedVoucher.endAt).toLocaleString("vi-VN") : "---"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[13px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    ĐIỀU KIỆN SỬ DỤNG
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white border border-slate-100 rounded-xl flex items-center gap-3 shadow-sm">
                      <div className="p-2 bg-slate-50 rounded-lg"><Package className="w-4 h-4 text-slate-400" /></div>
                      <div>
                        <p className="text-[13px] font-black text-slate-400 uppercase tracking-tighter">Đơn hàng tối thiểu</p>
                        <p className="text-xs font-black text-slate-800">{selectedVoucher.minOrderValue?.toLocaleString("vi-VN") ?? 0}đ</p>
                      </div>
                    </div>
                    <div className="p-3 bg-white border border-slate-100 rounded-xl flex items-center gap-3 shadow-sm">
                      <div className="p-2 bg-slate-50 rounded-lg"><UserCheck className="w-4 h-4 text-slate-400" /></div>
                      <div>
                        <p className="text-[13px] font-black text-slate-400 uppercase tracking-tighter">Lượt dùng mỗi khách</p>
                        <p className="text-xs font-black text-slate-800">{selectedVoucher.limitPerUser} lần</p>
                      </div>
                    </div>
                    <div className="p-3 bg-white border border-slate-100 rounded-xl flex items-center gap-3 col-span-2 shadow-sm">
                      <div className="p-2 bg-slate-50 rounded-lg"><ShieldCheck className="w-4 h-4 text-slate-400" /></div>
                      <div className="flex justify-between items-center flex-1">
                        <div>
                          <p className="text-[13px] font-black text-slate-400 uppercase tracking-tighter">Sản phẩm bị loại trừ</p>
                          <p className="text-xs font-black text-slate-800">{selectedVoucher.excludePrescriptionDrugs ? "Thuốc kê đơn" : "Không có"}</p>
                        </div>
                        {selectedVoucher.excludePrescriptionDrugs && <Badge className="bg-rose-50 text-rose-500 border-none px-2 h-5 text-[10px]">Hạn chế</Badge>}
                      </div>
                    </div>

                    <div className="p-3 bg-white border border-slate-100 rounded-xl flex items-center gap-3 col-span-2 shadow-sm">
                      <div className="p-2 bg-blue-50 rounded-lg"><Layers className="w-4 h-4 text-blue-400" /></div>
                      <div className="flex justify-between items-center flex-1">
                        <div>
                          <p className="text-[13px] font-black text-slate-400 uppercase tracking-tighter">Phạm vi áp dụng</p>
                          <p className="text-xs font-black text-blue-600">
                            {selectedVoucher.applicableProductId ? (
                              <span>Riêng sản phẩm: <span className="">{products.find((p: any) => p.id === selectedVoucher.applicableProductId)?.name || "Sản phẩm cụ thể"}</span></span>
                            ) : selectedVoucher.applicableCategoryId ? (
                              <span>Riêng danh mục: <span className="">{flatCategories.find((c: any) => c.id === selectedVoucher.applicableCategoryId)?.name || "Danh mục cụ thể"}</span></span>
                            ) : (
                              "Tất cả sản phẩm & đơn hàng"
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[13px] font-black text-slate-400 uppercase tracking-widest">TIẾN ĐỘ SỬ DỤNG VOUCHER</h4>
                  <div className="p-5 bg-slate-900 rounded-[2rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10 flex justify-between items-end mb-3">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">ĐÃ SỬ DỤNG</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-black text-white tracking-tighter">{selectedVoucher.usedCount || 0}</span>
                          <span className="text-xs font-bold text-slate-400 uppercase">LƯỢT</span>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">NGÂN SÁCH TỐI ĐA</p>
                        <div className="flex items-baseline justify-end gap-1.5">
                          <span className="text-xl font-black text-slate-300">{selectedVoucher.usageLimit.toLocaleString()}</span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">mã</span>
                        </div>
                      </div>
                    </div>

                    <div className="relative h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 via-blue-400 to-emerald-400 rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                        style={{ width: `${Math.min(((selectedVoucher.usedCount || 0) / selectedVoucher.usageLimit) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="p-6 border-t bg-slate-50/50">
                <Button type="button" variant="outline" className="font-bold rounded-2xl h-12 px-8" onClick={() => setIsDetailsOpen(false)}>ĐÓNG CỬA SỔ</Button>
                <Button className="rounded-2xl bg-blue-600 font-black h-12 px-12 text-white shadow-xl shadow-blue-100 gap-2" onClick={() => {
                  setEditingVoucher(selectedVoucher)
                  setIsDetailsOpen(false)
                  setTimeout(() => {
                    form.reset({
                      ...selectedVoucher as any,
                      applicableProductId: selectedVoucher.applicableProductId || null,
                      applicableCategoryId: selectedVoucher.applicableCategoryId || null,
                      startAt: selectedVoucher.startAt ? selectedVoucher.startAt.slice(0, 16) : "",
                      endAt: selectedVoucher.endAt ? selectedVoucher.endAt.slice(0, 16) : "",
                    })
                    setIsProductLimited(!!selectedVoucher.applicableProductId)
                    setIsCategoryLimited(!!selectedVoucher.applicableCategoryId)
                    setIsDialogOpen(true)
                  }, 200)
                }}>
                  <Edit className="w-4 h-4" /> CHỈNH SỬA VOUCHER
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
