"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, ExternalLink, ArrowRight } from "lucide-react"
import { isAuthenticated, fetchWithAuth } from "@/lib/utils"
import { useUser } from "@/lib/user-context"

export default function MakePost() {
  const [posts, setPosts] = useState<{ title: string; url: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isParaphrasing, setIsParaphrasing] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true)
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useUser()

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

    // Get access token from localStorage
    const token = localStorage.getItem("authToken")
    setAccessToken(token)

    // Fetch subscription details
    fetchSubscriptionDetails()
  }, [router, toast])

  const fetchSubscriptionDetails = async () => {
    setIsLoadingSubscription(true)
    try {
      const response = await fetchWithAuth("http://127.0.0.1:8000/api/subscription/details/", {}, router, toast)

      if (response.ok) {
        const data = await response.json()
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

  // Add error handling for subscription-related errors
  const fetchUrls = async () => {
    setIsLoading(true)
    try {
      const response = await fetchWithAuth(
        "http://127.0.0.1:8000/api/fetch-news/",
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
        router,
        toast,
      )

      if (!response.ok) {
        // Check for subscription-related errors
        if (response.status === 403) {
          const errorData = await response.json()
          if (errorData.detail && errorData.detail.includes("subscription")) {
            toast({
              title: "Subscription required",
              description: "Your subscription has expired. Please renew to use this feature.",
              variant: "destructive",
            })
            router.push("/dashboard/subscription")
            return
          }
        }
        // Don't throw an error here, just return to avoid double error messages
        return
      }

      const data = await response.json()
      const postsArray = Object.entries(data).map(([title, url]) => ({ title, url: url as string }))
      setPosts(postsArray)
      toast({
        title: "Posts fetched successfully",
        description: `Retrieved ${postsArray.length} posts.`,
      })
    } catch (error) {
      // Only show error message if it wasn't already handled
      if (!(error instanceof Error && error.message === "Session expired")) {
        toast({
          title: "Error fetching posts",
          description: "An error occurred while fetching posts. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Update the handleParaphrase function to properly check subscription status
  const handleParaphrase = async (title: string, url: string) => {
    // Check if user has active plan before making the request
    if (!hasActivePlan) {
      toast({
        title: "Subscription required",
        description: "Your subscription has expired. Please renew to use this feature.",
        variant: "destructive",
      })
      router.push("/dashboard/subscription")
      return
    }

    setIsParaphrasing(true)
    try {
      const response = await fetchWithAuth(
        "http://127.0.0.1:8000/api/paraphrase/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title, url }),
        },
        router,
        toast,
      )

      if (!response.ok) {
        // Check for subscription-related errors
        if (response.status === 403) {
          const errorData = await response.json()
          if (errorData.detail && errorData.detail.includes("subscription")) {
            toast({
              title: "Subscription required",
              description: "Your subscription has expired. Please renew to use this feature.",
              variant: "destructive",
            })
            router.push("/dashboard/subscription")
            return
          }
        }

        // Don't throw an error here, just return to avoid double error messages
        return
      }

      const data = await response.json()

      // Don't throw an error here, just handle it directly
      if (data.error) {
        // Check if error is subscription related
        if (data.error.toLowerCase().includes("subscription")) {
          toast({
            title: "Subscription required",
            description: "Your subscription has expired. Please renew to use this feature.",
            variant: "destructive",
          })
          router.push("/dashboard/subscription")
          return
        }

        toast({
          title: "Paraphrasing error",
          description: data.error,
          variant: "destructive",
        })
        return
      }

      // Store the paraphrased content in localStorage
      localStorage.setItem("paraphrasedContent", JSON.stringify(data))

      // Redirect to the paraphrase page
      router.push("/paraphrase")
    } catch (error) {
      // Only show error message if it wasn't already handled
      if (!(error instanceof Error && error.message === "Session expired")) {
        toast({
          title: "Error paraphrasing",
          description: "An error occurred while paraphrasing. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsParaphrasing(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Make Post</h2>

      {/* Add information card about fetched-posts page */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-blue-800 dark:text-blue-200">Pro Tip: Quick Paraphrasing</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-700 dark:text-blue-300">
            Looking for a faster way to paraphrase your posts? Check out the Fetched Posts page where you can directly
            paraphrase your content without additional steps.
          </p>
        </CardContent>
        <CardFooter>
          <Link href="/fetched-posts">
            <Button
              variant="outline"
              className="text-blue-600 dark:text-blue-300 border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800/50"
            >
              Go to Fetched Posts
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardFooter>
      </Card>

      {/* Show warning for expired subscription */}
      {isLoadingSubscription ? (
        <div className="flex items-center justify-center h-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
          <span className="text-muted-foreground">Checking subscription status...</span>
        </div>
      ) : (
        !hasActivePlan && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-amber-400"
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
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">Subscription expired</h3>
                <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                  <p>
                    Your subscription has expired. You can view posts but paraphrasing is unavailable.{" "}
                    <a
                      href="/dashboard/subscription"
                      className="font-medium underline hover:text-amber-800 dark:hover:text-amber-100"
                    >
                      Renew now
                    </a>{" "}
                    to regain full access.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      )}

      <Card>
        <CardHeader>
          <CardTitle>Fetch Posts</CardTitle>
          <CardDescription>Retrieve the latest posts from your WordPress blog</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchUrls} disabled={isLoading} title={!accessToken ? "Please log in to fetch posts" : ""}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fetching...
              </>
            ) : (
              "Get Posts"
            )}
          </Button>
          {!accessToken && (
            <p className="text-sm text-muted-foreground mt-2">You need to be logged in to fetch posts.</p>
          )}
        </CardContent>
      </Card>
      {posts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Latest Posts</CardTitle>
            <CardDescription>View or paraphrase your recent posts</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-6">
              {posts.map((post, index) => (
                <li key={index} className="flex flex-col space-y-2">
                  <div className="flex flex-col space-y-1">
                    <h3 className="font-medium line-clamp-2">{post.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">{post.url}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-grow sm:flex-grow-0"
                      onClick={() => window.open(post.url, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Post
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-grow sm:flex-grow-0"
                      onClick={() => handleParaphrase(post.title, post.url)}
                      disabled={isParaphrasing || !hasActivePlan}
                    >
                      {isParaphrasing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Paraphrasing...
                        </>
                      ) : (
                        "Paraphrase"
                      )}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

