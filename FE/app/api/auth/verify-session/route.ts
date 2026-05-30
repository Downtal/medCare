import { auth } from "@/auth"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()

  if (!session?.user?.accessToken) {
    return NextResponse.json({ error: "No active session" }, { status: 401 })
  }

  const internalApiBase =
    process.env.INTERNAL_API_BASE_URL || "http://127.0.0.1:8080"

  try {
    const res = await fetch(`${internalApiBase}/user-service/api/users/profiles/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (res.status === 401 || res.status === 403) {
      return NextResponse.json(
        { error: "Session revoked by server" },
        { status: 401 }
      )
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: "Backend verification failed", status: res.status },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err) {
    console.error("[verify-session] Backend unreachable:", err)
    return NextResponse.json({ error: "Backend unreachable" }, { status: 500 })
  }
}
