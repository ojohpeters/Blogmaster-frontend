"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle } from "lucide-react"
import { isAuthenticated } from "@/lib/auth"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export default function UrlParaphraser() {
  const [url, setUrl] = useState("")
  const [paraphrasedText, setParaphrasedText] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Add subscription status check
  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      toast({
        title: "Authentication required",
        description: "Please log in to access this page.",
        variant: "destructive",
      })
      router.push("/auth/login?returnUrl=" + encodeURIComponent(window.location.pathname))
      return
    }

    // Fetch subscription status and check plan
    const checkSubscription = async () => {
      try {
        const token = localStorage.getItem("authToken")
        if (!token) return

        const response = await fetch("http://127.0.0.1:8000/api/subscription/details/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          console.log("URL Paraphraser - subscription data:", data)
          setSubscription(data)

          // Check if user has Ultimate plan - just set state, don't redirect
          if (data.status !== "active" || data.plan?.name !== "Ultimate") {
            toast({
              title: "Feature locked",
              description: "The URL Paraphraser is only available to Ultimate plan subscribers.",
              variant: "destructive",
            })
          }
        } else {
          console.error("Failed to fetch subscription details:", response.status)
          // If we can't fetch subscription details, assume no access
          toast({
            title: "Subscription check failed",
            description: "Unable to verify your subscription. Some features may be limited.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching subscription details:", error)
        toast({
          title: "Error",
          description: "An error occurred while checking your subscription.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingSubscription(false)
      }
    }

    checkSubscription()
  }, [router, toast])

  const [subscription, setSubscription] = useState<any>(null)
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true)

  const fetchSubscriptionStatus = async () => {
    setIsLoadingSubscription(true)
    try {
      const token = localStorage.getItem("authToken")
      if (!token) return

      const response = await fetch("http://127.0.0.1:8000/api/subscription/details/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("URL Paraphraser - subscription data:", data)
        setSubscription(data)
      } else {
        console.error("Failed to fetch subscription details:", response.status)
      }
    } catch (error) {
      console.error("Error fetching subscription details:", error)
    } finally {
      setIsLoadingSubscription(false)
    }
  }

  // Check if subscription is active
  const hasActivePlan = subscription?.status === "active"

  // Update the hasActivePlan check to also verify Ultimate plan
  const hasUltimatePlan = subscription?.status === "active" && subscription?.plan?.name === "Ultimate"

  // Update handleParaphrase to check subscription status
  const handleParaphrase = async () => {
    if (!url.trim()) return

    // Check if user is authenticated and has active Ultimate subscription
    if (isAuthenticated() && !hasUltimatePlan) {
      toast({
        title: "Access restricted",
        description: "The URL Paraphraser is only available to Ultimate plan subscribers.",
        variant: "destructive",
      })
      router.push("/dashboard/subscription")
      return
    }

    setIsLoading(true)
    setError("")
    setParaphrasedText("")

    try {
      const response = await fetch("/api/paraphrase-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      if (data.error) {
        // Check if error is subscription related
        if (data.error.toLowerCase().includes("subscription")) {
          toast({
            title: "Subscription required",
            description: "The URL Paraphraser is only available to Ultimate plan subscribers.",
            variant: "destructive",
          })
          router.push("/dashboard/subscription")
          return
        }

        setError(data.error)
      } else if (data.Paraphrased) {
        setParaphrasedText(data.Paraphrased)
      }
    } catch (err) {
      setError("Failed to connect to the paraphrasing service")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="container mx-auto px-4 py-10 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">URL Content Paraphraser</h1>

      {/* Add subscription warning banner */}
      {isAuthenticated() && isLoadingSubscription ? (
        <div className="flex items-center justify-center h-12 mb-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
          <span className="text-muted-foreground">Checking subscription status...</span>
        </div>
      ) : (
        isAuthenticated() &&
        !hasUltimatePlan && (
          <Card className="border-amber-300 dark:border-amber-700 mb-8">
            <CardHeader className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
              <CardTitle className="flex items-center text-amber-800 dark:text-amber-200">
                <svg
                  className="h-5 w-5 text-amber-500 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
                Premium Feature Locked
              </CardTitle>
              <CardDescription className="text-amber-700 dark:text-amber-300">
                This feature is exclusive to Ultimate plan subscribers
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
                The URL Paraphraser allows you to instantly rewrite content from any URL with our advanced AI. Upgrade
                to the Ultimate plan to unlock this powerful feature and enhance your content creation workflow.
              </p>
              {subscription && subscription.plan && subscription.plan.description && (
                <div className="bg-amber-50/50 dark:bg-amber-900/10 p-4 rounded-lg mb-4">
                  <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Ultimate Plan Features:</h4>
                  <ul className="space-y-2">
                    {subscription.plan.description.details.map((detail, index) => (
                      <li key={index} className="flex items-start text-sm text-amber-700 dark:text-amber-300">
                        <CheckCircle className="h-4 w-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex justify-center">
                <Button
                  onClick={() => router.push("/dashboard/subscription")}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Upgrade to Ultimate Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      )}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Input URL</CardTitle>
            <CardDescription>Enter the URL of the content you want to paraphrase</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              type="url"
              placeholder="https://example.com/article"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleParaphrase}
              disabled={isLoading || !url.trim() || (isAuthenticated() && !hasUltimatePlan)}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Paraphrasing...
                </>
              ) : (
                "Paraphrase URL Content"
              )}
            </Button>
          </CardFooter>
        </Card>

        {(paraphrasedText || error) && (
          <Card>
            <CardHeader>
              <CardTitle>{error ? "Error" : "Paraphrased Content"}</CardTitle>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="text-red-500">{error}</div>
              ) : (
                <div className="whitespace-pre-wrap">{paraphrasedText}</div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}

