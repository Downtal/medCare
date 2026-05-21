"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { MessageSquare, Star, Trash, Reply, ExternalLink, Search, RotateCcw, XCircle, Trash2, MoreVertical, LayoutGrid, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Pencil, X, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/admin/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import Image from "next/image"
import { reviewService, ReviewResponse, ProductReviewSummary } from "@/services/reviewService"
import { productService } from "@/services/productService"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

export default function AdminReviewsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState("summaries") // Default to summaries by product
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  const [isReplyOpen, setIsReplyOpen] = useState(false)
  const [selectedReview, setSelectedReview] = useState<ReviewResponse | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [editingReplyId, setEditingReplyId] = useState<number | null>(null)
  const [editReplyContent, setEditReplyContent] = useState("")

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false)
  const [isHardDeleteDialogOpen, setIsHardDeleteDialogOpen] = useState(false)
  const [reviewSelectedId, setReviewSelectedId] = useState<number | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [filterRating, setFilterRating] = useState("ALL")
  const [filterProductId, setFilterProductId] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState("rating-high") // Changed default to valid summary option
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const resetFilters = () => {
    setSearchQuery("")
    setFilterRating("ALL")
    setFilterProductId(null)
    setSortBy("newest")
    setCurrentPage(1)
  }

  const isFiltered = searchQuery !== "" || filterRating !== "ALL" || filterProductId !== null || sortBy !== "newest"

  const { data: productsData } = useQuery({
    queryKey: ["admin_products_all"],
    queryFn: () => productService.getProducts()
  })
  const products = Array.isArray(productsData) ? productsData : (productsData as any)?.content || []

  // --- Helper: Get Product Info Fallback ---
  const getProductInfo = (item: any) => {
    const medId = item.productId;
    if (!medId) return item;

    // Check if item already has metadata
    if (item.brand && item.registrationNumber && item.countryOfOrigin) return item;

    // Lookup in products
    const p = products.find((x: any) => Number(x.id) === Number(medId));
    if (!p) return item;

    return {
      ...item,
      brand: item.brand || p.brand || "MedCare Brand",
      registrationNumber: item.registrationNumber || p.registrationNumber || "Đang cập nhật",
      countryOfOrigin: item.countryOfOrigin || p.countryOfOrigin,
      productImage: item.productImage || p.primaryImageUrl || "/placeholder.svg",
      productName: item.productName || p.name || "Sản phẩm không tên"
    };
  };

  const { data: summaries = [], isLoading: isLoadingSummaries } = useQuery({
    queryKey: ["admin_review_summaries"],
    queryFn: () => reviewService.getProductSummaries()
  })

  const { data: unrepliedReviews = [], isLoading: isLoadingUnreplied } = useQuery({
    queryKey: ["admin_unreplied_reviews"],
    queryFn: () => reviewService.getUnrepliedReviews(),
    enabled: activeTab === "unreplied"
  })

  const { data: reviews = [], isLoading: isLoadingActive } = useQuery({
    queryKey: ["admin_reviews"],
    queryFn: () => reviewService.getAllReviews()
  })

  const { data: trashedReviews = [], isLoading: isLoadingTrash } = useQuery({
    queryKey: ["admin_trashed_reviews"],
    queryFn: () => reviewService.getTrashedReviews(),
    enabled: activeTab === "trash"
  })

  const replyMutation = useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) => reviewService.replyToReview(id, content),
    onSuccess: () => {
      toast.success("Đã trả lời đánh giá")
      queryClient.invalidateQueries({ queryKey: ["admin_reviews"] })
      queryClient.invalidateQueries({ queryKey: ["admin_unreplied_reviews"] })
      queryClient.invalidateQueries({ queryKey: ["admin_review_summaries"] })
      setIsReplyOpen(false)
      setReplyContent("")
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Lỗi khi gửi phản hồi")
  })

  const updateReplyMutation = useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) => reviewService.updateReply(id, content),
    onSuccess: (updatedReview) => {
      queryClient.setQueryData(["admin_reviews"], (old: ReviewResponse[]) =>
        old?.map(r => r.id === updatedReview.id ? updatedReview : r)
      )
      if (selectedReview?.id === updatedReview.id) {
        setSelectedReview(updatedReview)
      }
      setEditingReplyId(null)
      toast.success("Đã cập nhật phản hồi")
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Lỗi khi cập nhật")
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => reviewService.deleteReview(id),
    onSuccess: () => {
      toast.success("Đã đưa đánh giá vào thùng rác")
      queryClient.invalidateQueries({ queryKey: ["admin_reviews"] })
      queryClient.invalidateQueries({ queryKey: ["admin_trashed_reviews"] })
      queryClient.invalidateQueries({ queryKey: ["admin_review_summaries"] })
      setIsDeleteDialogOpen(false)
    },
    onError: () => toast.error("Lỗi khi xóa")
  })

  const restoreMutation = useMutation({
    mutationFn: (id: number) => reviewService.restoreReview(id),
    onSuccess: () => {
      toast.success("Đã khôi phục đánh giá")
      queryClient.invalidateQueries({ queryKey: ["admin_reviews"] })
      queryClient.invalidateQueries({ queryKey: ["admin_trashed_reviews"] })
      setIsRestoreDialogOpen(false)
    },
    onError: () => toast.error("Lỗi khi khôi phục")
  })

  const hardDeleteMutation = useMutation({
    mutationFn: (id: number) => reviewService.hardDeleteReview(id),
    onSuccess: () => {
      toast.success("Đã xóa vĩnh viễn")
      queryClient.invalidateQueries({ queryKey: ["admin_trashed_reviews"] })
      setIsHardDeleteDialogOpen(false)
    },
    onError: () => toast.error("Lỗi khi xóa vĩnh viễn")
  })


  const getFilteredReviews = () => {
    let list = [...(activeTab === "trash" ? trashedReviews :
      activeTab === "unreplied" ? unrepliedReviews : reviews)]

    if (filterProductId) {
      list = list.filter(r => r.productId === filterProductId)
    }

    if (filterRating !== "ALL") {
      list = list.filter(r => r.rating === Number(filterRating))
    }

    // Search
    list = list.filter(r =>
      (r.productName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.guestName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.comment || "").toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Sort
    list.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sortBy === "rating-high") return b.rating - a.rating
      if (sortBy === "rating-low") return a.rating - b.rating
      return 0
    })

    return list
  }

  const getFilteredSummaries = () => {
    let list = [...summaries]

    if (filterRating !== "ALL") {
      list = list.filter(s => Math.round(s.averageRating) === Number(filterRating))
    }

    list = list.filter(s => (s.productName || "").toLowerCase().includes(searchQuery.toLowerCase()))

    list.sort((a, b) => {
      if (sortBy === "rating-high") return b.averageRating - a.averageRating
      if (sortBy === "rating-low") return a.averageRating - b.averageRating
      if (sortBy === "reviews-high") return b.totalReviews - a.totalReviews
      return 0
    })

    return list
  }

  const filteredReviews = getFilteredReviews()
  const totalReviewPages = Math.ceil(filteredReviews.length / itemsPerPage)
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const filteredSummaries = getFilteredSummaries()
  const totalSummaryPages = Math.ceil(filteredSummaries.length / itemsPerPage)
  const paginatedSummaries = filteredSummaries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const columns: ColumnDef<ReviewResponse>[] = [
    {
      accessorKey: "productImage",
      header: "Hình ảnh",
      cell: ({ row }) => {
        const info = getProductInfo(row.original);
        return (
          <div className="relative w-12 h-12 rounded-lg border bg-white shadow-sm overflow-hidden flex items-center justify-center p-1">
            <Image
              src={info.productImage || "/placeholder.svg"}
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
      accessorKey: "productName",
      header: "Thông tin thuốc",
      cell: ({ row }) => {
        const info = getProductInfo(row.original);
        return (
          <div className="flex flex-col gap-0.5 min-w-[200px]">
            <span className="font-bold text-slate-800 leading-tight uppercase text-[13px]">{info.productName}</span>
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
      accessorKey: "rating",
      header: "Đánh giá",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`w-3.5 h-3.5 ${i < row.original.rating ? "fill-orange-400 text-orange-400" : "text-slate-200"}`} />
          ))}
          <span className="ml-2 font-bold text-slate-700">{row.original.rating}/5</span>
        </div>
      )
    },
    {
      accessorKey: "comment",
      header: "Nội dung",
      cell: ({ row }) => (
        <div className="max-w-[300px] flex flex-col gap-1">
          <p className="text-sm text-slate-600 italic line-clamp-2">"{row.original.comment}"</p>
          <div className="flex gap-2">
            {row.original.replies?.length > 0 ? (
              <Badge className="bg-emerald-50 text-emerald-600 text-[10px] border-none flex gap-1 items-center">
                <CheckCircle2 size={10} /> Đã phản hồi
              </Badge>
            ) : (
              <Badge className="bg-orange-50 text-orange-600 text-[10px] border-none flex gap-1 items-center">
                <AlertCircle size={10} /> Chưa trả lời
              </Badge>
            )}
            {row.original.userId ? <Badge className="bg-blue-50 text-blue-600 text-[10px] border-none uppercase tracking-tighter">Hội viên</Badge> : <Badge className="bg-slate-50 text-slate-500 text-[10px] border-none uppercase tracking-tighter">Khách</Badge>}
          </div>
        </div>
      )
    },
    {
      accessorKey: "guestName",
      header: "Người gửi",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800">{row.original.guestName || "User #" + row.original.userId}</span>
          <span className="text-[11px] text-slate-500">{row.original.phoneNumber || row.original.email || "N/A"}</span>
        </div>
      )
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }) => {
        const r = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-lg">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-none p-2">
              <DropdownMenuLabel className="text-[10px] uppercase text-slate-400 font-black px-2 py-1.5">Quản lý</DropdownMenuLabel>
              {activeTab !== "trash" ? (
                <>
                  <DropdownMenuItem onClick={() => {
                    setSelectedReview(r)
                    setIsReplyOpen(true)
                  }} className="rounded-lg cursor-pointer">
                    <Reply className="mr-2 h-4 w-4 text-blue-600" /> Phản hồi
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {
                    setReviewSelectedId(r.id)
                    setIsDeleteDialogOpen(true)
                  }} className="text-rose-600 focus:bg-rose-50 font-bold rounded-lg cursor-pointer">
                    <Trash className="mr-2 h-4 w-4" /> Bỏ vào thùng rác
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => {
                    setReviewSelectedId(r.id)
                    setIsRestoreDialogOpen(true)
                  }} className="text-emerald-600 font-bold rounded-lg cursor-pointer">
                    <RotateCcw className="mr-2 h-4 w-4" /> Khôi phục
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {
                    setReviewSelectedId(r.id)
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

  const summaryColumns: ColumnDef<ProductReviewSummary>[] = [
    {
      accessorKey: "productImage",
      header: "Hình ảnh",
      cell: ({ row }) => {
        const info = getProductInfo(row.original);
        return (
          <div className="relative w-14 h-14 rounded-xl border bg-white shadow-sm overflow-hidden flex items-center justify-center p-1">
            <Image
              src={info.productImage || "/placeholder.svg"}
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
      accessorKey: "productName",
      header: "Thông tin thuốc",
      cell: ({ row }) => {
        const info = getProductInfo(row.original);
        return (
          <div className="flex flex-col gap-0.5 min-w-[250px]">
            <span className="font-black text-slate-800 leading-tight uppercase text-sm">{info.productName}</span>
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
      accessorKey: "averageRating",
      header: "Trung bình",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 font-black">
            {row.original.averageRating?.toFixed(1)}
          </div>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`w-3 h-3 ${i < Math.round(row.original.averageRating) ? "fill-orange-400 text-orange-400" : "text-slate-200"}`} />
            ))}
          </div>
        </div>
      )
    },
    {
      accessorKey: "totalReviews",
      header: "Số lượng",
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <span className="font-bold text-slate-700">{row.original.totalReviews} Đánh giá</span>
          <div className="flex gap-2">
            {row.original.unrepliedCount > 0 && (
              <Badge className="bg-rose-50 text-rose-600 text-[10px] border-none font-black uppercase">
                {row.original.unrepliedCount} CẦN TRẢ LỜI
              </Badge>
            )}
          </div>
        </div>
      )
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }) => (
        <Button
          variant="outline"
          className="rounded-xl border-blue-100 text-blue-600 font-bold text-xs h-9 hover:bg-blue-600 hover:text-white transition-all shadow-none"
          onClick={() => {
            setFilterProductId(row.original.productId)
            setActiveTab("active")
          }}
        >
          Xem chi tiết
          <ExternalLink className="ml-2 w-3 h-3" />
        </Button>
      )
    }
  ]

  return (
    <div className="p-10 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      {/* Top Header Card */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={(v) => {
            setActiveTab(v);
            setFilterProductId(null);
            setCurrentPage(1);
            // Set valid default sort for the tab
            setSortBy(v === "summaries" ? "rating-high" : "newest");
          }} className="w-fit">
            <TabsList className="bg-slate-100 p-1 rounded-2xl h-12">
              <TabsTrigger value="summaries" className="rounded-xl font-bold px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm flex gap-2 items-center">
                <LayoutGrid size={16} /> Theo Sản phẩm
              </TabsTrigger>
              <TabsTrigger value="unreplied" className="rounded-xl font-bold px-6 data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:shadow-sm flex gap-2 items-center">
                <AlertCircle size={16} /> {unrepliedReviews.length > 0 && <span className="absolute -top-1 -right-1 h-4 w-4 bg-white text-orange-600 rounded-full text-[10px] flex items-center justify-center border-2 border-orange-600 font-bold">{unrepliedReviews.length}</span>} Phản hồi nhanh
              </TabsTrigger>
              <TabsTrigger value="active" className="rounded-xl font-bold px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Toàn bộ</TabsTrigger>
              <TabsTrigger value="trash" className="rounded-xl font-bold px-4 data-[state=active]:bg-rose-50 data-[state=active]:text-rose-600 data-[state=active]:shadow-sm">Thùng rác</TabsTrigger>
            </TabsList>
          </Tabs>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              {activeTab === "summaries" ? "Thống kê đánh giá" :
                activeTab === "unreplied" ? "Yêu cầu cần phản hồi ngay" :
                  activeTab === "active" ? (filterProductId ? "Chi tiết sản phẩm" : "Quản lý đánh giá khách hàng") : "Lưu trữ đánh giá"}
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              {activeTab === "summaries" ? "Xem điểm trung bình và số lượng phản hồi theo từng sản phẩm." : "Hỗ trợ khách hàng và kiểm soát chất lượng dịch vụ MedCare."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
            <MessageSquare size={28} />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black text-slate-800">{activeTab === "summaries" ? summaries.length : filteredReviews.length}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đánh giá</span>
          </div>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-5">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <Input
                placeholder={activeTab === "summaries" ? "Tìm theo tên thuốc..." : "Tìm theo tên khách hàng, nội dung hoặc thuốc..."}
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

          {/* Row 2: Secondary Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <Select value={filterRating} onValueChange={(v) => { setFilterRating(v); setCurrentPage(1); }}>
              <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold min-w-[180px] px-6 shadow-sm hover:bg-slate-100 transition-all text-xs">
                <div className="flex items-center gap-3">
                  <Star className="w-4 h-4 text-orange-400" />
                  <SelectValue placeholder="Điểm đánh giá" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
                <SelectItem value="ALL">Tất cả số sao</SelectItem>
                <SelectItem value="5">5 Sao ⭐⭐⭐⭐⭐</SelectItem>
                <SelectItem value="4">4 Sao ⭐⭐⭐⭐</SelectItem>
                <SelectItem value="3">3 Sao ⭐⭐⭐</SelectItem>
                <SelectItem value="2">2 Sao ⭐⭐</SelectItem>
                <SelectItem value="1">1 Sao ⭐</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setCurrentPage(1); }}>
              <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold min-w-[200px] px-6 shadow-sm hover:bg-slate-100 transition-all text-xs">
                <div className="flex items-center gap-3">
                  <ArrowUpDown className="w-4 h-4 text-blue-500" />
                  <SelectValue placeholder="Sắp xếp theo..." />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
                {activeTab === "summaries" ? (
                  <>
                    <SelectItem value="rating-high">Đánh giá cao nhất</SelectItem>
                    <SelectItem value="rating-low">Đánh giá thấp nhất</SelectItem>
                    <SelectItem value="reviews-high">Nhiều đánh giá nhất</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="newest">Mới nhất</SelectItem>
                    <SelectItem value="oldest">Cũ nhất</SelectItem>
                    <SelectItem value="rating-high">Sao: Cao đến thấp</SelectItem>
                    <SelectItem value="rating-low">Sao: Thấp đến cao</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
        {activeTab === "summaries" ? (
          <>
            <DataTable
              columns={summaryColumns}
              data={paginatedSummaries}
              hidePagination={true}
              loading={isLoadingSummaries}
              onRowClick={(s) => {
                setFilterProductId(s.productId)
                setActiveTab("active")
              }}
            />
            <div className="flex items-center justify-between px-8 py-6 bg-white border-t">
              <div className="text-sm font-bold text-slate-400">
                Hiển thị <span className="text-slate-800">{paginatedSummaries.length}</span> / {filteredSummaries.length} bản ghi
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
                    const total = totalSummaryPages;
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
                  disabled={currentPage === totalSummaryPages || totalSummaryPages === 0}
                  onClick={() => setCurrentPage(p => Math.min(totalSummaryPages, p + 1))}
                >
                  Tiếp <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={paginatedReviews}
              hidePagination={true}
              loading={isLoadingActive || isLoadingTrash || isLoadingUnreplied}
              onRowClick={(r) => {
                setSelectedReview(r)
                setIsDetailsOpen(true)
              }}
            />
            <div className="flex items-center justify-between px-8 py-6 bg-white border-t">
              <div className="text-sm font-bold text-slate-400">
                Hiển thị <span className="text-slate-800">{paginatedReviews.length}</span> / {filteredReviews.length} bản ghi
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
                    const total = totalReviewPages;
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
                  disabled={currentPage === totalReviewPages || totalReviewPages === 0}
                  onClick={() => setCurrentPage(p => Math.min(totalReviewPages, p + 1))}
                >
                  Tiếp <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Reply Dialog */}
      <Dialog open={isReplyOpen} onOpenChange={setIsReplyOpen}>
        <DialogContent className="sm:max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] flex flex-col rounded-3xl p-0 overflow-hidden border-none shadow-2xl font-sans">
          <DialogHeader className="p-8 pb-4 bg-white border-b shrink-0">
            <DialogTitle className="text-2xl font-black">Phản hồi đánh giá</DialogTitle>
            <DialogDescription>
              Câu trả lời của bạn sẽ hiển thị công khai dưới tên "Dược sĩ MedCare".
            </DialogDescription>
          </DialogHeader>

          {selectedReview && (
            <div className="p-8 space-y-6 bg-slate-50/30 flex-1 overflow-y-auto custom-scrollbar-slim">
              <div className="flex items-start gap-4 p-5 bg-white rounded-2xl shadow-sm border border-slate-100 italic text-slate-700 text-sm relative">
                <div className="absolute -top-3 -left-3 h-10 w-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                  <MessageSquare size={18} />
                </div>
                "{selectedReview.comment}"
              </div>

              {selectedReview.replies?.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-[10px] uppercase text-slate-400 tracking-widest ml-1">Các phản hồi trước đây</h4>
                  {selectedReview.replies.map(r => (
                    <div key={r.id} className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-3 shadow-sm border-l-4 border-l-emerald-400 group relative">
                      <Badge className="bg-emerald-600 h-fit text-[10px]">{r.staffRole}</Badge>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className="text-[13px] font-bold text-slate-800">{r.staffName}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-all rounded-full hover:bg-emerald-100"
                            onClick={() => {
                              setEditingReplyId(r.id)
                              setEditReplyContent(r.content)
                            }}
                          >
                            <Pencil size={12} className="text-emerald-600" />
                          </Button>
                        </div>

                        {editingReplyId === r.id ? (
                          <div className="mt-2 space-y-2">
                            <Textarea
                              value={editReplyContent}
                              onChange={e => setEditReplyContent(e.target.value)}
                              className="bg-white border-emerald-200 focus-visible:ring-emerald-100 text-sm"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" className="bg-emerald-600 h-8" onClick={() => updateReplyMutation.mutate({ id: r.id, content: editReplyContent })}>Lưu</Button>
                              <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingReplyId(null)}>Hủy</Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="text-[13px] text-slate-600 mt-0.5 prose-sm max-w-none break-words"
                            dangerouslySetInnerHTML={{ __html: r.content }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 ml-1 flex items-center gap-2">
                  <Reply size={16} className="text-blue-600" /> Nhập nội dung phản hồi mới
                </label>
                <Textarea
                  rows={4}
                  placeholder="Cảm ơn khách hàng hoặc giải đáp thắc mắc..."
                  className="rounded-2xl bg-white border-2 border-slate-100 focus-visible:border-blue-400 focus-visible:ring-0 transition-all font-medium py-4 px-5"
                  value={replyContent}
                  onChange={e => setReplyContent(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="p-8 bg-white border-t">
            <Button variant="ghost" className="rounded-xl font-bold h-12 px-6" onClick={() => setIsReplyOpen(false)}>Quay lại</Button>
            <Button
              className="rounded-xl bg-blue-600 hover:bg-blue-700 font-black px-10 h-12 shadow-lg shadow-blue-100 transition-all text-base"
              disabled={!replyContent.trim() || replyMutation.isPending}
              onClick={() => selectedReview && replyMutation.mutate({ id: selectedReview.id, content: replyContent })}
            >
              {replyMutation.isPending ? "Đang gửi..." : "Gửi dữ liệu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialogs */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black">Bỏ vào thùng rác?</AlertDialogTitle>
            <AlertDialogDescription>
              Đánh giá sẽ bị ẩn khỏi trang sản phẩm nhưng vẫn có thể khôi phục từ thùng rác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Hủy</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-orange-600" onClick={() => reviewSelectedId && deleteMutation.mutate(reviewSelectedId)}>
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-emerald-600">Khôi phục đánh giá?</AlertDialogTitle>
            <AlertDialogDescription>Đánh giá sẽ hiển thị trở lại bình thường trên trang sản phẩm.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Hủy</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-emerald-600 font-bold" onClick={() => reviewSelectedId && restoreMutation.mutate(reviewSelectedId)}>KHÔI PHỤC</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isHardDeleteDialogOpen} onOpenChange={setIsHardDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-rose-600 text-rose-600 underline decoration-rose-200">XÓA VĨNH VIỄN?</AlertDialogTitle>
            <AlertDialogDescription>Mọi dữ liệu bao gồm cả hình ảnh và các câu trả lời liên quan sẽ bị xóa sạch khỏi hệ thống!</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Hủy</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-rose-600 font-black" onClick={() => reviewSelectedId && hardDeleteMutation.mutate(reviewSelectedId)}>XÓA HOÀN TOÀN</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] flex flex-col rounded-3xl p-0 overflow-hidden border-none shadow-2xl font-sans">
          <DialogHeader className="p-8 pb-6 bg-white border-b flex flex-row items-center justify-between shrink-0">
            <div>
              <DialogTitle className="text-2xl font-black">Chi tiết đánh giá</DialogTitle>
              <DialogDescription>
                Thông tin đầy đủ về nội dung phản hồi từ khách hàng.
              </DialogDescription>
            </div>
            {selectedReview && (
              <div className={cn(
                "px-4 py-2 rounded-2xl font-black text-sm",
                selectedReview.replies?.length > 0 ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
              )}>
                {selectedReview.replies?.length > 0 ? "ĐÃ PHẢN HỒI" : "CHƯA PHẢN HỒI"}
              </div>
            )}
          </DialogHeader>

          {selectedReview && (() => {
            const productInfo = getProductInfo(selectedReview);
            return (
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/30 flex-1 overflow-y-auto custom-scrollbar-slim">
                {/* Product & User Side */}
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex gap-4">
                    <div className="relative w-16 h-16 rounded-2xl bg-slate-50 p-2 overflow-hidden border">
                      <Image
                        src={productInfo.productImage || "/placeholder.svg"}
                        alt="p"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-slate-800 leading-tight uppercase line-clamp-3 mb-1">
                        {productInfo.productName}
                      </h3>
                      <p className="text-xs font-black text-blue-600 uppercase tracking-widest">{productInfo.brand}</p>

                      <div className="mt-4 pt-4 border-t border-slate-50 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Số đăng ký</p>
                          <p className="text-[11px] font-bold text-slate-600">{productInfo.registrationNumber}</p>
                        </div>

                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Khách hàng</h4>
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xl">
                        {(selectedReview.guestName || "U")[0]}
                      </div>
                      <div>
                        <p className="font-black text-slate-800">{selectedReview.guestName || "Người dùng ẩn danh"}</p>
                        <p className="text-xs text-slate-500">{selectedReview.phoneNumber || "ID: " + selectedReview.userId}</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-50 space-y-2">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Thời gian gửi</p>
                      <p className="text-xs font-bold text-slate-700">{new Date(selectedReview.createdAt).toLocaleString("vi-VN")}</p>
                    </div>
                  </div>
                </div>

                {/* Review Content Side */}
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nội dung đánh giá</h4>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < selectedReview.rating ? "fill-orange-400 text-orange-400" : "text-slate-100"}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-lg font-medium text-slate-800 italic leading-relaxed">
                      "{selectedReview.comment}"
                    </p>
                  </div>

                  {selectedReview.replies?.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Lịch sử phản hồi</h4>
                      {selectedReview.replies.map(rep => (
                        <div key={rep.id} className="bg-emerald-600 text-white p-6 rounded-3xl shadow-xl shadow-emerald-100 relative overflow-hidden group">

                          <div className="flex items-center justify-between mb-3 relative z-10">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-white/20 hover:bg-white/30 border-none text-[10px] uppercase font-black">{rep.staffRole}</Badge>
                              <span className="text-[10px] font-bold text-white/60">{new Date(rep.createdAt).toLocaleDateString()}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-white hover:bg-white/10 rounded-full transition-all"
                              title="Chỉnh sửa phản hồi này"
                              onClick={() => {
                                setEditingReplyId(rep.id)
                                setEditReplyContent(rep.content)
                                setIsDetailsOpen(false)
                                setIsReplyOpen(true)
                              }}
                            >
                              <Pencil size={14} />
                            </Button>
                          </div>
                          <p className="font-bold text-white text-sm relative z-10">@{rep.staffName}</p>
                          <div
                            className="mt-2 text-sm text-emerald-50 leading-relaxed font-medium prose-invert max-w-none break-words relative z-10"
                            dangerouslySetInnerHTML={{ __html: rep.content }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-40 bg-orange-50/50 rounded-3xl border border-dashed border-orange-200 flex flex-col items-center justify-center text-center p-6 space-y-3">
                      <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                        <AlertCircle size={24} />
                      </div>
                      <p className="text-xs font-bold text-orange-600 uppercase tracking-tight">Chưa có phản hồi từ hiệu thuốc</p>
                      <Button
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700 text-white font-black px-6 rounded-xl h-10"
                        onClick={() => {
                          setIsDetailsOpen(false)
                          setIsReplyOpen(true)
                        }}
                      >
                        PHẢN HỒI NGAY
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )
          })()}

          <DialogFooter className="p-8 bg-white border-t flex justify-between items-center sm:justify-between shrink-0">
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-xl h-12 px-6 font-bold" onClick={() => setIsDetailsOpen(false)}>Đóng</Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                className="rounded-xl h-12 px-6 font-black gap-2"
                onClick={() => {
                  if (selectedReview) {
                    setReviewSelectedId(selectedReview.id)
                    setIsDeleteDialogOpen(true)
                  }
                }}
              >
                <Trash size={18} /> GỠ BỎ
              </Button>
              <Button
                className="rounded-xl h-12 px-8 font-black bg-blue-600 shadow-xl shadow-blue-100 gap-2"
                onClick={() => {
                  setIsDetailsOpen(false)
                  setIsReplyOpen(true)
                }}
              >
                <Reply size={18} /> TRẢ LỜI KHÁCH HÀNG
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
