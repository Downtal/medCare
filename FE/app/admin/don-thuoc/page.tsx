"use client"

import { useState, useMemo, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  FileText,
  Search,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  ListFilter,
  ChevronLeft,
  ChevronRight,
  BrainCircuit,
  User,
  Stethoscope,
  Building2,
  Calendar,
  AlertCircle,
  X,
  Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/admin/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import Image from "next/image"
import { prescriptionService } from "@/services/prescriptionService"
import { PrescriptionResponse, PrescriptionStatus } from "@/lib/types"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function AdminPrescriptionsPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionResponse | null>(null)
  const [allProducts, setAllProducts] = useState<any[]>([])

  // Load all products for suggestions
  useQuery({
    queryKey: ["all_products_suggestions"],
    queryFn: async () => {
      const products = await productService.getProducts()
      setAllProducts(products)
      return products
    }
  })

  // Dialog States
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const isFiltered = searchQuery !== "" || selectedStatus !== "all" || sortBy !== "newest"

  const resetFilters = () => {
    setSearchQuery("")
    setSelectedStatus("all")
    setSortBy("newest")
    setCurrentPage(1)
  }

  const [editForm, setEditForm] = useState<{
    hospitalName: string;
    doctorName: string;
    expiryDate: string;
    medicines: any[];
  }>({
    hospitalName: "",
    doctorName: "",
    expiryDate: "",
    medicines: []
  })

  // Sync editForm when selectedPrescription changes
  useEffect(() => {
    if (selectedPrescription) {
      let meds = []
      try {
        const parsed = JSON.parse(selectedPrescription.extractedData || "{}")
        const rawMeds = (parsed && parsed.mapped_medicines) ? parsed.mapped_medicines : []
        
        // Clean quantities to only show numbers
        meds = rawMeds.map((m: any) => ({
          ...m,
          quantity: m.quantity ? m.quantity.toString().replace(/[^0-9]/g, '') : "1"
        }))
      } catch (e) {
        console.error("Failed to parse medicines", e)
      }

      setEditForm({
        hospitalName: selectedPrescription.hospitalName || "",
        doctorName: selectedPrescription.doctorName || "",
        expiryDate: selectedPrescription.expiryDate || "",
        medicines: meds
      })
    }
  }, [selectedPrescription])

  const { data: prescriptions = [], isLoading } = useQuery({
    queryKey: ["admin_prescriptions"],
    queryFn: () => prescriptionService.getAllPrescriptions()
  })

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: number, status: PrescriptionStatus, note?: string }) =>
      prescriptionService.updatePrescriptionStatus(id, status, note),
    onSuccess: (_, variables) => {
      const msg = variables.status === 'APPROVED' ? "Đã phê duyệt đơn thuốc" : "Đã từ chối đơn thuốc"
      toast.success(msg)
      queryClient.invalidateQueries({ queryKey: ["admin_prescriptions"] })
      setIsDetailsOpen(false)
    },
    onError: () => toast.error("Lỗi khi cập nhật trạng thái")
  })

  const updateExtractedDataMutation = useMutation({
    mutationFn: (info: { id: number, extractedData: string }) =>
      prescriptionService.updateExtractedData(info.id, info.extractedData),
    onSuccess: (data) => {
      setSelectedPrescription(data)
    }
  })

  const updateInfoMutation = useMutation({
    mutationFn: (info: { id: number, hospitalName?: string, doctorName?: string, expiryDate?: string }) =>
      prescriptionService.updatePrescriptionInfo(info.id, info),
    onSuccess: (data) => {
      setSelectedPrescription(data)
      queryClient.invalidateQueries({ queryKey: ["admin_prescriptions"] })
    }
  })

  const analyzeMutation = useMutation({
    mutationFn: (id: number) => prescriptionService.analyzePrescription(id),
    onSuccess: (data) => {
      toast.success("AI đã hoàn tất phân tích đơn thuốc!")
      setSelectedPrescription(data)
      queryClient.invalidateQueries({ queryKey: ["admin_prescriptions"] })
    },
    onError: () => toast.error("AI phân tích thất bại")
  })

  const statusConfig: Record<PrescriptionStatus, { label: string, color: string, icon: any }> = {
    PENDING: { label: "Chờ duyệt", color: "bg-amber-50 text-amber-600 border-amber-100", icon: Clock },
    APPROVED: { label: "Đã duyệt", color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: CheckCircle2 },
    REJECTED: { label: "Từ chối", color: "bg-rose-50 text-rose-600 border-rose-100", icon: XCircle },
  }

  const columns: ColumnDef<PrescriptionResponse>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => (
        <span className="font-black text-slate-800 tracking-tight">#{row.original.id}</span>
      )
    },
    {
      accessorKey: "imageUrl",
      header: "Ảnh đơn",
      cell: ({ row }) => (
        <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-slate-100">
           <Image src={row.original.imageUrl} alt="Prescription" fill className="object-cover" />
        </div>
      )
    },
    {
      accessorKey: "userEmail",
      header: "Người dùng",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800 truncate max-w-[250px]">{row.original.userEmail || "Chưa xác định"}</span>
          <span className="text-[11px] text-slate-400">ID: {row.original.userId}</span>
        </div>
      )
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const cfg = statusConfig[row.original.status]
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
      header: "Ngày gửi",
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
            setSelectedPrescription(row.original)
            setIsDetailsOpen(true)
          }}
        >
          <Eye className="w-4 h-4" />
        </Button>
      )
    }
  ]

  const filteredData = useMemo(() => {
    let result = Array.isArray(prescriptions) ? prescriptions : []
    
    result = result.filter(p => {
      const q = searchQuery.toLowerCase()
      const matchesSearch = 
        (p.hospitalName?.toLowerCase() || "").includes(q) ||
        (p.doctorName?.toLowerCase() || "").includes(q) ||
        (p.userEmail?.toLowerCase() || "").includes(q) ||
        p.id.toString().includes(q)
      
      const matchesStatus = selectedStatus === "all" || p.status === selectedStatus
      return matchesSearch && matchesStatus
    })

    result.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })

    return result
  }, [prescriptions, searchQuery, selectedStatus, sortBy])

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedRows = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const parsedExtractedData = useMemo(() => {
    if (!selectedPrescription?.extractedData) return null
    try {
      return JSON.parse(selectedPrescription.extractedData)
    } catch (e) {
      return null
    }
  }, [selectedPrescription])

  return (
    <div className="p-10 space-y-8 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            Duyệt Đơn Thuốc
            <FileText className="w-8 h-8 text-blue-600" />
          </h1>
          <p className="text-slate-500 font-medium mt-1">Xác thực toa thuốc RX từ người dùng và hỗ trợ AI OCR.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Tìm theo ID, bệnh viện, bác sĩ hoặc email người dùng..."
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select value={selectedStatus} onValueChange={(v) => { setSelectedStatus(v); setCurrentPage(1); }}>
            <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-blue-500" />
                <SelectValue placeholder="Tất cả trạng thái" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl">
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="PENDING">Chờ duyệt</SelectItem>
              <SelectItem value="APPROVED">Đã duyệt</SelectItem>
              <SelectItem value="REJECTED">Từ chối</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setCurrentPage(1); }}>
            <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold">
              <div className="flex items-center gap-2">
                <ListFilter className="h-4 w-4 text-blue-500" />
                <SelectValue placeholder="Sắp xếp" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl">
              <SelectItem value="newest">Mới nhất</SelectItem>
              <SelectItem value="oldest">Cũ nhất</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
        <DataTable
          columns={columns}
          data={paginatedRows}
          loading={isLoading}
          hidePagination={true}
          onRowClick={(p) => {
            setSelectedPrescription(p)
            setIsDetailsOpen(true)
          }}
        />
        
        {/* Pagination similar to admin-orders-page */}
        <div className="flex items-center justify-between px-8 py-6 bg-white border-t border-slate-50">
           <div className="text-sm font-bold text-slate-400">
             Hiển thị <span className="text-slate-800">{paginatedRows.length}</span> / {filteredData.length} đơn thuốc
           </div>
           <div className="flex items-center gap-2">
             <Button variant="outline" size="sm" className="rounded-xl h-10 font-bold border-slate-200" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
               <ChevronLeft className="h-4 w-4 mr-1" /> Trước
             </Button>
             <Button variant="outline" size="sm" className="rounded-xl h-10 font-bold border-slate-200" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
               Tiếp <ChevronRight className="h-4 w-4 ml-1" />
             </Button>
           </div>
        </div>
      </div>

      {/* Prescription Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-[95vw] lg:max-w-[1400px] w-full max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden bg-white border-none shadow-2xl rounded-[3rem]">
          <DialogHeader className="sr-only">
            <DialogTitle>Chi tiết đơn thuốc</DialogTitle>
            <DialogDescription>
              Xem ảnh gốc và kết quả phân tích AI của đơn thuốc.
            </DialogDescription>
          </DialogHeader>
          {selectedPrescription && (
            <>
              <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
                {/* Left: Original Image Viewer */}
                <div className="bg-slate-100 relative overflow-hidden group">
                  <div className="absolute top-6 left-6 z-10">
                    <Badge className="bg-white/80 backdrop-blur-md text-slate-900 font-black px-4 py-2 rounded-xl shadow-xl border-none">
                      ẢNH ĐƠN THUỐC GỐC
                    </Badge>
                  </div>
                  <ScrollArea className="h-full w-full p-10">
                    <div className="relative aspect-[3/4] w-full shadow-2xl rounded-2xl overflow-hidden bg-white">
                       <Image src={selectedPrescription.imageUrl} alt="Toa gốc" fill className="object-contain" />
                    </div>
                  </ScrollArea>
                </div>

                {/* Right: Data Verification & AI Result */}
                <div className="p-10 flex flex-col bg-white overflow-y-auto custom-scrollbar-slim">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                       <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                         Duyệt Thông Tin
                         <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                       </h2>
                       <p className="text-slate-400 font-bold text-sm">Đối soát dữ liệu trích xuất từ AI</p>
                    </div>
                    <Badge className={cn("px-4 py-2 rounded-xl font-black", statusConfig[selectedPrescription.status].color)}>
                       {statusConfig[selectedPrescription.status].label}
                    </Badge>
                  </div>

                  <div className="space-y-6 flex-1">
                    {/* Medical Metadata */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 focus-within:border-blue-200 focus-within:bg-white transition-all">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                              <Building2 className="w-3 h-3" /> Bệnh viện
                           </p>
                           <input 
                              className="w-full bg-transparent font-bold text-slate-800 outline-none focus:ring-0 p-0 h-auto text-sm"
                              value={editForm.hospitalName}
                              onChange={(e) => setEditForm({...editForm, hospitalName: e.target.value})}
                              placeholder="Nhập tên bệnh viện..."
                           />
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 focus-within:border-blue-200 focus-within:bg-white transition-all">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                              <Stethoscope className="w-3 h-3" /> Bác sĩ
                           </p>
                           <input 
                              className="w-full bg-transparent font-bold text-slate-800 outline-none focus:ring-0 p-0 h-auto text-sm"
                              value={editForm.doctorName}
                              onChange={(e) => setEditForm({...editForm, doctorName: e.target.value})}
                              placeholder="Nhập tên bác sĩ..."
                           />
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 focus-within:border-blue-200 focus-within:bg-white transition-all">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> Hạn dùng
                           </p>
                           <input 
                              type="date"
                              className="w-full bg-transparent font-bold text-slate-800 outline-none focus:ring-0 p-0 h-auto text-sm"
                              value={editForm.expiryDate}
                              onChange={(e) => setEditForm({...editForm, expiryDate: e.target.value})}
                           />
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 opacity-60">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                              <User className="w-3 h-3" /> Người dùng
                           </p>
                           <p className="font-bold text-slate-800 truncate text-sm" title={selectedPrescription.userEmail}>
                             {selectedPrescription.userEmail || "---"}
                           </p>
                        </div>
                     </div>

                    {/* AI OCR Results Section */}
                    <div className="mt-8 space-y-4">
                      <div className="flex items-center justify-between">
                         <h4 className="font-black text-[11px] uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                           DANH SÁCH THUỐC (AI OCR)
                         </h4>
                         <div className="flex gap-2">
                           <Button 
                              size="sm" 
                              variant="outline" 
                              className="rounded-xl font-bold bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
                              onClick={() => analyzeMutation.mutate(selectedPrescription.id)}
                              disabled={analyzeMutation.isPending}
                            >
                              <BrainCircuit className={cn("w-4 h-4 mr-2", analyzeMutation.isPending && "animate-pulse")} />
                              Phân Tích AI
                            </Button>
                           <Button 
                              size="sm" 
                              variant="ghost" 
                              className="rounded-xl font-bold text-slate-600 hover:bg-slate-50 border border-slate-200"
                              onClick={() => {
                                 const newMeds = [...editForm.medicines, { 
                                    original_name: "", 
                                    dosage: "", 
                                    quantity: "1", 
                                    unit: "Viên",
                                    matched_product: null 
                                 }]
                                 setEditForm({...editForm, medicines: newMeds})
                              }}
                            >
                               <Plus className="w-4 h-4 mr-1" /> Thêm thuốc
                            </Button>
                         </div>
                      </div>

                      {editForm.medicines && editForm.medicines.length > 0 ? (
                         <div className="space-y-3">
                            {editForm.medicines.map((med: any, idx: number) => (
                              <div key={idx} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-blue-200 transition-all group">
                                 <div className="flex flex-col gap-3">
                                    <div className="flex-1 space-y-2">
                                       <div className="flex items-center justify-between gap-4">
                                          <div className="relative flex-1">
                                             <input 
                                                className="w-full bg-transparent font-black text-slate-800 outline-none focus:ring-0 p-0 h-auto text-sm"
                                                value={med.original_name || ""}
                                                list={`product-suggestions-${idx}`}
                                                onChange={(e) => {
                                                   const val = e.target.value
                                                   const newMeds = [...editForm.medicines]
                                                   newMeds[idx].original_name = val
                                                   
                                                   // Auto-map if exact match found in suggestions
                                                   const matched = allProducts.find(p => p.name === val)
                                                   if (matched) {
                                                      newMeds[idx].matched_product = {
                                                         id: matched.id,
                                                         name: matched.name,
                                                         price: matched.price
                                                      }
                                                   } else {
                                                      newMeds[idx].matched_product = null
                                                   }
                                                   
                                                   setEditForm({...editForm, medicines: newMeds})
                                                }}
                                                placeholder="Nhập tên thuốc..."
                                             />
                                             <datalist id={`product-suggestions-${idx}`}>
                                                {allProducts.map((p: any) => (
                                                   <option key={p.id} value={p.name} />
                                                ))}
                                             </datalist>
                                          </div>
                                          {med.matched_product ? (
                                             <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold rounded-lg text-[9px] whitespace-nowrap shadow-none">
                                               Khớp hệ thống
                                             </Badge>
                                          ) : (
                                             <Badge className="bg-amber-50 text-amber-600 border-amber-100 font-bold rounded-lg text-[9px] flex items-center gap-1 whitespace-nowrap shadow-none">
                                               <AlertCircle className="w-2.5 h-2.5" /> Không khớp
                                             </Badge>
                                          )}
                                       </div>
                                       
                                       {med.matched_product && (
                                          <p className="text-[10px] text-emerald-600 font-bold bg-emerald-50/50 px-2 py-1 rounded-md w-fit border border-emerald-100/50">
                                             Sản phẩm: {med.matched_product.name}
                                          </p>
                                       )}

                                       <div className="flex items-center gap-2">
                                          <input 
                                             className="w-24 bg-slate-50 border border-slate-100 rounded px-2 py-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-200 transition-all outline-none"
                                             value={med.quantity || ""}
                                             onChange={(e) => {
                                                const newMeds = [...editForm.medicines]
                                                newMeds[idx].quantity = e.target.value
                                                setEditForm({...editForm, medicines: newMeds})
                                             }}
                                             placeholder="Số lượng..."
                                          />
                                          <div className="flex-1" /> {/* Spacer */}
                                          <Button 
                                             variant="ghost" 
                                             size="icon" 
                                             className="h-8 w-8 text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                                             onClick={() => {
                                                const newMeds = editForm.medicines.filter((_, i) => i !== idx)
                                                setEditForm({...editForm, medicines: newMeds})
                                             }}
                                          >
                                             <XCircle className="w-5 h-5" />
                                          </Button>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                            ))}
                         </div>
                       ) : (
                        <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[2rem] text-slate-300">
                           <BrainCircuit className="w-10 h-10 mb-2 opacity-20" />
                           <p className="text-xs font-bold italic">Chưa có dữ liệu AI phân tích</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-10 pt-10 border-t border-slate-100 flex items-center gap-4">
                     <Button 
                        variant="outline" 
                        className="flex-1 h-16 rounded-[1.5rem] font-bold text-rose-600 border-rose-100 hover:bg-rose-50"
                        onClick={() => updateStatusMutation.mutate({ id: selectedPrescription.id, status: 'REJECTED' })}
                        disabled={updateStatusMutation.isPending}
                     >
                        TỪ CHỐI
                     </Button>
                     <Button 
                        className="flex-[2] h-16 rounded-[1.5rem] font-black text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100"
                        onClick={async () => {
                          if (!selectedPrescription) return
                          try {
                             toast.loading("Đang lưu thông tin...", { id: "approval" })
                             await updateInfoMutation.mutateAsync({
                               id: selectedPrescription.id,
                               ...editForm
                             })
                             const currentData = JSON.parse(selectedPrescription.extractedData || "{}")
                             const updatedData = {
                               ...currentData,
                               mapped_medicines: editForm.medicines
                             }
                             await updateExtractedDataMutation.mutateAsync({
                               id: selectedPrescription.id,
                               extractedData: JSON.stringify(updatedData)
                             })
                             await updateStatusMutation.mutateAsync({ id: selectedPrescription.id, status: 'APPROVED' })
                             toast.success("Đã phê duyệt đơn thuốc thành công!", { id: "approval" })
                             setIsDetailsOpen(false)
                          } catch (err) {
                             console.error("Approval error:", err)
                             toast.error("Lỗi khi phê duyệt đơn thuốc!", { id: "approval" })
                          }
                        }}
                        disabled={updateStatusMutation.isPending || updateInfoMutation.isPending || updateExtractedDataMutation.isPending}
                     >
                        PHÊ DUYỆT ĐƠN THUỐC
                     </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
