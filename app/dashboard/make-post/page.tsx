"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, ExternalLink } from "lucide-react"

export default function MakePost() {
  const [posts, setPosts] = useState<{ title: string; url: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isParaphrasing, setIsParaphrasing] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Get access token from localStorage or session
    const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken")
    setAccessToken(token)
  }, [])

  const fetchUrls = async () => {
    setIsLoading(true)
    try {
      if (!accessToken) {
        toast({
          title: "Authentication required",
          description: "Please log in to fetch posts.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("http://127.0.0.1:5000/latest_posts", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      })

      if (response.status === 401) {
        toast({
          title: "Authentication error",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        })
        return
      }

      if (!response.ok) {
        throw new Error("Failed to fetch posts")
      }

      const data = await response.json()
      const postsArray = Object.entries(data).map(([title, url]) => ({ title, url: url as string }))
      setPosts(postsArray)
      toast({
        title: "Posts fetched successfully",
        description: `Retrieved ${postsArray.length} posts.`,
      })
    } catch (error) {
      // Only show one error message
      toast({
        title: "Error fetching posts",
        description:
          error instanceof Error ? error.message : "An error occurred while fetching posts. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleParaphrase = async (title: string, url: string) => {
    setIsParaphrasing(true)
    try {
      if (!accessToken) {
        toast({
          title: "Authentication required",
          description: "Please log in to paraphrase content.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("http://127.0.0.1:5000/paraphrase", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, url }),
      })

      if (response.status === 401) {
        toast({
          title: "Authentication error",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        })
        return
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        if (errorData && errorData.error) {
          throw new Error(errorData.error)
        } else {
          throw new Error("Failed to paraphrase")
        }
      }

      const data = await response.json()

      // Don't throw an error here, just handle it directly
      if (data.error) {
        toast({
          title: "Paraphrasing error",
          description: data.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Paraphrasing successful",
        description: "The post has been paraphrased successfully.",
      })
    } catch (error) {
      // Only show one error message
      toast({
        title: "Error paraphrasing",
        description: error instanceof Error ? error.message : "An error occurred while paraphrasing. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsParaphrasing(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Make Post</h2>
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
                      disabled={isParaphrasing}
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

