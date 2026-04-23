"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Minus, Plus, Trash2, ShoppingCart, HelpCircle, Tag } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCartStore } from "@/lib/store/useCartStore"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSession } from "next-auth/react"
import { Input } from "@/components/ui/input"
import { getOptimizedImageUrl } from "@/lib/utils"

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

export interface CartItem {
  medicineId: number;
  name: string;
  slug: string;
  imageUrl: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  packingUnit?: string;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, updateQuantity, removeItem } = useCartStore()
  const [selectedIds, setSelectedIds] = useState<number[]>(items.map(i => i.medicineId))
  const { data: session, status } = useSession()

  const selectedItems = items.filter(item => selectedIds.includes(item.medicineId))

  const subtotal = selectedItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
  const discountDirect = 0
  const finalTotal = subtotal - discountDirect

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(items.map(i => i.medicineId))
    } else {
      setSelectedIds([])
    }
  }

  const toggleItem = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const removeSelected = () => {
    selectedIds.forEach(id => removeItem(id))
    setSelectedIds([])
  }

  const getUnitOptions = (packingUnit?: string) => {
    const units = ["Hộp", "Vỉ", "Viên", "Chai", "Tuýp"]
    if (!packingUnit) return units
    const current = packingUnit.split(' ')[0]
    return Array.from(new Set([current, ...units]))
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="flex flex-col w-full sm:max-w-xl p-0">
        <SheetHeader className="p-6 border-b">
          <SheetTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
            <ShoppingCart className="h-6 w-6 text-blue-600" />
            Giỏ hàng ({items.length})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="h-10 w-10 text-blue-300" />
              </div>
              <p className="text-slate-500 font-medium mb-6">Giỏ hàng của bạn đang trống</p>
              <Button onClick={onClose} className="rounded-full px-8 bg-blue-600 hover:bg-blue-700">Dạo quanh nhà thuốc</Button>
            </div>
          </div>
        ) : (
          <>
            {/* Header Action Bar */}
            <div className="px-6 py-4 bg-slate-50 border-b flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="select-all"
                  className="h-5 w-5 border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  checked={selectedIds.length === items.length && items.length > 0}
                  onCheckedChange={(checked) => toggleAll(!!checked)}
                />
                <label htmlFor="select-all" className="cursor-pointer font-bold text-slate-700 text-base">
                  Chọn tất cả ({items.length})
                </label>
              </div>

              {selectedIds.length > 0 && (
                <button
                  onClick={removeSelected}
                  className="text-red-500 flex items-center gap-1.5 text-sm font-bold hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                  Xóa mục đã chọn
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto px-6 py-2 scrollbar-thin">
              <div className="divide-y divide-slate-100">
                {items.map((item) => (
                  <div key={item.medicineId} className="py-6 flex items-start gap-4 group">
                    <Checkbox
                      className="mt-6 h-5 w-5 border-slate-300"
                      checked={selectedIds.includes(item.medicineId)}
                      onCheckedChange={() => toggleItem(item.medicineId)}
                    />

                    <div className="relative h-24 w-24 rounded-2xl overflow-hidden border border-slate-100 bg-white shadow-sm shrink-0 flex items-center justify-center p-2 group-hover:border-blue-100 transition-colors">
                      <Image src={getOptimizedImageUrl(item.imageUrl)} alt={item.name} fill unoptimized={item.imageUrl?.includes("cloudinary")} className="object-contain p-1" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[15px] text-slate-800 mb-3 line-clamp-2 leading-[1.4] hover:text-blue-600 transition-colors cursor-pointer">
                        {item.name}
                      </h4>

                      <div className="flex items-center justify-between">
                        <div className="flex flex-col min-w-[100px]">
                          <span className="font-extrabold text-blue-600 text-[17px]">{item.unitPrice?.toLocaleString("vi-VN")}đ</span>
                          <span className="text-[13px] text-slate-400 line-through">{(item.unitPrice * 1.2).toLocaleString("vi-VN")}đ</span>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Quantity Control */}
                          <div className="flex items-center border border-slate-200 rounded-xl h-11 bg-white overflow-hidden shadow-sm">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-full w-10 hover:bg-slate-50 text-slate-400 hover:text-blue-600 rounded-none border-r"
                              onClick={() => updateQuantity(item.medicineId, item.quantity - 1, session?.user?.accessToken)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <div className="w-12 text-center font-black text-slate-700 text-base">{item.quantity}</div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-full w-10 hover:bg-slate-50 text-slate-400 hover:text-blue-600 rounded-none border-l"
                              onClick={() => updateQuantity(item.medicineId, item.quantity + 1, session?.user?.accessToken)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Unit Select */}
                          <Select defaultValue={item.unit.toLowerCase()}>
                            <SelectTrigger className="w-28 h-11 border-slate-200 rounded-xl font-bold text-slate-600 focus:ring-0 shadow-sm bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-100">
                              {getUnitOptions(item.packingUnit).map(u => (
                                <SelectItem key={u} value={u.toLowerCase()} className="font-bold">{u}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-11 w-11 rounded-xl hover:bg-red-50 group/del"
                            onClick={() => removeItem(item.medicineId, session?.user?.accessToken)}
                          >
                            <Trash2 className="h-5 w-5 text-slate-300 group-hover/del:text-red-500 transition-colors" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Summary Panel */}
            <div className="p-6 border-t bg-white space-y-6">
              {/* Promo Code Section */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-blue-600" />
                  Mã giảm giá / Voucher
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nhập mã khuyến mãi"
                    className="h-11 rounded-xl border-slate-200 focus:border-blue-400 focus:ring-blue-100"
                  />
                  <Button variant="outline" className="h-11 rounded-xl border-blue-600 text-blue-600 font-bold hover:bg-blue-50 px-6">
                    Áp dụng
                  </Button>
                </div>
              </div>

              <Separator className="bg-slate-100" />

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-medium">Tổng tiền</span>
                  <span className="font-bold text-slate-900 text-lg">{subtotal.toLocaleString("vi-VN")}đ</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-medium">Giảm giá trực tiếp</span>
                  <span className="font-bold text-orange-500">-{discountDirect.toLocaleString("vi-VN")}đ</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-medium">Giảm giá voucher</span>
                  </div>
                  <span className="font-bold text-orange-500">0đ</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-dashed border-slate-200 mt-2">
                  <span className="text-slate-700 font-bold">Tiết kiệm được</span>
                  <span className="font-bold text-orange-500 text-lg">{discountDirect.toLocaleString("vi-VN")}đ</span>
                </div>
              </div>

              <div className="flex items-center justify-between py-4 bg-blue-50/50 px-4 rounded-2xl border border-blue-100">
                <span className="text-xl font-black text-slate-900">Thành tiền</span>
                <div className="flex flex-col items-end leading-none">
                  <span className="text-2xl font-black text-blue-600 tabular-nums">
                    {finalTotal.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>

              <Button size="lg" className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-xl font-black rounded-full shadow-lg shadow-blue-200 transition-all hover:scale-[1.01] active:scale-[0.98]" asChild>
                <Link href="/thanh-toan" onClick={onClose}>
                  Tiến hành đặt hàng
                </Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
