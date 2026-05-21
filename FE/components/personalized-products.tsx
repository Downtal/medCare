"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { getApiBaseUrl } from "@/lib/config"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Sparkles, ChevronRight, AlertTriangle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { Product, RecommendationResponse } from "@/lib/types"
import Link from "next/link"
import { inventoryService } from "@/services/inventoryService"

export function PersonalizedProducts() {
  const { data: session } = useSession()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [degraded, setDegraded] = useState(false)

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setError(false)
        const headers: Record<string, string> = {}
        if (session?.user?.id) {
          headers["X-User-Id"] = session.user.id.toString()
        }

        const res = await fetch(`${getApiBaseUrl()}/ai-service/api/recommendations/home?limit=4`, {
          headers,
          cache: 'no-store'
        })

        if (res.ok) {
          const payload = await res.json() as RecommendationResponse
          const rawItems = Array.isArray(payload?.items) ? payload.items : []
          // Filter out prescription drugs immediately so it applies to both success and fallback paths
          const items = rawItems.filter((p: Product) => p.requiresPrescription !== true)
          setDegraded(Boolean(payload?.metadata?.degraded))

          // Refresh real-time stock from inventory-service
          if (items.length > 0) {
            try {
              const productIds = items.map((p: Product) => p.id)
              const stockMap = await inventoryService.getStocksBulk(productIds)
              const hydratedItems = items.map((p: Product) => ({
                ...p,
                stockQuantity: stockMap[p.id] !== undefined ? stockMap[p.id] : p.stockQuantity
              }))
              setProducts(hydratedItems)
            } catch (err) {
              console.warn("Failed to fetch real-time stocks in recommendations:", err)
              setProducts(items)
            }
          } else {
            setProducts([])
          }
        } else {
          console.error(`Recommendations failed with status: ${res.status} ${res.statusText}`)
          setProducts([])
          setError(true)
        }
      } catch (error) {
        console.error("Failed to fetch recommendations:", error)
        if (error instanceof TypeError) {
          console.error("Network error or CORS issue suspected. URL:", `${getApiBaseUrl()}/ai-service/api/recommendations/home?limit=4`);
        }
        setProducts([])
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [session?.user?.id])

  return (
    <section className="py-20 bg-slate-50" data-testid="homepage-recommendation-widget">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider mb-3">
              <Sparkles className="w-5 h-5 fill-current" />
              <span>Dành riêng cho bạn</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">
              Gợi ý chăm sóc <br />
              <span className="text-primary">Sức khỏe Cá nhân hóa</span>
            </h2>
            <p className="text-slate-500 mt-4 font-medium text-lg">
              {session?.user
                ? "Dựa trên tìm kiếm và lịch sử mua hàng, MedCare đề xuất những sản phẩm phù hợp nhất với bạn."
                : "Đăng nhập để nhận được những gợi ý sản phẩm phù hợp với độ tuổi và nhu cầu của bạn."}
            </p>
          </div>
          <Button variant="ghost" className="rounded-xl font-bold text-primary hover:bg-primary/5 group" asChild>
            <Link href="/cua-hang">
              Xem tất cả <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        {/* Removed degraded alert to keep UI clean for users */}

        <AnimatePresence mode="wait">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8" data-testid="homepage-recommendation-loading">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white border border-slate-100 rounded-[32px] p-6 space-y-4">
                  <div className="aspect-square bg-slate-100 rounded-2xl animate-shimmer relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-100 rounded-full w-3/4 animate-pulse" />
                    <div className="h-3 bg-slate-50 rounded-full w-1/2 animate-pulse" />
                  </div>
                  <div className="h-8 bg-slate-100 rounded-xl w-full animate-pulse mt-4" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600" data-testid="homepage-recommendation-error">
              Không thể tải gợi ý lúc này.
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600" data-testid="homepage-recommendation-empty">
              Chưa có gợi ý phù hợp.
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8"
              data-testid="homepage-recommendation-ready"
            >
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id.toString()}
                  slug={product.slug}
                  name={product.name}
                  ingredient={product.activeIngredients || ""}
                  price={product.price}
                  rating={4.9}
                  image={product.primaryImageUrl || "/placeholder.svg"}
                  requiresPrescription={product.requiresPrescription}
                  stockQuantity={product.stockQuantity}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
