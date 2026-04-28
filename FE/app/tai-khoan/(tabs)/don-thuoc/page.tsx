"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileCheck, Plus, Loader2, Calendar, User as UserIcon, Hospital, Eye, ShoppingCart, Clock, X, Upload, Trash2, AlertTriangle } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { format } from "date-fns"
import { prescriptionService } from "@/services/prescriptionService"
import { PrescriptionResponse } from "@/lib/types"
import { toast } from "sonner"
import Image from "next/image"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { useSession } from "next-auth/react"

export default function PrescriptionsPage() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [prescriptions, setPrescriptions] = useState<PrescriptionResponse[]>([])
  
  // Upload confirmation states
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [prescriptionToDelete, setPrescriptionToDelete] = useState<number | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchPrescriptions = async () => {
    if (status !== "authenticated") return
    
    try {
      setLoading(true)
      const data = await prescriptionService.getMyPrescriptions()
      setPrescriptions(data)
    } catch (error) {
      console.error("Failed to fetch prescriptions:", error)
      toast.error("Không thể tải danh sách đơn thuốc.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === "authenticated") {
      fetchPrescriptions()
    } else if (status === "unauthenticated") {
      setLoading(false)
    }
  }, [status])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Allow only images
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chỉ chọn tệp hình ảnh.")
      return
    }

    const url = URL.createObjectURL(file)
    setSelectedFile(file)
    setPreviewUrl(url)
    setConfirmModalOpen(true)
  }

  const handleConfirmUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      await prescriptionService.uploadPrescription(selectedFile);
      toast.success("Tải đơn thuốc lên thành công! Đang chờ Dược sĩ duyệt.");
      setConfirmModalOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      await fetchPrescriptions();
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Lỗi khi tải đơn thuốc lên. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
    }
  }

  const handleDeletePrescription = async () => {
    if (prescriptionToDelete === null) return;
    
    try {
      await prescriptionService.deletePrescription(prescriptionToDelete);
      toast.success("Đã xóa đơn thuốc thành công.");
      await fetchPrescriptions();
    } catch (error) {
      console.error("Failed to delete prescription:", error);
      toast.error("Không thể xóa đơn thuốc. Vui lòng thử lại sau.");
    } finally {
      setPrescriptionToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleCancelUpload = () => {
    setConfirmModalOpen(false)
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold px-3 py-1 rounded-full"><FileCheck className="w-3 h-3 mr-1" /> Đã duyệt</Badge>
      case 'REJECTED':
        return <Badge className="bg-red-50 text-red-600 border-red-100 font-bold px-3 py-1 rounded-full">Đã từ chối</Badge>
      default:
        return <Badge className="bg-amber-50 text-amber-600 border-amber-100 font-bold px-3 py-1 rounded-full"><Clock className="w-3 h-3 mr-1" /> Đang chờ</Badge>
    }
  }

  return (
    <Card className="animate-in fade-in slide-in-from-right-4 duration-500 border-none shadow-sm rounded-3xl overflow-hidden bg-white">
      <CardHeader className="bg-slate-50 border-b border-slate-100 px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Đơn thuốc của tôi</CardTitle>
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileSelect}
          />
          <Button 
            className="rounded-full bg-blue-600 hover:bg-blue-700 px-6 font-bold shadow-lg shadow-blue-500/20"
            onClick={() => fileInputRef.current?.click()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Gửi đơn thuốc mới
          </Button>
        </div>
      </CardHeader>

      {/* Upload Confirmation Modal */}
      <Dialog open={confirmModalOpen} onOpenChange={(open) => !open && handleCancelUpload()}>
        <DialogContent className="sm:max-w-xl rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="bg-blue-600 p-6 text-white text-center">
            <div className="mx-auto w-12 h-12 bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl flex items-center justify-center mb-3">
              <Upload className="h-6 w-6 text-white" />
            </div>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">Xác nhận gửi đơn</DialogTitle>
          </DialogHeader>
          
          <div className="p-6 space-y-6">
            <div className="relative h-[280px] w-full rounded-2xl overflow-hidden border-2 border-slate-100 bg-slate-50 shadow-inner group flex items-center justify-center">
              {previewUrl && (
                <Image src={previewUrl} alt="Preview" fill className="object-contain p-2" />
              )}
            </div>
            
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
              <p className="text-xs text-blue-700 font-bold flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Lưu ý: Đơn thuốc sẽ được gửi đến Dược sĩ chuyên môn để thẩm định trước khi bạn có thể đặt mua.
              </p>
            </div>
          </div>

          <DialogFooter className="p-6 pt-0 flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 rounded-full border-slate-200 font-bold h-12 text-slate-600"
              onClick={handleCancelUpload}
              disabled={isUploading}
            >
              Chọn lại
            </Button>
            <Button 
              className="flex-2 rounded-full bg-blue-600 hover:bg-blue-700 font-bold h-12 px-8 shadow-lg shadow-blue-500/20"
              onClick={handleConfirmUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                "Xác nhận gửi"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CardContent className="p-8">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <FileCheck className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">Chưa có đơn thuốc nào</h3>
            <p className="text-slate-500 font-medium max-w-[300px] mx-auto">Bạn chưa tải lên bất kỳ đơn thuốc nào. Hãy gửi đơn thuốc để được Dược sĩ tư vấn nhé.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {prescriptions.map((item) => (
              <div key={item.id} className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all group flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col">
                    <h4 className="text-lg font-black text-slate-800">Đơn thuốc #{item.id}</h4>
                    <p className="text-xs text-slate-400 font-medium flex items-center mt-1">
                      <Calendar className="w-3 h-3 mr-1" />
                      {item.createdAt ? (() => {
                        try {
                          const date = new Date(item.createdAt);
                          return isNaN(date.getTime()) ? "N/A" : format(date, "dd/MM/yyyy HH:mm");
                        } catch (e) {
                          return "N/A";
                        }
                      })() : "N/A"}
                    </p>
                  </div>
                  {getStatusBadge(item.status)}
                </div>
                
                <div className="flex gap-4 mb-6 flex-1">
                  {item.imageUrl && (
                    <div className="relative h-20 w-20 rounded-2xl overflow-hidden shrink-0 border border-slate-100">
                      <Image src={item.imageUrl} alt="Đơn thuốc" fill className="object-cover" />
                    </div>
                  )}
                  <div className="space-y-2 flex-1 text-sm">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-600 font-medium line-clamp-1">{item.doctorName || "Chưa cập nhật bác sĩ"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hospital className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-600 font-medium line-clamp-1">{item.hospitalName || "Chưa cập nhật bệnh viện"}</span>
                    </div>
                    {item.pharmacistNote && (
                      <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg mt-2 font-medium">
                        Phản hồi: {item.pharmacistNote}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-auto">
                    <Button 
                      variant="outline" 
                      className="flex-1 rounded-full border-slate-200 text-slate-600 hover:text-blue-600 font-bold h-11 group-hover:border-blue-200 transition-all active:scale-95" 
                      onClick={() => window.open(item.imageUrl, '_blank')}
                    >
                       <Eye className="w-4 h-4 mr-2" />
                       Xem ảnh
                    </Button>
                    
                    <Button 
                      disabled={item.status !== 'APPROVED'}
                      className={`flex-[2] rounded-full font-bold h-11 shadow-lg transition-all active:scale-95 ${
                        item.status === 'APPROVED' 
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/25" 
                          : "bg-slate-100 text-slate-400 shadow-none"
                      }`}
                      asChild={item.status === 'APPROVED'}
                    >
                      {item.status === 'APPROVED' ? (
                        <Link href="/gio-hang">
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Dùng đơn này
                        </Link>
                      ) : (
                        <div className="flex items-center justify-center opacity-70">
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Dùng đơn này
                        </div>
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full w-11 h-11 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      onClick={() => {
                        setPrescriptionToDelete(item.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-8 bg-slate-50 rounded-3xl p-6 border border-dashed border-slate-200 text-center">
          <p className="text-sm text-slate-500 font-medium italic">
            Dược sĩ MedCare luôn sẵn sàng tư vấn cho đơn thuốc của bạn 24/7.
          </p>
        </div>
      </CardContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl p-0 overflow-hidden sm:max-w-[400px]">
          <div className="bg-red-50 p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <AlertDialogHeader className="space-y-2">
              <AlertDialogTitle className="text-2xl font-black text-slate-900 leading-tight">Xóa đơn thuốc?</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-500 font-medium px-4">
                Hành động này không thể hoàn tác. Đơn thuốc và ảnh sẽ bị xóa vĩnh viễn khỏi hệ thống.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="p-6 bg-white gap-3 sm:gap-0 sm:flex-row flex-col">
            <AlertDialogCancel className="flex-1 rounded-full border-slate-200 text-slate-600 font-bold h-12 active:scale-95">Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePrescription}
              className="flex-1 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold h-12 shadow-lg shadow-red-500/20 active:scale-95"
            >
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
