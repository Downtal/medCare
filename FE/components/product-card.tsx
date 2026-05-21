"use client"

import { getApiBaseUrl } from "@/lib/config"
import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star, ShoppingCart, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import DOMPurify from "isomorphic-dompurify"
import { useCartStore } from "@/lib/store/useCartStore"
import { useCartAnimationStore } from "@/lib/store/useCartAnimationStore"
import { toast } from "sonner"
import { cn, getOptimizedImageUrl } from "@/lib/utils"
import { useSession } from "next-auth/react"
import { v4 as uuidv4 } from "uuid"

interface ProductCardProps {
  id: string
  slug?: string
  name: string
  ingredient: string
  price: number
  originalPrice?: number
  rating?: number
  image: string
  badge?: string
  requiresPrescription?: boolean
  countryOfOrigin?: string
  packingUnit?: string
  stockQuantity?: number
  priority?: boolean
}

const REVIEW_API = `${getApiBaseUrl()}/review-service/api/reviews/product`

export function ProductCard({
  id,
  slug,
  name,
  ingredient,
  price,
  originalPrice,
  rating,
  image,
  badge,
  requiresPrescription,
  countryOfOrigin,
  packingUnit,
  stockQuantity,
  priority,
}: ProductCardProps) {
  const [realRating, setRealRating] = useState<number>(rating || 0)
  const [totalReviews, setTotalReviews] = useState<number>(0)
  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0
  const productPath = slug ? `/san-pham/${slug}` : `/san-pham/${id}`

  const { data: session } = useSession()
  const addToCartAction = useCartStore((state) => state.addItem)
  const addAnimation = useCartAnimationStore((state) => state.addAnimation)

  const addToCart = (e: React.MouseEvent) => {
    // Prevent adding if stock is explicitly 0
    if (typeof stockQuantity === 'number' && stockQuantity <= 0) {
      toast.error("Sản phẩm này hiện đang hết hàng.");
      return;
    }

    // Trigger animation
    addAnimation({
      id: uuidv4(),
      imageUrl: image,
      startX: e.clientX,
      startY: e.clientY
    })

    addToCartAction({
      medicineId: Number(id),
      name,
      slug: slug || "",
      imageUrl: image,
      quantity: 1,
      unit: packingUnit || "Hộp",
      unitPrice: price,
      totalPrice: price,
      originalPrice: originalPrice,
      requiresPrescription,
      packingUnit: packingUnit
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
            <Image src={image || "/placeholder.svg"} alt="Product" fill className="object-contain p-2" />
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <p className="font-bold text-slate-800 text-[15px] leading-tight line-clamp-1">Thêm thành công!</p>
            <p className="text-[13px] text-slate-500 mt-0.5 line-clamp-1">1x {name}</p>
          </div>
        </div>
        <div className="flex justify-between items-center mt-1 border-t border-slate-50 pt-3">
          <span className="font-black text-blue-600">{price.toLocaleString("vi-VN")}đ</span>
          <Button size="sm" variant="outline" className="h-8 rounded-full text-xs font-bold px-4 border-blue-100 text-blue-600 hover:bg-blue-50 hover:text-blue-700" onClick={() => { toast.dismiss(t); window.location.href = '/gio-hang' }}>
            Xem giỏ hàng
          </Button>
        </div>
      </div>
    ), { duration: 3000, position: "top-right" })
  }

  useEffect(() => {
    // Only fetch if rating wasn't explicitly passed as a positive number
    // or we just want to always get the latest from review-service
    const fetchRating = async () => {
      try {
        const res = await fetch(`${REVIEW_API}/${id}/rating`)
        if (res.ok) {
          const data = await res.json()
          setRealRating(data.averageRating)
          setTotalReviews(data.totalReviews)
        } else {
          console.error(`Failed to fetch rating for product ${id}:`, res.status);
        }
      } catch (err) {
        console.error(`Error fetching rating for product ${id}:`, err);
      }
    }
    fetchRating()
  }, [id])

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      <Link href={productPath}>
        <div className="relative aspect-square overflow-hidden bg-white border-b border-gray-50">
          {image && (
            <Image
              src={getOptimizedImageUrl(image)}
              alt={name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
              unoptimized={image?.includes("cloudinary")}
              priority={priority}
              className="object-contain p-4 transition-transform group-hover:scale-105"
            />
          )}
          {requiresPrescription && (
            <div className="absolute top-2 left-2 bg-rose-500 text-white rounded-md px-2 py-1 shadow-md text-[10px] sm:text-[11px] font-black uppercase z-20 flex items-center gap-1">
              Thuốc kê đơn
            </div>
          )}
          {countryOfOrigin && (
            <div className={cn(
              "absolute left-2 bg-white/90 backdrop-blur-sm rounded-md px-1.5 py-0.5 shadow-sm border border-slate-100 flex items-center gap-1.5 z-10",
              requiresPrescription ? "top-10" : "top-2"
            )}>
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-700">{countryOfOrigin}</span>
            </div>
          )}
          {badge && <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground z-10">{badge}</Badge>}
          {(typeof stockQuantity === 'number' && stockQuantity <= 0) && (
            <Badge className="absolute top-2 right-2 bg-slate-900/80 text-white border-none backdrop-blur-md z-20 font-black">HẾT HÀNG</Badge>
          )}
          {discount > 0 && price < (originalPrice || 0) && !requiresPrescription && stockQuantity !== 0 && (
            <Badge className="absolute top-9 right-2 bg-destructive text-destructive-foreground z-10">-{discount}%</Badge>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        <Link href={productPath}>
          <h3 className="font-semibold text-sm mb-1 line-clamp-2 hover:text-primary transition-colors">{name}</h3>
          <div
            className="text-xs text-muted-foreground mb-2 line-clamp-1"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(ingredient) }}
          />
        </Link>

        {!requiresPrescription && (
          <div className="flex items-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${i < Math.floor(realRating) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"
                  }`}
              />
            ))}
            <span className="text-xs text-muted-foreground ml-1">
              {realRating > 0 ? `${realRating.toFixed(1)} (${totalReviews})` : "Chưa có đánh giá"}
            </span>
          </div>
        )}

        {requiresPrescription ? (
          <div className="space-y-2">
            <p className="text-[14px] text-slate-500 font-medium">Cần tư vấn từ dược sĩ</p>
            <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-none font-bold text-[12px] px-3 py-1 rounded-lg">
              {packingUnit || "Hộp"}
            </Badge>
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-base sm:text-lg font-black text-primary">
                {price.toLocaleString("vi-VN")}đ
              </span>
              {packingUnit && (
                <span className="text-xs sm:text-sm font-medium text-slate-500">/ {packingUnit}</span>
              )}
            </div>
            {originalPrice && originalPrice > price && (
              <span className="text-[11px] sm:text-xs text-muted-foreground line-through block mt-0.5">
                {originalPrice.toLocaleString("vi-VN")}đ
              </span>
            )}
          </>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2 mt-auto">
        {requiresPrescription ? (
          <Button
            className="w-full h-11 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border-none font-black text-sm rounded-2xl shadow-none active:scale-95 transition-all"
            asChild
          >
            <Link href={productPath}>Xem chi tiết</Link>
          </Button>
        ) : (
          <>
            <Button
              className="w-full sm:flex-1 text-[13px] sm:text-sm font-bold rounded-2xl"
              size="sm"
              onClick={addToCart}
              disabled={typeof stockQuantity === 'number' && stockQuantity <= 0}
            >
              <ShoppingCart className="h-4 w-4 mr-1.5 sm:mr-2" />
              {typeof stockQuantity === 'number' && stockQuantity <= 0 ? "Hết hàng" : "Thêm vào giỏ"}
            </Button>
            <Button variant="outline" size="sm" className="hidden sm:inline-flex rounded-2xl" asChild>
              <Link href={productPath}>Chi tiết</Link>
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
