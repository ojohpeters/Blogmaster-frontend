"use client"

import type React from "react"
import { useState, useEffect, useContext, createContext } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { fetchWithAuth, clearAuthTokens } from "@/lib/utils"

// Create a context for logout functionality
const LogoutContext = createContext<(() => void) | undefined>(undefined)

// Create a context for user data
export const UserContext = createContext<{
  hasSubscribedBefore: boolean
  hasActivePlan: boolean
}>({
  hasSubscribedBefore: false,
  hasActivePlan: false,
})

export const useLogout = () => useContext(LogoutContext)
export const useUserSubscription = () => useContext(UserContext)

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasSubscribedBefore, setHasSubscribedBefore] = useState(false)
  const [hasActivePlan, setHasActivePlan] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Update the checkAuth function to better handle subscription status
    const checkAuth = async () => {
      const token = localStorage.getItem("authToken")
      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please log in to access the dashboard.",
          variant: "destructive",
        })
        router.push("/auth/login")
        return
      }

      try {
        // First, check user profile to see if they've subscribed before
        const userResponse = await fetchWithAuth("http://127.0.0.1:8000/api/users/user/", {}, router, toast)

        if (!userResponse.ok) {
          throw new Error(`API request failed with status ${userResponse.status}`)
        }

        const userData = await userResponse.json()

        // Check if user has subscribed before
        setHasSubscribedBefore(userData.has_subscribed)

        // If user has never subscribed before, redirect to pricing
        if (!userData.has_subscribed) {
          toast({
            title: "Subscription required",
            description: "Please subscribe to access the dashboard features.",
            variant: "destructive",
          })
          router.push("/pricing")
          return
        }

        // Check current subscription status
        try {
          const subscriptionResponse = await fetchWithAuth(
            "http://127.0.0.1:8000/api/subscription/details/",
            {},
            router,
            toast,
          )

          if (subscriptionResponse.ok) {
            const subscriptionData = await subscriptionResponse.json()
            console.log("Dashboard layout - subscription data:", subscriptionData)
            // Explicitly check for "active" status
            setHasActivePlan(subscriptionData.status === "active")
          } else {
            console.error("Failed to fetch subscription details:", subscriptionResponse.status)
            // If subscription details API fails, assume no active plan
            setHasActivePlan(false)
          }
        } catch (error) {
          console.error("Error checking subscription status:", error)
          // If there's an error checking subscription, assume no active plan
          setHasActivePlan(false)
        }

        // Allow access to dashboard regardless of current subscription status
        // as long as they've subscribed before
        setIsLoading(false)
      } catch (error) {
        console.error("Authentication check error:", error)
        // If the error is not "Session expired", show a generic error message
        if (!(error instanceof Error && error.message === "Session expired")) {
          toast({
            title: "Error",
            description: "Something went wrong. Please try again.",
            variant: "destructive",
          })
          router.push("/auth/login")
        }
      }
    }

    checkAuth()
  }, [router, toast])

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("authToken")
      const refreshToken = localStorage.getItem("refreshToken")

      if (token && refreshToken) {
        await fetchWithAuth(
          "http://127.0.0.1:8000/api/users/logout/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ refresh: refreshToken }),
          },
          router,
          toast,
        )
      }
    } catch (error) {
      console.error("Error during logout:", error)
    } finally {
      // Always remove tokens from localStorage
      clearAuthTokens()

      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      })

      router.push("/")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <LogoutContext.Provider value={handleLogout}>
      <UserContext.Provider value={{ hasSubscribedBefore, hasActivePlan }}>
        <div className="flex flex-col min-h-screen">
          <main className="flex-grow container mx-auto px-4 py-8">{children}</main>
        </div>
      </UserContext.Provider>
    </LogoutContext.Provider>
  )
}

