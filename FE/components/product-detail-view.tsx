"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ProductCard } from "@/components/product-card"
import Image from "next/image"
import {
  Star,
  Minus,
  Plus,
  Globe,
  ChevronRight,
  ChevronLeft,
  X,
  AlertTriangle,
} from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import type { Product, RecommendationResponse } from "@/lib/types"
import { cn, getOptimizedImageUrl } from "@/lib/utils"
import { useCartStore } from "@/lib/store/useCartStore"
import { useCartAnimationStore } from "@/lib/store/useCartAnimationStore"
import { toast } from "sonner"
import { v4 as uuidv4 } from "uuid"
import DOMPurify from "isomorphic-dompurify"
import { inventoryService } from "@/services/inventoryService"
import { getApiBaseUrl } from "@/lib/config"

const sanitizeContent = (content: string) => {
  return {
    __html: DOMPurify.sanitize(content || "", {
      ALLOWED_TAGS: [
        "h1", "h2", "h3", "h4", "h5", "h6",
        "p", "br", "ul", "ol", "li",
        "strong", "em", "b", "i", "u",
        "span", "div"
      ],
      ALLOWED_ATTR: ["class", "style"]
    })
  }
}

import { ProductReviews } from "@/components/product-reviews"

interface ProductDetailViewProps {
  initialProduct: Product
  reviews: any[]
  productSlug?: string
}

export function ProductDetailView({ initialProduct, reviews, productSlug }: ProductDetailViewProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(getOptimizedImageUrl(initialProduct.primaryImageUrl || "/placeholder.svg"))
  const [product, setProduct] = useState<Product>(initialProduct)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [relatedLoading, setRelatedLoading] = useState(true)
  const [relatedError, setRelatedError] = useState(false)
  const [relatedDegraded, setRelatedDegraded] = useState(false)
  const [isReviewsVisible, setIsReviewsVisible] = useState(false)

  useEffect(() => {
    const refreshStock = async () => {
      try {
        const stock = await inventoryService.getProductStock(product.id)
        if (stock !== undefined) {
          setProduct(prev => ({ ...prev, stockQuantity: stock }))
        }
      } catch (err) {
        console.warn("Failed to refresh product stock from inventory-service:", err)
      }
    }
    refreshStock()
  }, [product.id])

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        setRelatedLoading(true)
        setRelatedError(false)
        const response = await fetch(
          `${getApiBaseUrl()}/ai-service/api/recommendations/related?productId=${product.id}&limit=5`,
          { cache: "no-store" }
        )

        if (!response.ok) {
          setRelatedProducts([])
          setRelatedError(true)
          setRelatedDegraded(false)
          return
        }

        const payload = await response.json() as RecommendationResponse
        // Filter out prescription drugs immediately
        const filteredItems = (Array.isArray(payload?.items) ? payload.items : [])
          .filter((p: Product) => p.requiresPrescription !== true)
        setRelatedProducts(filteredItems)
        setRelatedDegraded(Boolean(payload?.metadata?.degraded))
      } catch (error) {
        console.error("Failed to fetch related recommendations:", error)
        setRelatedProducts([])
        setRelatedError(true)
        setRelatedDegraded(false)
      } finally {
        setRelatedLoading(false)
      }
    }

    fetchRelatedProducts()
  }, [product.id])

  const allImages = Array.from(new Set([
    product.primaryImageUrl,
    ...(product.imageUrls || []),
    ...(product.images?.map(img => img.imageUrl) || [])
  ])).filter(Boolean) as string[]

  const averageRating = reviews.length > 0
    ? (reviews.reduce((a, b: any) => a + b.rating, 0) / reviews.length).toFixed(1)
    : "5.0"

  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  const { data: session } = useSession()
  const addToCartAction = useCartStore((state) => state.addItem)
  const addAnimation = useCartAnimationStore((state) => state.addAnimation)

  const handleAddToCart = (e: React.MouseEvent) => {
    // Prevent adding if stock is 0
    if (typeof product.stockQuantity === 'number' && product.stockQuantity <= 0) {
      toast.error("Sản phẩm này hiện đang hết hàng.");
      return;
    }

    // Trigger animation
    addAnimation({
      id: uuidv4(),
      imageUrl: product.primaryImageUrl || "",
      startX: e.clientX,
      startY: e.clientY
    })

    addToCartAction({
      medicineId: Number(product.id),
      name: product.name,
      slug: product.slug || "",
      imageUrl: product.primaryImageUrl || "",
      quantity: quantity,
      unit: product.packingUnit?.split(' ')[0] || "Hộp",
      unitPrice: product.price,
      totalPrice: product.price * quantity,
      originalPrice: product.originalPrice,
      requiresPrescription: !!product.requiresPrescription,
      packingUnit: product.packingUnit
    } as any, session?.user?.accessToken)
    toast.custom((t) => (
      <div className="flex flex-col gap-3 p-4 bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-blue-50 relative overflow-hidden group min-w-[320px]">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-2xl"></div>
        <button
          onClick={() => toast.dismiss(t)}
          className="absolute top-1/2 -translate-y-1/2 right-3 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all z-10 border border-slate-100 bg-slate-50 shadow-sm"
        >
          <X size={14} />
        </button>
        <div className="flex gap-4">
          <div className="relative h-14 w-14 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center shrink-0">
            <Image src={product.primaryImageUrl || "/placeholder.svg"} alt="Product" fill className="object-contain p-2" />
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <p className="font-bold text-slate-800 text-[15px] leading-tight line-clamp-1">Thêm thành công!</p>
            <p className="text-[13px] text-slate-500 mt-0.5 line-clamp-1">{quantity}x {product.name}</p>
          </div>
        </div>
        <div className="flex justify-between items-center mt-1 border-t border-slate-50 pt-3">
          <span className="font-black text-blue-600">{(product.price * quantity).toLocaleString("vi-VN")}đ</span>
          <Button size="sm" variant="outline" className="h-8 rounded-full text-xs font-bold px-4 border-blue-100 text-blue-600 hover:bg-blue-50 hover:text-blue-700" onClick={() => { toast.dismiss(t); window.location.href = '/gio-hang' }}>
            Xem giỏ hàng
          </Button>
        </div>
      </div>
    ), { duration: 3000, position: "top-right" })
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col font-sans">
      <Header />

      <main className="flex-1 pb-12">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-100">
          <div className="container mx-auto px-4 py-3 flex items-center gap-2 text-[13px]">
            <a href="/" className="text-blue-600 hover:underline">Trang chủ</a>
            <span className="text-gray-400">/</span>
            {product.parentCategoryName && (
              <>
                <a href={`/cua-hang?category=${product.parentCategorySlug}`} className="text-blue-600 hover:underline whitespace-nowrap">{product.parentCategoryName}</a>
                <span className="text-gray-400">/</span>
              </>
            )}
            <span className="text-gray-500 font-medium truncate">{product.name}</span>
          </div>
        </div>

        <div className="container mx-auto px-4 mt-6">
          <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-3xl overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col lg:flex-row">
                {/* Left Column: Image Gallery */}
                <div className="w-full lg:w-[45%] p-6 md:p-10 border-r border-gray-50 flex flex-col gap-6">
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white/50 border border-gray-50 group">
                    <Image
                      src={getOptimizedImageUrl(selectedImage)}
                      alt={product.name}
                      fill
                      className="object-contain p-8 transition-transform duration-700 group-hover:scale-110"
                      priority
                      unoptimized={selectedImage.includes("cloudinary")}
                    />

                    {product.requiresPrescription && (
                      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-[11px] font-black text-slate-700 uppercase">Thuốc kê đơn</span>
                        </div>

                      </div>
                    )}

                    {/* Navigation Arrows */}
                    {allImages.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            const idx = allImages.indexOf(selectedImage);
                            setSelectedImage(allImages[(idx - 1 + allImages.length) % allImages.length]);
                          }}
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 shadow-md flex items-center justify-center text-slate-600 opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-blue-600"
                        >
                          <ChevronLeft size={24} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            const idx = allImages.indexOf(selectedImage);
                            setSelectedImage(allImages[(idx + 1) % allImages.length]);
                          }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 shadow-md flex items-center justify-center text-slate-600 opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-blue-600"
                        >
                          <ChevronRight size={24} />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnails */}
                  {allImages.length > 1 && (
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {allImages.map((img, idx) => (
                        <button
                          key={idx}
                          onMouseEnter={() => setSelectedImage(img)}
                          onClick={() => setSelectedImage(img)}
                          className={cn(
                            "relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0",
                            selectedImage === img ? "border-blue-600 shadow-md scale-105" : "border-gray-100 hover:border-blue-300"
                          )}
                        >
                          <Image src={getOptimizedImageUrl(img)} alt={`${product.name} ${idx}`} fill className="object-cover p-1" unoptimized={img.includes("cloudinary")} />
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-[12px] text-gray-400 text-center italic">Mẫu mã sản phẩm có thể thay đổi theo lô hàng</p>
                </div>

                {/* Right Column: Pricing & Quick Details */}
                <div className="w-full lg:w-[55%] p-6 md:p-8 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 rounded text-[11px] font-bold text-slate-700">
                      <Globe size={12} className="text-blue-600" />
                      <span>{product.countryOfOrigin || "Việt Nam"}</span>
                    </div>
                    <div className="text-[13px]">
                      <span className="text-gray-500">Thương hiệu: </span>
                      <a href="#" className="font-bold text-blue-600 hover:underline uppercase">{product.brand || "Đang cập nhật"}</a>
                    </div>
                  </div>

                  <h1 className="text-xl md:text-2xl font-black text-slate-800 leading-snug mb-1">{product.name}</h1>

                  {product.requiresPrescription && (
                    <p className="text-[14px] text-blue-600 font-bold mb-3 italic flex items-center gap-2">
                      Sản phẩm cần tư vấn từ dược sĩ.
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-[13px] mb-6">
                    <span className="text-gray-400 font-mono tracking-tight">{product.sourceSku || ("MS-" + product.id)}</span>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-slate-800">
                        {reviews.length > 0 ? (reviews.reduce((a, b: any) => a + b.rating, 0) / reviews.length).toFixed(1) : "5.0"}
                      </span>
                      <Star size={14} className="fill-yellow-400 text-yellow-400" />
                    </div>
                    <span className="text-blue-600 hover:underline">{reviews.length} đánh giá</span>
                  </div>

                  <div className="mb-6 p-5 bg-blue-50/30 rounded-2xl border border-blue-100/50">
                    <div className="flex items-baseline gap-3 mb-1">
                      <span className="text-3xl font-black text-blue-600">{product.price?.toLocaleString("vi-VN")}đ</span>
                      {discount > 0 && product.originalPrice && (
                        <>
                          <span className="text-sm text-gray-400 line-through font-medium">{product.originalPrice.toLocaleString("vi-VN")}đ</span>
                          <Badge className="bg-red-500 text-white border-none text-[12px] px-2 py-0.5 h-auto rounded-full font-black">
                            -{discount}%
                          </Badge>
                        </>
                      )}
                      <span className="ml-auto text-base font-bold text-blue-600/70">/ {product.packingUnit?.split(' ')[0] || "Hộp"}</span>
                    </div>
                  </div>

                  {product.requiresPrescription ? (
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                      <Button
                        className="flex-1 h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-lg font-black shadow-lg shadow-blue-200 active:scale-95 transition-all uppercase"
                      >
                        Tư vấn ngay
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 h-14 rounded-2xl border-2 border-blue-100 bg-blue-50/50 hover:bg-blue-100 text-blue-700 text-lg font-black active:scale-95 transition-all uppercase"
                        onClick={() => window.location.href = '/toa-thuoc'}
                      >
                        Gửi đơn thuốc
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4 mb-6">
                        <div className="flex items-center gap-8">
                          <span className="text-[14px] font-bold text-slate-600 w-24">Chọn đơn vị tính</span>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="px-5 py-2 border-blue-600 text-blue-600 bg-blue-50 text-[13px] font-black rounded-full">
                              {product.packingUnit?.split(' ')[0] || "Hộp"}
                              <ChevronRight size={14} className="ml-1 rotate-90" />
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <span className="text-[14px] font-bold text-slate-600 w-24">Chọn số lượng</span>
                          <div className="flex items-center border border-gray-200 rounded-full h-10 px-1 bg-white">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-gray-100" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={14} /></Button>
                            <span className="w-10 text-center font-black text-slate-800">{quantity}</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-gray-100" onClick={() => setQuantity(quantity + 1)}><Plus size={14} /></Button>
                          </div>
                        </div>
                      </div>

                      <div className="flex mb-6">
                        <Button
                          className="w-full h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-base font-black shadow-lg shadow-blue-200 active:scale-95 transition-all uppercase"
                          onClick={(e) => handleAddToCart(e)}
                          disabled={typeof product.stockQuantity === 'number' && product.stockQuantity <= 0}
                        >
                          {(typeof product.stockQuantity === 'number' && product.stockQuantity <= 0) ? "Hết hàng" : "Thêm vào giỏ hàng"}
                        </Button>
                      </div>
                    </>
                  )}

                  <div className="space-y-3 pt-4 border-t border-gray-50">
                    <p className="text-[13px] text-slate-600 italic leading-relaxed">
                      {product.description ? DOMPurify.sanitize(product.description, { ALLOWED_TAGS: [] }).substring(0, 160) : "Thông tin đang cập nhật"}...
                    </p>

                    <div className="grid grid-cols-1 gap-y-2 pt-2">
                      {[
                        { label: "Số đăng ký", value: product.registrationNumber || "Thông tin đang cập nhật", highlight: !!product.registrationNumber },
                        { label: "Quy cách", value: product.packingUnit || "Thông tin đang cập nhật" },
                        { label: "Thành phần", value: product.activeIngredients || "Thông tin đang cập nhật" },
                        { label: "Dạng bào chế", value: product.dosageForm || "Thông tin đang cập nhật" },
                        { label: "Thuốc cần kê toa", value: product.requiresPrescription ? "Có" : "Không", highlight: !!product.requiresPrescription },
                        { label: "Nhà sản xuất", value: product.manufacturer || "Thông tin đang cập nhật" },
                      ].map((row, i) => (
                        <div key={i} className="flex text-[13px]">
                          <span className="w-32 text-gray-500 font-medium shrink-0">{row.label}</span>
                          <span className={cn("flex-1 text-slate-800 font-bold", row.highlight && "text-blue-600")}>
                            {row.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8">
            <div className="w-full">
              <Card className="border-none shadow-sm rounded-2xl p-6 md:p-8 bg-white overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl md:text-2xl font-black text-slate-800">{product.name} là gì?</h2>
                </div>

                <Accordion type="multiple" defaultValue={["description", "indications"]} className="w-full space-y-4">
                  <AccordionItem value="description" id="description" className="border border-gray-100 rounded-xl overflow-hidden px-4 bg-gray-50/30 scroll-mt-28">
                    <AccordionTrigger className="hover:no-underline py-4 font-black text-slate-800 uppercase tracking-wider text-sm">
                      Mô tả sản phẩm
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 text-slate-600 leading-relaxed">
                      <div className="text-[14px]" dangerouslySetInnerHTML={sanitizeContent(product.description || "Thông tin đang cập nhật...")} />
                      <div className="relative h-[300px] w-full mt-6 rounded-xl overflow-hidden border bg-white">
                        <Image src={getOptimizedImageUrl(product.primaryImageUrl || "/placeholder.svg")} alt="Detail" fill className="object-contain p-6" unoptimized={product.primaryImageUrl?.includes("cloudinary")} />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {product.indications && (
                    <AccordionItem value="indications" id="indications" className="border border-gray-100 rounded-xl overflow-hidden px-4 scroll-mt-28">
                      <AccordionTrigger className="hover:no-underline py-4 font-black text-slate-800 uppercase tracking-wider text-sm">
                        Công dụng
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-6 text-slate-600 leading-relaxed text-[14px]">
                        <div dangerouslySetInnerHTML={sanitizeContent(product.indications)} />
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {product.usageInstruction && (
                    <AccordionItem value="usage" id="usage" className="border border-gray-100 rounded-xl overflow-hidden px-4 scroll-mt-28">
                      <AccordionTrigger className="hover:no-underline py-4 font-black text-slate-800 uppercase tracking-wider text-sm">
                        Cách dùng & Liều lượng
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-6 text-slate-600 leading-relaxed text-[14px]">
                        <div dangerouslySetInnerHTML={sanitizeContent(product.usageInstruction)} />
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {product.sideEffects && (
                    <AccordionItem value="side_effects" id="side_effects" className="border border-gray-100 rounded-xl overflow-hidden px-4 scroll-mt-28">
                      <AccordionTrigger className="hover:no-underline py-4 font-black text-slate-800 uppercase tracking-wider text-sm">
                        Tác dụng không mong muốn
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-6 text-slate-600 leading-relaxed text-[14px]">
                        <div dangerouslySetInnerHTML={sanitizeContent(product.sideEffects)} />
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {product.precautions && (
                    <AccordionItem value="precautions" id="precautions" className="border border-gray-100 rounded-xl overflow-hidden px-4 scroll-mt-28">
                      <AccordionTrigger className="hover:no-underline py-4 font-black text-slate-800 uppercase tracking-wider text-sm">
                        Lưu ý khi sử dụng
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-6 text-slate-600 leading-relaxed text-[14px]">
                        <div dangerouslySetInnerHTML={sanitizeContent(product.precautions)} />
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {product.storageConditions && (
                    <AccordionItem value="storage" id="storage" className="border border-gray-100 rounded-xl overflow-hidden px-4 scroll-mt-28">
                      <AccordionTrigger className="hover:no-underline py-4 font-black text-slate-800 uppercase tracking-wider text-sm">
                        Điều kiện bảo quản
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-6 text-slate-600 leading-relaxed text-[14px]">
                        <div dangerouslySetInnerHTML={sanitizeContent(product.storageConditions)} />
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>
              </Card>

              <div className="mt-6 bg-[#EDFBFF] border-l-4 border-blue-600 p-4 rounded-r-2xl space-y-1">
                <p className="text-[13px] text-blue-700 font-medium italic">Thông tin chỉ mang tính tham khảo, không thay thế tư vấn của bác sĩ.</p>
                <p className="text-[12px] text-blue-600/80">Thực phẩm bảo vệ sức khoẻ, không phải là thuốc, không có tác dụng thay thế thuốc chữa bệnh.</p>
              </div>

              {/* Reviews Section Toggleable */}
              <div className="mt-10">
                <button 
                  onClick={() => setIsReviewsVisible(!isReviewsVisible)}
                  className="flex items-center justify-between w-full p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl md:text-2xl font-black text-slate-800">Đánh giá sản phẩm</h2>
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-bold">
                      {reviews.length}
                    </Badge>
                  </div>
                  <div className={cn("text-slate-400 transition-transform duration-300", isReviewsVisible ? "rotate-180" : "")}>
                    <Plus size={24} className={isReviewsVisible ? "hidden" : "block"} />
                    <Minus size={24} className={isReviewsVisible ? "block" : "hidden"} />
                  </div>
                </button>

                {isReviewsVisible && (
                  <div className="mt-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <ProductReviews
                      productId={product.id.toString()}
                      productSlug={productSlug || ""}
                      productName={product.name}
                      productImage={product.primaryImageUrl || "/placeholder.svg"}
                      initialReviews={reviews}
                      hideTitle={true}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Related Products */}
          <div className="mt-16" data-testid="related-recommendation-widget">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-slate-800 underline decoration-blue-600/30 decoration-4 underline-offset-8">Sản phẩm liên quan</h2>
              <Button variant="ghost" className="text-blue-600 font-bold hover:bg-blue-50">Xem tất cả</Button>
            </div>
            {/* Removed technical alert for clean UI */}
            {relatedLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4" data-testid="related-recommendation-loading">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="aspect-square rounded-xl bg-slate-100 animate-pulse" />
                    <div className="mt-3 h-4 w-3/4 rounded bg-slate-100 animate-pulse" />
                    <div className="mt-2 h-4 w-1/2 rounded bg-slate-100 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : relatedError ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600" data-testid="related-recommendation-error">
                Khong the tai san pham lien quan luc nay.
              </div>
            ) : relatedProducts.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600" data-testid="related-recommendation-empty">
                Chua co san pham lien quan phu hop.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4" data-testid="related-recommendation-ready">
                {relatedProducts.map(p => (
                  <ProductCard
                    key={p.id}
                    id={p.id.toString()}
                    name={p.name}
                    price={p.price}
                    rating={5}
                    image={p.primaryImageUrl || "/placeholder.svg"}
                    slug={p.slug}
                    ingredient={p.activeIngredients || ""}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
