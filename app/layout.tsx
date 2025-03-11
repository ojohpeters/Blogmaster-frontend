import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { DesktopNav } from "@/components/desktop-nav"
import { MobileNav } from "@/components/mobile-nav"
import { SubscriptionBanner } from "@/components/ui/subscription-banner"
import { UserProvider } from "@/lib/user-context"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "BlogMaster - AI-Powered Blog Management",
  description: "Manage and optimize your WordPress blog with AI-powered tools",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <UserProvider>
            <div className="relative min-h-screen flex flex-col">
              <DesktopNav />
              <main className="flex-grow">
                {/* SubscriptionBanner will only show for authenticated users with expired subscriptions */}
                <SubscriptionBanner />
                {children}
              </main>
              <MobileNav />
            </div>
            <Toaster />
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'