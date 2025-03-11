import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Add this function to handle API responses and check for token expiration
export async function handleApiResponse(response: Response, router: any, toast: any) {
  if (response.ok) {
    return response
  }

  // Check if the response is a 401 Unauthorized, which indicates an expired token
  if (response.status === 401) {
    // Try to refresh the token
    const refreshed = await refreshToken()

    if (refreshed) {
      // If token refresh was successful, return a signal to retry the original request
      return { retryWithNewToken: true }
    } else {
      // If token refresh failed, redirect to login
      clearAuthTokens()

      toast({
        title: "Session expired",
        description: "Your session has expired. Please log in again.",
        variant: "destructive",
      })

      // Redirect to login page with return URL
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search)
      router.push(`/auth/login?returnUrl=${returnUrl}`)
      throw new Error("Session expired")
    }
  }

  // For other error types, just return the response for further handling
  return response
}

// Function to refresh the token
export async function refreshToken(): Promise<boolean> {
  try {
    const refreshToken = localStorage.getItem("refreshToken")

    if (!refreshToken) {
      return false
    }

    const response = await fetch("http://127.0.0.1:8000/api/users/token/refresh/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken }),
    })

    if (!response.ok) {
      return false
    }

    const data = await response.json()

    // Store the new access token
    if (data.access) {
      localStorage.setItem("authToken", data.access)
      return true
    }

    return false
  } catch (error) {
    console.error("Error refreshing token:", error)
    return false
  }
}

// Function to clear auth tokens
export function clearAuthTokens() {
  localStorage.removeItem("authToken")
  localStorage.removeItem("refreshToken")
  localStorage.removeItem("userData") // Also clear user data
}

// Add a function to check if user is authenticated
export function isAuthenticated() {
  if (typeof window === "undefined") return false
  return !!localStorage.getItem("authToken")
}

// Function to make authenticated API requests with automatic token refresh
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
  router: any,
  toast: any,
): Promise<Response> {
  const token = localStorage.getItem("authToken")

  if (!token) {
    throw new Error("No authentication token found")
  }

  // Add authorization header
  const authOptions = {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  }

  // Make the request
  const response = await fetch(url, authOptions)

  // Handle potential token expiration
  const handledResponse = await handleApiResponse(response, router, toast)

  // If we got a signal to retry with a new token
  if (handledResponse && "retryWithNewToken" in handledResponse) {
    // Get the new token and retry the request
    const newToken = localStorage.getItem("authToken")
    const retryOptions = {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${newToken}`,
      },
    }

    // Retry the original request with the new token
    return fetch(url, retryOptions)
  }

  return handledResponse as Response
}

// Check if user has subscribed before
export async function hasUserSubscribedBefore(router: any, toast: any): Promise<boolean> {
  try {
    const response = await fetchWithAuth("http://127.0.0.1:8000/api/users/user/", {}, router, toast)

    if (!response.ok) {
      return false
    }

    const userData = await response.json()
    return userData.has_subscribed === true
  } catch (error) {
    console.error("Error checking subscription history:", error)
    return false
  }
}

// Check if user has an active subscription
export async function hasActiveSubscription(router: any, toast: any): Promise<boolean> {
  try {
    const response = await fetchWithAuth("http://127.0.0.1:8000/api/subscription/details/", {}, router, toast)

    if (!response.ok) {
      return false
    }

    const data = await response.json()
    // Explicitly check for "active" status
    return data.status === "active"
  } catch (error) {
    console.error("Error checking active subscription:", error)
    return false
  }
}

