import { auth } from "@/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Routes that require authentication
const protectedRoutes = ["/tai-khoan", "/don-hang", "/toa-thuoc", "/thanh-toan"]

export async function proxy(request: NextRequest) {
  const session = await auth()
  const { pathname } = request.nextUrl
  const isAuthenticated = !!session?.user

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // If token expired and refresh failed, ONLY redirect if the route is protected.
  // For public routes like "/", we just let them browse as a guest.
  if (session?.error === "RefreshAccessTokenError" && isProtected) {
    const loginUrl = new URL("/dang-nhap", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Block unauthenticated users from protected routes
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/dang-nhap", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect already-logged-in users away from auth pages (only if no error)
  if (isAuthenticated && !session?.error && (pathname === "/dang-nhap" || pathname === "/dang-ky")) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon|public).*)"],
}
