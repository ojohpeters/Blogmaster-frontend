"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useUser } from "@/lib/user-context"

interface DesktopNavProps {
  onLogout?: () => void
}

export function DesktopNav({ onLogout }: DesktopNavProps) {
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { user, clearUserData } = useUser()

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

  const publicRoutes = [
    { href: "/", label: "Home" },
    { href: "/pricing", label: "Pricing" },
  ]

  const authRoutes = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/make-post", label: "Make Post" },
    { href: "/fetched-posts", label: "Fetched Posts" },
    { href: "/dashboard/subscription", label: "Subscription" },
    { href: "/url-paraphraser", label: "URL Paraphraser" },
  ]

  const routes = isAuthenticated ? authRoutes : publicRoutes

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user) return "U"
    return user.username.charAt(0).toUpperCase()
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="hidden items-center space-x-2 md:flex">
            <span className="hidden font-bold sm:inline-block">BlogMaster</span>
          </Link>
          <nav className="hidden gap-6 md:flex">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  pathname === route.href && "text-foreground",
                )}
              >
                {route.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg" alt={user?.username || "User"} />
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.username || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email || "user@example.com"}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm">Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

