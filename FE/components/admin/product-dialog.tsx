"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MultiSelect } from "./multi-select"
import { toast } from "sonner"
import { Loader2, Pill, FileText, Bot, Thermometer, Boxes, CheckCircle2, Clock, Info, Database } from "lucide-react"
import { productService, ProductPayload } from "@/services/productService"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRef } from "react"
import { MultiImageUpload, MultiImageUploadRef } from "./multi-image-upload"
import { cn } from "@/lib/utils"
import { SYMPTOM_OPTIONS } from "@/constants/symptoms"

const productSchema = z.object({
  name: z.string().min(2, "Tên sản phẩm tối thiểu 2 ký tự"),
  categoryId: z.coerce.number().min(1, "Vui lòng chọn danh mục"),
  price: z.coerce.number().min(0, "Giá phải từ 0"),
  originalPrice: z.coerce.number().optional(),
  discountPercentage: z.coerce.number().min(0).max(100).optional(),
  packingUnit: z.string().optional(),
  sourceSku: z.string().optional(),
  registrationNumber: z.string().optional(),
  requiresPrescription: z.boolean().default(false),

  // Medical Details
  brand: z.string().optional(),
  manufacturer: z.string().optional(),
  country_of_origin: z.string().optional(),
  dosage_form: z.string().optional(),
  activeIngredients: z.string().optional(),
  expiry_date: z.string().optional(),

  brand_name: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  dosageForm: z.string().optional(),
  expiryDate: z.string().optional(),

  // Content
  description: z.string().optional(),
  indications: z.string().optional(),
  usageInstruction: z.string().optional(),
  contraindications: z.string().optional(),
  sideEffects: z.string().optional(),
  precautions: z.string().optional(),
  storageConditions: z.string().optional(),

  // Images
  images: z.array(z.object({
    imageUrl: z.string(),
    isPrimary: z.boolean(),
    sortOrder: z.number()
  })).default([]),

  symptoms: z.array(z.string()).default([]),

  // Initial Inventory
  initialQuantity: z.coerce.number().min(0, "Số lượng không được âm").optional(),
  initialBatchNumber: z.string().optional(),
  initialExpiryDate: z.string().optional(),
}).superRefine((data, ctx) => {
  // Ràng buộc chéo: Nếu có số lượng nhập kho thì BẮT BUỘC phải có hạn dùng
  if (data.initialQuantity && data.initialQuantity > 0) {
    if (!data.initialExpiryDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Hạn dùng là bắt buộc khi nhập kho",
        path: ["initialExpiryDate"],
      });
    }
  }
})

type ProductFormValues = z.infer<typeof productSchema>

interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: any
  categories: any[]
}


const DEFAULT_VALUES = {
  name: "",
  categoryId: 0,
  price: 0,
  originalPrice: 0,
  discountPercentage: 0,
  packingUnit: "",
  sourceSku: "",
  registrationNumber: "",
  requiresPrescription: false,
  brand: "",
  manufacturer: "",
  countryOfOrigin: "",
  dosageForm: "",
  activeIngredients: "",
  description: "",
  indications: "",
  usageInstruction: "",
  contraindications: "",
  sideEffects: "",
  precautions: "",
  storageConditions: "",
  expiryDate: "",
  images: [],
  symptoms: [],
  initialQuantity: 0,
  initialBatchNumber: "",
  initialExpiryDate: "",
}

export function ProductDialog({ open, onOpenChange, product, categories }: ProductDialogProps) {
  const imageUploadRef = useRef<MultiImageUploadRef>(null)
  const queryClient = useQueryClient()
  const { data: symptomsData = [] } = useQuery({
    queryKey: ["symptoms"],
    queryFn: () => productService.getSymptoms()
  })

  // Combine DB symptoms with our initial defaults for a rich list
  const dynamicSymptoms = Array.from(new Set([
    ...SYMPTOM_OPTIONS.map(s => s.value),
    ...symptomsData.map((s: any) => s.name)
  ])).map(name => {
    const existing = SYMPTOM_OPTIONS.find(s => s.value === name)
    return existing || { label: name, value: name }
  })
  const [activeTab, setActiveTab] = useState("general")

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: DEFAULT_VALUES
  })

  useEffect(() => {
    if (product) {
      // Sanitize product data to replace nulls with empty strings for form inputs
      const sanitizedProduct = { ...product }
      Object.keys(sanitizedProduct).forEach(key => {
        if (sanitizedProduct[key] === null) {
          sanitizedProduct[key] = ""
        }
      })

      // Map BE images (imageUrls or images object list) to FE images structure
      let mappedImages = []
      if (product.images && Array.isArray(product.images)) {
        mappedImages = product.images.map((img: any) => ({
          imageUrl: img.imageUrl,
          isPrimary: img.isPrimary,
          sortOrder: img.sortOrder || 0
        }))
      } else if (product.imageUrls && Array.isArray(product.imageUrls)) {
        mappedImages = product.imageUrls.map((url: string) => ({
          imageUrl: url,
          isPrimary: url === product.primaryImageUrl,
          sortOrder: 0
        }))
      }

      form.reset({
        ...DEFAULT_VALUES,
        ...sanitizedProduct,
        images: mappedImages,
        originalPrice: product.originalPrice || product.price,
        discountPercentage: product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0
      })
    } else {
      form.reset(DEFAULT_VALUES)
    }
  }, [product, form])

  const price = form.watch("price")
  const originalPrice = form.watch("originalPrice")
  const discountPercentage = form.watch("discountPercentage")

  const handlePriceChange = (v: number) => {
    form.setValue("price", v)
    if (v && originalPrice && originalPrice > v) {
      const percentage = Math.round(((originalPrice - v) / originalPrice) * 100)
      form.setValue("discountPercentage", percentage)
    } else if (v && !originalPrice) {
      form.setValue("originalPrice", v)
      form.setValue("discountPercentage", 0)
    }
  }

  const handleOriginalPriceChange = (v: number) => {
    form.setValue("originalPrice", v)
    if (v && price && v > price) {
      const percentage = Math.round(((v - price) / v) * 100)
      form.setValue("discountPercentage", percentage)
    } else if (v && discountPercentage) {
      const newPrice = Math.round(v * (1 - discountPercentage / 100))
      form.setValue("price", newPrice)
    }
  }

  const handleDiscountChange = (percentage: number) => {
    form.setValue("discountPercentage", percentage)
    if (originalPrice && percentage >= 0) {
      const newPrice = Math.round(originalPrice * (1 - percentage / 100))
      form.setValue("price", newPrice)
    }
  }

  const mutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      // Auto-upload if user forgot to click confirm
      if (imageUploadRef.current?.hasPendingFiles) {
        toast.info("Đang tự động tải ảnh lên...")
        await imageUploadRef.current.uploadPendingFiles()
        // CẬP NHẬT LẠI GIÁ TRỊ MỚI NHẤT SAU KHI UPLOAD ẢNH XONG
        values = form.getValues()
      }

      const primary = values.images.find(i => i.isPrimary)?.imageUrl || ""
      const payload: ProductPayload = {
        ...values as any,
        primaryImageUrl: primary
      }

      if (product?.id) {
        return productService.updateProduct(product.id, payload)
      }

      // Clean up payload for creation
      const createPayload = { ...payload }
      if (!createPayload.initialBatchNumber) delete createPayload.initialBatchNumber
      if (!createPayload.initialExpiryDate) delete createPayload.initialExpiryDate
      if (createPayload.initialQuantity === 0) delete createPayload.initialQuantity

      return productService.createProduct(createPayload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_products"] })
      toast.success(product ? "Cập nhật sản phẩm thành công" : "Thêm mới sản phẩm thành công")
      onOpenChange(false)
    },
    onError: (error) => {
      console.error(error)
      toast.error("Đã xảy ra lỗi khi lưu sản phẩm")
    }
  })

  const onSubmit = (values: ProductFormValues) => {
    mutation.mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] lg:max-w-[1450px] w-full max-h-[95vh] flex flex-col gap-0 p-0 overflow-hidden bg-slate-50 border-none shadow-2xl rounded-3xl">
        <DialogHeader className="p-10 pb-6 bg-white border-b">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-4xl font-black text-slate-800 tracking-tight">
                {product ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
              </DialogTitle>
              <DialogDescription className="text-slate-500 font-medium">
                Quản lý thông tin chi tiết, dữ liệu y khoa và cấu hình AI cho sản phẩm.
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center justify-between mt-8">
            <div className="flex bg-slate-100/80 p-1.5 rounded-2xl gap-1">
              {[
                { id: "general", label: "Thông tin tổng quan", icon: FileText },
                { id: "medical", label: "Dữ liệu thuốc", icon: Pill },
                { id: "content", label: "Nội dung & HDSD", icon: FileText },
                { id: "inventory", label: "Nhập kho", icon: Boxes },
                { id: "chatbot", label: "AI Knowledge", icon: Bot },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300",
                    activeTab === tab.id
                      ? "bg-white text-primary shadow-sm ring-1 ring-slate-200"
                      : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                  )}
                >
                  <tab.icon className={cn("h-4 w-4", activeTab === tab.id ? "text-primary" : "text-slate-400")} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" className="font-bold text-slate-500 h-12 px-6 rounded-xl hover:bg-slate-100" onClick={() => onOpenChange(false)}>
                Đóng cửa sổ
              </Button>
              <Button
                type="submit"
                onClick={form.handleSubmit(onSubmit)}
                disabled={mutation.isPending}
                className="bg-primary hover:bg-primary/90 text-white font-black h-12 px-10 rounded-xl shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {mutation.isPending ? (
                  <><Loader2 className="mr-3 h-5 w-5 animate-spin" /> Đang xử lý...</>
                ) : (
                  product ? "CẬP NHẬT SẢN PHẨM" : "THÊM SẢN PHẨM"
                )}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-slate-50/50">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-8">
                  <div className="transition-all duration-500 ease-in-out">
                    {activeTab === "general" && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                        <section className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-bold text-slate-700">Tên thuốc/sản phẩm <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                  <Input placeholder="VD: Panadol Extra 500mg" {...field} className="h-14 bg-slate-50 border-slate-200 rounded-xl text-lg font-medium" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="categoryId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="font-bold text-slate-700">Danh mục<span className="text-red-500">*</span></FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value ? field.value.toString() : ""}>
                                    <FormControl>
                                      <SelectTrigger className="h-12 bg-slate-50 rounded-xl">
                                        <SelectValue placeholder="Chọn danh mục con..." />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                      {categories.map((cat: any) => (
                                        <SelectGroup key={cat.id}>
                                          <SelectLabel className="px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-400 bg-slate-50/50">{cat.name}</SelectLabel>
                                          {cat.children?.map((child: any) => (
                                            <SelectItem key={child.id} value={child.id.toString()} className="hover:bg-primary/5 cursor-pointer py-2.5">
                                              {child.name}
                                            </SelectItem>
                                          ))}
                                        </SelectGroup>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="packingUnit"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="font-bold text-slate-700">Quy cách (Packing)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="VD: Hộp 10 vỉ x 10 viên" {...field} className="h-12 bg-slate-50 border-slate-200 rounded-xl" />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="sourceSku"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="font-bold text-slate-700">Mã SKU</FormLabel>
                                  <FormControl>
                                    <Input placeholder="VD: 00012345" {...field} className="h-12 bg-slate-50 border-slate-200 rounded-xl" />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="registrationNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="font-bold text-slate-700">Số đăng ký (Bộ Y tế)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="VD: VD-24536-16" {...field} className="h-12 bg-slate-50 border-slate-200 rounded-xl" />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
                            <FormField
                              control={form.control}
                              name="price"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="font-bold text-primary italic">Giá KM (Cuối) <span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) => handlePriceChange(Number(e.target.value))}
                                      className="h-14 bg-primary/5 border-primary/20 text-primary font-black rounded-xl text-xl"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="originalPrice"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="font-bold text-slate-400">Giá gốc niêm yết</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) => handleOriginalPriceChange(Number(e.target.value))}
                                      className="h-14 bg-slate-50 border-slate-200 text-slate-400 rounded-xl"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="discountPercentage"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="font-bold text-orange-600">% Giảm</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) => handleDiscountChange(Number(e.target.value))}
                                      className="h-14 bg-orange-50 border-orange-200 text-orange-600 font-bold rounded-xl"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </section>
                      </div>
                    )}

                    {activeTab === "inventory" && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                        <div className="bg-emerald-600 p-10 rounded-[2.5rem] text-white shadow-xl shadow-emerald-100 overflow-hidden relative">
                          <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Boxes className="h-40 w-40" />
                          </div>
                          <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-4">
                              <div className="h-16 w-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                                <Boxes className="h-8 w-8 text-white" />
                              </div>
                              <div className="space-y-1">
                                <h3 className="text-3xl font-black tracking-tight">Cấu hình tồn kho ban đầu</h3>
                                <p className="text-emerald-50/80 font-medium">Thiết lập số lượng, số lô và hạn dùng ngay khi tạo sản phẩm.</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
                              <FormField
                                control={form.control}
                                name="initialQuantity"
                                render={({ field }) => (
                                  <FormItem className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20">
                                    <FormLabel className="font-black text-white text-sm uppercase tracking-wider mb-2 block">Số lượng nhập</FormLabel>
                                    <FormControl>
                                      <Input type="number" placeholder="0" {...field} className="h-14 bg-white border-none rounded-2xl text-emerald-900 font-black text-xl placeholder:text-emerald-200" />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="initialBatchNumber"
                                render={({ field }) => (
                                  <FormItem className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20">
                                    <FormLabel className="font-black text-white text-sm uppercase tracking-wider mb-2 block">Số lô (Batch No.)</FormLabel>
                                    <FormControl>
                                      <Input placeholder="VD: LOT2024..." {...field} className="h-14 bg-white border-none rounded-2xl text-emerald-900 font-black text-lg placeholder:text-emerald-200" />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="initialExpiryDate"
                                render={({ field }) => (
                                  <FormItem className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20">
                                    <FormLabel className="font-black text-white text-sm uppercase tracking-wider mb-2 block">Hạn sử dụng</FormLabel>
                                    <FormControl>
                                      <Input type="date" {...field} className="h-14 bg-white border-none rounded-2xl text-emerald-900 font-black text-lg" />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="bg-emerald-700/50 p-6 rounded-2xl border border-emerald-500/30">
                              <p className="text-sm font-bold text-emerald-50 flex items-center gap-2">
                                <Bot className="h-4 w-4" /> Tip: Bạn có thể bỏ trống phần này nếu chưa muốn nhập kho thực tế ngay lúc này.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "medical" && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                        <section className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                          <div className="grid grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="brand"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="font-bold text-slate-700">Thương hiệu</FormLabel>
                                  <FormControl>
                                    <Input placeholder="VD: Traphaco" {...field} className="h-11 bg-slate-50 rounded-xl" />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="countryOfOrigin"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="font-bold text-slate-700">Xuất xứ</FormLabel>
                                  <FormControl>
                                    <Input placeholder="VD: Việt Nam" {...field} className="h-11 bg-slate-50 rounded-xl" />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="manufacturer"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-bold text-slate-700">Nhà sản xuất (Producer)</FormLabel>
                                <FormControl>
                                  <Input placeholder="VD: Công ty Cổ phần Traphaco" {...field} className="h-11 bg-slate-50 rounded-xl" />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="dosageForm"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="font-bold text-slate-700">Dạng bào chế</FormLabel>
                                  <FormControl>
                                    <Input placeholder="VD: Viên nén sủi" {...field} className="h-11 bg-slate-50 rounded-xl" />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="expiryDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="font-bold text-slate-700">Hạn dùng</FormLabel>
                                  <FormControl>
                                    <Input placeholder="VD: 36 tháng kể từ ngày SX" {...field} className="h-11 bg-slate-50 rounded-xl" />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="activeIngredients"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-bold text-slate-700">Thành phần hoạt chất (Ingredients)</FormLabel>
                                <FormControl>
                                  <Textarea rows={4} placeholder="Liệt kê hàm lượng, hoạt chất..." {...field} className="resize-none bg-slate-50 rounded-xl" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </section>
                      </div>
                    )}

                    {activeTab === "content" && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                        <section className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-bold text-slate-700">Mô tả sản phẩm (Tổng quan)</FormLabel>
                                <FormControl>
                                  <Textarea rows={4} placeholder="Nhập mô tả ngắn gọn về sản phẩm..." {...field} className="resize-none bg-slate-50 rounded-xl" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="indications"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-bold text-slate-700 text-blue-700">Công dụng & Chỉ định</FormLabel>
                                <FormControl>
                                  <Textarea rows={3} placeholder="Thuốc dùng để điều trị bệnh gì..." {...field} className="resize-none bg-blue-50/30 rounded-xl" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="usageInstruction"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-bold text-slate-700">Cách dùng & Liều lượng</FormLabel>
                                <FormControl>
                                  <Textarea rows={3} placeholder="Người lớn: ... trẻ em: ..." {...field} className="resize-none bg-slate-50 rounded-xl" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="contraindications"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-bold text-red-600">Chống chỉ định</FormLabel>
                                <FormControl>
                                  <Textarea rows={3} placeholder="Người mẫn cảm với thành phần..." {...field} className="resize-none bg-red-50/30 border-red-100 text-red-700 rounded-xl" />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="sideEffects"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="font-bold text-slate-700 text-amber-600">Tác dụng phụ</FormLabel>
                                  <FormControl>
                                    <Textarea rows={4} placeholder="Buồn nôn, chóng mặt..." {...field} className="resize-none bg-amber-50/20 rounded-xl" />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="precautions"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="font-bold text-slate-700">Thận trọng / Lưu ý</FormLabel>
                                  <FormControl>
                                    <Textarea rows={4} placeholder="Phụ nữ có thai, người lái xe..." {...field} className="resize-none bg-slate-50 rounded-xl" />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="storageConditions"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-bold text-slate-700 flex items-center gap-2">
                                  Điều kiện bảo quản
                                </FormLabel>
                                <FormControl>
                                  <Textarea rows={2} placeholder="VD: Nơi khô ráo, nhiệt độ dưới 30 độ C, tránh ánh sáng trực tiếp" {...field} className="resize-none bg-blue-50/20 border-blue-100 rounded-xl" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </section>
                      </div>
                    )}

                    {activeTab === "chatbot" && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                        <div className="bg-gradient-to-br from-indigo-600 via-blue-700 to-blue-800 p-10 rounded-[2.5rem] text-white shadow-2xl shadow-blue-200 relative">
                          {/* Decorative Elements */}
                          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl" />

                          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
                            <div className="h-20 w-20 bg-white/20 backdrop-blur-xl rounded-[2rem] flex items-center justify-center border border-white/30 shadow-inner">
                              <Bot className="h-10 w-10 text-white animate-pulse" />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="text-3xl font-black tracking-tight">AI Training Model</h3>
                                <Badge className="bg-emerald-400 text-emerald-950 font-black border-none">RAG Ready</Badge>
                              </div>
                              <p className="text-blue-50/80 font-medium text-lg">Gắn thẻ triệu chứng để Gemini có thể tư vấn sản phẩm này.</p>
                            </div>
                          </div>


                          <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 shadow-inner">
                            <FormField
                              control={form.control}
                              name="symptoms"
                              render={({ field }) => (
                                <FormItem className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <FormLabel className="font-black text-white text-lg block">Triệu chứng liên quan (Symptoms)</FormLabel>
                                    <Badge variant="outline" className="border-white/20 text-white/60 font-bold uppercase text-[10px]">Optional</Badge>
                                  </div>
                                  <FormControl>
                                    <MultiSelect
                                      options={dynamicSymptoms}
                                      selected={field.value}
                                      onChange={field.onChange}
                                      placeholder="Gõ để tìm triệu chứng (VD: Đau đầu, Sốt...)"
                                      className="border-white/20 bg-white/10"
                                      placeholderClassName="placeholder:text-white/40 text-white font-bold"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/10 flex gap-4 items-start">
                              <div className="bg-amber-400/20 p-2 rounded-lg">
                                <Info className="h-5 w-5 text-amber-300" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-black text-amber-200">Tip cho Admin:</p>
                                <p className="text-xs text-white/70 font-medium leading-relaxed">
                                  Bạn có thể <span className="text-white font-black underline decoration-amber-400 underline-offset-4">BỎ TRỐNG</span> phần này lúc tạo sản phẩm và bổ sung sau tại mục
                                  <span className="text-white font-bold mx-1 italic">"Quản lý Chatbot QA"</span> bất cứ lúc nào. AI vẫn sẽ học từ mô tả sản phẩm, nhưng tag triệu chứng giúp độ chính xác cao hơn 40%.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-8 lg:sticky lg:top-0">
                  <section className="bg-white p-6 pb-20 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                    <FormField
                      control={form.control}
                      name="images"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <MultiImageUpload
                              ref={imageUploadRef}
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </section>
                  <section className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                    <FormField
                      control={form.control}
                      name="requiresPrescription"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:bg-slate-100/50">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base font-bold text-slate-800">Thuốc kê đơn (RX)</FormLabel>
                            <FormDescription className="text-xs">Yêu cầu đơn thuốc từ bác sĩ.</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-primary" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </section>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
