"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { aiService, IndexedProduct, ChatLog } from "@/services/aiService"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Bot,
  RefreshCcw,
  MessageSquare,
  Search,
  Database,
  AlertCircle,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  Clock,
  History,
  Tag,
  ChevronRight,
  Info,
  X,
  Plus,
  Trash2
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

import { useSession } from "next-auth/react"
import { MultiSelect } from "@/components/admin/multi-select"
import { cn } from "@/lib/utils"
import { SYMPTOM_OPTIONS } from "@/constants/symptoms"
import { productService } from "@/services/productService"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, ArrowRight } from "lucide-react"


export default function ChatbotManagementPage() {
  const { data: session } = useSession()
  const token = session?.user?.accessToken
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const [mappingFilter, setMappingFilter] = useState("all")

  const resetMappingFilters = () => {
    setSearchTerm("")
    setMappingFilter("all")
  }

  const isMappingFiltered = searchTerm !== "" || mappingFilter !== "all"

  // Fetch data
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["indexed_products", token],
    queryFn: () => aiService.getIndexedProducts(token),
    enabled: !!token
  })

  const { data: logs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ["chat_logs", token],
    queryFn: () => aiService.getChatLogs(token),
    enabled: !!token
  })

  // State for controlled dialogs
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<IndexedProduct | null>(null)
  const [selectedLogForDetail, setSelectedLogForDetail] = useState<ChatLog | null>(null)

  const { data: symptomsData = [], refetch: refetchSymptoms } = useQuery({
    queryKey: ["symptoms"],
    queryFn: () => productService.getSymptoms()
  })

  // New mutations for symptom management
  const addSymptomMutation = useMutation({
    mutationFn: (name: string) => productService.addSymptom(name),
    onSuccess: () => {
      toast.success("Đã thêm triệu chứng mới!")
      refetchSymptoms()
    },
    onError: (error: any) => {
      toast.error(`Lỗi: ${error.message}`)
    }
  })

  const deleteSymptomMutation = useMutation({
    mutationFn: (id: number) => productService.deleteSymptom(id),
    onSuccess: () => {
      toast.success("Đã xóa triệu chứng!")
      refetchSymptoms()
    },
    onError: (error: any) => {
      toast.error(`Lỗi: ${error.message}`)
    }
  })

  const [newSymptomName, setNewSymptomName] = useState("")

  const dynamicSymptoms = Array.from(new Set([
    ...SYMPTOM_OPTIONS.map(s => s.value),
    ...symptomsData.map((s: any) => s.name)
  ])).map(name => {
    const existing = SYMPTOM_OPTIONS.find(s => s.value === name)
    return existing || { label: name, value: name }
  })

  // Mutations
  const syncMutation = useMutation({
    mutationFn: () => aiService.syncProducts(token),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Đã đồng bộ thành công ${data.count} sản phẩm!`)
        queryClient.invalidateQueries({ queryKey: ["indexed_products"] })
      } else {
        toast.error(`Đồng bộ thất bại: ${data.error}`)
      }
    },
    onError: (error) => {
      toast.error(`Lỗi kết nối: ${error.message}`)
    }
  })

  const updateSymptomMutation = useMutation({
    mutationFn: ({ id, symptoms }: { id: number; symptoms: string }) =>
      aiService.updateProductSymptoms(id, symptoms, token),
    onSuccess: () => {
      toast.success("Đã cập nhật mapping triệu chứng!")
      queryClient.invalidateQueries({ queryKey: ["indexed_products"] })
    }
  })

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.symptoms.toLowerCase().includes(searchTerm.toLowerCase())

    let matchesMapping = true
    if (mappingFilter === "missing") {
      matchesMapping = !p.symptoms || p.symptoms.trim() === ""
    } else if (mappingFilter === "mapped") {
      matchesMapping = p.symptoms && p.symptoms.trim() !== ""
    }

    return matchesSearch && matchesMapping
  })

  const [ratingFilter, setRatingFilter] = useState("all")

  const filteredLogs = logs.filter(l => {
    if (ratingFilter === "positive") return l.rating === true;
    if (ratingFilter === "negative") return l.rating === false;
    if (ratingFilter === "unrated") return l.rating === null || l.rating === undefined;
    return true;
  });

  const positiveLogs = logs.filter(l => l.rating === true).length
  const negativeLogs = logs.filter(l => l.rating === false).length

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-[1600px] mx-auto min-h-screen pb-20">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Quản lý Chatbot AI</h1>
          </div>
          <p className="text-slate-500 font-medium">Theo dõi cơ sở tri thức, lịch sử tư vấn và cấu hình mapping AI.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 px-6 rounded-xl shadow-xl shadow-blue-100 transition-all active:scale-95"
          >
            {syncMutation.isPending ? (
              <RefreshCcw className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <RefreshCcw className="mr-2 h-5 w-5" />
            )}
            Đồng bộ Knowledge Base
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-500">Sản phẩm đã Index</CardTitle>
            <div className="p-2 bg-indigo-50 rounded-xl">
              <Database className="h-5 w-5 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-800">{products.length}</div>
            <p className="text-xs font-semibold text-slate-400 mt-2">Dữ liệu sẵn sàng cho RAG</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-500">Tổng lượt tư vấn</CardTitle>
            <div className="p-2 bg-blue-50 rounded-xl">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-800">{logs.length}</div>
            <p className="text-xs font-semibold text-slate-400 mt-2">Hội thoại trong 30 ngày qua</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-500">Phản hồi tích cực</CardTitle>
            <div className="p-2 bg-emerald-50 rounded-xl">
              <ThumbsUp className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-800">{positiveLogs}</div>
            <p className="text-xs font-semibold text-emerald-600 mt-2">Đánh giá tốt từ khách hàng</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-500">Cần cải thiện</CardTitle>
            <div className="p-2 bg-red-50 rounded-xl">
              <ThumbsDown className="h-5 w-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-800">{negativeLogs}</div>
            <p className="text-xs font-semibold text-red-600 mt-2">Đánh giá chưa hài lòng</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-2xl h-auto flex-wrap sm:flex-nowrap">
          <TabsTrigger value="overview" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Tổng quan AI
          </TabsTrigger>
          <TabsTrigger value="mapping" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Symptom Mapping
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Lịch sử tư vấn
          </TabsTrigger>
          <TabsTrigger value="catalog" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Danh mục Triệu chứng
          </TabsTrigger>
        </TabsList>

        {/* Tab content: Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  Nguyên lý hoạt động & Đồng bộ
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p className="text-slate-600 leading-relaxed">
                  Chatbot MedCare sử dụng kiến trúc <strong>RAG (Retrieval-Augmented Generation)</strong>.
                  Cơ sở tri thức (Knowledge Base) của AI được duy trì thông qua 2 cơ chế chính:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                    <div className="flex items-center gap-2 font-black text-slate-800 text-sm">
                      <Database className="w-4 h-4 text-indigo-500" /> ĐỒNG BỘ DỮ LIỆU
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      Hệ thống tự động đồng bộ thông tin sản phẩm (tên, thành phần, công dụng) từ Database chính sang Database AI mỗi khi bạn nhấn nút "Đồng bộ".
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100 space-y-3">
                    <div className="flex items-center gap-2 font-black text-blue-800 text-sm">
                      <Tag className="w-4 h-4 text-blue-500" /> SYMPTOM MAPPING
                    </div>
                    <p className="text-xs text-blue-600 font-medium leading-relaxed">
                      Đây là lớp tri thức bổ sung. Bạn gắn các "triệu chứng" cho thuốc để AI biết chính xác loại thuốc nào dùng cho bệnh gì.
                    </p>
                  </div>
                </div>

                <h4 className="text-slate-800 font-bold mb-2">Quy trình xử lý câu hỏi:</h4>
                <div className="flex flex-col gap-2">
                  {[
                    "Trích xuất triệu chứng: AI phân tích tin nhắn người dùng để tìm các từ khóa bệnh lý.",
                    "Truy vấn Knowledge: AI tìm trong bảng mapping các sản phẩm có triệu chứng tương ứng.",
                    "Tạo câu trả lời: Gửi ngữ cảnh (Sản phẩm + Triệu chứng) tới Gemini AI để phản hồi khách hàng."
                  ].map((step, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm font-medium text-slate-600">
                      <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black shrink-0">{idx + 1}</div>
                      {step}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 text-white">
              <CardHeader>
                <CardTitle className="text-white">Trạng thái Service</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span className="font-bold">AI Service</span>
                  </div>
                  <Badge variant="outline" className="bg-emerald-400/10 text-emerald-400 border-emerald-400/20">Hoạt động</Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span className="font-bold">Gemini API</span>
                  </div>
                  <Badge variant="outline" className="bg-emerald-400/10 text-emerald-400 border-emerald-400/20">Kết nối tốt</Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <History className="h-5 w-5 text-blue-400" />
                    <span className="font-bold">Sync cuối</span>
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    {products[0] ? format(new Date(products[0].updated_at), "HH:mm, dd/MM/yyyy", { locale: vi }) : "Chưa có dữ liệu"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab content: Mapping */}
        <TabsContent value="mapping" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 mb-2 items-center">
            <div className="flex items-center gap-4 flex-1 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Tìm sản phẩm hoặc triệu chứng..."
                  className="pl-12 h-12 bg-white rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500 font-bold"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {isMappingFiltered && (
                <Button
                  variant="ghost"
                  onClick={resetMappingFilters}
                  className="h-12 px-6 rounded-xl font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-all flex items-center gap-2 shrink-0 border-none"
                >
                  <X className="h-4 w-4" />
                  Xóa lọc
                </Button>
              )}
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <Select value={mappingFilter} onValueChange={setMappingFilter}>
                <SelectTrigger className={cn(
                  "h-12 w-48 rounded-xl font-bold transition-all border-slate-200",
                  mappingFilter !== "all" && "bg-blue-50 text-blue-600 border-blue-100 shadow-sm"
                )}>
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <SelectValue placeholder="Trạng thái Mapping" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl p-2">
                  <SelectItem value="all" className="font-bold rounded-lg">Tất cả sản phẩm</SelectItem>
                  <SelectItem value="mapped" className="font-bold rounded-lg text-emerald-600">Đã có Mapping</SelectItem>
                  <SelectItem value="missing" className="font-bold rounded-lg text-orange-600">Chưa có Mapping</SelectItem>
                </SelectContent>
              </Select>

              <div className="bg-white px-6 py-3 rounded-xl border border-slate-200 flex items-center gap-2 text-sm font-black text-slate-500 shrink-0">
                <Database className="h-4 w-4 text-blue-500" />
                <span>{filteredProducts.length} <span className="hidden sm:inline">sản phẩm</span></span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="font-black text-slate-800 py-6 pl-8">Sản phẩm</TableHead>
                  <TableHead className="font-black text-slate-800">Triệu chứng Mapping</TableHead>
                  <TableHead className="font-black text-slate-800">Cập nhật cuối</TableHead>
                  <TableHead className="font-black text-slate-800 text-right pr-8">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingProducts ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={4} className="p-8"><Skeleton className="h-12 w-full rounded-xl" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map((p) => (
                    <TableRow
                      key={p.id}
                      className="group hover:bg-slate-50/50 transition-colors border-slate-50 cursor-pointer"
                      onClick={() => setSelectedProductForEdit(p)}
                    >
                      <TableCell className="py-5 pl-8">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{p.name}</span>
                          <span className="text-xs font-medium text-slate-400 italic">ID: {p.id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {p.symptoms ? (
                            p.symptoms.split(",").map((s, idx) => (
                              <Badge key={idx} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100/50 font-bold">
                                {s.trim()}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-slate-300 text-xs italic">Chưa có mapping</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm font-medium">
                        {format(new Date(p.updated_at), "dd/MM/yyyy", { locale: vi })}
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-blue-50 hover:text-blue-600 font-bold rounded-lg transition-colors group/btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProductForEdit(p);
                          }}
                        >
                          Cập nhật Mapping <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-64 text-center">
                      <div className="flex flex-col items-center gap-3 opacity-40">
                        <Database className="h-12 w-12" />
                        <p className="font-bold">Không tìm thấy sản phẩm nào</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Tab content: History */}
        <TabsContent value="history" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 mb-2 justify-end items-center">
            <div className="flex items-center gap-4">
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger className={cn(
                  "h-12 w-48 rounded-xl font-bold transition-all border-slate-200",
                  ratingFilter !== "all" && "bg-blue-50 text-blue-600 border-blue-100 shadow-sm"
                )}>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <SelectValue placeholder="Trạng thái Đánh giá" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl p-2">
                  <SelectItem value="all" className="font-bold rounded-lg">Tất cả đánh giá</SelectItem>
                  <SelectItem value="positive" className="font-bold rounded-lg text-emerald-600">Hài lòng (Thumbs Up)</SelectItem>
                  <SelectItem value="negative" className="font-bold rounded-lg text-red-600">Chưa tốt (Thumbs Down)</SelectItem>
                  <SelectItem value="unrated" className="font-bold rounded-lg text-slate-500">Chưa đánh giá</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="font-black text-slate-800 py-6 pl-8">Thời gian</TableHead>
                  <TableHead className="font-black text-slate-800">Câu hỏi người dùng</TableHead>
                  <TableHead className="font-black text-slate-800">Đánh giá</TableHead>
                  <TableHead className="font-black text-slate-800 text-right pr-8">Chi tiết</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingLogs ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={4} className="p-8"><Skeleton className="h-12 w-full rounded-xl" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <TableRow
                      key={log.id}
                      className="hover:bg-slate-50/50 transition-colors border-slate-50 cursor-pointer"
                      onClick={() => setSelectedLogForDetail(log)}
                    >
                      <TableCell className="py-5 pl-8">
                        <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
                          <Clock className="h-4 w-4" />
                          {format(new Date(log.created_at), "HH:mm, dd/MM", { locale: vi })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold text-slate-800 line-clamp-1 max-w-md">{log.user_message}</p>
                      </TableCell>
                      <TableCell>
                        {log.rating === true ? (
                          <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold gap-1">
                            <ThumbsUp className="h-3 w-3" /> Hài lòng
                          </Badge>
                        ) : log.rating === false ? (
                          <Badge className="bg-red-50 text-red-600 border-red-100 font-bold gap-1">
                            <ThumbsDown className="h-3 w-3" /> Chưa tốt
                          </Badge>
                        ) : (
                          <span className="text-slate-300 text-xs">Chưa có</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-slate-100 rounded-xl"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLogForDetail(log);
                          }}
                        >
                          <ChevronRight className="h-5 w-5 text-slate-400" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-64 text-center">
                      <div className="flex flex-col items-center gap-3 opacity-40">
                        <History className="h-12 w-12" />
                        <p className="font-bold">Chưa có lịch sử hội thoại</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Tab content: Symptom Catalog */}
        <TabsContent value="catalog" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1 border-none shadow-sm rounded-3xl h-fit">
              <CardHeader>
                <CardTitle className="text-xl font-black text-slate-800">Thêm triệu chứng</CardTitle>
                <CardDescription className="font-medium">Bổ sung từ khóa mới cho AI</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase">Tên triệu chứng</label>
                  <Input
                    placeholder="VD: Đau đầu, Chóng mặt..."
                    className="h-12 rounded-xl font-bold"
                    value={newSymptomName}
                    onChange={(e) => setNewSymptomName(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-lg shadow-blue-100"
                  onClick={() => {
                    if (!newSymptomName.trim()) return
                    addSymptomMutation.mutate(newSymptomName)
                    setNewSymptomName("")
                  }}
                  disabled={addSymptomMutation.isPending}
                >
                  <Plus className="mr-2 h-5 w-5" /> THÊM VÀO KNOWLEDGE
                </Button>

                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 mt-4">
                  <p className="text-xs text-indigo-700 font-bold leading-relaxed">
                    Mẹo: Các triệu chứng nên ngắn gọn (1-3 từ) để AI dễ dàng trích xuất từ tin nhắn của khách hàng.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black text-slate-800">Danh sách Triệu chứng</CardTitle>
                </div>
                <div className="p-2 bg-blue-50 rounded-xl">
                  <Tag className="h-5 w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="font-black text-slate-800 py-4 pl-8">Triệu chứng</TableHead>
                      <TableHead className="font-black text-slate-800">ID</TableHead>
                      <TableHead className="font-black text-slate-800 text-right pr-8">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {symptomsData.length > 0 ? (
                      symptomsData.map((s: any) => (
                        <TableRow key={s.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                          <TableCell className="py-4 pl-8">
                            <Badge className="bg-white text-slate-800 border-slate-200 font-bold px-4 py-1.5 shadow-sm">
                              {s.name}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-400 font-medium text-sm">#{s.id}</TableCell>
                          <TableCell className="text-right pr-8">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                              onClick={() => {
                                if (confirm(`Bạn có chắc chắn muốn xóa triệu chứng "${s.name}"?`)) {
                                  deleteSymptomMutation.mutate(s.id)
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="h-48 text-center text-slate-400 font-bold italic">
                          Chưa có triệu chứng nào được tạo thủ công.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Render Dialogs outside the table loop for better performance and controlled state */}
      {selectedProductForEdit && (
        <EditSymptomDialog
          product={selectedProductForEdit}
          options={dynamicSymptoms}
          open={!!selectedProductForEdit}
          onOpenChange={(open) => !open && setSelectedProductForEdit(null)}
          onSave={(s) => {
            updateSymptomMutation.mutate({ id: selectedProductForEdit.id, symptoms: s });
            setSelectedProductForEdit(null);
          }}
        />
      )}

      {selectedLogForDetail && (
        <LogDetailDialog
          log={selectedLogForDetail}
          open={!!selectedLogForDetail}
          onOpenChange={(open) => !open && setSelectedLogForDetail(null)}
        />
      )}
    </div>
  )
}

function EditSymptomDialog({
  product,
  options,
  onSave,
  open,
  onOpenChange
}: {
  product: IndexedProduct,
  options: any[],
  onSave: (s: string) => void,
  open: boolean,
  onOpenChange: (open: boolean) => void
}) {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(
    product.symptoms ? product.symptoms.split(",").map(s => s.trim()).filter(Boolean) : []
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden max-w-[95vw] lg:max-w-[1400px]">
        <DialogHeader className="p-10 pb-6 bg-gradient-to-br from-slate-800 to-slate-900 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Bot className="h-24 w-24" />
          </div>
          <DialogTitle className="text-3xl font-black tracking-tight mb-2">Cấu hình tri thức AI</DialogTitle>
          <DialogDescription className="text-slate-300 font-medium">
            Tối ưu hóa khả năng tư vấn của Chatbot cho <strong>{product.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="p-10 space-y-8 bg-white">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Triệu chứng liên quan</label>
              <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 font-bold">RAG Engine</Badge>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <MultiSelect
                options={options}
                selected={selectedSymptoms}
                onChange={setSelectedSymptoms}
                placeholder="Chọn các triệu chứng phù hợp..."
              />
            </div>
            <p className="text-[11px] text-slate-400 font-medium italic px-2">
              * AI sẽ sử dụng các nhãn này để tìm kiếm thuốc khi người dùng mô tả bệnh.
            </p>
          </div>

          <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex gap-4 items-start shadow-sm">
            <div className="bg-amber-500/20 p-2 rounded-xl">
              <Info className="h-5 w-5 text-amber-600 shrink-0" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-black text-amber-900 leading-none mb-1">Cơ chế đồng bộ:</p>
              <p className="text-xs text-amber-700/80 font-bold leading-relaxed">
                Sau khi lưu, hãy nhấn <strong>"Đồng bộ Knowledge Base"</strong> ở trang quản lý để cập nhật dữ liệu mới nhất vào bộ não AI.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-slate-50/50 border-t flex gap-3 sm:justify-end px-10 pb-8">
          <DialogTrigger asChild>
            <Button variant="ghost" className="font-bold text-slate-500 h-12 px-6 rounded-xl hover:bg-slate-200/50">Hủy bỏ</Button>
          </DialogTrigger>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white font-black h-12 px-10 rounded-xl shadow-xl shadow-blue-100 transition-all active:scale-95"
            onClick={() => onSave(selectedSymptoms.join(", "))}
          >
            CẬP NHẬT TRÍ THỨC
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function LogDetailDialog({
  log,
  open,
  onOpenChange
}: {
  log: ChatLog,
  open: boolean,
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden max-w-[95vw] lg:max-w-[1400px] bg-slate-50">
        <DialogHeader className="p-8 bg-white border-b">
          <DialogTitle className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Bot className="h-6 w-6 text-blue-600" /> Chi tiết hội thoại
          </DialogTitle>
          <DialogDescription className="font-medium text-slate-400">
            {format(new Date(log.created_at), "eeee, dd MMMM yyyy 'lúc' HH:mm", { locale: vi })}
          </DialogDescription>
        </DialogHeader>
        <div className="p-8 space-y-8 max-h-[65vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
              <MessageSquare className="h-3 w-3" /> Người dùng hỏi
            </div>
            <div className="bg-white p-5 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm font-bold text-slate-800 leading-relaxed">
              {log.user_message}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-blue-400 uppercase tracking-widest">
              <Bot className="h-3 w-3" /> AI Phản hồi
            </div>
            <div className="bg-blue-600 p-5 rounded-2xl rounded-tr-none text-white shadow-lg shadow-blue-100 leading-relaxed font-medium">
              {log.bot_response}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Tag className="h-3 w-3" /> Triệu chứng nhận diện
              </div>
              <div className="flex flex-wrap gap-2">
                {log.detected_symptoms && log.detected_symptoms.length > 0 ? (
                  log.detected_symptoms.map((s, i) => (
                    <Badge key={i} className="bg-slate-200 text-slate-700 hover:bg-slate-200 font-bold border-none">{s}</Badge>
                  ))
                ) : <span className="text-slate-400 text-sm italic">Không nhận diện được</span>}
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Database className="h-3 w-3" /> Sản phẩm gợi ý
              </div>
              <div className="flex flex-wrap gap-2">
                {log.suggested_medicines && log.suggested_medicines.length > 0 ? (
                  log.suggested_medicines.map((m, i) => (
                    <Badge key={i} className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 font-black border-indigo-100">{m.name}</Badge>
                  ))
                ) : <span className="text-slate-400 text-sm italic">Không có gợi ý</span>}
              </div>
            </div>
          </div>

          {log.rating === false && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
              <p className="text-sm font-black text-red-800 mb-1">Lý do không hài lòng:</p>
              <p className="text-sm text-red-600 font-medium">{log.feedback_reason || "Người dùng không để lại lý do."}</p>
            </div>
          )}
        </div>
        <div className="p-6 bg-white border-t text-center">
          <Button variant="ghost" className="font-bold text-slate-400 rounded-xl" onClick={() => onOpenChange(false)}>Đóng cửa sổ</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
