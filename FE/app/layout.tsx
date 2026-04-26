import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { auth } from "@/auth"
import { AuthProvider } from "@/components/auth-provider"
import { GlobalAuthGuard } from "@/components/global-auth-guard"
import { Toaster } from "@/components/ui/sonner"
import { QueryProvider } from "@/components/providers/query-provider"
import { AIChatbot } from "@/components/chat/ai-chatbot"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MedCare - Nhà thuốc trực tuyến uy tín",
  description: "Mua thuốc online an toàn, nhanh chóng, tư vấn dược sĩ 24/7",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth()

  return (
    <html lang="vi">
      <body className={`${inter.className} font-sans antialiased`}>
        <AuthProvider session={session}>
          <QueryProvider>
            <GlobalAuthGuard>
              {children}
            </GlobalAuthGuard>
            <AIChatbot />
          </QueryProvider>
        </AuthProvider>
        <Toaster closeButton />
        <Analytics />
      </body>
    </html>
  )
}
