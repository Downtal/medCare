"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, CreditCard, Truck, FileText, AlertCircle, Ticket, X, CheckCircle2, Loader2, Info, ChevronRight, ChevronLeft, Plus, ShoppingCart, Tag, Wallet, Pencil, Trash2, ShieldCheck, ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCartStore, CartItem } from "@/lib/store/useCartStore"
import { getApiBaseUrl, API_ENDPOINTS } from "@/lib/config"
import { cn } from "@/lib/utils"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [step, setStep] = useState(2)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // IDs of items selected for checkout
  const selectedIds = searchParams.get("ids")?.split(",").map(id => parseInt(id)).filter(id => !isNaN(id)) || []
  const selectedPrescriptionId = searchParams.get("prescriptionId")

  // Address selection state
  const [addressModalOpen, setAddressModalOpen] = useState(false)

  // Voucher states
  const [voucherCode, setVoucherCode] = useState("")
  const [appliedProductVoucher, setAppliedProductVoucher] = useState<any>(null)
  const [appliedShippingVoucher, setAppliedShippingVoucher] = useState<any>(null)
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false)
  const [vouchersModalOpen, setVouchersModalOpen] = useState(false)
  const [availableVouchers, setAvailableVouchers] = useState<any[]>([])
  const [isLoadingVouchers, setIsLoadingVouchers] = useState(false)

  // Available addresses from API
  const [savedAddresses, setSavedAddresses] = useState<any[]>([])
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false)

  // Address GHN Location states
  const [provinces, setProvinces] = useState<any[]>([])
  const [districts, setDistricts] = useState<any[]>([])
  const [wards, setWards] = useState<any[]>([])

  // Address CRUD states
  const [addressView, setAddressView] = useState<'list' | 'form'>('list')
  const [addressForm, setAddressForm] = useState({
    receiverName: "",
    receiverPhone: "",
    fullAddress: "",
    city: "",
    district: "",
    ward: "",
    cityId: undefined as number | undefined,
    districtId: undefined as number | undefined,
    wardCode: "",
    isDefault: false
  })
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null)
  const [isAddressSubmitting, setIsAddressSubmitting] = useState(false)
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({})

  // Prescription states
  const [prescriptionImageUrl, setPrescriptionImageUrl] = useState("")
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null)
  const [isLoadingPrescription, setIsLoadingPrescription] = useState(false)

  const [form, setForm] = useState({
    name: "",
    phone: "",
    province: "",
    district: "",
    ward: "",
    address: "",
    note: "",
    paymentMethod: "COD",
    cityId: undefined as number | undefined,
    districtId: undefined as number | undefined,
    wardCode: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [safetyResult, setSafetyResult] = useState<{ riskLevel: "NONE" | "LOW" | "HIGH", message: string, requiresConfirmation: boolean } | null>(null)
  const [safetyConfirmed, setSafetyConfirmed] = useState(false)
  const [isCheckingSafety, setIsCheckingSafety] = useState(false)

  const { items: allCartItems, clearCart } = useCartStore()

  // FILTERED items based on selected IDs
  const cartItems = allCartItems.filter(item => selectedIds.length === 0 || selectedIds.includes(item.medicineId))
  const subtotal = cartItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)

  useEffect(() => {
    // Redirect unauthenticated guests to login page
    if (status === "unauthenticated") {
      toast.error("Vui lòng đăng nhập để tiến hành thanh toán");
      const idsParam = selectedIds.length > 0 ? `?ids=${selectedIds.join(",")}` : "";
      const prescriptionParam = selectedPrescriptionId ? `&prescriptionId=${selectedPrescriptionId}` : "";
      router.push(`/dang-nhap?callbackUrl=/thanh-toan${idsParam}${prescriptionParam}`);
    }
  }, [status, router, selectedIds, selectedPrescriptionId])

  useEffect(() => {
    // If no items are selected or in cart, redirect back
    if (status === "authenticated" && allCartItems.length > 0 && cartItems.length === 0 && selectedIds.length > 0) {
      toast.error("Vui lòng chọn sản phẩm để thanh toán")
      router.push("/gio-hang")
    }
  }, [status, allCartItems, cartItems, selectedIds, router])

  // Fetch data from APIs
  useEffect(() => {
    const fetchData = async () => {
      const token = session?.user?.accessToken
      if (!token) return

      // Fetch Addresses
      setIsLoadingAddresses(true)
      try {
        const res = await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.USER}/users/profiles/me/addresses`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const fetchedAddresses = await res.json()
          setSavedAddresses(fetchedAddresses)

          // Auto-fill form with default address if available
          const defaultAddr = fetchedAddresses.find((a: any) => a.isDefault) || fetchedAddresses[0]
          if (defaultAddr) {
            setForm(prev => ({
              ...prev,
              name: defaultAddr.receiverName || "",
              phone: defaultAddr.receiverPhone || "",
              province: defaultAddr.city || "",
              district: defaultAddr.district || "",
              ward: defaultAddr.ward || "",
              address: defaultAddr.fullAddress || "",
              cityId: defaultAddr.cityId || undefined,
              districtId: defaultAddr.districtId || undefined,
              wardCode: defaultAddr.wardCode || ""
            }))
          }
        }
      } catch (err) {
        console.error("Failed to fetch addresses")
      } finally {
        setIsLoadingAddresses(false)
      }

      // Fetch Vouchers
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

    if (status === "authenticated") {
      fetchData()
    }
  }, [session, status])

  // Fetch selected prescription details
  useEffect(() => {
    const fetchPrescription = async () => {
      if (!selectedPrescriptionId || !session?.user?.accessToken) return
      setIsLoadingPrescription(true)
      try {
        const res = await fetch(`${getApiBaseUrl()}/user-service/api/users/prescriptions/${selectedPrescriptionId}`, {
          headers: { 'Authorization': `Bearer ${session.user.accessToken}` }
        })
        if (res.ok) {
          setSelectedPrescription(await res.json())
        }
      } catch (err) {
        console.error("Failed to fetch prescription details")
      } finally {
        setIsLoadingPrescription(false)
      }
    }

    fetchPrescription()
  }, [selectedPrescriptionId, session])


  const fetchProvinces = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.SHIPPING}/shipping/provinces`)
      if (res.ok) {
        const data = await res.json()
        setProvinces(data.data || [])
      }
    } catch (err) { console.error("Failed to fetch provinces") }
  }

  const fetchDistricts = async (provinceId: number) => {
    try {
      const res = await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.SHIPPING}/shipping/districts?provinceId=${provinceId}`)
      if (res.ok) {
        const data = await res.json()
        setDistricts(data.data || [])
      }
    } catch (err) { console.error("Failed to fetch districts") }
  }

  const fetchWards = async (districtId: number) => {
    try {
      const res = await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.SHIPPING}/shipping/wards?districtId=${districtId}`)
      if (res.ok) {
        const data = await res.json()
        setWards(data.data || [])
      }
    } catch (err) { console.error("Failed to fetch wards") }
  }

  useEffect(() => {
    if (addressView === 'form') {
      fetchProvinces()
    }
  }, [addressView])

  useEffect(() => {
    if (addressForm.cityId) {
      fetchDistricts(addressForm.cityId)
      setWards([])
    }
  }, [addressForm.cityId])

  useEffect(() => {
    if (addressForm.districtId) {
      fetchWards(addressForm.districtId)
    }
  }, [addressForm.districtId])

  const fetchAddresses = async () => {
    const token = session?.user?.accessToken
    if (!token) return
    setIsLoadingAddresses(true)
    try {
      const res = await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.USER}/users/profiles/me/addresses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setSavedAddresses(await res.json())
      }
    } catch (err) {
      console.error("Failed to fetch addresses")
    } finally {
      setIsLoadingAddresses(false)
    }
  }

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = session?.user?.accessToken
    if (!token) return

    // Simple validation
    const err: Record<string, string> = {}
    if (!addressForm.receiverName) err.receiverName = "Vui lòng nhập tên"
    if (!addressForm.receiverPhone) {
      err.receiverPhone = "Vui lòng nhập số điện thoại"
    } else if (!/^(0|84)[3|5|7|8|9][0-9]{8}$/.test(addressForm.receiverPhone)) {
      err.receiverPhone = "Số điện thoại không hợp lệ (10 số)"
    }
    if (!addressForm.city) err.city = "Vui lòng nhập tỉnh/thành phố"
    if (!addressForm.district) err.district = "Vui lòng nhập quận/huyện"
    if (!addressForm.fullAddress) err.fullAddress = "Vui lòng nhập địa chỉ cụ thể"

    if (Object.keys(err).length > 0) {
      setAddressErrors(err)
      // Also show a toast for the first error found
      const firstError = Object.values(err)[0]
      toast.error(firstError)
      return
    }

    setIsAddressSubmitting(true)
    try {
      const url = editingAddressId
        ? `${getApiBaseUrl()}/user-service/api/users/addresses/${editingAddressId}`
        : `${getApiBaseUrl()}/user-service/api/users/profiles/me/addresses`

      const res = await fetch(url, {
        method: editingAddressId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(addressForm)
      })

      if (res.ok) {
        toast.success(editingAddressId ? "Đã cập nhật địa chỉ" : "Đã thêm địa chỉ mới")
        await fetchAddresses()
        setAddressView('list')
      } else {
        const errorData = await res.json().catch(() => ({}))
        toast.error(errorData.message || "Không thể lưu địa chỉ")
      }
    } catch (err) {
      toast.error("Lỗi kết nối server")
    } finally {
      setIsAddressSubmitting(false)
    }
  }

  const handleDeleteAddress = async (id: number) => {
    const addressToDelete = savedAddresses.find(a => a.id === id)

    if (addressToDelete?.isDefault) {
      toast.error("Không thể xóa địa chỉ mặc định", {
        description: "Vui lòng chọn địa chỉ khác làm mặc định trước khi xóa."
      })
      return
    }

    const token = session?.user?.accessToken
    if (!token) return

    toast.warning("Xác nhận xóa địa chỉ?", {
      description: `Bạn có chắc muốn xóa địa chỉ tại ${addressToDelete?.city}?`,
      action: {
        label: "Xóa",
        onClick: async () => {
          try {
            const res = await fetch(`${getApiBaseUrl()}/user-service/api/users/addresses/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
              toast.success("Đã xóa địa chỉ thành công")
              await fetchAddresses()
            }
          } catch (err) {
            toast.error("Lỗi khi xóa địa chỉ")
          }
        }
      }
    })
  }

  const selectAddress = (addr: any) => {
    setForm(prev => ({
      ...prev,
      name: addr.receiverName,
      phone: addr.receiverPhone,
      province: addr.city,
      district: addr.district,
      ward: addr.ward,
      address: addr.fullAddress,
      cityId: addr.cityId || undefined,
      districtId: addr.districtId || undefined,
      wardCode: addr.wardCode || ""
    }))
    setAddressModalOpen(false)
  }

  const validateStep2 = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = "Họ và tên không được để trống"
    if (!form.phone.trim()) e.phone = "Số điện thoại không được để trống"
    else if (!/^(0|84)[3|5|7|8|9][0-9]{8}$/.test(form.phone)) e.phone = "Số điện thoại không hợp lệ"
    if (!form.province.trim()) e.province = "Vui lòng nhập Tỉnh/Thành phố"
    if (!form.district.trim()) e.district = "Vui lòng nhập Quận/Huyện"
    if (!form.ward.trim()) e.ward = "Vui lòng nhập Phường/Xã"
    if (!form.address.trim()) e.address = "Vui lòng nhập địa chỉ cụ thể"

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNextStep2 = () => {
    if (validateStep2()) {
      setStep(3)
    }
  }

  const updateForm = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }))
  }

  const handleApplyVoucher = async (codeOverride?: string) => {
    const code = codeOverride || voucherCode
    if (!code.trim()) return

    setIsApplyingVoucher(true)
    try {
      const res = await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.PROMOTION}/vouchers/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code,
          userId: (session?.user as any)?.userId || (session?.user as any)?.id || 0,
          items: cartItems.map(item => ({
            productId: item.medicineId,
            price: item.unitPrice,
            quantity: item.quantity,
            isPrescription: !!(item as any).requiresPrescription
          })),
          shippingFee: 30000
        })
      })

      const data = await res.json()
      if (data.success) {
        if (data.discountType === 'FREESHIP') {
          setAppliedShippingVoucher({ ...data, code: code })
          toast.success(`Đã áp dụng mã vận chuyển ${code}!`)
        } else {
          setAppliedProductVoucher({ ...data, code: code })
          toast.success(`Đã áp dụng mã giảm giá ${code}!`)
        }

        setVoucherCode("")
        setVouchersModalOpen(false)
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

  const handlePlaceOrder = async () => {
    if (!form.name || !form.phone || !form.address) {
      toast.error("Vui lòng thêm hoặc chọn địa chỉ nhận hàng để tiếp tục!")
      return
    }

    if (!/^(0|84)[3|5|7|8|9][0-9]{8}$/.test(form.phone)) {
      toast.error("Số điện thoại nhận hàng không hợp lệ!")
      return
    }

    if (!form.paymentMethod) {
      toast.error("Vui lòng chọn phương thức thanh toán!")
      return
    }

    if (hasPrescriptionItems && !prescriptionImageUrl && !selectedPrescriptionId) {
      toast.error("Vui lòng tải lên ảnh đơn thuốc!");
      return;
    }

    setIsSubmitting(true)
    try {
      const orderRequest = {
        recipientName: form.name,
        recipientPhone: form.phone,
        street: form.address,
        ward: form.ward || " ",     // fallback space to avoid @NotBlank fail on old addresses without ward
        district: form.district,
        province: form.province,
        cityId: form.cityId || null,
        districtId: form.districtId || null,
        wardCode: form.wardCode || null,
        paymentMethod: form.paymentMethod,
        voucherCode: appliedProductVoucher?.code || null,
        discountAmount: appliedProductVoucher?.discountAmount || 0,
        shippingVoucherCode: appliedShippingVoucher?.code || null,
        shippingDiscountAmount: appliedShippingVoucher?.discountAmount || 0,
        prescriptionImageUrl: prescriptionImageUrl || selectedPrescription?.imageUrl || null,
        note: form.note,
        prescriptionId: selectedPrescriptionId ? parseInt(selectedPrescriptionId) : null,
        // Send only selected items
        items: cartItems.map(item => ({
          medicineId: item.medicineId,
          quantity: item.quantity,
          unit: item.unit
        }))
      }

      const res = await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.ORDER}/orders/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.user?.accessToken}`
        },
        body: JSON.stringify(orderRequest)
      })

      if (res.ok) {
        const order = await res.json()
        // Remove only selected items from store
        selectedIds.forEach(id => (useCartStore.getState() as any).removeItem(id, session?.user?.accessToken))

        toast.success("Đặt hàng thành công!", {
          description: `Đơn hàng #${order.orderCode} đã được tiếp nhận.`
        })

        // Handle VNPay Redirect
        if (form.paymentMethod === 'VNPAY') {
          try {
            const payRes = await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.PAYMENT}/payment/create`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.user?.accessToken}`
              },
              body: JSON.stringify({
                orderId: order.id,
                orderCode: order.orderCode,
                amount: total,
                description: `Thanh toan don hang ${order.orderCode}`
              })
            })

            if (payRes.ok) {
              const payData = await payRes.json()
              if (payData.paymentUrl) {
                window.location.href = payData.paymentUrl
                return
              } else {
                toast.error("Không tìm thấy URL thanh toán VNPay")
              }
            } else {
              const errText = await payRes.text()
              console.error("VNPay initialization failed:", payRes.status, errText)
              toast.error("Khởi tạo thanh toán VNPay thất bại. Bạn có thể thanh toán lại sau.")
            }
          } catch (err) {
            console.error("VNPay network error:", err)
            toast.error("Lỗi kết nối khi khởi tạo thanh toán VNPay.")
          }
        }

        router.push(`/xac-nhan-don-hang?code=${order.orderCode}`)
      } else {
        const errorData = await res.json()
        toast.error(errorData.message || "Đặt hàng thất bại. Vui lòng thử lại.")
      }
    } catch (error) {
      toast.error("Lỗi kết nối tới hệ thống đặt hàng")
    } finally {
      setIsSubmitting(false)
    }
  }

  const baseShipping = subtotal >= 300000 || cartItems.length === 0 ? 0 : 30000
  const shippingDiscount = appliedShippingVoucher?.discountAmount || 0
  const shipping = Math.max(0, baseShipping - shippingDiscount)
  const productDiscount = appliedProductVoucher?.discountAmount || 0
  const total = subtotal + shipping - productDiscount

  const hasPrescriptionItems = cartItems.some((item: any) => item.requiresPrescription)

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9FC]">
      <Header />

      <main className="flex-1 pb-8 bg-[#F0F2F5]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-4 text-blue-600 hover:text-blue-700 cursor-pointer" onClick={() => router.push("/gio-hang")}>
            <ChevronLeft size={16} />
            <span className="text-[14px] font-medium">Quay lại giỏ hàng</span>
          </div>

          <div className="grid lg:grid-cols-3 gap-4 items-start">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-4">
              {/* 1. Product List */}
              <div className="space-y-4">
                <h3 className="text-[17px] font-bold text-slate-800">Danh sách sản phẩm</h3>
                <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white">
                  <CardContent className="p-0 divide-y divide-slate-100">
                    {cartItems.map((item) => (
                      <div key={item.medicineId} className="p-4 flex gap-4">
                        <div className="h-14 w-14 relative bg-white border border-slate-100 rounded-lg overflow-hidden shrink-0">
                          <Image src={item.imageUrl || "/placeholder.svg"} alt={item.name} fill className="object-contain p-1" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between gap-4 mb-0.5">
                            <h4 className="text-[13px] font-bold text-slate-800 line-clamp-2 leading-snug">{item.name}</h4>
                            <span className="text-[13px] font-bold text-slate-800">{(item.unitPrice * item.quantity).toLocaleString("vi-VN")}đ</span>
                          </div>
                          <div className="flex justify-between items-end">
                            <span className="text-[12px] text-slate-500 font-medium">x{item.quantity} {item.unit}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Prescription Summary Box */}
                {selectedPrescription && (
                  <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-5">
                    <div className="h-14 w-14 relative rounded-xl overflow-hidden shadow-md border-2 border-white shrink-0">
                      <Image src={selectedPrescription.imageUrl} alt="Don" fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[14px] font-black text-emerald-800 uppercase tracking-tight">ĐƠN THUỐC ĐÃ ĐƯỢC DUYỆT</h4>
                      <p className="text-[13px] text-emerald-700 font-bold">
                        BS. {selectedPrescription.doctorName || "---"} - {selectedPrescription.hospitalName || "Hệ thống y tế"}
                      </p>
                      <p className="text-[11px] text-emerald-600 mt-0.5 italic">Hạn sử dụng: {selectedPrescription.expiryDate || "---"}</p>
                    </div>
                    <div className="h-10 w-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                      <ShieldCheck size={20} />
                    </div>
                  </div>
                )}

              </div>

              {/* 2. Delivery Address Selection */}
              <div className="space-y-1">
                <h3 className="text-[17px] font-bold text-slate-800">Địa chỉ nhận hàng</h3>
                <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white">
                  <CardContent className="p-0">
                    <div className="relative p-5 rounded-xl bg-white flex items-center justify-between group cursor-pointer overflow-hidden border border-slate-100" onClick={() => setAddressModalOpen(true)}>
                      {/* Map background effect mockup */}
                      <div className="absolute inset-0 opacity-[0.05] pointer-events-none grayscale translate-x-20">
                        <MapPin className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64" />
                      </div>

                      {form.name ? (
                        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 flex-1 w-full">
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                              <MapPin size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[15px] font-bold text-slate-800 leading-tight">{form.name} | {form.phone}</h4>
                              <p className="text-[13px] text-slate-500 mt-0.5 break-words">{form.address}, {form.ward}, {form.district}, {form.province}</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="rounded-full border-blue-600 text-blue-600 font-bold px-6 hover:bg-blue-50 transition-colors self-start sm:self-auto ml-14 sm:ml-0 shrink-0">Sửa địa chỉ</Button>
                        </div>
                      ) : (
                        <div className="relative flex items-center justify-between w-full pr-2">
                          <div className="flex flex-col gap-1 z-10">
                            <div className="mb-0.5">
                              <MapPin size={24} className="text-blue-600" />
                            </div>
                            <div className="text-left">
                              <h4 className="text-[17px] font-bold text-slate-800 leading-tight">Chưa có địa chỉ nhận hàng</h4>
                              <p className="text-[15px] text-slate-600 mt-1">Vui lòng thêm địa chỉ để hoàn tất đơn hàng.</p>
                            </div>
                          </div>
                          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full px-8 h-12 shadow-lg shadow-blue-100 relative z-10">Thêm địa chỉ</Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 3. Payment Methods */}
              <div className="space-y-4">
                <h3 className="text-[17px] font-bold text-slate-800">Chọn phương thức thanh toán</h3>
                <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white">
                  <CardContent className="p-0">
                    <RadioGroup defaultValue={form.paymentMethod} onValueChange={(val) => updateForm("paymentMethod", val)} className="divide-y divide-slate-100">
                      {[
                        { id: "COD", label: "Thanh toán tiền mặt khi nhận hàng", icon: Truck },
                        { id: "VNPAY", label: "Thanh toán bằng cổng thanh toán VNPAY", icon: Wallet },
                      ].map((method) => (
                        <div key={method.id} className="p-5 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => updateForm("paymentMethod", method.id)}>
                          <RadioGroupItem value={method.id} id={method.id} className="h-5 w-5 border-2 text-blue-600" />
                          <div className="h-8 w-8 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center">
                            <method.icon className="h-4 w-4 text-slate-400" />
                          </div>
                          <Label htmlFor={method.id} className="text-[15px] font-medium text-slate-700 cursor-pointer">{method.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:pt-[41px] space-y-4">
              <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white">
                <CardContent className="p-4 space-y-4">
                  {/* Voucher Area */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-blue-600" />
                      <span className="text-[14px] font-bold text-slate-800">Mã giảm giá MedCare</span>
                    </div>

                    <div className="space-y-2">
                      {appliedProductVoucher && (
                        <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-center justify-between animate-in zoom-in-95 duration-300">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                              <Tag size={16} />
                            </div>
                            <div>
                              <p className="text-[13px] font-bold text-slate-800">{appliedProductVoucher.code}</p>
                              <p className="text-[10px] text-green-600 font-bold">Giảm sản phẩm: -{appliedProductVoucher.discountAmount?.toLocaleString("vi-VN")}đ</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-50 hover:text-red-500 rounded-full" onClick={handleRemoveProductVoucher}>
                            <X size={12} />
                          </Button>
                        </div>
                      )}

                      {appliedShippingVoucher && (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center justify-between animate-in zoom-in-95 duration-300">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                              <Truck size={16} />
                            </div>
                            <div>
                              <p className="text-[13px] font-bold text-slate-800">{appliedShippingVoucher.code}</p>
                              <p className="text-[10px] text-blue-600 font-bold">Miễn phí vận chuyển</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-50 hover:text-red-500 rounded-full" onClick={handleRemoveShippingVoucher}>
                            <X size={12} />
                          </Button>
                        </div>
                      )}

                      {(!appliedProductVoucher || !appliedShippingVoucher) && (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Input
                                placeholder="Nhập mã ưu đãi..."
                                value={voucherCode}
                                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                                className="h-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all text-sm"
                              />
                            </div>
                            <Button
                              className="h-10 rounded-xl px-4 bg-blue-600 hover:bg-blue-700 font-bold text-sm"
                              onClick={() => handleApplyVoucher()}
                              disabled={!voucherCode || isApplyingVoucher || cartItems.length === 0}
                            >
                              {isApplyingVoucher ? <Loader2 className="h-4 w-4 animate-spin" /> : "Áp dụng"}
                            </Button>
                          </div>
                          <button
                            className="w-full h-10 text-[12px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50/50 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-blue-100"
                            onClick={() => setVouchersModalOpen(true)}
                          >
                            <Ticket size={14} />
                            Mã giảm giá của tôi
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-1 space-y-2">
                    <div className="flex justify-between text-[13px]">
                      <span className="text-slate-500">Tổng tiền</span>
                      <span className="text-slate-800 font-bold">{subtotal.toLocaleString("vi-VN")}đ</span>
                    </div>
                    {productDiscount > 0 && (
                      <div className="flex justify-between text-[13px]">
                        <span className="text-slate-500">Giảm giá sản phẩm</span>
                        <span className="text-orange-500 font-bold">-{productDiscount.toLocaleString("vi-VN")}đ</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[13px]">
                      <span className="text-slate-500">Phí vận chuyển</span>
                      <div className="text-right">
                        {shipping === 0 ? (
                          <span className="font-black text-blue-600 text-xs block">MIỄN PHÍ</span>
                        ) : (
                          <div className="flex flex-col items-end">
                            {shippingDiscount > 0 && (
                              <span className="text-[10px] text-slate-400 line-through leading-none mb-0.5">
                                {(shipping + shippingDiscount).toLocaleString("vi-VN")}đ
                              </span>
                            )}
                            <span className="font-bold text-slate-800 text-xs block">
                              {shipping.toLocaleString("vi-VN")}đ
                            </span>
                          </div>
                        )}
                        {shippingDiscount > 0 && (
                          <span className="text-[10px] text-blue-600 font-bold italic block mt-0.5">
                            (Đã giảm -{shippingDiscount.toLocaleString("vi-VN")}đ)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-slate-50" />

                  <div className="flex justify-between items-center py-1">
                    <span className="text-[15px] font-bold text-slate-800">Thành tiền</span>
                    <span className="text-[18px] font-bold text-blue-600">{total.toLocaleString("vi-VN")}đ</span>
                  </div>



                  <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                    Bằng việc tiến hành đặt hàng, bạn đồng ý với <Link href="#" className="text-blue-600 underline">Điều khoản dịch vụ</Link> của Nhà thuốc MedCare
                  </p>
                </CardContent>
              </Card>


            </div>
          </div>
        </div>
      </main>

      {/* Common Bottom Bar for both Web/Mobile when scrolled down */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-6 py-4 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-6">
          <div className="hidden sm:block">
            <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Tổng thanh toán</p>
            <p className="text-3xl font-black text-blue-600 tracking-tighter leading-none">{total.toLocaleString("vi-VN")}đ</p>
          </div>
          <div className="flex-1 sm:flex-none flex gap-4">
            <Button
              variant="outline"
              className="h-14 px-10 rounded-[1.25rem] font-black text-slate-500 border-2 hidden md:flex hover:bg-slate-50"
              onClick={() => router.push("/gio-hang")}
            >
              Hủy bỏ
            </Button>
            <Button
              className="flex-1 sm:w-72 h-16 rounded-[1.25rem] bg-blue-600 hover:bg-blue-700 text-white text-xl font-black shadow-xl shadow-blue-200 transition-all active:scale-95 opacity-100 disabled:opacity-50"
              disabled={
                isSubmitting ||
                !form.name ||
                cartItems.length === 0 ||
                (safetyResult?.requiresConfirmation && !safetyConfirmed)
              }
              onClick={handlePlaceOrder}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-3 ">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Đang xử lý...</span>
                </div>
              ) : "XÁC NHẬN ĐẶT HÀNG"}
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar (Only for Mobile) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-4 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tổng thanh toán</p>
            <p className="text-2xl font-black text-blue-600 tracking-tighter">{total.toLocaleString("vi-VN")}đ</p>
          </div>
          <Button
            className="flex-1 h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-lg font-black shadow-lg shadow-blue-200 transition-all active:scale-95 opacity-100 disabled:opacity-50"
            disabled={
              isSubmitting ||
              !form.name ||
              cartItems.length === 0 ||
              (safetyResult?.requiresConfirmation && !safetyConfirmed)
            }
            onClick={handlePlaceOrder}
          >
            {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : "Đặt hàng"}
          </Button>
        </div>
      </div>

      {/* Address Selection Modal */}
      <Dialog open={addressModalOpen} onOpenChange={(open) => {
        setAddressModalOpen(open)
        if (!open) {
          setAddressView('list')
          setEditingAddressId(null)
          setAddressErrors({})
        }
      }}>
        <DialogContent className="sm:max-w-lg rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="bg-blue-600 px-6 py-6 text-white">
            <DialogTitle className="text-xl font-black flex items-center gap-3">
              {addressView === 'form' && (
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 rounded-full shrink-0" onClick={() => setAddressView('list')}>
                  <ArrowLeft size={18} />
                </Button>
              )}
              <span>
                {addressView === 'list' ? "Địa chỉ đã lưu" : (editingAddressId ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới")}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="p-6">
            {addressView === 'list' ? (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                {isLoadingAddresses ? (
                  <div className="flex flex-col items-center py-20 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-sm text-slate-400 font-medium">Đang tải địa chỉ...</p>
                  </div>
                ) : savedAddresses.length > 0 ? (
                  savedAddresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="p-4 rounded-2xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50/30 cursor-pointer transition-all group relative"
                      onClick={() => selectAddress(addr)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn("rounded-lg font-bold h-5 text-[10px]", addr.isDefault ? "bg-blue-600 text-white border-none" : "bg-white")}>
                            {addr.isDefault ? "Mặc định" : "Khác"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-600 hover:bg-blue-100 rounded-full" onClick={(e) => {
                            e.stopPropagation();
                            setAddressForm({
                              receiverName: addr.receiverName,
                              receiverPhone: addr.receiverPhone,
                              city: addr.city,
                              district: addr.district,
                              fullAddress: addr.fullAddress,
                              cityId: addr.cityId,
                              districtId: addr.districtId,
                              wardCode: addr.wardCode,
                              isDefault: addr.isDefault
                            });
                            setEditingAddressId(addr.id);
                            setAddressView('form');
                          }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:bg-red-50 rounded-full" onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAddress(addr.id);
                          }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <h4 className="font-black text-slate-800 text-[14px]">{addr.receiverName}</h4>
                      <p className="text-[12px] text-slate-500 font-medium mb-0.5">{addr.receiverPhone}</p>
                      <p className="text-[12px] text-slate-600 leading-relaxed truncate">{addr.fullAddress}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <MapPin className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 italic text-sm">Bạn chưa lưu địa chỉ nào</p>
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full h-14 rounded-2xl border-dashed border-2 bg-slate-50 hover:bg-white hover:border-blue-500 hover:text-blue-600 font-bold transition-all"
                  onClick={() => {
                    setAddressForm({
                      receiverName: "",
                      receiverPhone: "",
                      city: "",
                      district: "",
                      fullAddress: "",
                      cityId: undefined,
                      districtId: undefined,
                      wardCode: "",
                      isDefault: false
                    });
                    setEditingAddressId(null);
                    setAddressView('form');
                  }}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Thêm địa chỉ mới
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSaveAddress} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-bold text-slate-700">Tên người nhận</Label>
                    <Input
                      placeholder="Nguyễn Văn A"
                      value={addressForm.receiverName}
                      onChange={e => setAddressForm({ ...addressForm, receiverName: e.target.value })}
                      className={cn("h-11 rounded-xl bg-slate-50 border-slate-200", addressErrors.receiverName && "border-red-500")}
                    />
                    {addressErrors.receiverName && <p className="text-[11px] text-red-500 font-bold ml-1">{addressErrors.receiverName}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-bold text-slate-700">Số điện thoại</Label>
                    <Input
                      placeholder="09xxx"
                      value={addressForm.receiverPhone}
                      onChange={e => setAddressForm({ ...addressForm, receiverPhone: e.target.value })}
                      className={cn("h-11 rounded-xl bg-slate-50 border-slate-200", addressErrors.receiverPhone && "border-red-500")}
                    />
                    {addressErrors.receiverPhone && <p className="text-[11px] text-red-500 font-bold ml-1">{addressErrors.receiverPhone}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-bold text-slate-700">Tỉnh/Thành phố</Label>
                    <select
                      className={cn("w-full h-11 rounded-xl bg-slate-50 border border-slate-200 px-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all", addressErrors.city && "border-red-500")}
                      value={addressForm.cityId || ""}
                      onChange={e => {
                        const id = parseInt(e.target.value);
                        const item = provinces.find(p => p.ProvinceID === id);
                        setAddressForm({ ...addressForm, cityId: id, city: item?.ProvinceName || "", districtId: undefined, district: "", wardCode: "" })
                      }}
                    >
                      <option value="">Chọn Tỉnh/Thành</option>
                      {provinces.map(p => <option key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-bold text-slate-700">Quận/Huyện</Label>
                    <select
                      className={cn("w-full h-11 rounded-xl bg-slate-50 border border-slate-200 px-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all", addressErrors.district && "border-red-500")}
                      value={addressForm.districtId || ""}
                      onChange={e => {
                        const id = parseInt(e.target.value);
                        const item = districts.find(d => d.DistrictID === id);
                        setAddressForm({ ...addressForm, districtId: id, district: item?.DistrictName || "", wardCode: "" })
                      }}
                      disabled={!addressForm.cityId}
                    >
                      <option value="">Chọn Quận/Huyện</option>
                      {districts.map(d => <option key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-bold text-slate-700">Phường/Xã (Mã GHN)</Label>
                    <select
                      className={cn("w-full h-11 rounded-xl bg-slate-50 border border-slate-200 px-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all", addressErrors.wardCode && "border-red-500")}
                      value={addressForm.wardCode || ""}
                      onChange={e => {
                        const code = e.target.value;
                        const item = wards.find(w => w.WardCode === code);
                        setAddressForm({ ...addressForm, wardCode: code, ward: item?.WardName || "" })
                      }}
                      disabled={!addressForm.districtId}
                    >
                      <option value="">Chọn Phường/Xã</option>
                      {wards.map(w => <option key={w.WardCode} value={w.WardCode}>{w.WardName}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5 flex flex-col justify-end">
                    {/* Placeholder for symmetry or other fields */}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-bold text-slate-700">Địa chỉ cụ thể (Số nhà, đường...)</Label>
                  <Input
                    placeholder="Số nhà, tên đường..."
                    value={addressForm.fullAddress}
                    onChange={e => setAddressForm({ ...addressForm, fullAddress: e.target.value })}
                    className={cn("h-11 rounded-xl bg-slate-50 border-slate-200", addressErrors.fullAddress && "border-red-500")}
                  />
                </div>
                <div className="flex items-center gap-2 py-2">
                  <Checkbox
                    id="isDefault"
                    checked={addressForm.isDefault}
                    onCheckedChange={checked => setAddressForm({ ...addressForm, isDefault: !!checked })}
                  />
                  <Label htmlFor="isDefault" className="text-sm text-slate-600 font-medium">Đặt làm địa chỉ mặc định</Label>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="ghost" className="flex-1 h-12 rounded-xl font-bold" onClick={() => setAddressView('list')}>Hủy</Button>
                  <Button type="submit" className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold" disabled={isAddressSubmitting}>
                    {isAddressSubmitting ? <Loader2 className="animate-spin" /> : (editingAddressId ? "Cập nhật" : "Lưu địa chỉ")}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
                const minOrderValue = v.minOrderValue || 0;
                const isDisabled = subtotal < minOrderValue;
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
                              Đơn tối thiểu {minOrderValue.toLocaleString("vi-VN")}đ
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

      <Footer />
    </div>
  )
}
