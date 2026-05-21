import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useSession } from "next-auth/react"
import { PersonalizedProducts } from "@/components/personalized-products"
import { inventoryService } from "@/services/inventoryService"

vi.mock("@/components/product-card", () => ({
  ProductCard: ({ name }: { name: string }) => <div data-testid="recommendation-item">{name}</div>,
}))

vi.mock("@/services/inventoryService", () => ({
  inventoryService: {
    getStocksBulk: vi.fn(async () => ({})),
  },
}))

const defaultMetadata = {
  degraded: false,
  degradedReasons: [],
  source: "personalized",
  identityType: "authenticated",
  limit: 4,
  cacheTtlSeconds: 90,
  cacheHit: false,
  generatedAt: "2026-05-15T00:00:00+00:00",
}

describe("PersonalizedProducts", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useSession as any).mockReturnValue({
      data: { user: { id: 123 } },
      status: "authenticated",
    })
    ;(inventoryService.getStocksBulk as any).mockResolvedValue({})
  })

  it("shows loading state while request is in progress", () => {
    ;(global.fetch as any) = vi.fn(() => new Promise(() => {}))
    render(<PersonalizedProducts />)
    expect(screen.getByTestId("homepage-recommendation-loading")).toBeInTheDocument()
  })

  it("shows empty state when canonical API returns no items", async () => {
    ;(global.fetch as any) = vi.fn(async () => ({
      ok: true,
      json: async () => ({ items: [], metadata: defaultMetadata }),
    }))

    render(<PersonalizedProducts />)

    await waitFor(() => {
      expect(screen.getByTestId("homepage-recommendation-empty")).toBeInTheDocument()
    })
  })

  it("shows degraded indicator and items when degraded response has data", async () => {
    ;(global.fetch as any) = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        items: [{ id: 1, name: "Item A", slug: "item-a", categoryId: 1, requiresPrescription: false, status: true, price: 1000 }],
        metadata: { ...defaultMetadata, degraded: true, degradedReasons: ["inventory_filter_degraded"] },
      }),
    }))

    render(<PersonalizedProducts />)

    await waitFor(() => {
      expect(screen.getByTestId("homepage-recommendation-degraded")).toBeInTheDocument()
      expect(screen.getByTestId("homepage-recommendation-ready")).toBeInTheDocument()
      expect(screen.getAllByTestId("recommendation-item").length).toBe(1)
    })

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/ai-service/api/recommendations/home?limit=4"),
      expect.objectContaining({ cache: "no-store" })
    )
  })

  it("shows error state when request fails", async () => {
    ;(global.fetch as any) = vi.fn(async () => ({ ok: false, status: 500, statusText: "Internal Server Error" }))
    render(<PersonalizedProducts />)

    await waitFor(() => {
      expect(screen.getByTestId("homepage-recommendation-error")).toBeInTheDocument()
    })
  })
})
