"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Home, CreditCard, User, Menu, FileText, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useToast } from "@/components/ui/use-toast"
import { useUser } from "@/lib/user-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function MobileNav({ onLogout }: { onLogout?: () => void }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { user, clearUserData } = useUser()

  const publicRoutes = [
    { href: "/", label: "Home", icon: Home },
    { href: "/pricing", label: "Pricing", icon: CreditCard },
    { href: "/auth/login", label: "Login", icon: User },
  ]

  const authRoutes = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/dashboard/subscription", label: "Subscription", icon: CreditCard },
    { href: "/fetched-posts", label: "Fetched Posts", icon: FileText },
    { href: "/dashboard/profile", label: "Profile", icon: User },
    { href: "/url-paraphraser", label: "URL Paraphraser", icon: RefreshCw },
  ]

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
    // Check authentication status when component mounts or user changes
    const token = localStorage.getItem("authToken")
    if (token) {
      setIsAuthenticated(true)
    } else {
      setIsAuthenticated(false)
    }
  }, [user]) // Add user as a dependency to re-check when user changes

  if (!isMounted) {
    return null
  }

  const routes = isAuthenticated ? authRoutes : publicRoutes

  const handleLogout = async () => {
    if (onLogout) {
      onLogout()
    } else {
      // Default logout behavior
      try {
        const token = localStorage.getItem("authToken")
        const refreshToken = localStorage.getItem("refreshToken")

        if (token && refreshToken) {
          const response = await fetch("http://127.0.0.1:8000/api/users/logout/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ refresh: refreshToken }),
          })

          if (!response.ok) {
            // Still remove tokens even if logout fails on server
          }
        }
      } catch (error) {
        console.error("Error during logout:", error)
      } finally {
        // Always remove tokens from localStorage
        localStorage.removeItem("authToken")
        localStorage.removeItem("refreshToken")
        // Clear user data
        clearUserData()
        setIsAuthenticated(false)

        toast({
          title: "Logged out",
          description: "You have been successfully logged out.",
        })

        router.push("/")
      }
    }
  }

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user) return "U"
    return user.username.charAt(0).toUpperCase()
  }

  return (
    <>
      {/* Mobile Navigation */}
      <div className="fixed bottom-0 left-0 z-50 w-full border-t bg-background md:hidden">
        <div className="grid h-16 grid-cols-4">
          {routes.slice(0, 4).map((route) => {
            const Icon = route.icon
            const isActive = pathname === route.href

            return (
              <a
                key={route.href}
                href={route.href}
                className={cn(
                  "flex flex-col items-center justify-center space-y-1 text-muted-foreground transition-all duration-200 hover:text-foreground",
                  isActive && "text-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
                <span className="text-xs">{route.label}</span>
              </a>
            )
          })}
        </div>
      </div>

      {/* Mobile Menu Button (for more options) */}
      <div className="fixed right-4 top-4 z-50 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <div className="flex flex-col space-y-6 pt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">BlogMaster</h2>
                <ThemeToggle />
              </div>

              {isAuthenticated && user && (
                <div className="flex items-center space-x-3 p-4 border rounded-md">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/placeholder.svg" alt={user.username} />
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="text-sm font-medium">{user.username}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              )}

              <nav className="flex flex-col space-y-4">
                {routes.map((route) => {
                  const Icon = route.icon
                  const isActive = pathname === route.href

                  return (
                    <a
                      key={route.href}
                      href={route.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center space-x-2 rounded-md px-3 py-2 text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-accent-foreground",
                        isActive && "bg-accent text-accent-foreground",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{route.label}</span>
                    </a>
                  )
                })}
              </nav>
              {isAuthenticated && (
                <Button
                  variant="destructive"
                  className="mt-auto"
                  onClick={() => {
                    handleLogout()
                    setOpen(false)
                  }}
                >
                  Logout
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}

