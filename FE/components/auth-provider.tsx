"use client"

import { SessionProvider, signOut } from "next-auth/react"
import type { Session } from "next-auth"
import { useEffect } from "react"

export function AuthProvider({
  children,
  session,
}: {
  children: React.ReactNode
  session?: Session | null
}) {
  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      console.warn("Refresh token expired or invalid, signing out...")
      signOut({ callbackUrl: "/dang-nhap" })
    }
  }, [session])

  return <SessionProvider session={session}>{children}</SessionProvider>
}
