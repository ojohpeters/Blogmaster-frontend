"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, ArrowLeft, Save, RefreshCw } from "lucide-react"
import { isAuthenticated, fetchWithAuth } from "@/lib/utils"
import dynamic from "next/dynamic"

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false })

interface ParaphrasedContent {
  success?: boolean
  paraphrased_content?: string
  Post?: string
  Paraphrased?: string
  title?: string
  url?: string
  error?: string
}

export default function Paraphrase() {
  const [content, setContent] = useState("")
  const [originalTitle, setOriginalTitle] = useState("")
  const [originalUrl, setOriginalUrl] = useState("")
  const [wordLength, setWordLength] = useState([500])
  const [keyword, setKeyword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const { toast } = useToast()
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

    // Fetch subscription status
    fetchSubscriptionStatus()

    const storedContent = localStorage.getItem("paraphrasedContent")
    if (storedContent) {
      try {
        const parsedContent: ParaphrasedContent = JSON.parse(storedContent)

        // Handle different response formats including the new one
        if (parsedContent.Paraphrased) {
          setContent(parsedContent.Paraphrased)
        } else if (parsedContent.paraphrased_content) {
          setContent(parsedContent.paraphrased_content)
        } else if (parsedContent.Post) {
          setContent(parsedContent.Post)
        }

        // Set original title and URL if available
        if (parsedContent.title) {
          setOriginalTitle(parsedContent.title)
        }
        if (parsedContent.url) {
          setOriginalUrl(parsedContent.url)
        }

        setIsInitializing(false)
      } catch (error) {
        console.error("Error parsing stored content:", error)
        toast({
          title: "Error",
          description: "Failed to load paraphrased content.",
          variant: "destructive",
        })
        router.push("/make-post")
      }
    } else {
      toast({
        title: "No content found",
        description: "Please select a post to paraphrase first.",
      })
      router.push("/make-post")
    }
  }, [router, toast])

  const [subscription, setSubscription] = useState<any>(null)
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true)

  const fetchSubscriptionStatus = async () => {
    setIsLoadingSubscription(true)
    try {
      const response = await fetchWithAuth("http://127.0.0.1:8000/api/subscription/details/", {}, router, toast)

      if (response.ok) {
        const data = await response.json()
        console.log("Paraphrase page - subscription data:", data)
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

  // Update the handleParaphraseAgain function to use fetchWithAuth
  const handleParaphraseAgain = async () => {
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

    setIsLoading(true)
    try {
      const response = await fetchWithAuth(
        "http://127.0.0.1:8000/api/reparaphrase/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content,
            word_length: wordLength[0],
            keyword,
            url: originalUrl,
            title: originalTitle,
          }),
        },
        router,
        toast,
      )

      // Check for subscription-related errors
      if (!response.ok) {
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
      }

      const data = await response.json()

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
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
      } else if (data.Paraphrased) {
        setContent(data.Paraphrased)
        localStorage.setItem("paraphrasedContent", JSON.stringify(data))
        toast({
          title: "Success",
          description: "Content paraphrased successfully",
        })
      } else if (data.success || data.Post) {
        // Update content based on response format
        if (data.paraphrased_content) {
          setContent(data.paraphrased_content)
        } else if (data.Post) {
          setContent(data.Post)
        }

        // Update localStorage
        localStorage.setItem("paraphrasedContent", JSON.stringify(data))

        toast({
          title: "Success",
          description: "Content paraphrased successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to paraphrase. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Update the handleSaveAsDraft function to use fetchWithAuth
  const handleSaveAsDraft = async () => {
    setIsLoading(true)
    try {
      const response = await fetchWithAuth(
        "http://127.0.0.1:8000/api/save-draft/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content,
            title: originalTitle,
            url: originalUrl,
          }),
        },
        router,
        toast,
      )

      // Check for subscription-related errors
      if (!response.ok) {
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
      }

      const data = await response.json()

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
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Content saved as draft successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Update the handlePublish function to use fetchWithAuth
  const handlePublish = async () => {
    setIsLoading(true)
    try {
      const response = await fetchWithAuth(
        "http://127.0.0.1:8000/api/publish/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content,
            title: originalTitle,
            url: originalUrl,
          }),
        },
        router,
        toast,
      )

      const data = await response.json()

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
      } else {
        // Record this activity in the user's recent activity
        try {
          await fetchWithAuth(
            "http://127.0.0.1:8000/api/record-activity/",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                action_type: "Published",
                details: originalTitle,
                url: originalUrl,
              }),
            },
            router,
            toast,
          )
        } catch (activityError) {
          console.error("Error recording activity:", activityError)
          // Continue even if recording activity fails
        }

        toast({
          title: "Success",
          description: "Content published successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to publish. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading paraphrased content...</p>
      </div>
    )
  }

  // Add subscription warning banner
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Paraphrase</h1>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Add subscription warning banner */}
      {isLoadingSubscription ? (
        <div className="flex items-center justify-center h-12 mb-6">
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
                    Your subscription has expired. You can view content but paraphrasing again is unavailable.{" "}
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

      {originalTitle && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Original Post</CardTitle>
            <CardDescription>{originalTitle}</CardDescription>
          </CardHeader>
          {originalUrl && (
            <CardFooter className="pt-0">
              <Button variant="link" onClick={() => window.open(originalUrl, "_blank")} className="p-0">
                View original post
              </Button>
            </CardFooter>
          )}
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Paraphrased Content</CardTitle>
          <CardDescription>Edit and refine the paraphrased content</CardDescription>
        </CardHeader>
        <CardContent>
          <MDEditor value={content} onChange={(value) => setContent(value || "")} preview="live" height={400} />
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleSaveAsDraft} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            Save as Draft
          </Button>
          <Button variant="default" onClick={handlePublish} disabled={isLoading}>
            <ArrowLeft className="h-4 w-4 mr-2 rotate-90" />
            Publish
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Paraphrase Again</CardTitle>
          <CardDescription>Adjust parameters and paraphrase the content again</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="wordLength" className="text-sm font-medium">
              Word Length: {wordLength[0]}
            </label>
            <Slider id="wordLength" min={100} max={1000} step={50} value={wordLength} onValueChange={setWordLength} />
          </div>
          <div className="space-y-2">
            <label htmlFor="keyword" className="text-sm font-medium">
              Keyword
            </label>
            <Input
              id="keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Enter a keyword"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleParaphraseAgain} disabled={isLoading || !hasActivePlan} className="w-full">
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Paraphrasing...
              </>
            ) : (
              "Paraphrase Again"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

