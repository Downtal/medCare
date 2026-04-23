"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Plus, 
  Pencil, 
  Trash2, 
  MapPin, 
  Phone, 
  User, 
  Loader2, 
  MapPinHouse,
  AlertCircle 
} from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { getApiBaseUrl } from "@/lib/config"
import type { AddressDto } from "@/lib/types"
import { shippingService, type Province, type District, type Ward } from "@/services/shippingService"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function AddressesPage() {
  const { data: session } = useSession()
  const [addresses, setAddresses] = useState<AddressDto[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addressLoading, setAddressLoading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({
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

  const [provinces, setProvinces] = useState<Province[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [wards, setWards] = useState<Ward[]>([])

  useEffect(() => {
    if (session?.user?.accessToken) {
      fetchAddresses()
      fetchProvinces()
    }
  }, [session?.user?.accessToken])

  const fetchProvinces = async () => {
    try {
      const data = await shippingService.getProvinces()
      // GHN API or internal service might wrap data in an object
      const provinceList = Array.isArray(data) ? data : (data as any)?.data || []
      setProvinces(provinceList)
    } catch (error) {
      console.error("Fetch provinces error:", error)
      setProvinces([])
    }
  }

  useEffect(() => {
    if (form.cityId) {
      fetchDistricts(form.cityId)
    } else {
      setDistricts([])
    }
  }, [form.cityId])

  useEffect(() => {
    if (form.districtId) {
      fetchWards(form.districtId)
    } else {
      setWards([])
    }
  }, [form.districtId])

  const fetchDistricts = async (provinceId: number) => {
    try {
      const data = await shippingService.getDistricts(provinceId)
      const districtList = Array.isArray(data) ? data : (data as any)?.data || []
      setDistricts(districtList)
    } catch (error) {
      console.error("Fetch districts error:", error)
      setDistricts([])
    }
  }

  const fetchWards = async (districtId: number) => {
    try {
      const data = await shippingService.getWards(districtId)
      const wardList = Array.isArray(data) ? data : (data as any)?.data || []
      setWards(wardList)
    } catch (error) {
      console.error("Fetch wards error:", error)
      setWards([])
    }
  }

  const fetchAddresses = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${getApiBaseUrl()}/user-service/api/users/profiles/me/addresses`, {
        headers: { Authorization: `Bearer ${session?.user?.accessToken}` }
      })
      if (res.ok) {
        const data = await res.json()
        setAddresses(data)
      }
    } catch (error) {
      console.error("Fetch addresses error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user?.accessToken) return

    // Simple validation
    if (!form.receiverName || !form.receiverPhone || !form.cityId || !form.districtId || !form.wardCode || !form.fullAddress) {
      toast.error("Vui lòng điền đầy đủ thông tin")
      return
    }

    setAddressLoading(true)
    try {
      const url = editingId
        ? `${getApiBaseUrl()}/user-service/api/users/addresses/${editingId}`
        : `${getApiBaseUrl()}/user-service/api/users/profiles/me/addresses`

      const method = editingId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.user.accessToken}`,
        },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        toast.success(editingId ? "Cập nhật thành công!" : "Thêm địa chỉ thành công!")
        setIsAddOpen(false)
        fetchAddresses()
      }
    } catch (error) {
      toast.error("Lỗi kết nối")
    } finally {
      setAddressLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) return
    try {
      const res = await fetch(`${getApiBaseUrl()}/user-service/api/users/addresses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session?.user?.accessToken}` }
      })
      if (res.ok) {
        toast.success("Đã xóa địa chỉ")
        fetchAddresses()
      }
    } catch (error) {
      toast.error("Lỗi xóa địa chỉ")
    }
  }

  const handleEdit = (addr: AddressDto) => {
    setEditingId(addr.id)
    setForm({
      receiverName: addr.receiverName,
      receiverPhone: addr.receiverPhone,
      fullAddress: addr.fullAddress,
      city: addr.city,
      district: addr.district,
      ward: addr.ward || "",
      cityId: addr.cityId,
      districtId: addr.districtId,
      wardCode: addr.wardCode || "",
      isDefault: addr.isDefault
    })
    setIsAddOpen(true)
  }

  const handleAddNew = () => {
    setEditingId(null)
    setForm({
      receiverName: "",
      receiverPhone: "",
      fullAddress: "",
      city: "",
      district: "",
      ward: "",
      cityId: undefined,
      districtId: undefined,
      wardCode: "",
      isDefault: false
    })
    setIsAddOpen(true)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl shadow-sm border border-slate-100">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
        <p className="text-slate-500 font-bold">Đang tải địa chỉ...</p>
      </div>
    )
  }

  return (
    <Card className="animate-in fade-in slide-in-from-right-4 duration-500 border-none shadow-sm rounded-3xl overflow-hidden bg-white">
      <CardHeader className="bg-slate-50 border-b border-slate-100 px-8 py-6 flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Sổ địa chỉ</CardTitle>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <Button 
            onClick={handleAddNew}
            className="rounded-full bg-blue-600 hover:bg-blue-700 px-6 font-bold shadow-lg shadow-blue-500/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm địa chỉ mới
          </Button>
          <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
            <form onSubmit={handleSave}>
              <DialogHeader className="bg-blue-600 p-8 text-white">
                <DialogTitle className="text-2xl font-black flex items-center gap-3">
                  {editingId ? <Pencil className="h-6 w-6" /> : <MapPin className="h-6 w-6" />}
                  {editingId ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
                </DialogTitle>
                <DialogDescription className="text-blue-100 font-medium">
                  Vui lòng cung cấp thông tin chính xác để MedCare giao hàng nhanh nhất.
                </DialogDescription>
              </DialogHeader>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700 ml-1">Người nhận</Label>
                    <Input 
                      placeholder="Vd: Nguyễn Văn A"
                      value={form.receiverName}
                      onChange={e => setForm({...form, receiverName: e.target.value})}
                      className="rounded-xl border-slate-200 h-12" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700 ml-1">Số điện thoại</Label>
                    <Input 
                      placeholder="Số điện thoại"
                      value={form.receiverPhone}
                      onChange={e => setForm({...form, receiverPhone: e.target.value})}
                      className="rounded-xl border-slate-200 h-12" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700 ml-1">Tỉnh / Thành phố</Label>
                    <Select 
                      value={form.cityId?.toString()} 
                      onValueChange={(val) => {
                        const p = provinces.find(x => x.ProvinceID.toString() === val)
                        setForm({...form, cityId: parseInt(val), city: p?.ProvinceName || "", districtId: undefined, district: "", wardCode: "", ward: ""})
                      }}
                    >
                      <SelectTrigger className="rounded-xl border-slate-200 h-12">
                        <SelectValue placeholder="Chọn Tỉnh/Thành" />
                      </SelectTrigger>
                      <SelectContent>
                        {provinces.map(p => (
                          <SelectItem key={p.ProvinceID} value={p.ProvinceID.toString()}>{p.ProvinceName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700 ml-1">Quận / Huyện</Label>
                    <Select 
                      disabled={!form.cityId}
                      value={form.districtId?.toString()} 
                      onValueChange={(val) => {
                        const d = districts.find(x => x.DistrictID.toString() === val)
                        setForm({...form, districtId: parseInt(val), district: d?.DistrictName || "", wardCode: "", ward: ""})
                      }}
                    >
                      <SelectTrigger className="rounded-xl border-slate-200 h-12">
                        <SelectValue placeholder="Chọn Quận/Huyện" />
                      </SelectTrigger>
                      <SelectContent>
                        {districts.map(d => (
                          <SelectItem key={d.DistrictID} value={d.DistrictID.toString()}>{d.DistrictName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700 ml-1">Phường / Xã</Label>
                    <Select 
                      disabled={!form.districtId}
                      value={form.wardCode} 
                      onValueChange={(val) => {
                        const w = wards.find(x => x.WardCode === val)
                        setForm({...form, wardCode: val, ward: w?.WardName || ""})
                      }}
                    >
                      <SelectTrigger className="rounded-xl border-slate-200 h-12">
                        <SelectValue placeholder="Chọn Phường/Xã" />
                      </SelectTrigger>
                      <SelectContent>
                        {wards.map(w => (
                          <SelectItem key={w.WardCode} value={w.WardCode}>{w.WardName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700 ml-1">Địa chỉ chi tiết</Label>
                  <Input 
                    placeholder="Số nhà, tên đường..."
                    value={form.fullAddress}
                    onChange={e => setForm({...form, fullAddress: e.target.value})}
                    className="rounded-xl border-slate-200 h-12" 
                  />
                </div>
                <div className="flex items-center space-x-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <Checkbox 
                    id="isDefault" 
                    checked={form.isDefault}
                    onCheckedChange={checked => setForm({...form, isDefault: !!checked})}
                  />
                  <Label htmlFor="isDefault" className="font-bold text-slate-600 cursor-pointer">Đặt làm địa chỉ mặc định</Label>
                </div>
              </div>
              <DialogFooter className="p-8 bg-slate-50 border-t gap-3 sm:justify-center">
                 <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-full px-8 font-bold">Hủy</Button>
                 <Button type="submit" disabled={addressLoading} className="rounded-full px-10 bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-500/20">
                    {addressLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Lưu địa chỉ
                 </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-8">
        {addresses.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {addresses.map((addr) => (
              <div key={addr.id} className="relative p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-2.5 rounded-xl">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="text-lg font-black text-slate-800">{addr.receiverName}</span>
                  </div>
                  {addr.isDefault && (
                    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 rounded-full font-bold px-3 py-1">Mặc định</Badge>
                  )}
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-slate-500 font-medium">
                    <Phone className="h-4 w-4 mr-3 text-slate-300" />
                    <span>{addr.receiverPhone}</span>
                  </div>
                  <div className="flex items-start text-slate-500 font-medium leading-relaxed">
                    <MapPin className="h-4 w-4 mr-3 mt-1 text-slate-300 shrink-0" />
                    <span className="text-sm">{addr.fullAddress}, {addr.ward}, {addr.district}, {addr.city}</span>
                  </div>
                </div>

                <Separator className="border-slate-50 mb-4" />
                
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(addr)} className="text-blue-600 hover:bg-blue-50 font-bold rounded-full px-4">
                    <Pencil className="h-4 w-4 mr-2" /> Sửa
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(addr.id)} className="text-rose-500 hover:bg-rose-50 font-bold rounded-full px-4">
                    <Trash2 className="h-4 w-4 mr-2" /> Xóa
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-slate-50/50 rounded-[40px] border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm mx-auto mb-6">
              <MapPinHouse className="h-10 w-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Chưa có địa chỉ nào</h3>
            <p className="text-slate-400 font-medium italic mb-8">Thêm địa chỉ giao hàng để đặt hàng nhanh hơn.</p>
            <Button className="rounded-full bg-blue-600 hover:bg-blue-700 font-black px-8 h-12 shadow-lg shadow-blue-500/20" onClick={() => setIsAddOpen(true)}>
              Thêm địa chỉ ngay
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
