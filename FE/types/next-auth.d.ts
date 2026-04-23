import NextAuth from "next-auth"

// Extend NextAuth types to include our custom fields
declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null
      email?: string | null
      image?: string | null
      accessToken?: string
      username?: string
      fullName?: string
      role?: string
      userId?: number
    }
    error?: string
  }

  interface User {
    accessToken?: string
    refreshToken?: string
    accessTokenExpires?: number
    username?: string
    fullName?: string
    role?: string
    userId?: number
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    accessTokenExpires?: number
    username?: string
    fullName?: string
    role?: string
    userId?: number
    error?: string
  }
}
