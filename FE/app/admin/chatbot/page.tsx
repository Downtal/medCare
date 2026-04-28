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
  Info
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

import { useSession } from "next-auth/react"

export default function ChatbotManagementPage() {
  const { data: session } = useSession()
  const token = session?.user?.accessToken
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("overview")

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

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.symptoms.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
        </TabsList>

        {/* Tab content: Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  Nguyên lý hoạt động
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-slate max-w-none">
                <p className="text-slate-600 leading-relaxed">
                  Chatbot MedCare sử dụng kiến trúc <strong>RAG (Retrieval-Augmented Generation)</strong>. 
                  Khi người dùng đặt câu hỏi, hệ thống sẽ thực hiện các bước:
                </p>
                <ol className="list-decimal list-inside space-y-3 text-slate-600 font-medium">
                  <li><span className="text-slate-800 font-bold">Trích xuất triệu chứng:</span> Phân tích tin nhắn để tìm từ khóa bệnh lý.</li>
                  <li><span className="text-slate-800 font-bold">Truy vấn Knowledge Base:</span> Tìm kiếm sản phẩm trong bảng mapping triệu chứng.</li>
                  <li><span className="text-slate-800 font-bold">Tư vấn thông minh:</span> Gửi ngữ cảnh sản phẩm tìm được + Lịch sử chat tới Gemini AI để tạo câu trả lời tự nhiên.</li>
                </ol>
                <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 shrink-0" />
                  <p className="text-sm text-blue-800 font-medium">
                    Hãy đảm bảo bạn đã gắn đúng triệu chứng cho sản phẩm ở tab <strong>Symptom Mapping</strong> để AI có thể tư vấn chính xác nhất.
                  </p>
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
          <div className="flex flex-col md:flex-row gap-4 mb-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input 
                placeholder="Tìm sản phẩm hoặc triệu chứng..." 
                className="pl-12 h-12 bg-white rounded-xl border-slate-200 focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-2 text-sm font-bold text-slate-500">
              <Database className="h-4 w-4" />
              <span>{filteredProducts.length} sản phẩm</span>
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
                    <TableRow key={p.id} className="group hover:bg-slate-50/50 transition-colors border-slate-50">
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
                        <EditSymptomDialog 
                          product={p} 
                          onSave={(s) => updateSymptomMutation.mutate({ id: p.id, symptoms: s })} 
                        />
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
                ) : logs.length > 0 ? (
                  logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
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
                        <LogDetailDialog log={log} />
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
      </Tabs>
    </div>
  )
}

function EditSymptomDialog({ product, onSave }: { product: IndexedProduct, onSave: (s: string) => void }) {
  const [val, setVal] = useState(product.symptoms)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="hover:bg-blue-50 hover:text-blue-600 font-bold rounded-lg transition-colors">
          Cập nhật Mapping <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[2rem] border-none shadow-2xl p-8 max-w-lg">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-black text-slate-800">Cập nhật triệu chứng</DialogTitle>
          <DialogDescription className="font-medium">
            Sửa danh sách triệu chứng cho <strong>{product.name}</strong>. Phân cách bằng dấu phẩy.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-black text-slate-700 uppercase tracking-wider">Danh sách triệu chứng</label>
            <Textarea 
              value={val} 
              onChange={(e) => setVal(e.target.value)}
              placeholder="VD: Sốt, Đau đầu, Ho khan..."
              className="min-h-[120px] rounded-2xl bg-slate-50 border-slate-200 focus:ring-blue-500 font-medium p-4"
            />
          </div>
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800 font-bold leading-relaxed">
              Lưu ý: Dữ liệu này chỉ ảnh hưởng đến khả năng tìm kiếm của Chatbot. Để thay đổi thông tin gốc của sản phẩm, vui lòng vào trang Quản lý sản phẩm.
            </p>
          </div>
        </div>
        <DialogFooter className="gap-3">
          <Button variant="ghost" className="font-bold text-slate-500 rounded-xl" onClick={() => {}}>Hủy</Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-black px-8 rounded-xl"
            onClick={() => onSave(val)}
          >
            LƯU THAY ĐỔI
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function LogDetailDialog({ log }: { log: ChatLog }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="hover:bg-slate-100 rounded-xl">
          <ChevronRight className="h-5 w-5 text-slate-400" />
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden max-w-2xl bg-slate-50">
        <DialogHeader className="p-8 bg-white border-b">
          <DialogTitle className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Bot className="h-6 w-6 text-blue-600" /> Chi tiết hội thoại
          </DialogTitle>
          <DialogDescription className="font-medium text-slate-400">
            {format(new Date(log.created_at), "eeee, dd MMMM yyyy 'lúc' HH:mm", { locale: vi })}
          </DialogDescription>
        </DialogHeader>
        <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
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
          <Button variant="ghost" className="font-bold text-slate-400 rounded-xl" onClick={() => {}}>Đóng cửa sổ</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
