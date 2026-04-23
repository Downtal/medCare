"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Boxes,
  Search,
  Plus,
  Calendar,
  Warehouse as WarehouseIcon,
  History,
  MoreVertical,
  RotateCcw,
  XCircle,
  Trash,
  Trash2,
  MapPin,
  ArrowDownToLine,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Minus,
  ClipboardList,
  RefreshCcw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/admin/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import Image from "next/image"
import { inventoryService, InventoryBatch, Warehouse, ProductStockSummary } from "@/services/inventoryService"
import { productService } from "@/services/productService"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { Switch } from "@/components/ui/switch"

export default function InventoryPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState("summaries")
  const [searchQuery, setSearchQuery] = useState("")
  const [warehouseFilter, setWarehouseFilter] = useState<string>("ALL")
  const [filterProductId, setFilterProductId] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [stockLevelFilter, setStockLevelFilter] = useState<string>("ALL")
  const [logTypeFilter, setLogTypeFilter] = useState<string>("ALL")
  const itemsPerPage = 8

  // Dialog States
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isWarehouseDialogOpen, setIsWarehouseDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false)
  const [isHardDeleteDialogOpen, setIsHardDeleteDialogOpen] = useState(false)

  // Selection States
  const [selectedWarehouse, setSelectedWarehouse] = useState<Partial<Warehouse> | null>(null)
  const [warehouseActionId, setWarehouseActionId] = useState<number | null>(null)
  const [selectedBatch, setSelectedBatch] = useState<InventoryBatch | null>(null)
  const [isBatchDetailsOpen, setIsBatchDetailsOpen] = useState(false)

  // Multi-row import state
  type ImportRow = {
    id: number
    medicineId: string
    warehouseId: string
    batchNumber: string
    expiryDate: string
    quantity: number
    notes: string
  }

  const createEmptyRow = (id: number): ImportRow => ({
    id,
    medicineId: "",
    warehouseId: warehouses.length > 0 ? String(warehouses[0]?.id ?? "") : "",
    batchNumber: "",
    expiryDate: "",
    quantity: 1,
    notes: ""
  })

  const [importRows, setImportRows] = useState<ImportRow[]>([{ id: 1, medicineId: "", warehouseId: "", batchNumber: "", expiryDate: "", quantity: 1, notes: "" }])
  const [nextRowId, setNextRowId] = useState(2)

  const addRow = () => {
    setImportRows(prev => [...prev, createEmptyRow(nextRowId)])
    setNextRowId(n => n + 1)
  }

  const removeRow = (id: number) => {
    if (importRows.length <= 1) return
    setImportRows(prev => prev.filter(r => r.id !== id))
  }

  const updateRow = (id: number, field: keyof ImportRow, value: string | number) => {
    setImportRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  const resetImport = () => {
    setImportRows([{ id: 1, medicineId: "", warehouseId: "", batchNumber: "", expiryDate: "", quantity: 1, notes: "" }])
    setNextRowId(2)
  }

  // --- Data Fetching ---
  const { data: summariesData, isLoading: isLoadingSummaries } = useQuery({
    queryKey: ["admin_inventory_summaries"],
    queryFn: () => inventoryService.getProductSummaries()
  })
  const summaries = Array.isArray(summariesData) ? summariesData : []

  const { data: batchesData, isLoading: isInventoryLoading } = useQuery({
    queryKey: ["admin_inventory"],
    queryFn: () => inventoryService.getBatches()
  })
  const batches = Array.isArray(batchesData) ? batchesData : []

  const { data: productsData } = useQuery({
    queryKey: ["admin_products_all"],
    queryFn: () => productService.getProducts()
  })
  const products = Array.isArray(productsData) ? productsData : (productsData as any)?.content || []

  const { data: warehousesData, isLoading: isLoadingWarehouses } = useQuery({
    queryKey: ["admin_warehouses"],
    queryFn: () => inventoryService.getAllWarehouses()
  })
  const warehouses = Array.isArray(warehousesData) ? warehousesData : []

  const { data: trashedWarehousesData, isLoading: isLoadingTrash } = useQuery({
    queryKey: ["admin_trashed_warehouses"],
    queryFn: () => inventoryService.getTrashedWarehouses(),
    enabled: activeTab === "trash" || activeTab === "warehouses"
  })
  const trashedWarehouses = Array.isArray(trashedWarehousesData) ? trashedWarehousesData : []

  const { data: logsData, isLoading: isLoadingLogs } = useQuery({
    queryKey: ["admin_inventory_logs"],
    queryFn: () => inventoryService.getInventoryLogs(),
    enabled: activeTab === "logs"
  })
  const logs = Array.isArray(logsData) ? logsData : []

  // --- Helper: Get Product Info Fallback ---
  const getProductInfo = (item: any) => {
    const medId = item.medicineId;
    if (!medId) return item;

    // Check if item already has metadata
    if (item.brand && item.registrationNumber && item.countryOfOrigin) return item;

    // Lookup in products
    const p = products.find((x: any) => Number(x.id) === Number(medId));
    if (!p) return item;

    return {
      ...item,
      brand: item.brand || p.brand,
      registrationNumber: item.registrationNumber || p.registrationNumber,
      countryOfOrigin: item.countryOfOrigin || p.countryOfOrigin,
      medicineImage: item.medicineImage || p.primaryImageUrl,
      medicineName: item.medicineName || p.name
    };
  };

  // --- Mutations ---
  const importMutation = useMutation({
    mutationFn: () => {
      const validRows = importRows.filter(r => r.medicineId && r.warehouseId && r.expiryDate && r.quantity > 0)
      if (validRows.length === 0) throw new Error("Không có dòng hợp lệ")

      const requests = validRows.map(row => {
        const product = products.find((p: any) => p.id === parseInt(row.medicineId))
        return {
          medicineId: parseInt(row.medicineId),
          medicineName: product?.name || "Unknown",
          medicineSlug: product?.slug || "unknown",
          medicineImage: product?.primaryImageUrl || product?.images?.[0]?.imageUrl || "",
          brand: product?.brand || "",
          registrationNumber: product?.registrationNumber || "",
          countryOfOrigin: product?.countryOfOrigin || "",
          warehouseId: parseInt(row.warehouseId),
          batchNumber: row.batchNumber || `LOT-${Date.now()}-${row.medicineId}`,
          expiryDate: row.expiryDate,
          quantity: Number(row.quantity),
          notes: row.notes
        }
      })
      return inventoryService.importStockBulk(requests)
    },
    onSuccess: (data: any[]) => {
      toast.success(`Nhập kho thành công ${data.length} dòng!`)
      setIsImportOpen(false)
      resetImport()
      queryClient.invalidateQueries({ queryKey: ["admin_inventory"] })
      queryClient.invalidateQueries({ queryKey: ["admin_inventory_summaries"] })
    },
    onError: (err: any) => toast.error(err?.message || "Lỗi khi nhập kho")
  })

  const warehouseMutation = useMutation({
    mutationFn: (data: Partial<Warehouse>) => {
      if (data.id) return inventoryService.updateWarehouse(data.id, data)
      return inventoryService.createWarehouse(data)
    },
    onSuccess: () => {
      toast.success(selectedWarehouse?.id ? "Đã cập nhật kho" : "Đã tạo kho mới")
      setIsWarehouseDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ["admin_warehouses"] })
    },
    onError: () => toast.error("Lỗi khi xử lý thông tin kho")
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => inventoryService.deleteWarehouse(id),
    onSuccess: () => {
      toast.success("Đã đưa kho vào thùng rác")
      queryClient.invalidateQueries({ queryKey: ["admin_warehouses"] })
      queryClient.invalidateQueries({ queryKey: ["admin_trashed_warehouses"] })
      setIsDeleteDialogOpen(false)
    },
    onError: () => toast.error("Lỗi khi xóa")
  })

  const restoreMutation = useMutation({
    mutationFn: (id: number) => inventoryService.restoreWarehouse(id),
    onSuccess: () => {
      toast.success("Đã khôi phục kho")
      queryClient.invalidateQueries({ queryKey: ["admin_warehouses"] })
      queryClient.invalidateQueries({ queryKey: ["admin_trashed_warehouses"] })
      setIsRestoreDialogOpen(false)
    },
    onError: () => toast.error("Lỗi khi khôi phục")
  })

  const hardDeleteMutation = useMutation({
    mutationFn: (id: number) => inventoryService.hardDeleteWarehouse(id),
    onSuccess: () => {
      toast.success("Đã xóa vĩnh viễn")
      queryClient.invalidateQueries({ queryKey: ["admin_trashed_warehouses"] })
      setIsHardDeleteDialogOpen(false)
    },
    onError: () => toast.error("Lỗi khi xóa vĩnh viễn")
  })

  // --- Table Columns ---
  const summaryColumns: ColumnDef<ProductStockSummary>[] = [
    {
      accessorKey: "medicineImage",
      header: "Hình ảnh",
      cell: ({ row }) => {
        const info = getProductInfo(row.original);
        return (
          <div className="relative w-14 h-14 rounded-xl border bg-white shadow-sm overflow-hidden flex items-center justify-center p-1">
            <Image
              src={info.medicineImage || "/placeholder.svg"}
              alt="p"
              fill
              sizes="56px"
              className="object-contain"
            />
          </div>
        );
      },
    },
    {
      accessorKey: "medicineName",
      header: "Thông tin thuốc",
      cell: ({ row }) => {
        const info = getProductInfo(row.original);
        return (
          <div className="flex flex-col gap-0.5 min-w-[300px]">
            <span className="font-black text-slate-800 leading-tight uppercase text-sm">{info.medicineName}</span>
            <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] font-bold uppercase tracking-tight text-slate-400">
              {info.brand && <span className="text-blue-500 font-extrabold">{info.brand}</span>}
              {info.registrationNumber && <span>REG: {info.registrationNumber}</span>}
            </div>
            <div className="text-[11px] text-slate-500 font-medium italic">
              {info.countryOfOrigin || "Chưa rõ xuất xứ"}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "totalQuantity",
      header: "Tổng tồn kho",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-xl font-black text-slate-800">{row.original.totalQuantity}</span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Trong {row.original.batchCount} lô</span>
        </div>
      )
    },
    {
      accessorKey: "available",
      header: "Khả dụng",
      cell: ({ row }) => {
        const avail = row.original.totalQuantity - row.original.totalReserved
        return (
          <Badge className={cn("rounded-lg px-3 py-1 font-black shadow-sm border-none", avail > 10 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
            {avail} CÓ SẴN
          </Badge>
        )
      }
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          className="rounded-xl text-blue-600 font-bold gap-2 hover:bg-blue-50"
          onClick={(e) => {
            e.stopPropagation()
            setFilterProductId(row.original.medicineId)
            setActiveTab("batches")
          }}
        >
          Chi tiết lô <History size={16} />
        </Button>
      )
    }
  ]

  const batchColumns: ColumnDef<InventoryBatch>[] = [
    {
      accessorKey: "medicineImage",
      header: "Hình ảnh",
      cell: ({ row }) => {
        const info = getProductInfo(row.original);
        return (
          <div className="relative w-12 h-12 rounded-lg border bg-white shadow-sm overflow-hidden flex items-center justify-center p-1">
            <Image
              src={info.medicineImage || "/placeholder.svg"}
              alt="p"
              fill
              sizes="48px"
              className="object-contain"
            />
          </div>
        );
      },
    },
    {
      accessorKey: "medicineName",
      header: "Thông tin thuốc",
      cell: ({ row }) => {
        const info = getProductInfo(row.original);
        return (
          <div className="flex flex-col gap-0.5 min-w-[250px]">
            <span className="font-bold text-slate-800 leading-tight uppercase text-[13px]">{info.medicineName}</span>
            <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[9px] font-bold uppercase tracking-tight text-slate-400">
              {info.brand && <span className="text-blue-500 font-extrabold">{info.brand}</span>}
              {info.registrationNumber && <span>REG: {info.registrationNumber}</span>}
            </div>
            <div className="text-[10px] text-slate-500 font-medium italic">
              {info.countryOfOrigin || "Chưa rõ xuất xứ"}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "batchNumber",
      header: "Số lô",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono bg-slate-50 text-slate-700 border-slate-200">
          {row.getValue("batchNumber")}
        </Badge>
      )
    },
    {
      accessorKey: "warehouseName",
      header: "Kho",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-slate-600">
          <WarehouseIcon className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium">{row.getValue("warehouseName")}</span>
        </div>
      )
    },
    {
      accessorKey: "expiryDate",
      header: "Hạn sử dụng",
      cell: ({ row }) => {
        const date = new Date(row.original.expiryDate)
        const today = new Date()
        const isExpired = date < today
        const isExpiringSoon = !isExpired && date < new Date(today.setMonth(today.getMonth() + 6))

        return (
          <div className="flex items-center gap-2">
            <Calendar className={cn("w-4 h-4", isExpired ? "text-rose-500" : isExpiringSoon ? "text-amber-500" : "text-slate-400")} />
            <span className={cn(
              "text-sm font-bold",
              isExpired ? "text-rose-600" : isExpiringSoon ? "text-amber-600" : "text-slate-600"
            )}>
              {new Date(row.original.expiryDate).toLocaleDateString("vi-VN")}
            </span>
            {isExpired && <Badge className="bg-rose-100 text-rose-600 hover:bg-rose-100 border-none text-[10px] h-5 px-1.5 font-black">Hết hạn</Badge>}
          </div>
        )
      }
    },
    {
      accessorKey: "quantityAvailable",
      header: "Tồn kho",
      cell: ({ row }) => {
        const available = row.original.quantityAvailable - row.original.quantityReserved
        return (
          <div className="flex flex-col items-end pr-4">
            <span className="text-lg font-black text-slate-800">{available}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tổng: {row.original.quantityAvailable}</span>
          </div>
        )
      }
    }
  ]

  const warehouseColumns: ColumnDef<Warehouse>[] = [
    {
      accessorKey: "name",
      header: "Tên kho",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <WarehouseIcon className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-800">{row.original.name}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ID: #{row.original.id}</span>
          </div>
        </div>
      )
    },
    {
      accessorKey: "address",
      header: "Địa chỉ",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-slate-500 text-sm italic">
          <MapPin className="w-4 h-4 shrink-0" />
          <span className="line-clamp-1">{row.original.address}</span>
        </div>
      )
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => (
        <Badge className={cn("rounded-lg font-bold border-none", row.original.status ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400")}>
          {row.original.status ? "Hoạt động" : "Tạm dừng"}
        </Badge>
      )
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const w = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-lg text-slate-400">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-none p-2">
              <DropdownMenuLabel className="text-[10px] uppercase text-slate-400 font-black px-2 py-1.5">Quản lý</DropdownMenuLabel>
              {activeTab === "warehouses" ? (
                <>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation()
                    setSelectedWarehouse(w)
                    setIsWarehouseDialogOpen(true)
                  }} className="rounded-lg cursor-pointer">
                    Cập nhật thông tin
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation()
                    setWarehouseActionId(w.id)
                    setIsDeleteDialogOpen(true)
                  }} className="text-rose-600 focus:bg-rose-50 font-bold rounded-lg cursor-pointer">
                    <Trash className="mr-2 h-4 w-4" /> Cho vào thùng rác
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => {
                    setWarehouseActionId(w.id)
                    setIsRestoreDialogOpen(true)
                  }} className="text-emerald-600 font-bold rounded-lg cursor-pointer">
                    <RotateCcw className="mr-2 h-4 w-4" /> Khôi phục
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {
                    setWarehouseActionId(w.id)
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

  const logColumns: ColumnDef<any>[] = [
    {
      accessorKey: "createdAt",
      header: "Thời gian",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-700">{new Date(row.original.createdAt).toLocaleDateString("vi-VN")}</span>
          <span className="text-[10px] text-slate-400 font-black">{new Date(row.original.createdAt).toLocaleTimeString("vi-VN")}</span>
        </div>
      )
    },
    {
      accessorKey: "medicineName",
      header: "Sản phẩm",
      cell: ({ row }) => {
        const info = getProductInfo({ medicineId: row.original.medicineId });
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 relative rounded-lg border overflow-hidden shrink-0">
              <Image src={info.medicineImage || "/placeholder.svg"} alt="" fill className="object-contain p-1" />
            </div>
            <span className="font-bold text-slate-800 text-xs uppercase line-clamp-1">{info.medicineName || "Sản phẩm #" + row.original.medicineId}</span>
          </div>
        )
      }
    },
    {
      accessorKey: "changeType",
      header: "Loại biến động",
      cell: ({ row }) => (
        <Badge className={cn(
          "rounded-lg font-black text-[10px] uppercase px-2 py-0.5 border-none",
          row.original.changeType === "IN" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
        )}>
          {row.original.changeType === "IN" ? "NHẬP KHO" : "XUẤT KHO"}
        </Badge>
      )
    },
    {
      accessorKey: "quantity",
      header: "Số lượng",
      cell: ({ row }) => (
        <span className={cn(
          "text-lg font-black",
          row.original.changeType === "IN" ? "text-emerald-600" : "text-rose-600"
        )}>
          {row.original.changeType === "IN" ? "+" : "-"}{row.original.quantity}
        </span>
      )
    },
    {
      accessorKey: "notes",
      header: "Ghi chú",
      cell: ({ row }) => <span className="text-xs text-slate-500 italic font-medium">"{row.original.notes}"</span>
    }
  ]

  const getFilteredData = () => {
    if (activeTab === "summaries") {
      let list = summaries;
      if (warehouseFilter !== "ALL") {
        const productIdsInWarehouse = new Set(batches.filter(b => String(b.warehouseId) === warehouseFilter).map(b => b.medicineId));
        list = list.filter(s => productIdsInWarehouse.has(s.medicineId));
      }
      if (stockLevelFilter === "LOW") {
        list = list.filter(s => s.totalQuantity < 20);
      }
      return list.filter(s => (s.medicineName || "").toLowerCase().includes(searchQuery.toLowerCase()))
    }

    let list: any[] = activeTab === "batches" ? batches :
      activeTab === "warehouses" ? warehouses :
        activeTab === "logs" ? logs : trashedWarehouses

    if (activeTab === "batches") {
      if (warehouseFilter !== "ALL") {
        list = list.filter(b => String(b.warehouseId) === warehouseFilter)
      }
      if (statusFilter === "EXPIRED") {
        list = list.filter(b => new Date(b.expiryDate) < new Date())
      } else if (statusFilter === "ACTIVE") {
        list = list.filter(b => new Date(b.expiryDate) >= new Date())
      }
    }

    if (activeTab === "logs") {
      if (logTypeFilter !== "ALL") {
        list = list.filter(l => l.changeType === logTypeFilter)
      }
    }

    if (filterProductId && activeTab === "batches") {
      list = list.filter(b => b.medicineId === filterProductId)
    }

    return list.filter(item => {
      const name = (item as any).medicineName || (item as any).name || ""
      const batch = (item as any).batchNumber || ""
      return name.toLowerCase().includes(searchQuery.toLowerCase()) || batch.toLowerCase().includes(searchQuery.toLowerCase())
    })
  }

  const filteredRows = getFilteredData()
  const totalPages = Math.ceil(filteredRows.length / itemsPerPage)
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="p-10 space-y-6 max-w-full mx-auto min-h-screen">
      {/* Top Card: Tabs & Main Actions */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
        <div className="space-y-6 flex-1 min-w-0">
          <div className="overflow-x-auto pb-2 -mb-2 custom-scrollbar-slim">
            <Tabs value={activeTab} onValueChange={(v) => {
              setActiveTab(v);
              setFilterProductId(null);
              setCurrentPage(1);
              setSearchQuery("");
            }} className="w-fit">
              <TabsList className="bg-slate-100 p-1 rounded-2xl h-12 flex-nowrap shrink-0">
                <TabsTrigger value="summaries" className="rounded-xl font-bold px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2 text-[10px]">
                  <LayoutGrid size={14} /> THEO SẢN PHẨM
                </TabsTrigger>
                <TabsTrigger value="batches" className="rounded-xl font-bold px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2 text-[10px]">
                  <Boxes size={14} /> LÔ CHI TIẾT
                </TabsTrigger>
                <TabsTrigger value="warehouses" className="rounded-xl font-bold px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2 text-[10px]">
                  <WarehouseIcon size={14} /> DANH MỤC KHO
                </TabsTrigger>
                <TabsTrigger value="logs" className="rounded-xl font-bold px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2 text-[10px]">
                  <ClipboardList size={14} /> BIẾN ĐỘNG KHO
                </TabsTrigger>
                <TabsTrigger value="trash" className="rounded-xl font-bold px-4 data-[state=active]:bg-rose-50 data-[state=active]:text-rose-600 data-[state=active]:shadow-sm text-[10px]">THÙNG RÁC</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3  first-letter:uppercase">
              {activeTab === "summaries" ? "Quản lý tồn kho" :
                activeTab === "batches" ? (filterProductId ? "Chi tiết lô hàng" : "Lịch sử nhập kho") :
                  activeTab === "warehouses" ? "Hệ thống kho hàng" :
                    activeTab === "logs" ? "Lịch sử biến động" : "Kho lưu trữ tạm thời"}
            </h1>
            <p className="text-slate-500 font-medium mt-1 text-sm">
              Phân phối và theo dõi tồn kho dược phẩm toàn hệ thống & Knowledge Base.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 shrink-0">
          {activeTab === "warehouses" && (
            <Button
              onClick={() => { setSelectedWarehouse({}); setIsWarehouseDialogOpen(true); }}
              className="h-14 px-8 rounded-2xl font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-100 gap-2 transition-all hover:scale-105 active:scale-95"
            >
              <Plus size={20} /> THÊM KHO MỚI
            </Button>
          )}
          <Button
            onClick={() => setIsImportOpen(true)}
            className="h-14 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-xl shadow-blue-100 gap-2 transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={20} /> NHẬP KHO SẢN PHẨM
          </Button>
        </div>
      </div>

      {/* Bottom Card: Search & Filters */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4">
        <div className="relative w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Tìm kiếm theo Tên thuốc, hoạt chất, số lô hàng..."
            className="pl-14 h-16 rounded-[1.25rem] bg-slate-50 border-none focus-visible:ring-blue-100 font-bold text-slate-700 shadow-inner text-base"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {(activeTab === "summaries" || activeTab === "batches") && (
            <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
              <SelectTrigger className="w-fit min-w-[200px] h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-600 px-4">
                <div className="flex items-center gap-2">
                  <WarehouseIcon className="w-4 h-4 text-slate-400" />
                  <span className="text-[10px] uppercase text-slate-400 mr-1">Kho:</span>
                  <SelectValue placeholder="Tất cả kho" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                <SelectItem value="ALL" className="font-bold rounded-xl">Tất cả kho lưu trữ</SelectItem>
                {warehouses.map(w => (
                  <SelectItem key={w.id} value={String(w.id)} className="font-bold rounded-xl">{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {activeTab === "summaries" && (
            <Select value={stockLevelFilter} onValueChange={setStockLevelFilter}>
              <SelectTrigger className="w-fit min-w-[180px] h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-600 px-4">
                <SelectValue placeholder="Mức tồn kho" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                <SelectItem value="ALL" className="font-bold rounded-xl">Tất cả số lượng</SelectItem>
                <SelectItem value="LOW" className="font-bold rounded-xl text-rose-500">Sắp hết hàng</SelectItem>
              </SelectContent>
            </Select>
          )}

          {activeTab === "batches" && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-fit min-w-[180px] h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-600 px-4">
                <SelectValue placeholder="Trạng thái lô" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                <SelectItem value="ALL" className="font-bold rounded-xl">Tất cả trạng thái</SelectItem>
                <SelectItem value="ACTIVE" className="font-bold rounded-xl text-emerald-600">Còn hạn sử dụng</SelectItem>
                <SelectItem value="EXPIRED" className="font-bold rounded-xl text-rose-600">Đã hết hạn</SelectItem>
              </SelectContent>
            </Select>
          )}

          {activeTab === "logs" && (
            <Select value={logTypeFilter} onValueChange={setLogTypeFilter}>
              <SelectTrigger className="w-fit min-w-[180px] h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-600 px-4">
                <SelectValue placeholder="Loại biến động" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                <SelectItem value="ALL" className="font-bold rounded-xl">Mọi biến động</SelectItem>
                <SelectItem value="IN" className="font-bold rounded-xl text-emerald-600 font-black">NHẬP KHO</SelectItem>
                <SelectItem value="OUT" className="font-bold rounded-xl text-rose-600 font-black">XUẤT KHO</SelectItem>
              </SelectContent>
            </Select>
          )}

          {filterProductId && (
            <Button variant="ghost" onClick={() => setFilterProductId(null)} className="h-12 rounded-xl text-rose-500 font-bold bg-rose-50 gap-2 px-4 shadow-sm border border-rose-100">
              Hủy lọc thuốc <XCircle size={16} />
            </Button>
          )}

          <div className="ml-auto flex items-center gap-2">
            <Button
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["admin_inventory_summaries"] })
                queryClient.invalidateQueries({ queryKey: ["admin_inventory_batches"] })
                toast.info("Đã đồng bộ dữ liệu mới nhất")
              }}
              variant="outline"
              className="h-12 px-6 rounded-xl font-bold bg-white border-slate-100 text-slate-600 gap-2 hover:bg-slate-50 shadow-sm"
            >
              <RefreshCcw className="w-4 h-4 text-slate-400" /> LÀM MỚI
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
        <DataTable
          columns={
            activeTab === "summaries" ? (summaryColumns as any[]) :
              activeTab === "batches" ? (batchColumns as any[]) :
                activeTab === "logs" ? (logColumns as any[]) : (warehouseColumns as any[])
          }
          data={paginatedRows}
          hidePagination={true}
          loading={isInventoryLoading || isLoadingWarehouses || isLoadingTrash || isLoadingSummaries || isLoadingLogs}
          onRowClick={(row: any) => {
            if (activeTab === "summaries") {
              setFilterProductId(row.medicineId)
              setActiveTab("batches")
            } else if (activeTab === "batches") {
              setSelectedBatch(row)
              setIsBatchDetailsOpen(true)
            } else if (activeTab === "warehouses") {
              setSelectedWarehouse(row)
              setIsWarehouseDialogOpen(true)
            }
          }}
        />

        <div className="flex items-center justify-between px-8 py-6 bg-white border-t">
          <div className="text-sm font-bold text-slate-400">
            Hiển thị <span className="text-slate-800">{paginatedRows.length}</span> / {filteredRows.length} bản ghi
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

      {/* Bulk Import Dialog */}
      <Dialog open={isImportOpen} onOpenChange={(open) => { setIsImportOpen(open); if (!open) resetImport() }}>
        <DialogContent className="max-w-[95vw] xl:max-w-[1400px] w-full max-h-[95vh] flex flex-col gap-0 p-0 rounded-[2rem] overflow-hidden border-none shadow-2xl">
          {/* Header */}
          <DialogHeader className="p-8 pb-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white shrink-0">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                <ClipboardList className="h-7 w-7 text-white" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-black text-white tracking-tight">Phiếu Nhập Kho</DialogTitle>
                <DialogDescription className="text-white/60 text-xs font-bold uppercase tracking-widest">Biểu mẫu nhập thuốc và dược phẩm vào kho hệ thống</DialogDescription>

              </div>
              <div className="ml-auto flex items-center gap-3">
                <Badge className="bg-white/20 text-white border-none text-sm font-black px-4 py-2 rounded-xl">
                  {importRows.filter(r => r.medicineId && r.expiryDate && r.quantity > 0).length} / {importRows.length} dòng hợp lệ
                </Badge>
              </div>
            </div>
          </DialogHeader>

          {/* Table rows */}
          <div className="flex-1 overflow-y-auto bg-slate-50/80 p-6">
            {/* Column headers */}
            <div className="grid grid-cols-[48px_2fr_1fr_1fr_1fr_120px_48px] gap-3 px-4 mb-3">
              {["#", "Sản phẩm", "Kho nhận", "Số lô", "Hạn dùng", "Số lượng", ""].map((h, i) => (
                <span key={i} className="text-[11px] font-black uppercase tracking-widest text-slate-400">{h}</span>
              ))}
            </div>

            <div className="space-y-3">
              {importRows.map((row, idx) => {
                const selectedProduct = products.find((p: any) => String(p.id) === row.medicineId)
                const isValid = row.medicineId && row.warehouseId && row.expiryDate && row.quantity > 0
                return (
                  <div
                    key={row.id}
                    className={cn(
                      "grid grid-cols-[48px_2fr_1fr_1fr_1fr_120px_48px] gap-3 items-center bg-white p-4 rounded-2xl border-2 transition-all",
                      isValid ? "border-emerald-200 shadow-sm shadow-emerald-50" : "border-slate-200"
                    )}
                  >
                    {/* Row number */}
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black",
                      isValid ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                    )}>{idx + 1}</div>

                    {/* Product */}
                    <Select value={row.medicineId} onValueChange={val => updateRow(row.id, "medicineId", val)}>
                      <SelectTrigger className={cn("h-12 rounded-xl border-slate-200 bg-slate-50 font-bold text-sm", row.medicineId && "bg-blue-50 border-blue-200 text-blue-900")}>
                        {selectedProduct ? (
                          <div className="flex items-center gap-2 truncate">
                            <div className="w-7 h-7 relative rounded-lg overflow-hidden bg-white border shrink-0">
                              <Image src={selectedProduct.primaryImageUrl || "/placeholder.svg"} alt="" fill className="object-contain" />
                            </div>
                            <span className="truncate text-xs font-black">{selectedProduct.name}</span>
                          </div>
                        ) : (
                          <SelectValue placeholder="Chọn thuốc..." />
                        )}
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl shadow-2xl border-none p-2 max-h-72">
                        {products.map((p: any) => (
                          <SelectItem key={p.id} value={String(p.id)} className="rounded-xl py-2.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 relative rounded-lg overflow-hidden bg-slate-100 shrink-0">
                                <Image src={p.primaryImageUrl || "/placeholder.svg"} alt="" fill className="object-contain" />
                              </div>
                              <span className="font-bold text-sm truncate max-w-[300px]">{p.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Warehouse */}
                    <Select value={row.warehouseId} onValueChange={val => updateRow(row.id, "warehouseId", val)}>
                      <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50 font-bold text-sm">
                        <SelectValue placeholder="Kho..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none p-2">
                        {warehouses.map(w => (
                          <SelectItem key={w.id} value={String(w.id)} className="rounded-xl font-bold">{w.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Batch Number */}
                    <Input
                      placeholder="Số lô (tùy chọn)"
                      value={row.batchNumber}
                      onChange={e => updateRow(row.id, "batchNumber", e.target.value)}
                      className="h-12 rounded-xl border-slate-200 bg-slate-50 font-medium text-sm"
                    />

                    {/* Expiry Date */}
                    <Input
                      type="date"
                      value={row.expiryDate}
                      onChange={e => updateRow(row.id, "expiryDate", e.target.value)}
                      className={cn("h-12 rounded-xl border-slate-200 bg-slate-50 font-bold text-sm", row.expiryDate && "border-blue-200 bg-blue-50 text-blue-900")}
                    />

                    {/* Quantity */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateRow(row.id, "quantity", Math.max(1, row.quantity - 1))}
                        className="w-8 h-12 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-black shrink-0 transition-colors"
                      ><Minus className="w-3 h-3" /></button>
                      <Input
                        type="number"
                        min={1}
                        value={row.quantity}
                        onChange={e => updateRow(row.id, "quantity", Number(e.target.value))}
                        className="h-12 rounded-xl border-slate-200 bg-slate-50 font-black text-center text-base px-2"
                      />
                      <button
                        onClick={() => updateRow(row.id, "quantity", row.quantity + 1)}
                        className="w-8 h-12 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-black shrink-0 transition-colors"
                      ><Plus className="w-3 h-3" /></button>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeRow(row.id)}
                      disabled={importRows.length <= 1}
                      className="w-9 h-9 rounded-xl hover:bg-rose-50 hover:text-rose-500 text-slate-300 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    ><XCircle className="w-5 h-5" /></button>
                  </div>
                )
              })}
            </div>

            {/* Add row button */}
            <button
              onClick={addRow}
              className="mt-4 w-full h-14 rounded-2xl border-2 border-dashed border-blue-300 text-blue-500 font-black flex items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-400 transition-all group"
            >
              <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Thêm dòng
            </button>
          </div>

          {/* Footer */}
          <div className="p-6 bg-white border-t flex items-center justify-between gap-4 shrink-0">
            <div className="text-sm text-slate-500 font-medium">
              Tổng:{" "}
              <span className="font-black text-slate-800 text-lg">
                {importRows.reduce((s, r) => s + (r.medicineId && r.expiryDate ? Number(r.quantity) : 0), 0).toLocaleString()}
              </span>{" "}sản phẩm từ{" "}
              <span className="font-black text-blue-600">
                {new Set(importRows.filter(r => r.medicineId).map(r => r.medicineId)).size}
              </span>{" "}loại thuốc
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="h-12 rounded-xl font-bold px-6 text-slate-500" onClick={() => { setIsImportOpen(false); resetImport() }}>Hủy bỏ</Button>
              <Button
                onClick={() => importMutation.mutate()}
                disabled={importMutation.isPending || importRows.filter(r => r.medicineId && r.warehouseId && r.expiryDate && r.quantity > 0).length === 0}
                className="h-12 px-10 rounded-xl bg-blue-600 hover:bg-blue-700 font-black text-white shadow-xl shadow-blue-200 gap-2 disabled:opacity-50"
              >
                {importMutation.isPending ? (
                  <><span className="animate-spin">⏳</span> Đang lưu...</>
                ) : (
                  <><ArrowDownToLine className="w-4 h-4" /> Xác nhận Nhập kho ({importRows.filter(r => r.medicineId && r.warehouseId && r.expiryDate && r.quantity > 0).length} dòng)</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Warehouse Dialog */}
      <Dialog open={isWarehouseDialogOpen} onOpenChange={setIsWarehouseDialogOpen}>
        <DialogContent className="max-w-xl rounded-[2.5rem] p-10">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black">{selectedWarehouse?.id ? "Cập nhật Kho" : "Thêm Kho mới"}</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">Cấu hình thông tin cơ bản và địa chỉ của kho lưu trữ</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label className="font-bold text-slate-700">Tên kho hàng</Label>
              <Input
                value={selectedWarehouse?.name || ""}
                placeholder="Tên đại diện kho..."
                className="h-14 rounded-2xl bg-slate-50 border-none font-bold"
                onChange={e => setSelectedWarehouse({ ...selectedWarehouse, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-slate-700">Địa chỉ cụ thể</Label>
              <Input
                value={selectedWarehouse?.address || ""}
                placeholder="Địa chỉ số nhà, đường, quận..."
                className="h-14 rounded-2xl bg-slate-50 border-none font-bold"
                onChange={e => setSelectedWarehouse({ ...selectedWarehouse, address: e.target.value })}
              />
            </div>
            <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="font-black text-slate-800 text-base">Trạng thái hoạt động</Label>
                <p className="text-xs text-slate-400 font-medium tracking-tight">Cho phép hoặc tạm dừng các hoạt động nhập xuất tại kho này</p>
              </div>
              <Switch
                checked={selectedWarehouse?.status}
                onCheckedChange={(checked) => setSelectedWarehouse({ ...selectedWarehouse, status: checked })}
              />
            </div>
          </div>

          <DialogFooter className="pt-10">
            <Button variant="ghost" className="h-14 rounded-2xl font-bold px-8" onClick={() => setIsWarehouseDialogOpen(false)}>Hủy</Button>
            <Button
              onClick={() => warehouseMutation.mutate(selectedWarehouse || {})}
              className="h-14 px-10 rounded-2xl bg-emerald-600 font-black text-white"
            >
              {selectedWarehouse?.id ? "Lưu thay đổi" : "Tạo kho mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialogs */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black">Bỏ vào thùng rác?</AlertDialogTitle>
            <AlertDialogDescription>Kho hàng sẽ bị ẩn khỏi các lựa chọn nhập hàng.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">Hủy</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-orange-600 font-bold" onClick={() => warehouseActionId && deleteMutation.mutate(warehouseActionId)}>XÁC NHẬN</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-emerald-600">Khôi phục kho hàng?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">Hủy</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-emerald-600 font-bold" onClick={() => warehouseActionId && restoreMutation.mutate(warehouseActionId)}>KHÔI PHỤC</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isHardDeleteDialogOpen} onOpenChange={setIsHardDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl border-4 border-rose-50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-rose-600">XÓA VĨNH VIỄN?</AlertDialogTitle>
            <AlertDialogDescription className="font-bold text-slate-800 italic">Dữ liệu sẽ không thể khôi phục!</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">HỦY BỎ</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-rose-600 font-black" onClick={() => warehouseActionId && hardDeleteMutation.mutate(warehouseActionId)}>XÓA NGAY</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Details Dialog */}
      <Dialog open={isBatchDetailsOpen} onOpenChange={setIsBatchDetailsOpen}>
        <DialogContent className="max-w-xl rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
          <VisuallyHidden>
            <DialogTitle>Chi tiết lô hàng</DialogTitle>
            <DialogDescription>Thông tin chi tiết về số lượng, hạn sử dụng và vị trí của lô hàng</DialogDescription>
          </VisuallyHidden>
          {selectedBatch && (() => {
            const info = getProductInfo(selectedBatch);
            return (
              <>
                <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 p-12 text-white relative">
                  <div className="absolute top-8 left-10 flex items-center gap-2 text-indigo-300 font-extrabold text-[10px] uppercase tracking-[0.3em]">
                    <Boxes className="w-4 h-4" /> BATCH INFORMATION
                  </div>
                  <div className="flex items-center gap-8 mt-4">
                    <div className="h-28 w-28 rounded-3xl bg-white p-3 shadow-2xl relative border-4 border-white/10 shrink-0">
                      <Image src={info.medicineImage || "/placeholder.svg"} alt="p" fill className="object-contain p-2" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-2xl font-black tracking-tight leading-tight uppercase line-clamp-2">{info.medicineName}</h2>
                      <p className="text-sm font-bold text-indigo-300 mt-1 uppercase tracking-widest">{info.brand}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge className="bg-white/20 hover:bg-white/30 border-none font-mono py-1 px-3">LOT: {selectedBatch.batchNumber}</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-10 space-y-8 bg-white max-h-[60vh] overflow-y-auto custom-scrollbar-slim">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2 mb-1">
                        <WarehouseIcon size={12} /> Kho lưu trữ
                      </Label>
                      <p className="font-black text-slate-800 text-lg line-clamp-1">{selectedBatch.warehouseName}</p>
                    </div>
                    <div className="space-y-1.5 text-right">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center justify-end gap-2 mb-1">
                        <Calendar size={12} /> Hạn sử dụng
                      </Label>
                      <p className={cn(
                        "font-black text-lg",
                        new Date(selectedBatch.expiryDate) < new Date() ? "text-rose-500" : "text-emerald-500"
                      )}>
                        {new Date(selectedBatch.expiryDate).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Số lượng còn lại</p>
                      <h3 className="text-4xl font-black text-slate-900 tracking-tighter">
                        {selectedBatch.quantityAvailable - selectedBatch.quantityReserved} <span className="text-sm font-bold text-slate-400 ml-1">đơn vị</span>
                      </h3>
                    </div>
                    <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                      <ArrowDownToLine className="w-8 h-8 text-blue-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
                      <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Đang giữ chỗ</p>
                      <p className="text-xl font-black text-rose-600">{selectedBatch.quantityReserved}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đã nhập lúc</p>
                      <p className="text-xl font-black text-slate-800">{new Date(selectedBatch.createdAt).toLocaleDateString("vi-VN")}</p>
                    </div>
                  </div>

                  {selectedBatch.notes && (
                    <div className="bg-amber-50/30 p-4 rounded-2xl border border-dashed border-amber-200">
                      <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Ghi chú nhập hàng</p>
                      <p className="text-xs text-slate-600 font-medium italic">"{selectedBatch.notes}"</p>
                    </div>
                  )}
                </div>

                <div className="p-8 bg-white border-t flex justify-end">
                  <Button variant="ghost" className="rounded-xl h-12 px-8 font-black text-slate-400" onClick={() => setIsBatchDetailsOpen(false)}>ĐÓNG</Button>
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
