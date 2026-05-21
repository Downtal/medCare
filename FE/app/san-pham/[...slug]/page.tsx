import { ProductDetailView } from "@/components/product-detail-view"
import type { Product } from "@/lib/types"
import { notFound } from "next/navigation"
import { getApiBaseUrl } from "@/lib/config"

// SEO Metadata Generation (Runs on Server)
export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const slugPath = slug.join('/')
  try {
    const res = await fetch(`${getApiBaseUrl()}/product-service/api/products/by-slug?slug=${encodeURIComponent(slugPath)}`, { cache: "no-store" })

    if (res.ok) {
      const product: Product = await res.json()
      return {
        title: `${product.name} - Mua chính hãng tại MedCare Pharmacy`,
        description: product.description?.replace(/<[^>]*>?/gm, '').substring(0, 160) || `Sản phẩm ${product.name} tại MedCare.`,
        openGraph: {
          title: product.name,
          description: product.description?.replace(/<[^>]*>?/gm, '').substring(0, 160),
          images: product.primaryImageUrl ? [{ url: product.primaryImageUrl }] : [],
        },
      }
    }
  } catch (e) {
    // Fallback below
  }
  return { title: "Sản phẩm - MedCare Pharmacy" }
}

async function getProduct(slugPath: string) {
  const res = await fetch(`${getApiBaseUrl()}/product-service/api/products/by-slug?slug=${encodeURIComponent(slugPath)}`, { cache: "no-store" })
  if (!res.ok) return null
  return res.json()
}

async function getReviews(productId: number) {
  try {
    const res = await fetch(`${getApiBaseUrl()}/review-service/api/reviews/product/${productId}`, { cache: "no-store" })
    if (res.ok) return res.json()
  } catch (e) {
    console.warn("Review service unreachable during build")
  }
  return []
}

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const slugPath = slug.join('/')
  const product = await getProduct(slugPath)

  if (!product) {
    notFound()
  }

  const reviews = await getReviews(product.id)

  return (
    <ProductDetailView
      initialProduct={product}
      reviews={reviews}
      productSlug={slugPath}
    />
  )
}
