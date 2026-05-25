"use client"

import { useSession, signOut } from "next-auth/react"
import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { toast } from "sonner"

/**
 * GlobalAuthGuard — Mounted once at the root layout (client-side).
 *
 * Responsibilities:
 * 1. Signs out users whose NextAuth session has an error (e.g. refresh token expired).
 * 2. Patches the global `fetch` to intercept 401 responses from the API Gateway.
 * 3. Proactively verifies session validity on F5 or route change.
 */
export function GlobalAuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const isPatched = useRef(false)
  const pathname = usePathname()
  const isLoggingOut = useRef(false)

  const handleForcedLogout = () => {
    if (isLoggingOut.current) return
    isLoggingOut.current = true

    toast.error("Phiên đăng nhập đã kết thúc", {
      description: "Tài khoản của bạn đã bị đăng xuất hoặc phiên đăng nhập của bạn đã hết hạn."
    })

    setTimeout(() => {
      signOut({ callbackUrl: "/dang-nhap" })
    }, 3000)
  }

  // ── Handle NextAuth session errors (e.g. refresh token expired) ─────────
  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      console.warn("[GlobalAuthGuard] Refresh token error — signing out")
      handleForcedLogout()
    }
  }, [session])

  // ── Proactively verify session with backend on F5 or route change ──────
  useEffect(() => {
    if (status === "authenticated") {
      fetch('/api/auth/verify-session')
        .then(res => {
          if (res.status === 401) {
            console.warn("[GlobalAuthGuard] Session revoked by server — signing out")
            handleForcedLogout()
          }
        })
        .catch(err => console.error("verify-session failed:", err))
    }
  }, [status, pathname])

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
          handleForcedLogout()
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
