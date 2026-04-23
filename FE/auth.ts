import NextAuth, { type NextAuthConfig } from "next-auth"
import { getApiBaseUrl } from "@/lib/config"
import Credentials from "next-auth/providers/credentials"
import { CredentialsSignin } from "next-auth"

class CustomAuthError extends CredentialsSignin {
  constructor(code: string) {
    super()
    this.code = code
  }
}

function mapLoginErrorCode(message: string) {
  const normalized = message.toLowerCase()

  if (normalized.includes("chưa được xác thực")) {
    const match = message.match(/\((.*?)\)/)
    if (match) {
      return `PENDING_VERIFICATION:${match[1]}`
    }
    return "PENDING_VERIFICATION"
  }

  if (normalized.includes("bị khóa")) {
    return "ACCOUNT_BLOCKED"
  }

  return "INVALID_CREDENTIALS"
}

const BACKEND_URL = `${getApiBaseUrl()}/auth-service/api/auth`
// Access token expires in 10 minutes (600s) → refresh ~3 min before expiry
const TOKEN_REFRESH_BUFFER_SECONDS = 180 // Refresh 3 minutes before expiry

// Persistent cache across HMR in development mode
const globalForAuth = global as unknown as {
  pendingRefreshes: Map<string, Promise<any>>
  rotatedTokens: Map<string, any>
}

const pendingRefreshes = globalForAuth.pendingRefreshes || new Map<string, Promise<any>>()
const rotatedTokens = globalForAuth.rotatedTokens || new Map<string, any>()

if (process.env.NODE_ENV !== "production") {
  globalForAuth.pendingRefreshes = pendingRefreshes
  globalForAuth.rotatedTokens = rotatedTokens
}

async function refreshAccessToken(refreshToken: string) {
  // 1. Check if we recently refreshed this specific token
  if (rotatedTokens.has(refreshToken)) {
    console.log("Token was already rotated recently, returning cached result.")
    return rotatedTokens.get(refreshToken)
  }

  // 2. If a refresh is already in progress for this token, return the existing promise
  if (pendingRefreshes.has(refreshToken)) {
    console.log("Parallel refresh detected, joining existing promise...")
    return pendingRefreshes.get(refreshToken)
  }

  const refreshPromise = (async () => {
    try {
      if (!refreshToken) {
        throw new Error("No refresh token provided");
      }
      console.log("Attempting silent refresh with token:", refreshToken.slice(0, 10) + "...")

      // Timeout after 5s to prevent middleware from blocking for 30+ seconds
      // when the backend is down (ECONNREFUSED scenario)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const res = await fetch(`${BACKEND_URL}/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (!res.ok) {
        let errorMsg = "Refresh failed"
        try {
          const errData = await res.json()
          errorMsg = errData.message || `Status: ${res.status}`
        } catch {
          errorMsg = `Status: ${res.status}`
        }

        // HEURISTIC: If backend says "already used" but we find this token in our cache
        // it means the cache entry just expired or we missed a race. 
        // We check the cache again just in case it was populated while we were fetching.
        if (rotatedTokens.has(refreshToken)) {
          console.log("Token rotated during failed fetch, recovering from cache.")
          return rotatedTokens.get(refreshToken)
        }

        console.warn("Silent refresh failed:", errorMsg)
        throw new Error(errorMsg)
      }

      const data = await res.json()
      console.log("Silent refresh successful, new expiration in:", data.expiresIn, "sec")

      const result = {
        accessToken: data.accessToken as string,
        refreshToken: (data.refreshToken ?? refreshToken) as string,
        accessTokenExpires: Math.floor(Date.now() / 1000) + (data.expiresIn as number),
        error: undefined,
      }

      // Store in rotation cache for a longer period (60s)
      rotatedTokens.set(refreshToken, result)
      setTimeout(() => rotatedTokens.delete(refreshToken), 60000)

      return result
    } catch (error: any) {
      console.error("RefreshAccessTokenError details:", error.message || error)
      return { error: "RefreshAccessTokenError" }
    } finally {
      // Clear the promise from the map when done
      pendingRefreshes.delete(refreshToken)
    }
  })()

  pendingRefreshes.set(refreshToken, refreshPromise)
  return refreshPromise
}

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null
        try {
          const res = await fetch(`${BACKEND_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password,
            }),
          })
          if (!res.ok) {
            let errorMessage = "Đăng nhập thất bại"
            try {
              const errorData = await res.json()
              errorMessage = errorData.message || errorMessage
            } catch {
              // fallback if not json
            }
            throw new CustomAuthError(mapLoginErrorCode(errorMessage))
          }
          const data = await res.json()
          return {
            id: data.username,
            name: data.fullName || data.username,
            email: data.email || data.username,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            // expiresIn is in seconds from backend
            accessTokenExpires: Math.floor(Date.now() / 1000) + (data.expiresIn ?? 3600),
            username: data.username,
            userId: data.userId, // Re-added
            fullName: data.fullName,
            role: data.role,
            phone: (data as any).phone,
          }
        } catch (error) {
          throw error
        }
      },
    }),
  ],

  callbacks: {
    // Called when JWT is created/updated — store backend tokens here
    async jwt({ token, user, trigger, session }) {
      // Manual trigger from client: update(...)
      if (trigger === "update" && session?.user) {
        return {
          ...token,
          fullName: session.user.fullName ?? token.fullName,
          name: session.user.name ?? token.name,
          email: session.user.email ?? token.email,
        }
      }

      // Initial sign in: copy backend response into JWT
      if (user) {
        return {
          ...token,
          accessToken: (user as any).accessToken,
          refreshToken: (user as any).refreshToken,
          accessTokenExpires: (user as any).accessTokenExpires,
          username: (user as any).username,
          userId: (user as any).userId,
          fullName: (user as any).fullName,
          role: (user as any).role,
          phone: (user as any).phone,
          name: (user as any).fullName || (user as any).username,
          error: undefined,
        }
      }

      // Token still valid → return as-is
      const nowSec = Math.floor(Date.now() / 1000)
      const expiresSec = Number(token.accessTokenExpires ?? 0)
      if (Number.isFinite(expiresSec) && nowSec < expiresSec - TOKEN_REFRESH_BUFFER_SECONDS) {
        return token
      }

      // Access token expired → try refresh
      const refreshed = await refreshAccessToken(token.refreshToken as string)
      if (refreshed.error) {
        // If refresh failed because token doesn't exist or is invalid, sign out the user
        // By returning the token with an error, the client-side AuthProvider will trigger a signOut()
        console.warn("Refresh failed, passing error to session")
        return { ...token, error: "RefreshAccessTokenError" }
      }
      return {
        ...token,
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken ?? token.refreshToken,
        accessTokenExpires: refreshed.accessTokenExpires,
        error: undefined,
      }
    },

    // Expose safe fields to client-side `useSession()`
    async session({ session, token }) {
      session.user.accessToken = token.accessToken as string
      session.user.userId = token.userId as number
      session.user.id = String(token.userId) // Ensure default id is populated
      session.user.username = token.username as string
      session.user.fullName = token.fullName as string
      session.user.role = token.role as string
      (session.user as any).phone = token.phone as string
      session.error = token.error as string | undefined
      return session
    },
  },

  pages: {
    signIn: "/dang-nhap",
    error: "/dang-nhap",
  },

  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days (matches refresh token)
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET,
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
