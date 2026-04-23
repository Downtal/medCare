"use client"

import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Search, Filter, MoreVertical, Edit, Trash, ExternalLink, RotateCcw, XCircle, Trash2, ListFilter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/admin/data-table"
import { ProductDialog } from "@/components/admin/product-dialog"
import { ProductDetailDialog } from "@/components/admin/product-detail-dialog"
import { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import Image from "next/image"
import { productService } from "@/services/productService"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export default function AdminProductsPage() {
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState("active")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedBrand, setSelectedBrand] = useState("all")
  const [selectedOrigin, setSelectedOrigin] = useState("all")
  const [selectedPrescription, setSelectedPrescription] = useState("all")
  const [sortBy, setSortBy] = useState("newest")

  // Search within filters
  const [brandSearch, setBrandSearch] = useState("")
  const [originSearch, setOriginSearch] = useState("")

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [currentProduct, setCurrentProduct] = useState<any>(null)

  // Dialogs
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false)
  const [isHardDeleteDialogOpen, setIsHardDeleteDialogOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ["admin_products"],
    queryFn: () => productService.getProducts()
  })

  const { data: deletedProducts = [], isLoading: isLoadingDeleted } = useQuery({
    queryKey: ["admin_deleted_products"],
    queryFn: () => productService.getDeletedProducts(),
    enabled: activeTab === "trash"
  })

  const { data: categories = [] } = useQuery({
    queryKey: ["admin_category_tree"],
    queryFn: () => productService.getCategoryTree()
  })

  const { data: brands = [] } = useQuery({
    queryKey: ["admin_brands"],
    queryFn: () => productService.getBrands()
  })

  const { data: origins = [] } = useQuery({
    queryKey: ["admin_origins"],
    queryFn: () => productService.getOrigins()
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productService.deleteProduct(id),
    onSuccess: () => {
      toast.success("Đã đưa vào thùng rác")
      queryClient.invalidateQueries({ queryKey: ["admin_products"] })
      queryClient.invalidateQueries({ queryKey: ["admin_deleted_products"] })
      setIsDeleteDialogOpen(false)
    }
  })

  const restoreMutation = useMutation({
    mutationFn: (id: number) => productService.restoreProduct(id),
    onSuccess: () => {
      toast.success("Đã khôi phục sản phẩm")
      queryClient.invalidateQueries({ queryKey: ["admin_products"] })
      queryClient.invalidateQueries({ queryKey: ["admin_deleted_products"] })
      setIsRestoreDialogOpen(false)
    }
  })

  const hardDeleteMutation = useMutation({
    mutationFn: (id: number) => productService.hardDeleteProduct(id),
    onSuccess: () => {
      toast.success("Đã xóa vĩnh viễn sản phẩm")
      queryClient.invalidateQueries({ queryKey: ["admin_deleted_products"] })
      setIsHardDeleteDialogOpen(false)
    }
  })

  // Filtered Options for Search within Filters
  const filteredBrands = useMemo(() =>
    brands.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase())),
    [brands, brandSearch]
  )

  const filteredOrigins = useMemo(() =>
    origins.filter(o => o.toLowerCase().includes(originSearch.toLowerCase())),
    [origins, originSearch]
  )

  const currentList = activeTab === "active" ? products : deletedProducts

  const filteredRows = currentList.filter((p: any) => {
    const name = p.name || ""
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || p.categoryId?.toString() === selectedCategory
    const matchesBrand = selectedBrand === "all" || p.brand === selectedBrand
    const matchesOrigin = selectedOrigin === "all" || p.countryOfOrigin === selectedOrigin
    const matchesPrescription = selectedPrescription === "all" ||
      (selectedPrescription === "prescription" && p.requiresPrescription) ||
      (selectedPrescription === "otc" && !p.requiresPrescription)
    return matchesSearch && matchesCategory && matchesBrand && matchesOrigin && matchesPrescription
  })

  const totalPages = Math.ceil(filteredRows.length / itemsPerPage)

  const sortedRows = useMemo(() => {
    const result = [...filteredRows]
    result.sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return Number(a.price) - Number(b.price)
        case "price-desc":
          return Number(b.price) - Number(a.price)
        case "name-asc":
          return (a.name || "").localeCompare(b.name || "")
        case "name-desc":
          return (b.name || "").localeCompare(a.name || "")
        case "newest":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        case "oldest":
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        default:
          return 0
      }
    })
    return result
  }, [filteredRows, sortBy])

  const paginatedRows = sortedRows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "primaryImageUrl",
      header: "Hình ảnh",
      cell: ({ row }) => (
        <div className="relative w-14 h-14 rounded-lg border bg-white shadow-sm overflow-hidden flex items-center justify-center p-1">
          <Image
            src={row.getValue("primaryImageUrl") || "/placeholder.svg"}
            alt="p"
            fill
            sizes="56px"
            className="object-contain"
          />
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "Thông tin thuốc",
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5 min-w-[300px] max-w-[500px]">
          <span className="font-bold text-slate-800 leading-tight">{row.getValue("name")}</span>
          <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] font-bold uppercase tracking-tight text-slate-400">
            {row.original.brand && <span className="text-blue-500 font-black">{row.original.brand}</span>}
            {row.original.registrationNumber && <span>REG: {row.original.registrationNumber}</span>}
          </div>
          <div className="text-[11px] text-slate-500 font-medium italic">
            {row.original.countryOfOrigin || "Chưa rõ xuất xứ"}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "price",
      header: "Giá bán",
      cell: ({ row }) => (
        <div className="font-black text-blue-700">{Number(row.getValue("price")).toLocaleString("vi-VN")} đ</div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const p = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-none p-2">
              <DropdownMenuLabel className="text-[10px] uppercase text-slate-400 font-black px-2 py-1.5">Quản lý</DropdownMenuLabel>
              {activeTab === "active" ? (
                <>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setCurrentProduct(p); setIsDialogOpen(true); }} className="rounded-lg cursor-pointer">
                    <Edit className="mr-2 h-4 w-4 text-blue-600" /> Chỉnh sửa
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open(`/san-pham/${p.slug}`, "_blank")} className="rounded-lg cursor-pointer">
                    <ExternalLink className="mr-2 h-4 w-4 text-slate-500" /> Xem Store
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedId(p.id); setIsDeleteDialogOpen(true); }} className="text-rose-600 focus:bg-rose-50 font-bold rounded-lg cursor-pointer">
                    <Trash className="mr-2 h-4 w-4" /> Bỏ vào thùng rác
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedId(p.id); setIsRestoreDialogOpen(true); }} className="text-emerald-600 font-bold rounded-lg cursor-pointer">
                    <RotateCcw className="mr-2 h-4 w-4" /> Khôi phục
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedId(p.id); setIsHardDeleteDialogOpen(true); }} className="text-rose-600 focus:bg-rose-50 font-black rounded-lg cursor-pointer">
                    <XCircle className="mr-2 h-4 w-4" /> XÓA VĨNH VIỄN
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="p-10 space-y-8 max-w-[1700px] mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCurrentPage(1); }} className="w-[300px]">
            <TabsList className="bg-slate-100 p-1 rounded-2xl h-12">
              <TabsTrigger value="active" className="rounded-xl font-bold px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Đang bán</TabsTrigger>
              <TabsTrigger value="trash" className="rounded-xl font-bold px-6 data-[state=active]:bg-rose-50 data-[state=active]:text-rose-600 data-[state=active]:shadow-sm">Thùng rác</TabsTrigger>
            </TabsList>
          </Tabs>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              {activeTab === "active" ? "Quản lý Sản phẩm" : "Thùng rác Sản phẩm"}
            </h1>
            <p className="text-slate-500 font-medium">
              {activeTab === "active" ? "Lưu trữ thông tin chuyên sâu của Dược phẩm & Knowledge Base." : "Xem lại hoặc xóa vĩnh viễn các thuốc đã xóa tạm."}
            </p>
          </div>
        </div>
        {activeTab === "active" && (
          <Button className="bg-blue-600 hover:bg-blue-700 font-bold px-8 h-12 rounded-2xl shadow-xl shadow-blue-100 transition-all shrink-0" onClick={() => { setCurrentProduct(null); setIsDialogOpen(true); }}>
            <Plus className="mr-2 h-5 w-5" /> Thêm sản phẩm
          </Button>
        )}
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Tìm kiếm theo Tên thuốc, hoạt chất..."
            className="pl-11 h-12 bg-slate-50 border-none rounded-2xl font-bold focus-visible:ring-blue-100"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setCurrentPage(1); }}>
            <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold">
              <div className="flex items-center gap-2"><Filter className="h-4 w-4 text-blue-500" /><SelectValue placeholder="Danh mục" /></div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl max-h-[400px]">
              <SelectItem value="all">Tất cả danh mục</SelectItem>
              {categories.map((p: any) => (
                <SelectGroup key={p.id}>
                  <SelectLabel className="px-3 py-2 text-[10px] font-black uppercase text-blue-500 bg-slate-50/50">{p.name}</SelectLabel>
                  {p.children?.map((c: any) => <SelectItem key={c.id} value={c.id.toString()} className="pl-6">{c.name}</SelectItem>)}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>

          {/* Brand Filter with Search */}
          <Select value={selectedBrand} onValueChange={(v) => { setSelectedBrand(v); setCurrentPage(1); }}>
            <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold">
              <div className="flex items-center gap-2"><Badge variant="outline" className="h-5 px-1 bg-blue-50 text-blue-600 border-none">Brand</Badge><SelectValue placeholder="Thương hiệu" /></div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl max-h-[400px]">
              <div className="p-2 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input placeholder="Tìm brand..." className="h-9 pl-8 bg-slate-50 border-none text-xs" value={brandSearch} onChange={(e) => setBrandSearch(e.target.value)} onClick={(e) => e.stopPropagation()} />
                </div>
              </div>
              <SelectItem value="all">Tất cả thương hiệu</SelectItem>
              {filteredBrands.filter(b => b && b.trim()).map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>

          {/* Origin Filter with Search */}
          <Select value={selectedOrigin} onValueChange={(v) => { setSelectedOrigin(v); setCurrentPage(1); }}>
            <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold">
              <div className="flex items-center gap-2"><Badge variant="outline" className="h-5 px-1 bg-amber-50 text-amber-600 border-none">Origin</Badge><SelectValue placeholder="Xuất xứ" /></div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl max-h-[400px]">
              <div className="p-2 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input placeholder="Tìm quốc gia..." className="h-9 pl-8 bg-slate-50 border-none text-xs" value={originSearch} onChange={(e) => setOriginSearch(e.target.value)} onClick={(e) => e.stopPropagation()} />
                </div>
              </div>
              <SelectItem value="all">Tất cả xuất xứ</SelectItem>
              {filteredOrigins.filter(o => o && o.trim()).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>

          {/* Prescription Filter */}
          <Select value={selectedPrescription} onValueChange={(v) => { setSelectedPrescription(v); setCurrentPage(1); }}>
            <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="h-5 px-1 bg-rose-50 text-rose-600 border-none uppercase text-[9px]">RX</Badge>
                <SelectValue placeholder="Loại thuốc" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl">
              <SelectItem value="all">Tất cả loại thuốc</SelectItem>
              <SelectItem value="prescription">Thuốc kê đơn (RX)</SelectItem>
              <SelectItem value="otc">Không kê đơn (OTC)</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Filter */}
          <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setCurrentPage(1); }}>
            <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold">
              <div className="flex items-center gap-2">
                <ListFilter className="h-4 w-4 text-blue-500" />
                <SelectValue placeholder="Sắp xếp" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl">
              <SelectItem value="newest">Mới nhất (Mặc định)</SelectItem>
              <SelectItem value="oldest">Cũ nhất</SelectItem>
              <SelectSeparator />
              <SelectItem value="price-asc">Giá: Thấp đến Cao</SelectItem>
              <SelectItem value="price-desc">Giá: Cao đến Thấp</SelectItem>
              <SelectSeparator />
              <SelectItem value="name-asc">Tên: A - Z</SelectItem>
              <SelectItem value="name-desc">Tên: Z - A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoadingProducts || isLoadingDeleted ? (
          <div className="h-64 flex items-center justify-center text-slate-400 italic">Đang tải dữ liệu...</div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={paginatedRows}
              hidePagination={true}
              onRowClick={(p) => {
                setCurrentProduct(p);
                setIsDetailDialogOpen(true);
              }}
            />
            <div className="flex items-center justify-between px-8 py-6 bg-white border-t">
              <div className="text-sm font-bold text-slate-400">
                Hiển thị <span className="text-slate-800">{paginatedRows.length}</span> / {filteredRows.length} sản phẩm
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
                      // Logic similar to store but using 1-based index for admin
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
          </>
        )}
      </div>

      <ProductDetailDialog
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        product={currentProduct}
        onEdit={(p) => {
          setIsDetailDialogOpen(false);
          setIsDialogOpen(true);
          setCurrentProduct(p);
        }}
      />

      <ProductDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} product={currentProduct} categories={categories} />

      {/* AlertDialogs for Delete/Restore/HardDelete */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader><AlertDialogTitle className="text-xl font-black">Bỏ vào thùng rác?</AlertDialogTitle><AlertDialogDescription>Sản phẩm sẽ ngừng bán và hiển thị tại Thùng rác.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="rounded-xl">Hủy</AlertDialogCancel><AlertDialogAction className="rounded-xl bg-orange-600" onClick={() => selectedId && deleteMutation.mutate(selectedId)}>Xác nhận</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader><AlertDialogTitle className="text-xl font-black">Khôi phục sản phẩm?</AlertDialogTitle><AlertDialogDescription>Sản phẩm sẽ quay lại trạng thái Đang bán.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="rounded-xl">Hủy</AlertDialogCancel><AlertDialogAction className="rounded-xl bg-emerald-600 font-bold" onClick={() => selectedId && restoreMutation.mutate(selectedId)}>KHÔI PHỤC NGAY</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isHardDeleteDialogOpen} onOpenChange={setIsHardDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader><AlertDialogTitle className="text-xl font-black text-rose-600">XÓA VĨNH VIỄN?</AlertDialogTitle><AlertDialogDescription>Hành động này sẽ xóa dữ liệu hoàn toàn khỏi hệ thống và không thể khôi phục!</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="rounded-xl">Hủy</AlertDialogCancel><AlertDialogAction className="rounded-xl bg-rose-600 font-black" onClick={() => selectedId && hardDeleteMutation.mutate(selectedId)}>XÓA HOÀN TOÀN</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
