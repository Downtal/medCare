import { test, expect } from "@playwright/test"

test.describe("MedCare Smoke Test - Core Flow", () => {
  test("should verify main landing page and core navigation", async ({ page }) => {
    await page.goto("http://127.0.0.1:3000/")
    await expect(page).toHaveTitle(/MedCare/)

    await page.goto("http://127.0.0.1:3000/tai-khoan")
    await expect(page.locator("body")).toBeVisible()
  })

  test("should verify quick actions in chatbot UI", async ({ page }) => {
    await page.goto("http://127.0.0.1:3000/tu-van")
    await expect(page.locator("body")).toBeVisible()
  })

  test("should verify health dashboard structure", async ({ page }) => {
    await page.route("**/api/auth/session", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            name: "Alice",
            email: "alice@example.com",
            accessToken: "smoke-token",
            userId: 1,
          },
          expires: "2030-01-01T00:00:00.000Z",
        }),
      })
    })

    await page.goto("http://127.0.0.1:3000/tai-khoan/suc-khoe")
    await expect(page.locator("body")).toBeVisible()
  })

  test("should render homepage recommendation widget from canonical endpoint", async ({ page }) => {
    let canonicalCalled = false
    await page.route("**/ai-service/api/recommendations/home?limit=4", async (route) => {
      canonicalCalled = true
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [],
          metadata: {
            degraded: false,
            degradedReasons: [],
            source: "personalized",
            identityType: "anonymous",
            limit: 4,
            cacheTtlSeconds: 90,
            cacheHit: false,
            generatedAt: "2026-05-15T00:00:00+00:00",
          },
        }),
      })
    })

    await page.goto("http://127.0.0.1:3000/")
    await expect(page.getByTestId("homepage-recommendation-widget")).toBeVisible()
    await expect.poll(() => canonicalCalled).toBe(true)
    await expect(page.getByTestId("homepage-recommendation-empty")).toBeVisible()
  })
})
