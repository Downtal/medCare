"use client"

import { signOut } from "next-auth/react"

import { getApiBaseUrl } from "@/lib/config"

export async function logoutUser(accessToken?: string, callbackUrl = "/dang-nhap") {
  if (accessToken) {
    try {
      await fetch(`${getApiBaseUrl()}/auth-service/api/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
    } catch (error) {
      console.error("Backend logout failed:", error)
    }
  }

  await signOut({ callbackUrl })
}
