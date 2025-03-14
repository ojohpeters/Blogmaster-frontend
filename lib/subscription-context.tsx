"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Define the subscription data interface
export interface SubscriptionData {
  id: number
  plan: {
    id: number
    name: string
    price: string
    daily_limit: number
    duration: number
    description?: {
      details: string[]
    }
  }
  start_date: string
  expires_at: string
  status: string
  requests_today: number
}

// Create the context with default values
interface SubscriptionContextType {
  subscription: SubscriptionData | null
  isLoading: boolean
  hasSubscribedBefore: boolean
  hasActivePlan: boolean
  refreshSubscription: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  subscription: null,
  isLoading: true,
  hasSubscribedBefore: false,
  hasActivePlan: false,
  refreshSubscription: async () => {},
})

// Create a provider component
export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasSubscribedBefore, setHasSubscribedBefore] = useState(false)
  const [hasActivePlan, setHasActivePlan] = useState(false)

  // Function to refresh subscription data
  const refreshSubscription = async () => {
    setIsLoading(true)
    try {
      // Check if we have a token
      const token = localStorage.getItem("authToken")
      if (!token) {
        setSubscription(null)
        setIsLoading(false)
        setHasActivePlan(false)
        return
      }

      // Try to get subscription data from sessionStorage first
      const cachedSubscriptionData = sessionStorage.getItem("subscriptionData")
      const cachedSubscriptionDataTimestamp = sessionStorage.getItem("subscriptionDataTimestamp")
      const now = Date.now()

      if (
        cachedSubscriptionData &&
        cachedSubscriptionDataTimestamp &&
        now - Number(cachedSubscriptionDataTimestamp) < 3600000
      ) {
        setSubscription(JSON.parse(cachedSubscriptionData))
        setIsLoading(false)
        setHasActivePlan(JSON.parse(cachedSubscriptionData).status === "active")
        return
      }

      // If no cached data or cache expired, fetch from API
      const response = await fetch("http://127.0.0.1:8000/api/subscription/details/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const subscriptionData = await response.json()
        setSubscription(subscriptionData)
        sessionStorage.setItem("subscriptionData", JSON.stringify(subscriptionData))
        sessionStorage.setItem("subscriptionDataTimestamp", String(Date.now()))
        setHasActivePlan(subscriptionData.status === "active")
      } else {
        setSubscription(null)
        setHasActivePlan(false)
      }
    } catch (error) {
      console.error("Error fetching subscription data:", error)
      setSubscription(null)
      setHasActivePlan(false)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const checkSubscription = async () => {
      setIsLoading(true)
      try {
        const token = localStorage.getItem("authToken")
        if (!token) {
          setIsLoading(false)
          return
        }

        // Check if user has subscribed before
        const hasSubscribed = localStorage.getItem("hasSubscribedBefore") === "true"
        setHasSubscribedBefore(hasSubscribed)

        // Fetch subscription details
        await refreshSubscription()
      } finally {
        setIsLoading(false)
      }
    }

    checkSubscription()
  }, [])

  return (
    <SubscriptionContext.Provider
      value={{ subscription, isLoading, hasSubscribedBefore, hasActivePlan, refreshSubscription }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}

// Custom hook to use the subscription context
export function useSubscription() {
  return useContext(SubscriptionContext)
}

