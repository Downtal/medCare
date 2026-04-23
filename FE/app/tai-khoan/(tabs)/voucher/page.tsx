"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Ticket,
  Search,
  Gift,
  Loader2,
  Clock,
  Info,
  X,
  Calendar,
  CircleCheck,
  AlertCircle,
  TrendingUp,
  UserCheck,
  ShoppingBag,
  Pill
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { getApiBaseUrl } from "@/lib/config"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { Progress } from "@/components/ui/progress"
import type { Voucher } from "@/services/voucherService"

export default function VouchersPage() {
  const { data: session } = useSession()
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  useEffect(() => {
    if (session?.user?.accessToken) {
      fetchVouchers()
    }
  }, [session])

  const fetchVouchers = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${getApiBaseUrl()}/promotion-service/api/vouchers/user/${session?.user?.userId}`, {
        headers: { Authorization: `Bearer ${session?.user?.accessToken}` }
      })
      if (res.ok) {
        const data = await res.json()
        setVouchers(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Fetch vouchers error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleShowDetail = (v: Voucher) => {
    setSelectedVoucher(v)
    setIsDetailOpen(true)
  }

  const getDaysRemaining = (endAt?: string) => {
    if (!endAt) return null;
    const d = new Date(endAt);
    if (isNaN(d.getTime())) return null;
    return Math.max(0, Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl shadow-sm border border-slate-100">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
        <p className="text-slate-500 font-bold">Đang tìm ưu đãi cho bạn...</p>
      </div>
    )
  }

  return (
    <Card className="animate-in fade-in slide-in-from-right-4 duration-500 border-none shadow-sm rounded-3xl overflow-hidden bg-white">
      <CardHeader className="bg-slate-50 border-b border-slate-100 px-8 py-6 flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Voucher của tôi</CardTitle>
        <Button variant="link" className="text-blue-600 font-bold" asChild>
          <Link href="/khuyen-mai">Tìm thêm ưu đãi</Link>
        </Button>
      </CardHeader>
      <CardContent className="p-8">
        {vouchers.length > 0 ? (
          <div className="grid md:grid-cols-1 xl:grid-cols-2 gap-6">
            {vouchers.map((v) => (
              <div
                key={v.id}
                onClick={() => handleShowDetail(v)}
                className="flex h-36 bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group cursor-pointer"
              >
                <div className="w-32 bg-gradient-to-br from-blue-600 to-indigo-700 flex flex-col items-center justify-center text-white relative shrink-0">
                  <div className="absolute top-0 bottom-0 -left-1 flex flex-col justify-around py-2">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-3 w-3 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors" />
                    ))}
                  </div>
                  <Ticket className="h-8 w-8 mb-2 opacity-80" />
                  <p className="text-xs font-black uppercase tracking-tighter opacity-70">MEDCARE</p>
                </div>

                <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h4 className="font-black text-slate-800 text-base leading-tight line-clamp-1">{v.title || v.description || "Giảm giá MedCare"}</h4>
                      <p className="text-[13px] font-bold text-blue-600 mt-1">Mã: #{v.code}</p>
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 rounded-full font-bold whitespace-nowrap">
                      HSD: {(() => {
                        const d = v.endAt ? new Date(v.endAt) : null;
                        return (!d || isNaN(d.getTime())) ? "Vô thời hạn" : format(d, "dd/MM");
                      })()}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                      <Clock className="h-3 w-3 mr-1" />
                      {(() => {
                        const days = getDaysRemaining(v.endAt);
                        return days === null ? "Sử dụng ngay" : `Còn ${days} ngày`;
                      })()}
                    </div>
                    <Button
                      size="sm"
                      className="rounded-full bg-blue-600 hover:bg-blue-700 font-bold px-5 h-9 shadow-lg shadow-blue-500/10 transition-transform active:scale-95"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      asChild
                    >
                      <Link href="/san-pham">Dùng ngay</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-slate-50/50 rounded-[40px] border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm mx-auto mb-6">
              <Gift className="h-10 w-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Bạn chưa có Voucher nào</h3>
            <p className="text-slate-400 font-medium italic mb-8">Hãy mua sắm để nhận thêm nhiều ưu đãi từ MedCare.</p>
            <Button className="rounded-full bg-blue-600 hover:bg-blue-700 font-black px-8 h-12 shadow-lg shadow-blue-500/20" asChild>
              <Link href="/san-pham">Mua sắm ngay</Link>
            </Button>
          </div>
        )}

        <div className="mt-10 bg-blue-50/50 p-6 rounded-3xl border border-blue-100/50 flex items-start gap-4">
          <Info className="h-5 w-5 text-blue-600 shrink-0 mt-1" />
          <div>
            <p className="text-sm font-black text-slate-800 mb-1">Cách sử dụng Voucher</p>
            <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
              Nhập mã Voucher tại bước thanh toán để được hưởng ưu đãi. Mỗi đơn hàng chỉ áp dụng tối đa 01 Voucher.
              Voucher không có giá trị quy đổi thành tiền mặt.
            </p>
          </div>
        </div>
      </CardContent>

      {/* Voucher Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem]">
          {selectedVoucher && (
            <>
              <DialogHeader className="p-6 pb-4 bg-slate-50 border-b border-slate-100 relative">
                <div className="flex items-center gap-4 mb-2">
                  <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Ticket className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">{selectedVoucher.code}</DialogTitle>
                    <p className="text-[13px] font-bold text-blue-600">{selectedVoucher.title || selectedVoucher.description}</p>
                  </div>
                </div>
                <div className="absolute top-6 right-6">
                  <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 rounded-lg px-2.5 py-1 font-black text-[9px] uppercase tracking-widest flex items-center gap-1 shadow-none">
                    <CircleCheck className="h-2.5 w-2.5" />
                    Hoạt động
                  </Badge>
                </div>
              </DialogHeader>

              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar-slim">
                {/* Value Section */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/20">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Giá trị</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-blue-600">
                        {selectedVoucher.discountType === 'PERCENT'
                          ? `${selectedVoucher.discountValue}%`
                          : `${selectedVoucher.discountValue.toLocaleString("vi-VN")}đ`
                        }
                      </span>
                    </div>
                    {selectedVoucher.maxDiscount && (
                      <p className="text-[10px] text-slate-500 font-bold mt-1 italic">
                        Tối đa {selectedVoucher.maxDiscount.toLocaleString("vi-VN")}đ
                      </p>
                    )}
                  </div>

                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Thời hạn</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500 font-medium">Bắt đầu:</span>
                        <span className="font-bold text-slate-800">
                          {selectedVoucher.startAt ? format(new Date(selectedVoucher.startAt), "dd/MM/yyyy") : "---"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500 font-medium">Kết thúc:</span>
                        <span className="font-bold text-rose-500">
                          {selectedVoucher.endAt ? format(new Date(selectedVoucher.endAt), "dd/MM/yyyy") : "Vô hạn"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conditions Section */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    ĐIỀU KIỆN SỬ DỤNG
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                      <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                        <ShoppingBag className="h-4 w-4 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Đơn tối thiểu</p>
                        <p className="text-[13px] font-bold text-slate-800">{selectedVoucher.minOrderValue?.toLocaleString("vi-VN") || 0}đ</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                      <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                        <UserCheck className="h-4 w-4 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Lượt dùng / Khách</p>
                        <p className="text-[13px] font-bold text-slate-800">{selectedVoucher.limitPerUser || 1} lần</p>
                      </div>
                    </div>
                    {selectedVoucher.excludePrescriptionDrugs && (
                      <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm md:col-span-2">
                        <div className="h-8 w-8 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                          <Pill className="h-4 w-4 text-rose-400" />
                        </div>
                        <div className="flex-1 flex justify-between items-center">
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Loại trừ</p>
                            <p className="text-[13px] font-bold text-slate-800">Thuốc kê đơn</p>
                          </div>
                          <Badge className="bg-rose-50 text-rose-500 border-none shadow-none text-[9px] font-black uppercase px-2 py-0.5">Hạn chế</Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Section */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    TIẾN ĐỘ SỬ DỤNG
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-500">Đã dùng</span>
                      <span className="text-slate-800">{selectedVoucher.usedCount || 0} / {selectedVoucher.usageLimit}</span>
                    </div>
                    <Progress value={((selectedVoucher.usedCount || 0) / selectedVoucher.usageLimit) * 100} className="h-2 bg-slate-100" />
                  </div>
                </div>
              </div>

              <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 flex items-center gap-4 sm:justify-between">
                <Button
                  variant="ghost"
                  className="rounded-xl h-10 px-6 font-bold text-slate-500 hover:bg-white transition-all border border-transparent hover:border-slate-200"
                  onClick={() => setIsDetailOpen(false)}
                >
                  ĐÓNG CỬA SỔ
                </Button>
                <Button className="flex-1 rounded-xl h-12 bg-blue-600 hover:bg-blue-700 font-black text-white shadow-xl shadow-blue-100 transition-all active:scale-95" asChild>
                  <Link href="/san-pham">DÙNG NGAY</Link>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .custom-scrollbar-slim::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar-slim::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar-slim::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar-slim::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </Card>
  )
}
