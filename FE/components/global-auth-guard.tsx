"use client"

import { useSession, signOut } from "next-auth/react"
import { useEffect, useRef } from "react"

/**
 * GlobalAuthGuard — Mounted once at the root layout (client-side).
 *
 * Responsibilities:
 * 1. Signs out users whose NextAuth session has an error (e.g. refresh token expired).
 * 2. Patches the global `fetch` to intercept 401 responses from the API Gateway.
 *    When a user's role/status is changed or a token is revoked, the system relies on 
 *    Short-lived Access Tokens (5-10m). Once they expire, the Silent Refresh fails
 *    or the Gateway returns 401. This guard catches those 401s and forced a logout.
 */
export function GlobalAuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const isPatched = useRef(false)

  // ── Handle NextAuth session errors (e.g. refresh token expired) ─────────
  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      console.warn("[GlobalAuthGuard] Refresh token error — signing out")
      signOut({ callbackUrl: "/dang-nhap" })
    }
  }, [session])

  // ── Patch global fetch to catch 401 from the API Gateway ─────────────────
  useEffect(() => {
    if (isPatched.current || status === "loading") return
    isPatched.current = true

    const originalFetch = window.fetch.bind(window)

    window.fetch = async (...args) => {
      const response = await originalFetch(...args)

      if (response.status === 401) {
        // Only intercept API gateway calls (not NextAuth internal calls)
        const url = typeof args[0] === "string" ? args[0] : (args[0] as Request).url
        const isApiCall = url.includes("/api/") || url.includes("-service/")

        if (isApiCall && status === "authenticated") {
          console.warn("[GlobalAuthGuard] 401 detected from API — session may be stale, signing out")
          signOut({ callbackUrl: "/dang-nhap" })
        }
      }

      return response
    }

    return () => {
      // Restore original fetch on unmount
      window.fetch = originalFetch
    }
  }, [status])

  return <>{children}</>
}
