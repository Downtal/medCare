"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useQueryClient } from "@tanstack/react-query" // Optional if needed
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  Minus, Plus, Trash2, ShoppingCart, HelpCircle, Tag, ArrowLeft, Ticket, X, 
  ChevronRight, Loader2, CheckCircle2, AlertCircle, FileText, CheckCircle,
  User, Clock, Truck, Pill
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCartStore } from "@/lib/store/useCartStore"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Header } from "@/components/header"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getApiBaseUrl, API_ENDPOINTS } from "@/lib/config"
import { cn } from "@/lib/utils"
import { prescriptionService } from "@/services/prescriptionService"
import { PrescriptionResponse } from "@/lib/types"

export default function CartPage() {
  const { data: session } = useSession()
  const token = (session as any)?.user?.accessToken as string | undefined
  const { items, updateQuantity, removeItem } = useCartStore()
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Voucher states
  const [voucherCode, setVoucherCode] = useState("")
  const [appliedProductVoucher, setAppliedProductVoucher] = useState<any>(null)
  const [appliedShippingVoucher, setAppliedShippingVoucher] = useState<any>(null)
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false)
  const [vouchersModalOpen, setVouchersModalOpen] = useState(false)

  // Available vouchers from API
  const [availableVouchers, setAvailableVouchers] = useState<any[]>([])
  const [isLoadingVouchers, setIsLoadingVouchers] = useState(false)

  // Prescription states
  const [approvedPrescriptions, setApprovedPrescriptions] = useState<PrescriptionResponse[]>([])
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionResponse | null>(null)
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false)

  // Initialize selected items once items are loaded (only items in stock)
  useEffect(() => {
    if (items.length > 0 && selectedIds.length === 0) {
      const inStockIds = items
        .filter(i => typeof i.stockQuantity !== 'number' || i.stockQuantity > 0)
        .map(i => i.medicineId);
      setSelectedIds(inStockIds)
    }
  }, [items])

  useEffect(() => {
    const fetchVouchers = async () => {
      if (!token) return
      setIsLoadingVouchers(true)
      try {
        const res = await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.PROMOTION}/vouchers/mine`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const vouchers = await res.json()
          setAvailableVouchers(Array.isArray(vouchers) ? vouchers : [])
        }
      } catch (err) {
        console.error("Failed to fetch vouchers")
      } finally {
        setIsLoadingVouchers(false)
      }
    }

    if (session) {
      fetchVouchers()
    }
  }, [session, token])

  const selectedItems = items.filter(item => selectedIds.includes(item.medicineId))
  const hasRXItems = selectedItems.some(item => (item as any).requiresPrescription)

  useEffect(() => {
    const fetchPrescriptions = async () => {
      if (!token || !hasRXItems) {
        setApprovedPrescriptions([])
        return
      }

      try {
        const res = await fetch(`${getApiBaseUrl()}/user-service/api/users/prescriptions/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          const approved = data.filter((p: PrescriptionResponse) => p.status === 'APPROVED' && !p.isUsed)
          
          // Filter prescriptions that contain ALL selected RX items
          const rxMedicineIds = selectedItems
            .filter(item => (item as any).requiresPrescription)
            .map(item => item.medicineId)

          const validPrescriptions = approved.filter((p: PrescriptionResponse) => {
            if (!p.extractedData) return false
            try {
              const extracted = JSON.parse(p.extractedData)
              const mappedMeds = extracted.mapped_medicines || []
              const medicinceIdsInPrescription = mappedMeds
                .filter((m: any) => m.matched_product?.id)
                .map((m: any) => m.matched_product.id)
              
              // Must contain ALL selected Rx items
              return rxMedicineIds.every(id => medicinceIdsInPrescription.includes(id))
            } catch (e) {
              return false
            }
          })

          setApprovedPrescriptions(validPrescriptions)
          
          // Reset selected prescription if it's no longer valid
          if (selectedPrescription && !validPrescriptions.find(p => p.id === selectedPrescription.id)) {
            setSelectedPrescription(null)
          }
        }
      } catch (err) {
        console.error("Failed to fetch prescriptions")
      }
    }

    fetchPrescriptions()
  }, [token, hasRXItems, selectedIds])

  // Subtotal is based on unitPrice (final price)
  const subtotal = selectedItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)

  // Direct discount is the difference between originalPrice and unitPrice
  const discountDirect = selectedItems.reduce((sum, item) => {
    const orig = item.originalPrice || item.unitPrice
    return sum + ((orig - item.unitPrice) * item.quantity)
  }, 0)

  const baseShipping = selectedItems.length > 0 && subtotal < 300000 ? 30000 : 0
  const productDiscount = appliedProductVoucher?.discountAmount || 0
  const shippingDiscount = appliedShippingVoucher?.discountAmount || 0
  
  const shipping = Math.max(0, baseShipping - shippingDiscount)
  const voucherDiscount = productDiscount + shippingDiscount
  
  const savings = discountDirect + voucherDiscount
  const finalTotal = subtotal + shipping - productDiscount

  const toggleAll = (checked: boolean) => {
    if (checked) {
      // Only select items that are in stock
      const inStockIds = items
        .filter(i => typeof i.stockQuantity !== 'number' || i.stockQuantity > 0)
        .map(i => i.medicineId)
      setSelectedIds(inStockIds)
    } else {
      setSelectedIds([])
    }
  }

  const toggleItem = (id: number) => {
    const item = items.find(i => i.medicineId === id);
    if (item && typeof item.stockQuantity === 'number' && item.stockQuantity <= 0) {
      return; // Can't toggle out of stock items
    }

    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const isCheckoutDisabled = selectedItems.length === 0 || 
    selectedItems.some(item => typeof item.stockQuantity === 'number' && item.stockQuantity <= 0) ||
    (hasRXItems && !selectedPrescription)

  const removeSelected = () => {
    selectedIds.forEach(id => removeItem(id, token))
    setSelectedIds([])
  }

  const getUnitOptions = (packingUnit?: string) => {
    if (!packingUnit) return ["Hộp"]
    // Simple logic: split common separators like 'x', '/', ','
    const parts = packingUnit.split(/[\s,x/]+/).filter(p => !/^\d+$/.test(p)) // Filter out pure numbers
    const commonUnits = ["Hộp", "Vỉ", "Viên", "Chai", "Tuýp", "Gói"]
    const found = commonUnits.filter(u => packingUnit.toLowerCase().includes(u.toLowerCase()))

    return found.length > 0 ? found : [packingUnit.split(' ')[0] || "Hộp"]
  }

  const handleApplyVoucher = async (codeOverride?: string) => {
    const code = codeOverride || voucherCode
    if (!code.trim() || selectedItems.length === 0) {
      if (selectedItems.length === 0) toast.error("Vui lòng chọn sản phẩm trước khi áp dụng mã")
      return
    }

    setIsApplyingVoucher(true)
    try {
      const payloadItems = selectedItems.map(item => ({
        productId: item.medicineId,
        price: item.unitPrice,
        quantity: item.quantity,
        isPrescription: !!(item as any).requiresPrescription
      }))

      const res = await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.PROMOTION}/vouchers/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: code,
          userId: (session?.user as any)?.userId || 0,
          items: payloadItems,
          shippingFee: subtotal >= 300000 || selectedItems.length === 0 ? 0 : 30000
        })
      })

      const data = await res.json()
      if (data.success || res.ok) {
        // Handle both standard success pattern and our generic response format
        const voucherData = data.data || data;
        const discountType = voucherData.discountType || (availableVouchers.find(v => v.code === code)?.discountType)

        if (discountType === 'FREESHIP') {
          setAppliedShippingVoucher({ ...voucherData, code: code, discountAmount: voucherData.discountAmount || data.discountAmount })
          toast.success(`Đã áp dụng mã vận chuyển ${code}!`)
        } else {
          setAppliedProductVoucher({ ...voucherData, code: code, discountAmount: voucherData.discountAmount || data.discountAmount })
          toast.success(`Đã áp dụng mã giảm giá ${code}!`)
        }
        
        setVouchersModalOpen(false)
        setVoucherCode("")
      } else {
        toast.error(data.message || "Không thể áp dụng mã giảm giá")
      }
    } catch (error) {
      toast.error("Lỗi kết nối tới dịch vụ khuyến mãi")
    } finally {
      setIsApplyingVoucher(false)
    }
  }

  const handleRemoveProductVoucher = () => {
    setAppliedProductVoucher(null)
  }

  const handleRemoveShippingVoucher = () => {
    setAppliedShippingVoucher(null)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-10 max-w-7xl">
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/"><ArrowLeft className="h-6 w-6" /></Link>
          </Button>
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-black text-slate-800">Giỏ hàng</h1>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-3xl p-20 shadow-xl border border-slate-100 text-center max-w-2xl mx-auto mt-10">
            <div className="w-32 h-32 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="h-16 w-16 text-blue-200" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-3">Giỏ hàng đang trống!</h2>
            <p className="text-slate-500 mb-10 text-lg">Hàng ngàn sản phẩm chăm sóc sức khỏe đang chờ bạn khám phá.</p>
            <Button size="lg" className="rounded-full px-12 h-14 bg-blue-600 hover:bg-blue-700 text-lg font-bold shadow-lg shadow-blue-100" asChild>
              <Link href="/">Tiếp tục mua sắm</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Left Column: Items List */}
            <div className="lg:col-span-8 space-y-6">
              {/* Toolbar */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Checkbox
                    id="select-all"
                    className="h-6 w-6 border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-lg"
                    checked={
                      items.length > 0 &&
                      items.filter(i => typeof i.stockQuantity !== 'number' || i.stockQuantity > 0).length > 0 &&
                      selectedIds.length === items.filter(i => typeof i.stockQuantity !== 'number' || i.stockQuantity > 0).length
                    }
                    onCheckedChange={(checked) => toggleAll(!!checked)}
                  />
                  <label htmlFor="select-all" className="cursor-pointer font-bold text-slate-700 text-lg">
                    Chọn tất cả ({items.filter(i => typeof i.stockQuantity !== 'number' || i.stockQuantity > 0).length})
                  </label>
                </div>

                {selectedIds.length > 0 && (
                  <Button
                    variant="ghost"
                    onClick={removeSelected}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 font-bold px-4 rounded-xl"
                  >
                    <Trash2 className="h-5 w-5 mr-2" />
                    Xóa các mục đã chọn
                  </Button>
                )}
              </div>

              {/* Items List */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-100">
                {items.map((item) => {
                  const itemOptions = getUnitOptions(item.packingUnit)
                  const hasDiscount = item.originalPrice && item.originalPrice > item.unitPrice

                  return (
                    <div key={item.medicineId} className="p-8 flex items-start gap-6 group hover:bg-slate-50/50 transition-colors">
                      <Checkbox
                        className="mt-8 h-6 w-6 border-slate-300 rounded-lg"
                        checked={selectedIds.includes(item.medicineId)}
                        disabled={typeof item.stockQuantity === 'number' && item.stockQuantity <= 0}
                        onCheckedChange={() => toggleItem(item.medicineId)}
                      />

                      <Link
                        href={`/san-pham/${item.slug}`}
                        className="relative h-32 w-32 rounded-3xl overflow-hidden border border-slate-100 bg-white shadow-sm shrink-0 flex items-center justify-center p-4"
                      >
                        <Image src={item.imageUrl || "/placeholder.svg"} alt={item.name} fill className="object-contain p-2" />
                      </Link>

                      <div className="flex-1 min-w-0">
                        <Link href={`/san-pham/${item.slug}`}>
                          <h4 className="font-bold text-xl text-slate-800 mb-2 line-clamp-2 leading-tight hover:text-blue-600 transition-colors">
                            {item.name}
                          </h4>
                        </Link>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {item.requiresPrescription && (
                            <div className="flex items-center gap-1 bg-rose-50 text-rose-600 border border-rose-100 px-2.5 py-1 rounded-full text-xs font-black">
                              <Pill className="w-3 h-3" />
                              Thuốc kê đơn
                            </div>
                          )}
                          {typeof item.stockQuantity === 'number' && item.stockQuantity <= 0 && (
                            <div className="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-xs font-black">
                              SẢN PHẨM HIỆN ĐANG HẾT HÀNG
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-6">
                          <div className="flex flex-col">
                            <span className="font-black text-blue-600 text-2xl">{item.unitPrice?.toLocaleString("vi-VN")}đ</span>
                            {hasDiscount && (
                              <span className="text-sm text-slate-400 font-bold line-through">
                                {item.originalPrice?.toLocaleString("vi-VN")}đ
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4">
                            {/* Unit Selection */}
                            <div className="flex flex-col gap-1.5 transition-opacity duration-300">
                              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Đơn vị</span>
                              <Select defaultValue={item.unit.toLowerCase()} disabled={itemOptions.length <= 1}>
                                <SelectTrigger className="w-32 h-12 border-slate-200 rounded-2xl font-bold text-slate-700 focus:ring-blue-100 shadow-none bg-slate-50/50 border-none disabled:opacity-50">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                                  {itemOptions.map(u => (
                                    <SelectItem key={u} value={u.toLowerCase()} className="font-bold">{u}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Quantity Selection */}
                            <div className="flex flex-col gap-1.5">
                              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1 text-center">Số lượng</span>
                              <div className="flex items-center border border-slate-100 bg-slate-50/50 rounded-2xl h-12 overflow-hidden px-1">
                                <Button
                                  variant="ghost"
                                  className="h-10 w-10 hover:bg-white text-slate-400 hover:text-blue-600 rounded-xl"
                                  onClick={() => updateQuantity(item.medicineId, Math.max(1, item.quantity - 1), token)}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <div className="w-12 text-center font-black text-slate-800 text-lg tabular-nums">{item.quantity}</div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-10 w-10 hover:bg-white text-slate-400 hover:text-blue-600 rounded-xl"
                                  onClick={() => updateQuantity(item.medicineId, item.quantity + 1, token)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-12 w-12 rounded-2xl hover:bg-red-50 text-slate-300 hover:text-red-500 mt-5 shadow-sm bg-white border border-slate-50 transition-all border-none"
                              onClick={() => removeItem(item.medicineId, token)}
                            >
                              <Trash2 className="h-6 w-6" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Prescription Reminder Box */}
              {hasRXItems && (
                <div className={cn(
                  "p-8 rounded-[2rem] border-2 transition-all flex flex-col md:flex-row items-center gap-6",
                  selectedPrescription 
                    ? "bg-emerald-50 border-emerald-100 shadow-sm" 
                    : "bg-amber-50 border-amber-100 shadow-md animate-pulse"
                )}>
                   <div className={cn(
                     "h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                     selectedPrescription ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                   )}>
                      {selectedPrescription ? <CheckCircle className="w-8 h-8" /> : <FileText className="w-8 h-8" />}
                   </div>
                   <div className="flex-1 text-center md:text-left">
                      <h4 className={cn("text-xl font-black mb-1", selectedPrescription ? "text-emerald-800" : "text-amber-800")}>
                        {selectedPrescription ? "Đơn thuốc đã sẵn sàng" : "Yêu cầu Đơn thuốc (RX)"}
                      </h4>
                      <p className={cn("text-sm font-medium", selectedPrescription ? "text-emerald-600" : "text-amber-700")}>
                        {selectedPrescription 
                          ? `Đã chọn đơn của Bác sĩ ${selectedPrescription.doctorName || "---"} - ${selectedPrescription.hospitalName || "Bệnh viện"}`
                          : "Giỏ hàng của bạn có thuốc kê đơn. Vui lòng chọn một đơn thuốc đã được dược sĩ MedCare phê duyệt để tiếp tục."
                        }
                      </p>
                   </div>
                   <Button 
                      onClick={() => setIsPrescriptionModalOpen(true)}
                      className={cn(
                        "rounded-2xl h-14 px-8 font-black shadow-lg transition-all",
                        selectedPrescription 
                          ? "bg-white text-emerald-600 hover:bg-white/90 border border-emerald-200" 
                          : "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-100"
                      )}
                   >
                      {selectedPrescription ? "Thay đổi đơn thuốc" : "Chọn đơn thuốc đã duyệt"}
                   </Button>
                </div>
              )}
            </div>

            {/* Right Column: Checkout Summary */}
            <div className="lg:col-span-4 space-y-6 sticky top-24">
              {/* Voucher Section */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                <div className="flex items-center gap-3 text-blue-600">
                  <Tag className="h-6 w-6" />
                  <span className="font-black text-lg">Mã giảm giá MedCare</span>
                </div>

                <div className="space-y-3">
                  {appliedProductVoucher && (
                    <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center justify-between animate-in zoom-in-95 duration-300">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                          <Tag size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800">{appliedProductVoucher.code}</p>
                          <p className="text-xs text-green-600 font-bold">Giảm sản phẩm: -{appliedProductVoucher.discountAmount?.toLocaleString("vi-VN")}đ</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 hover:text-red-500 rounded-full" onClick={handleRemoveProductVoucher}>
                        <X size={16} />
                      </Button>
                    </div>
                  )}

                  {appliedShippingVoucher && (
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between animate-in zoom-in-95 duration-300">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                          <Truck size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800">{appliedShippingVoucher.code}</p>
                          <p className="text-xs text-blue-600 font-bold">Miễn phí vận chuyển</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 hover:text-red-500 rounded-full" onClick={handleRemoveShippingVoucher}>
                        <X size={16} />
                      </Button>
                    </div>
                  )}

                  {(!appliedProductVoucher || !appliedShippingVoucher) && (
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <Input
                            placeholder="Nhập mã khuyến mãi..."
                            value={voucherCode}
                            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                            className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:border-blue-400 focus:ring-blue-100 focus:bg-white text-lg font-medium transition-all"
                          />
                        </div>
                        <Button
                          className="h-14 rounded-2xl px-6 bg-blue-600 hover:bg-blue-700 font-bold transition-all shadow-md shadow-blue-50"
                          onClick={() => handleApplyVoucher()}
                          disabled={!voucherCode || isApplyingVoucher || selectedItems.length === 0}
                        >
                          {isApplyingVoucher ? <Loader2 className="h-5 w-5 animate-spin" /> : "Áp dụng"}
                        </Button>
                      </div>
                      <button
                        className="w-full py-3 text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 rounded-2xl flex items-center justify-center gap-2 transition-all hover:bg-blue-100"
                        onClick={() => setVouchersModalOpen(true)}
                      >
                        <Ticket size={16} />
                        Mã giảm giá của tôi
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Details */}
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 space-y-8">
                <h3 className="text-xl font-black text-slate-800">Tóm tắt đơn hàng</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-slate-500 font-bold">
                    <span>Tạm tính ({selectedItems.length} món)</span>
                    <span className="text-slate-900 text-lg">{subtotal.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div className="flex items-center justify-between font-bold">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <span>Giảm giá trực tiếp</span>

                    </div>
                    <span className="text-emerald-600">-{discountDirect.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div className="flex items-center justify-between font-bold">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <span>Giảm giá Voucher</span>
                    </div>
                    <span className="text-emerald-600">-{productDiscount.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 font-bold">
                    <span>Phí vận chuyển</span>
                    <div className="text-right flex flex-col items-end">
                      <span className={cn(
                        "font-black text-xs px-2 py-1 rounded-full uppercase tracking-tighter",
                        shipping === 0 ? "text-success bg-green-50" : "text-slate-800"
                      )}>
                        {shipping === 0 ? "Miễn phí" : `${shipping.toLocaleString("vi-VN")}đ`}
                      </span>
                      {shippingDiscount > 0 && (
                        <span className="text-[10px] text-blue-600 font-bold mt-1 italic">
                          (Giảm phí ship: -{shippingDiscount.toLocaleString("vi-VN")}đ)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Separator className="bg-slate-100" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-slate-900">Tổng cộng</span>
                    <div className="flex flex-col items-end">
                      <span className="text-3xl font-black text-blue-600 tabular-nums">
                        {finalTotal.toLocaleString("vi-VN")}đ
                      </span>
                      <span className="text-sm text-slate-400 font-bold">Đã bao gồm VAT</span>
                    </div>
                  </div>

                  {savings > 0 && (
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center gap-3">
                      <div className="h-10 w-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0">
                        <Tag className="h-5 w-5" />
                      </div>
                      <p className="text-emerald-700 text-sm font-bold leading-tight">
                        Bạn đã tiết kiệm được {savings.toLocaleString("vi-VN")}đ từ đơn hàng này!
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  size="lg"
                  className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-xl font-black rounded-full shadow-2xl shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98] mt-4 disabled:opacity-50 disabled:bg-slate-300 disabled:shadow-none"
                  disabled={isCheckoutDisabled}
                  asChild={!isCheckoutDisabled}
                >
                  {isCheckoutDisabled ? (
                    <span>Không thể thanh toán</span>
                  ) : (
                    <Link href={`/thanh-toan?ids=${selectedIds.join(",")}${selectedPrescription ? `&prescriptionId=${selectedPrescription.id}` : ''}`}>
                      Tiến hành thanh toán
                    </Link>
                  )}
                </Button>

                <p className="text-center text-slate-400 text-sm font-medium">
                  Bằng cách nhấn thanh toán, bạn đồng ý với <Link href="/dieu-khoan" className="text-blue-500 hover:underline">Điều khoản MedCare</Link>
                </p>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Vouchers Selection Modal */}
      <Dialog open={vouchersModalOpen} onOpenChange={setVouchersModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl p-0 overflow-hidden border-none shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] bg-slate-50">
          <DialogHeader className="sr-only">
            <DialogTitle>Danh sách Voucher của bạn</DialogTitle>
          </DialogHeader>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-white/10 blur-xl"></div>

            <h2 className="text-3xl font-black mb-2 tracking-tight flex items-center gap-3 relative z-10">
              <Ticket className="h-8 w-8 text-blue-200" />
              Mã giảm giá
            </h2>
            <p className="text-blue-100 text-[15px] font-medium relative z-10">Khám phá ưu đãi dành riêng cho bạn</p>
          </div>

          <div className="p-6 space-y-4 max-h-[55vh] overflow-y-auto custom-scrollbar">
            {isLoadingVouchers ? (
              <div className="flex flex-col items-center py-16 gap-4">
                <div className="h-14 w-14 bg-blue-100 rounded-full flex items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
                </div>
                <p className="text-sm text-slate-500 font-bold">Đang tìm kiếm ưu đãi tốt nhất...</p>
              </div>
            ) : availableVouchers.length > 0 ? (
              availableVouchers.map((v) => {
                const minOrder = v.minOrderValue || 0;
                const isDisabled = selectedItems.length === 0 || subtotal < minOrder;
                return (
                  <div
                    key={v.code}
                    className={cn(
                      "relative bg-white rounded-2xl border-2 overflow-hidden flex transition-all duration-300",
                      isDisabled
                        ? "opacity-60 grayscale cursor-not-allowed border-slate-100"
                        : "hover:border-blue-400 group cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] border-transparent shadow-sm"
                    )}
                    onClick={() => !isDisabled && handleApplyVoucher(v.code)}
                  >
                    {/* Left border accent */}
                    <div className={cn("w-3 shrink-0", isDisabled ? "bg-slate-200" : "bg-gradient-to-b from-blue-400 to-blue-600")} />

                    <div className="flex flex-1 items-center gap-4 p-5">
                      <div className={cn(
                        "h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300",
                        isDisabled 
                          ? "bg-slate-50 text-slate-300" 
                          : v.discountType === 'FREESHIP'
                            ? "bg-blue-50 text-blue-600 group-hover:scale-110"
                            : "bg-emerald-50 text-emerald-600 group-hover:scale-110"
                      )}>
                        {v.discountType === 'FREESHIP' ? <Truck size={32} strokeWidth={1.5} /> : <Ticket size={32} strokeWidth={1.5} />}
                      </div>
 
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 mb-1">
                             <p className="font-black text-slate-800 text-xl tracking-tight truncate">{v.code}</p>
                             <span className={cn(
                               "text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider",
                               isDisabled 
                                ? "bg-slate-100 text-slate-400" 
                                : v.discountType === 'FREESHIP'
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-emerald-100 text-emerald-700"
                             )}>
                               {v.discountType === 'FREESHIP' ? 'Vận chuyển' : 'Sản phẩm'}
                             </span>
                          </div>
                          <p className="text-[13px] font-bold text-slate-500 mb-2 truncate">{v.description || v.title}</p>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md",
                              isDisabled ? "bg-slate-100 text-slate-400" : "bg-slate-50 text-slate-600"
                            )}>
                              Đơn tối thiểu {minOrder.toLocaleString("vi-VN")}đ
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {!isDisabled && (
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 h-8 w-8 bg-blue-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                        <ChevronRight className="h-5 w-5 text-blue-600" />
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="text-center py-20 flex flex-col items-center">
                <div className="h-24 w-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-sm">
                  <Ticket className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-lg font-black text-slate-700 mb-2">Chưa có mã giảm giá nào</h3>
                <p className="text-slate-500 font-medium text-sm max-w-[250px]">Hiện tại bạn chưa lưu mã giảm giá nào hoặc các mã đều đã hết hạn sử dụng.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Prescription Selection Modal */}
      <Dialog open={isPrescriptionModalOpen} onOpenChange={setIsPrescriptionModalOpen}>
        <DialogContent className="sm:max-w-2xl rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
          <DialogHeader className="sr-only">
            <DialogTitle>Chọn đơn thuốc đã duyệt</DialogTitle>
          </DialogHeader>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-10 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 rounded-full bg-white/10 blur-3xl"></div>
             <h2 className="text-3xl font-black mb-2 tracking-tight flex items-center gap-3 relative z-10 uppercase">
                <FileText className="h-8 w-8 text-blue-200" />
                Đơn thuốc của bạn
             </h2>
             <p className="text-blue-100 text-sm font-medium relative z-10">Chọn đơn thuốc RX để hoàn tất mua hàng</p>
          </div>

          <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar-slim">
            {approvedPrescriptions.length === 0 ? (
               <div className="py-20 flex flex-col items-center text-center gap-6">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                     <AlertCircle className="w-10 h-10 text-slate-300" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">Chưa có đơn thuốc nào được duyệt</h3>
                    <p className="text-slate-500 font-medium text-sm max-w-[350px] mx-auto">Bạn cần gửi ảnh đơn thuốc và đợi Dược sĩ MedCare phê duyệt trước khi mua các sản phẩm này.</p>
                  </div>
                  <Button className="rounded-full px-10 h-14 font-bold bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100" asChild>
                     <Link href="/tai-khoan/don-thuoc">Tới trang Đơn thuốc</Link>
                  </Button>
               </div>
            ) : (
               <div className="grid grid-cols-1 gap-4">
                  {approvedPrescriptions.map((p) => (
                    <div 
                      key={p.id}
                      onClick={() => { setSelectedPrescription(p); setIsPrescriptionModalOpen(false); }}
                      className={cn(
                        "p-6 rounded-[2rem] border-2 cursor-pointer transition-all flex items-center gap-6 group",
                        selectedPrescription?.id === p.id 
                          ? "bg-blue-50 border-blue-600 shadow-blue-50" 
                          : "bg-white border-slate-100 hover:border-blue-200 hover:bg-slate-50/50"
                      )}
                    >
                       <div className="relative h-16 w-16 rounded-2xl overflow-hidden shadow-md group-hover:scale-105 transition-transform">
                          <Image src={p.imageUrl} alt="Don thuốc" fill className="object-cover" />
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-800 text-lg truncate mb-1">
                             {p.hospitalName || "Bệnh viện / Phòng khám"}
                          </p>
                          <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                             <span className="flex items-center gap-1"><User className="w-3 h-3" /> BS. {p.doctorName || "---"}</span>
                             <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Hạn: {p.expiryDate || "Chưa rõ"}</span>
                          </div>
                       </div>
                       {selectedPrescription?.id === p.id && (
                         <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg">
                            <CheckCircle size={18} />
                         </div>
                       )}
                    </div>
                  ))}
               </div>
            )}
          </div>
          
          <div className="p-8 bg-slate-50 border-t border-slate-100 text-center">
             <p className="text-xs text-slate-400 font-medium italic">Chỉ hiển thị các đơn thuốc còn hạn sử dụng và đã được Dược sĩ duyệt</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
