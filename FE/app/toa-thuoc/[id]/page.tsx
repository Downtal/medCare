"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { prescriptionService } from "@/services/prescriptionService"
import { productService } from "@/services/productService"
import { PrescriptionResponse } from "@/lib/types"
import { useCartStore } from "@/lib/store/useCartStore"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"
import {
  FileCheck, ShoppingCart, ArrowLeft, Loader2, AlertCircle,
  User, Hospital, Calendar, CheckCircle2, Pill, ChevronRight,
  ShieldCheck, Package
} from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function UsePrescriptionPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const token = (session as any)?.user?.accessToken as string | undefined
  const { items, addItem } = useCartStore()

  const prescriptionId = Number(params.id)

  const [prescription, setPrescription] = useState<PrescriptionResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // RX items in cart
  const rxItems = items.filter((item: any) => item.requiresPrescription)
  const allItems = items

  // Extracted medicines from prescription
  const [extractedMedicines, setExtractedMedicines] = useState<any[]>([])
  const [isSyncingProducts, setIsSyncingProducts] = useState(false)

  useEffect(() => {
    const syncProducts = async () => {
      if (!prescription?.extractedData) return;

      try {
        setIsSyncingProducts(true);
        const parsed = JSON.parse(prescription.extractedData);
        const medicines = parsed.mapped_medicines || [];

        // Fetch full product details for each matched product in parallel
        const syncedMedicines = await Promise.all(medicines.map(async (med: any) => {
          if (med.matched_product?.id) {
            try {
              const fullProduct = await productService.getProductById(med.matched_product.id);
              return {
                ...med,
                matched_product: {
                  ...med.matched_product,
                  ...fullProduct, // Merge with real data from database
                  price: fullProduct.price || fullProduct.unitPrice || 0,
                  primaryImageUrl: fullProduct.primaryImageUrl || (fullProduct.images?.find((img: any) => img.isPrimary)?.imageUrl) || fullProduct.imageUrl
                }
              };
            } catch (err) {
              console.error(`Failed to sync product ${med.matched_product.id}:`, err);
              return med;
            }
          }
          return med;
        }));

        setExtractedMedicines(syncedMedicines);
      } catch (e) {
        console.error("Failed to parse or sync extracted data:", e);
      } finally {
        setIsSyncingProducts(false);
      }
    };

    syncProducts();
  }, [prescription])

  const handleAddToCart = (product: any) => {
    if (!product) return

    addItem({
      medicineId: product.id,
      name: product.name,
      slug: product.slug || "",
      imageUrl: product.primaryImageUrl || product.imageUrl || "",
      unitPrice: product.price || product.unitPrice || 0,
      originalPrice: product.price || product.unitPrice || 0,
      quantity: 1,
      unit: "Hộp",
      requiresPrescription: true
    }, token)

    toast.success(`Đã thêm ${product.name} vào giỏ hàng`)
  }

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const data = await prescriptionService.getPrescriptionById(prescriptionId)
        if (!data) throw new Error("Không tìm thấy đơn thuốc")
        setPrescription(data)
      } catch (e) {
        setError("Không thể tải đơn thuốc. Vui lòng thử lại.")
      } finally {
        setLoading(false)
      }
    }
    if (prescriptionId) load()
  }, [prescriptionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
        </div>
      </div>
    )
  }

  if (error || !prescription) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-black text-slate-800">{error || "Đơn thuốc không tồn tại"}</h2>
          <Button asChild className="rounded-full px-8 h-12 font-bold bg-blue-600 hover:bg-blue-700">
            <Link href="/tai-khoan/don-thuoc">Quay lại đơn thuốc</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (prescription.status !== "APPROVED") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-amber-400" />
          </div>
          <h2 className="text-2xl font-black text-slate-800">Đơn thuốc chưa được duyệt</h2>
          <p className="text-slate-500 font-medium max-w-sm">
            Đơn thuốc này chưa được Dược sĩ phê duyệt. Vui lòng đợi thẩm định trước khi mua hàng.
          </p>
          <Button asChild className="rounded-full px-8 h-12 font-bold bg-blue-600 hover:bg-blue-700">
            <Link href="/tai-khoan/don-thuoc">Quay lại đơn thuốc</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Build checkout URL — use ALL items + prescriptionId
  const checkoutIds = allItems.length > 0
    ? allItems.map((i: any) => i.medicineId).join(",")
    : ""

  const checkoutUrl = checkoutIds
    ? `/thanh-toan?ids=${checkoutIds}&prescriptionId=${prescriptionId}`
    : `/thanh-toan?prescriptionId=${prescriptionId}`

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-10 max-w-5xl">
        {/* Back button */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/tai-khoan/don-thuoc"><ArrowLeft className="h-6 w-6" /></Link>
          </Button>
          <div className="flex items-center gap-3">
            <FileCheck className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-black text-slate-800">Chi tiết đơn thuốc</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Left — Prescription Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold text-blue-200 uppercase tracking-widest">Đơn thuốc #{prescription.id}</span>
                  <Badge className="bg-emerald-400/20 text-white border-0 font-bold px-3 py-1">
                    <ShieldCheck className="w-3 h-3 mr-1" /> Đã duyệt
                  </Badge>
                </div>
                <p className="text-blue-100 text-xs font-medium">
                  {prescription.createdAt ? format(new Date(prescription.createdAt), "EEEE, dd MMMM yyyy", { locale: vi }) : ""}
                </p>
              </div>

              {/* Prescription Image */}
              {prescription.imageUrl && (
                <div
                  className="relative h-48 w-full border-b border-slate-100 cursor-pointer group"
                  onClick={() => window.open(prescription.imageUrl, "_blank")}
                >
                  <Image src={prescription.imageUrl} alt="Đơn thuốc" fill className="object-contain p-4 group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100">
                    <span className="text-xs font-bold text-slate-600 bg-white/90 rounded-full px-3 py-1">Bấm để xem ảnh</span>
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="p-6 space-y-4">
                <InfoRow icon={<User className="h-4 w-4 text-slate-400" />} label="Bác sĩ" value={prescription.doctorName || "Chưa cập nhật"} />
                <InfoRow icon={<Hospital className="h-4 w-4 text-slate-400" />} label="Bệnh viện" value={prescription.hospitalName || "Chưa cập nhật"} />
                {prescription.expiryDate && (
                  <InfoRow
                    icon={<Calendar className="h-4 w-4 text-slate-400" />}
                    label="Hạn sử dụng"
                    value={format(new Date(prescription.expiryDate), "dd/MM/yyyy")}
                  />
                )}
                {prescription.pharmacistNote && (
                  <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100">
                    <p className="text-xs font-bold text-blue-700">Ghi chú Dược sĩ: {prescription.pharmacistNote}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notice */}
            <div className="bg-emerald-50 rounded-3xl border border-emerald-100 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                <p className="text-sm text-emerald-700 font-medium">
                  Đơn thuốc này đã được Dược sĩ MedCare phê duyệt. Bạn có thể tiến hành mua các sản phẩm thuốc kê đơn trong giỏ hàng.
                </p>
              </div>
            </div>
          </div>

          {/* Right — Extracted Medicines List */}
          <div className="lg:col-span-3 space-y-6">

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Pill className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-black text-slate-800">Danh sách thuốc trong đơn</h2>
                </div>
              </div>

              {isSyncingProducts ? (
                <div className="p-20 text-center">
                  <Loader2 className="h-10 w-10 text-blue-600 animate-spin mx-auto mb-4" />
                  <p className="text-sm text-slate-400 font-bold">Đang cập nhật giá và kho hàng...</p>
                </div>
              ) : extractedMedicines.length === 0 ? (
                <div className="p-12 text-center">
                  <Package className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                  <h3 className="font-black text-slate-600 mb-1">Chưa có dữ liệu bóc tách</h3>
                  <p className="text-sm text-slate-400 font-medium">Dược sĩ đang bóc tách thuốc từ đơn của bạn</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {extractedMedicines.map((med: any, idx: number) => {
                    const product = med.matched_product;
                    const displayPrice = product?.price || product?.unitPrice || 0;
                    const displayImage = product?.primaryImageUrl || product?.imageUrl || "/placeholder.svg";

                    return (
                      <div key={idx} className="p-6 hover:bg-slate-50/50 transition-all group">
                        {product ? (
                          /* Item WITH matched product in shop */
                          <div className="space-y-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <Link href={`/san-pham/${product.slug}`} className="block group/title">
                                  <h4 className="font-black text-slate-900 text-lg leading-tight group-hover/title:text-blue-600 transition-colors">
                                    {product.name}
                                  </h4>
                                </Link>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                  <Badge className="bg-rose-50 text-rose-600 border-rose-100 font-black text-[10px] px-2 py-0.5">
                                    <Pill className="w-2.5 h-2.5 mr-1" /> Thuốc kê đơn
                                  </Badge>
                                  <Badge className="bg-blue-50 text-blue-600 border-0 font-bold text-[10px] px-2">
                                    Số lượng: {med.quantity || "1"}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 group-hover:border-blue-100 group-hover:bg-white transition-all shadow-sm">
                              <Link
                                href={`/san-pham/${product.slug}`}
                                className="relative h-20 w-20 rounded-xl overflow-hidden border border-white shadow-sm bg-white shrink-0 flex items-center justify-center p-2"
                              >
                                <Image src={displayImage} alt={product.name} fill className="object-contain p-1 group-hover:scale-110 transition-transform" />
                              </Link>

                              <div className="flex-1 min-w-0">
                                <p className="font-black text-blue-600 text-xl tracking-tight">
                                  {displayPrice > 0 ? `${displayPrice.toLocaleString("vi-VN")}đ` : "Liên hệ"}
                                </p>
                              </div>

                              <Button
                                size="lg"
                                className={cn(
                                  "rounded-2xl font-bold h-12 px-6 transition-all shadow-lg",
                                  med.purchased
                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none"
                                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-95"
                                )}
                                onClick={() => !med.purchased && handleAddToCart(product)}
                                disabled={med.purchased}
                              >
                                {med.purchased ? (
                                  <>
                                    <CheckCircle2 className="h-5 w-5 mr-2 text-slate-500" />
                                    Đã mua
                                  </>
                                ) : (
                                  <>
                                    <ShoppingCart className="h-5 w-5 mr-2" />
                                    Thêm vào giỏ
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          /* Item WITHOUT matched product */
                          <div className="py-2">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-black text-slate-800 text-base">{med.original_name}</h4>
                              <Badge variant="outline" className="border-slate-200 text-slate-400 font-bold text-[10px]">Chưa có sản phẩm</Badge>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200 text-center">
                              <p className="text-xs font-bold text-slate-400">Sản phẩm này hiện chưa có sẵn trực tuyến. Vui lòng liên hệ Dược sĩ để được hỗ trợ.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>


          </div>
        </div>
      </main>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-slate-700 truncate">{value}</p>
      </div>
    </div>
  )
}
