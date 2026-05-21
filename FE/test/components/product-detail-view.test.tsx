import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ProductDetailView } from "@/components/product-detail-view"

vi.mock("@/components/header", () => ({ Header: () => <div /> }))
vi.mock("@/components/footer", () => ({ Footer: () => <div /> }))
vi.mock("@/components/product-reviews", () => ({ ProductReviews: () => <div /> }))
vi.mock("@/components/product-card", () => ({
  ProductCard: ({ name }: { name: string }) => <div data-testid="related-item">{name}</div>,
}))
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))
vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
}))
vi.mock("@/components/ui/card", () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}))
vi.mock("@/components/ui/accordion", () => ({
  Accordion: ({ children }: any) => <div>{children}</div>,
  AccordionContent: ({ children }: any) => <div>{children}</div>,
  AccordionItem: ({ children }: any) => <div>{children}</div>,
  AccordionTrigger: ({ children }: any) => <div>{children}</div>,
}))
vi.mock("@/lib/store/useCartStore", () => ({
  useCartStore: (selector: any) =>
    selector({
      addItem: vi.fn(),
    }),
}))
vi.mock("@/lib/store/useCartAnimationStore", () => ({
  useCartAnimationStore: (selector: any) =>
    selector({
      addAnimation: vi.fn(),
    }),
}))
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    custom: vi.fn(),
    dismiss: vi.fn(),
  },
}))
vi.mock("uuid", () => ({ v4: () => "test-id" }))
vi.mock("isomorphic-dompurify", () => ({
  default: {
    sanitize: (value: string) => value,
  },
}))
vi.mock("@/services/inventoryService", () => ({
  inventoryService: {
    getProductStock: vi.fn(async () => 10),
  },
}))

const baseProduct = {
  id: 100,
  name: "Seed Product",
  slug: "seed-product",
  categoryId: 10,
  requiresPrescription: false,
  status: true,
  price: 120000,
}

const metadata = {
  degraded: false,
  degradedReasons: [],
  source: "related",
  limit: 5,
  cacheTtlSeconds: 90,
  cacheHit: false,
  generatedAt: "2026-05-15T00:00:00+00:00",
  seedProductId: 100,
}

describe("ProductDetailView related recommendation states", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows loading state while related API is pending", () => {
    ;(global.fetch as any) = vi.fn(() => new Promise(() => {}))
    render(<ProductDetailView initialProduct={baseProduct as any} reviews={[]} productSlug="seed-product" />)
    expect(screen.getByTestId("related-recommendation-loading")).toBeInTheDocument()
  })

  it("shows empty state when related API returns no items", async () => {
    ;(global.fetch as any) = vi.fn(async () => ({
      ok: true,
      json: async () => ({ items: [], metadata }),
    }))

    render(<ProductDetailView initialProduct={baseProduct as any} reviews={[]} productSlug="seed-product" />)

    await waitFor(() => {
      expect(screen.getByTestId("related-recommendation-empty")).toBeInTheDocument()
    })
  })

  it("shows degraded indicator with ready items", async () => {
    ;(global.fetch as any) = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        items: [{ id: 1, name: "Related A", slug: "related-a", categoryId: 10, requiresPrescription: false, status: true, price: 1000 }],
        metadata: { ...metadata, degraded: true, degradedReasons: ["inventory_filter_degraded"] },
      }),
    }))

    render(<ProductDetailView initialProduct={baseProduct as any} reviews={[]} productSlug="seed-product" />)

    await waitFor(() => {
      expect(screen.getByTestId("related-recommendation-degraded")).toBeInTheDocument()
      expect(screen.getByTestId("related-recommendation-ready")).toBeInTheDocument()
      expect(screen.getAllByTestId("related-item").length).toBeGreaterThan(0)
    })
  })

  it("shows error state when related API request fails", async () => {
    ;(global.fetch as any) = vi.fn(async () => ({ ok: false, status: 500, statusText: "Internal Server Error" }))
    render(<ProductDetailView initialProduct={baseProduct as any} reviews={[]} productSlug="seed-product" />)

    await waitFor(() => {
      expect(screen.getByTestId("related-recommendation-error")).toBeInTheDocument()
    })
  })
})
