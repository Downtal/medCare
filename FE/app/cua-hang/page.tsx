"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { SearchX, ChevronLeft, ChevronRight, Loader2, ChevronDown, ChevronUp, X, SlidersHorizontal } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { Product } from "@/lib/types"
import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getApiBaseUrl } from "@/lib/config"
import { cn } from "@/lib/utils"
import { inventoryService } from "@/services/inventoryService"

const API_BASE = `${getApiBaseUrl()}/product-service/api`
const PAGE_SIZE = 15

interface PageData {
  content: Product[]
  pageNo: number
  pageSize: number
  totalElements: number
  totalPages: number
  last: boolean
}

interface CategoryNode {
  id: number
  name: string
  slug: string
  parentId: number | null
  children?: CategoryNode[]
}

// Price range options matching the design
const PRICE_RANGES = [
  { label: "Dưới 100.000đ", min: 0, max: 100000 },
  { label: "100.000đ đến 300.000đ", min: 100000, max: 300000 },
  { label: "300.000đ đến 500.000đ", min: 300000, max: 500000 },
  { label: "Trên 500.000đ", min: 500000, max: 99999999 },
]

// Collapsible filter section component
function FilterSection({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-border pb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
      >
        {title}
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && <div className="pt-2">{children}</div>}
    </div>
  )
}

function StoreContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // URL params
  const query = searchParams.get("q") || ""
  const categorySlug = searchParams.get("category") || ""
  const pageParam = parseInt(searchParams.get("page") || "0")

  // State
  const [pageData, setPageData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<CategoryNode[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const [sortBy, setSortBy] = useState("popular")

  // Filter states
  const [selectedPriceRange, setSelectedPriceRange] = useState<number | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedOrigins, setSelectedOrigins] = useState<string[]>([])

  // Breadcrumb info
  const [breadcrumbInfo, setBreadcrumbInfo] = useState<{ parentName?: string; parentSlug?: string; categoryName?: string }>({})

  // Fetch categories & brands
  useEffect(() => {
    fetch(`${API_BASE}/categories/tree`, { cache: "no-store" })
      .then(res => res.ok ? res.json() : [])
      .then((data: any) => {
        const finalData = Array.isArray(data) ? data : []
        setCategories(finalData)
        // Build breadcrumb info
        if (categorySlug && Array.isArray(finalData)) {
          for (const cat of finalData) {
            if (cat.slug === categorySlug) {
              setBreadcrumbInfo({ categoryName: cat.name })
              break
            }
            if (cat.children) {
              const sub = cat.children.find((c: CategoryNode) => c.slug === categorySlug)
              if (sub) {
                setBreadcrumbInfo({ parentName: cat.name, parentSlug: cat.slug, categoryName: sub.name })
                break
              }
            }
          }
        } else {
          setBreadcrumbInfo({})
        }
      })
      .catch(() => { })

    fetch(`${API_BASE}/products/brands`)
      .then(res => res.json())
      .then(data => {
        // Deduplicate & clean
        const unique = [...new Set((data || []).filter((b: string) => b && b.trim()))] as string[]
        setBrands(unique)
      })
      .catch(() => { })
  }, [categorySlug])

  // Initialize selected categories from URL param
  useEffect(() => {
    if (categorySlug) {
      setSelectedCategories([categorySlug])
    } else {
      setSelectedCategories([])
    }
  }, [categorySlug])

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      let url: string
      if (query) {
        url = `${API_BASE}/products/search?q=${encodeURIComponent(query)}&page=${pageParam}&size=${PAGE_SIZE}`
      } else if (categorySlug) {
        // Try slug endpoint first; if categorySlug looks like a number, use ID endpoint
        const isNumeric = /^\d+$/.test(categorySlug)
        if (isNumeric) {
          url = `${API_BASE}/products/category/${categorySlug}?page=${pageParam}&size=${PAGE_SIZE}&includeChildren=true`
        } else {
          url = `${API_BASE}/products/category/slug/${categorySlug}?page=${pageParam}&size=${PAGE_SIZE}&includeChildren=true`
        }
      } else {
        url = `${API_BASE}/products?page=${pageParam}&size=${PAGE_SIZE}`
      }

      const res = await fetch(url, { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        
        // Refresh real-time stock from inventory-service
        if (data.content && data.content.length > 0) {
          try {
            const productIds = data.content.map((p: Product) => p.id)
            const stockMap = await inventoryService.getStocksBulk(productIds)
            data.content = data.content.map((p: Product) => ({
              ...p,
              stockQuantity: stockMap[p.id] !== undefined ? stockMap[p.id] : p.stockQuantity
            }))
          } catch (err) {
            console.warn("Failed to fetch real-time stocks from inventory-service:", err)
          }
        }
        
        setPageData(data)
      } else {
        // If slug-based lookup failed, try to fall back to all products
        console.warn(`Category fetch failed (${res.status}), showing all products`)
        const fallbackRes = await fetch(`${API_BASE}/products?page=${pageParam}&size=${PAGE_SIZE}`, { cache: "no-store" })
        if (fallbackRes.ok) {
          const data = await fallbackRes.json()
          setPageData(data)
        } else {
          setPageData({ content: [], pageNo: 0, pageSize: PAGE_SIZE, totalElements: 0, totalPages: 0, last: true })
        }
      }
    } catch (err) {
      console.error("Fetch products error:", err)
      setPageData({ content: [], pageNo: 0, pageSize: PAGE_SIZE, totalElements: 0, totalPages: 0, last: true })
    } finally {
      setLoading(false)
    }
  }, [query, categorySlug, pageParam])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Client-side sorting & filtering on current page data
  const getFilteredProducts = () => {
    if (!pageData) return []
    let products = [...pageData.content]

    // Price filter
    if (selectedPriceRange !== null) {
      const range = PRICE_RANGES[selectedPriceRange]
      products = products.filter(p => p.price >= range.min && p.price < range.max)
    }

    // Brand filter (client-side)
    if (selectedBrands.length > 0) {
      products = products.filter(p => p.brand && selectedBrands.includes(p.brand))
    }

    // Origin filter (client-side)
    if (selectedOrigins.length > 0) {
      products = products.filter(p => p.countryOfOrigin && selectedOrigins.includes(p.countryOfOrigin))
    }

    // Sort
    switch (sortBy) {
      case "price-asc":
        products.sort((a, b) => a.price - b.price)
        break
      case "price-desc":
        products.sort((a, b) => b.price - a.price)
        break
      case "newest":
        products.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        break
      default:
        break
    }
    return products
  }

  // Navigation helpers
  const navigateToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    router.push(`/cua-hang?${params.toString()}`)
  }

  const navigateToCategory = (catSlug: string | null) => {
    const params = new URLSearchParams()
    if (catSlug !== null) {
      params.set("category", catSlug)
    }
    if (query) params.set("q", query)
    router.push(`/cua-hang?${params.toString()}`)
  }

  // Toggle helpers
  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand])
  }

  const toggleOrigin = (origin: string) => {
    setSelectedOrigins(prev => prev.includes(origin) ? prev.filter(o => o !== origin) : [...prev, origin])
  }

  const toggleCategoryFilter = (catSlug: string) => {
    // Navigate to this category
    navigateToCategory(catSlug)
  }

  const filteredProducts = getFilteredProducts()

  // Extract unique origins from current products data for dynamic filter
  const availableOrigins = [...new Set(
    (pageData?.content || []).map(p => p.countryOfOrigin).filter((o): o is string => !!o && o.trim() !== "")
  )]

  // Extract unique brands from current products
  const availableBrands = [...new Set(
    (pageData?.content || []).map(p => p.brand).filter((b): b is string => !!b && b.trim() !== "")
  )]

  // Extract unique indications
  const availableIndications = [...new Set(
    (pageData?.content || []).map(p => p.indications).filter((i): i is string => !!i && i.trim() !== "")
  )].slice(0, 10)

  const renderFilterContent = () => (
    <div className="space-y-4">
      {/* Price Range - Button style */}
      <FilterSection title="Giá bán" defaultOpen={true}>
        <div className="space-y-2">
          {PRICE_RANGES.map((range, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedPriceRange(selectedPriceRange === idx ? null : idx)}
              className={`w-full text-center text-sm py-2.5 px-3 rounded-lg border transition-all ${selectedPriceRange === idx
                ? "border-primary bg-primary/5 text-primary font-semibold"
                : "border-border text-foreground hover:border-primary/50 hover:bg-muted/30"
                }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Categories - Checkbox multi-select */}
      <FilterSection title="Danh mục" defaultOpen={true}>
        <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
          {Array.isArray(categories) && categories.map((cat) => (
            <div key={cat.id}>
              <div className="flex items-center gap-2 py-1">
                <Checkbox
                  id={`cat-${cat.id}`}
                  checked={categorySlug === cat.slug}
                  onCheckedChange={() => toggleCategoryFilter(cat.slug)}
                />
                <Label htmlFor={`cat-${cat.id}`} className="text-sm font-medium cursor-pointer">
                  {cat.name}
                </Label>
              </div>
              {/* Sub categories */}
              {cat.children && cat.children.length > 0 && (
                <div className="ml-6 space-y-0.5">
                  {cat.children.map((sub: CategoryNode) => (
                    <div key={sub.id} className="flex items-center gap-2 py-1">
                      <Checkbox
                        id={`cat-${sub.id}`}
                        checked={categorySlug === sub.slug}
                        onCheckedChange={() => toggleCategoryFilter(sub.slug)}
                      />
                      <Label htmlFor={`cat-${sub.id}`} className="text-sm font-normal cursor-pointer text-muted-foreground">
                        {sub.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </FilterSection>

      {/* Thương hiệu - Brand */}
      <FilterSection title="Thương hiệu">
        <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1">
          {(availableBrands.length > 0 ? availableBrands : brands.slice(0, 15)).map((brand) => (
            <div key={brand} className="flex items-center gap-2 py-1">
              <Checkbox
                id={`brand-${brand}`}
                checked={selectedBrands.includes(brand)}
                onCheckedChange={() => toggleBrand(brand)}
              />
              <Label htmlFor={`brand-${brand}`} className="text-sm font-normal cursor-pointer">
                {brand}
              </Label>
            </div>
          ))}
          {availableBrands.length === 0 && brands.length === 0 && (
            <p className="text-xs text-muted-foreground italic">Chưa có dữ liệu</p>
          )}
        </div>
      </FilterSection>

      {/* Xuất xứ thương hiệu - Country of Origin */}
      <FilterSection title="Xuất xứ thương hiệu">
        <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1">
          {availableOrigins.length > 0 ? availableOrigins.map((origin) => (
            <div key={origin} className="flex items-center gap-2 py-1">
              <Checkbox
                id={`origin-${origin}`}
                checked={selectedOrigins.includes(origin)}
                onCheckedChange={() => toggleOrigin(origin)}
              />
              <Label htmlFor={`origin-${origin}`} className="text-sm font-normal cursor-pointer">
                {origin}
              </Label>
            </div>
          )) : (
            <p className="text-xs text-muted-foreground italic">Chưa có dữ liệu</p>
          )}
        </div>
      </FilterSection>
    </div>
  )

  // Title
  let pageTitle = "Tất cả sản phẩm"
  if (query) pageTitle = `Kết quả tìm kiếm cho "${query}"`
  else if (breadcrumbInfo.categoryName) pageTitle = breadcrumbInfo.categoryName

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="text-sm text-muted-foreground mb-6 flex items-center gap-1 flex-wrap">
            <Link href="/" className="hover:text-primary transition-colors">Trang chủ</Link>
            <span className="mx-1">/</span>
            <Link href="/cua-hang" className="hover:text-primary transition-colors">Cửa hàng</Link>
            {breadcrumbInfo.parentName && (
              <>
                <span className="mx-1">/</span>
                <Link
                  href={`/cua-hang?category=${breadcrumbInfo.parentSlug}`}
                  className="hover:text-primary transition-colors"
                >
                  {breadcrumbInfo.parentName}
                </Link>
              </>
            )}
            {breadcrumbInfo.categoryName && (
              <>
                <span className="mx-1">/</span>
                <span className="text-foreground font-semibold">{breadcrumbInfo.categoryName}</span>
              </>
            )}
            {query && (
              <>
                <span className="mx-1">/</span>
                <span className="text-muted-foreground">Tìm kiếm: &quot;{query}&quot;</span>
              </>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24">
                {renderFilterContent()}
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-bold mb-1">{pageTitle}</h1>
                  <p className="text-sm text-muted-foreground">
                    {pageData ? `Hiển thị ${filteredProducts.length} / ${pageData.totalElements} sản phẩm` : "Đang tải..."}
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="lg:hidden flex-1">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" className="w-full font-bold flex items-center justify-center gap-2 rounded-2xl h-10 px-4">
                          <SlidersHorizontal className="h-4 w-4" />
                          Bộ lọc
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="w-[300px] overflow-y-auto p-6 bg-white border-r">
                        <SheetHeader className="px-0 pb-4 border-b border-slate-100">
                          <SheetTitle className="text-lg font-black text-slate-800">Bộ lọc sản phẩm</SheetTitle>
                        </SheetHeader>
                        <div className="pt-4">
                          {renderFilterContent()}
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-[180px] rounded-2xl h-10">
                      <SelectValue placeholder="Sắp xếp" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popular">Phổ biến nhất</SelectItem>
                      <SelectItem value="newest">Mới nhất</SelectItem>
                      <SelectItem value="price-asc">Giá tăng dần</SelectItem>
                      <SelectItem value="price-desc">Giá giảm dần</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Active filters (Lọc theo) */}
              {(breadcrumbInfo.categoryName || query || selectedPriceRange !== null || selectedBrands.length > 0 || selectedOrigins.length > 0) && (
                <div className="flex flex-wrap items-center gap-3 mb-6 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <span className="text-sm font-bold text-slate-700">Lọc theo ({
                    (breadcrumbInfo.categoryName ? 1 : 0) +
                    (query ? 1 : 0) +
                    (selectedPriceRange !== null ? 1 : 0) +
                    selectedBrands.length +
                    selectedOrigins.length
                  })</span>
                  <div className="flex flex-wrap gap-2 flex-1">
                    {breadcrumbInfo.categoryName && (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-[13px] font-medium text-slate-700 shadow-sm">
                        {breadcrumbInfo.categoryName}
                        <X className="h-3.5 w-3.5 cursor-pointer hover:text-destructive transition-colors" onClick={() => navigateToCategory(null)} />
                      </div>
                    )}
                    {query && (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-[13px] font-medium text-slate-700 shadow-sm">
                        Tìm: {query}
                        <X className="h-3.5 w-3.5 cursor-pointer hover:text-destructive transition-colors" onClick={() => router.push("/cua-hang")} />
                      </div>
                    )}
                    {selectedPriceRange !== null && (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-[13px] font-medium text-slate-700 shadow-sm">
                        {PRICE_RANGES[selectedPriceRange].label}
                        <X className="h-3.5 w-3.5 cursor-pointer hover:text-destructive transition-colors" onClick={() => setSelectedPriceRange(null)} />
                      </div>
                    )}
                    {selectedBrands.map(brand => (
                      <div key={brand} className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-[13px] font-medium text-slate-700 shadow-sm">
                        {brand}
                        <X className="h-3.5 w-3.5 cursor-pointer hover:text-destructive transition-colors" onClick={() => toggleBrand(brand)} />
                      </div>
                    ))}
                    {selectedOrigins.map(origin => (
                      <div key={origin} className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-[13px] font-medium text-slate-700 shadow-sm">
                        {origin}
                        <X className="h-3.5 w-3.5 cursor-pointer hover:text-destructive transition-colors" onClick={() => toggleOrigin(origin)} />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      navigateToCategory(null)
                      setSelectedPriceRange(null)
                      setSelectedBrands([])
                      setSelectedOrigins([])
                      if (query) router.push("/cua-hang")
                    }}
                    className="text-sm font-bold text-primary hover:underline px-2"
                  >
                    Xóa tất cả
                  </button>
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-3 text-muted-foreground">Đang tải sản phẩm...</span>
                </div>
              )}

              {/* Products Grid */}
              {!loading && filteredProducts.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {filteredProducts.map((product: Product, index: number) => (
                    <ProductCard
                      key={product.id}
                      id={product.id.toString()}
                      slug={product.slug}
                      name={product.name}
                      ingredient={product.activeIngredients || "Đang cập nhật"}
                      price={product.price}
                      originalPrice={product.originalPrice}
                      image={product.primaryImageUrl || "/placeholder.svg"}
                      requiresPrescription={product.requiresPrescription}
                      countryOfOrigin={product.countryOfOrigin}
                      packingUnit={product.packingUnit}
                      stockQuantity={product.stockQuantity}
                      priority={index < 4}
                    />
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!loading && filteredProducts.length === 0 && (
                <div className="py-24 text-center bg-muted/10 rounded-2xl border border-dashed flex flex-col items-center justify-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <SearchX className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">Không tìm thấy sản phẩm</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto">
                    {query
                      ? `Không tìm thấy kết quả nào cho "${query}". Hãy thử từ khóa khác.`
                      : "Danh mục này chưa có sản phẩm nào."}
                  </p>
                  <Button variant="outline" className="mt-6 rounded-full" asChild>
                    <Link href="/cua-hang">Xem tất cả sản phẩm</Link>
                  </Button>
                </div>
              )}

              {/* Pagination */}
              {!loading && pageData && pageData.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pageData.pageNo === 0}
                    onClick={() => navigateToPage(pageData.pageNo - 1)}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Trước
                  </Button>

                  {(() => {
                    const total = pageData.totalPages;
                    const current = pageData.pageNo;
                    const renderBtn = (p: number) => (
                      <Button
                        key={p}
                        variant={p === current ? "default" : "outline"}
                        onClick={() => navigateToPage(p)}
                        className={cn(
                          "w-10 h-10 p-0 rounded-full font-bold transition-all shadow-none",
                          p === current 
                            ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600" 
                            : "bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:text-blue-600"
                        )}
                      >
                        {p + 1}
                      </Button>
                    );

                    const pages = [];
                    // Always show first
                    pages.push(renderBtn(0));

                    if (current > 3 && total > 6) {
                      pages.push(<span key="ell1" className="px-1 text-slate-400">...</span>);
                    }

                    // Middle range
                    const start = Math.max(1, current - 2);
                    const end = Math.min(total - 2, current + 2);
                    for (let i = start; i <= end; i++) {
                      pages.push(renderBtn(i));
                    }

                    if (current < total - 4 && total > 6) {
                      pages.push(<span key="ell2" className="px-1 text-slate-400">...</span>);
                    }

                    // Always show last if not only 1 page
                    if (total > 1) {
                      pages.push(renderBtn(total - 1));
                    }
                    return pages;
                  })()}

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pageData.last}
                    onClick={() => navigateToPage(pageData.pageNo + 1)}
                  >
                    Tiếp
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function StorePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <StoreContent />
    </Suspense>
  )
}
