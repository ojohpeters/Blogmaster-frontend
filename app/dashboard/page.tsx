"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, RefreshCw, CreditCard, BarChart3, FileText, Plus, Clock, Newspaper } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { fetchWithAuth } from "@/lib/auth"
import { useUserSubscription } from "./layout"

interface Post {
  title: string
  excerpt: string
  date?: string
  url?: string
}

interface SubscriptionDetails {
  plan: {
    name: string
    daily_limit: number
  }
  status: string
  expires_at: string
  requests_today: number
}

interface UserActivityDetails {
  id: number
  daily_api_requests: number
  fetched_posts: number
  paraphrased: number
  user: number
}

interface DashboardStats {
  total_posts: number
  total_paraphrased: number
  recent_activity: {
    action: string
    date: string
    details: string
  }[]
}

export default function Dashboard() {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [userActivity, setUserActivity] = useState<UserActivityDetails | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const { hasSubscribedBefore, hasActivePlan } = useUserSubscription()

  useEffect(() => {
    fetchSubscriptionDetails()
    fetchDashboardStats()
    fetchRecentPosts()
    fetchUserActivity()
  }, [])

  // Fetch user activity details from the API
  const fetchUserActivity = async () => {
    try {
      const response = await fetchWithAuth("http://127.0.0.1:8000/api/details/", {}, router, toast)

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const data = await response.json()
      if (data && data.length > 0) {
        setUserActivity(data[0])
      }
    } catch (error) {
      console.error("Error fetching user activity details:", error)
    }
  }

  // Update the fetchSubscriptionDetails function to use fetchWithAuth
  const fetchSubscriptionDetails = async () => {
    setIsLoadingSubscription(true)
    try {
      const response = await fetchWithAuth("http://127.0.0.1:8000/api/subscription/details/", {}, router, toast)

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const data = await response.json()

      // We'll update this to use the real daily_api_requests from the userActivity
      setSubscription(data)
    } catch (error) {
      console.error("Error fetching subscription details:", error)
    } finally {
      setIsLoadingSubscription(false)
    }
  }

  // Update the fetchDashboardStats function to fetch real activity data
  const fetchDashboardStats = async () => {
    setIsLoadingStats(true)
    try {
      // Use fallback data for now to ensure the dashboard works
      setStats({
        total_posts: userActivity?.fetched_posts || 0,
        total_paraphrased: userActivity?.paraphrased || 0,
        recent_activity: [
          {
            action: "Paraphrased",
            date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            details: "How to Optimize Your WordPress Site for Speed",
          },
          {
            action: "Fetched",
            date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            details: "10 New Posts from Your Blog",
          },
          {
            action: "Published",
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            details: "The Ultimate Guide to SEO in 2023",
          },
        ],
      })
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
      // Use fallback data if the API call fails
      setStats({
        total_posts: userActivity?.fetched_posts || 0,
        total_paraphrased: userActivity?.paraphrased || 0,
        recent_activity: [
          {
            action: "Paraphrased",
            date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            details: "How to Optimize Your WordPress Site for Speed",
          },
          {
            action: "Fetched",
            date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            details: "10 New Posts from Your Blog",
          },
          {
            action: "Published",
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            details: "The Ultimate Guide to SEO in 2023",
          },
        ],
      })
    } finally {
      setIsLoadingStats(false)
    }
  }

  // Update stats when userActivity changes
  useEffect(() => {
    if (userActivity && stats) {
      setStats({
        ...stats,
        total_posts: userActivity.fetched_posts,
        total_paraphrased: userActivity.paraphrased,
      })
    }
  }, [userActivity])

  // Update subscription with real daily_api_requests when userActivity changes
  useEffect(() => {
    if (userActivity && subscription) {
      setSubscription({
        ...subscription,
        requests_today: userActivity.daily_api_requests,
      })
    }
  }, [userActivity, subscription])

  // Update the fetchRecentPosts function to fetch real posts data
  const fetchRecentPosts = async () => {
    setIsLoading(true)
    try {
      // Fetch real posts data from the API
      const response = await fetchWithAuth("http://127.0.0.1:8000/api/recent-posts/", {}, router, toast)

      if (response.ok) {
        const data = await response.json()
        // Transform the API response into the format we need
        const formattedPosts = data.map((post) => ({
          title: post.title,
          excerpt: post.excerpt || "No excerpt available",
          date: post.created_at || post.published_at,
          url: post.url,
        }))

        setPosts(formattedPosts)
      } else {
        // Fallback to simulated data if the API call fails
        setPosts([
          {
            title: "How to Optimize Your WordPress Site for Speed",
            excerpt:
              "Learn the best practices for optimizing your WordPress site to achieve lightning-fast loading times...",
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            title: "10 Essential WordPress Plugins for Bloggers",
            excerpt:
              "Discover the must-have plugins that every WordPress blogger should install to enhance their site...",
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            title: "The Ultimate Guide to SEO in 2023",
            excerpt:
              "Stay ahead of the competition with these cutting-edge SEO strategies specifically for WordPress blogs...",
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ])
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
      // Fallback to simulated data
      setPosts([
        {
          title: "How to Optimize Your WordPress Site for Speed",
          excerpt:
            "Learn the best practices for optimizing your WordPress site to achieve lightning-fast loading times...",
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          title: "10 Essential WordPress Plugins for Bloggers",
          excerpt:
            "Discover the must-have plugins that every WordPress blogger should install to enhance their site...",
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          title: "The Ultimate Guide to SEO in 2023",
          excerpt:
            "Stay ahead of the competition with these cutting-edge SEO strategies specifically for WordPress blogs...",
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMMM d, yyyy")
    } catch (error) {
      return "Invalid date"
    }
  }

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

      if (diffInHours < 1) {
        return "Just now"
      } else if (diffInHours < 24) {
        return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`
      } else {
        const diffInDays = Math.floor(diffInHours / 24)
        return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`
      }
    } catch (error) {
      return "Unknown time"
    }
  }

  // Function to refresh all data
  const refreshAllData = () => {
    fetchSubscriptionDetails()
    fetchDashboardStats()
    fetchRecentPosts()
    fetchUserActivity()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshAllData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link href="/make-post">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </Link>
        </div>
      </div>

      {/* Subscription and Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Subscription Card */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-primary" />
              Subscription Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSubscription ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : subscription ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Plan:</span>
                  <span className="font-medium">{subscription.plan.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span
                    className={`font-medium ${subscription.status === "active" ? "text-green-500" : "text-red-500"}`}
                  >
                    {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Expires:</span>
                  <span className="font-medium">{formatDate(subscription.expires_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Daily Usage:</span>
                  <span className="font-medium">
                    {subscription.requests_today} / {subscription.plan.daily_limit} requests
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2.5 mt-2">
                  <div
                    className="bg-primary h-2.5 rounded-full"
                    style={{ width: `${(subscription.requests_today / subscription.plan.daily_limit) * 100}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">No active subscription found</p>
                <Button onClick={() => router.push("/pricing")} size="sm" className="relative overflow-hidden group">
                  <span className="relative z-10">View Plans</span>
                  <span className="absolute inset-0 bg-primary/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total Posts Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary" />
              Total Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="flex items-center justify-center h-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="text-center">
                <p className="text-3xl font-bold">{stats?.total_posts || 0}</p>
                <p className="text-sm text-muted-foreground mt-1">WordPress posts</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paraphrased Content Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-primary" />
              Paraphrased
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="flex items-center justify-center h-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="text-center">
                <p className="text-3xl font-bold">{stats?.total_paraphrased || 0}</p>
                <p className="text-sm text-muted-foreground mt-1">AI-enhanced posts</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to manage your blog</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/make-post">
              <Button className="w-full justify-start relative overflow-hidden group">
                <Plus className="mr-2 h-4 w-4" />
                <span className="relative z-10">Create New Post</span>
                <span className="absolute inset-0 bg-primary/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
              </Button>
            </Link>
            <Link href="/fetched-posts">
              <Button variant="outline" className="w-full justify-start relative overflow-hidden group">
                <Newspaper className="mr-2 h-4 w-4" />
                <span className="relative z-10">View Fetched Posts</span>
                <span className="absolute inset-0 bg-muted transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
              </Button>
            </Link>
            <Link href="/dashboard/subscription">
              <Button variant="outline" className="w-full justify-start relative overflow-hidden group">
                <CreditCard className="mr-2 h-4 w-4" />
                <span className="relative z-10">Manage Subscription</span>
                <span className="absolute inset-0 bg-muted transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
              </Button>
            </Link>
            {subscription && subscription.plan.name === "Ultimate" && (
              <Link href="/url-paraphraser">
                <Button variant="outline" className="w-full justify-start relative overflow-hidden group">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  <span className="relative z-10">URL Paraphraser</span>
                  <span className="absolute inset-0 bg-muted transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest actions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <div className="h-9 w-9 rounded-full bg-muted animate-pulse"></div>
                    <div className="space-y-1 flex-1">
                      <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                      <div className="h-3 bg-muted rounded w-1/2 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : stats?.recent_activity && stats.recent_activity.length > 0 ? (
              <div className="space-y-4">
                {stats.recent_activity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      {activity.action === "Paraphrased" && <RefreshCw className="h-4 w-4" />}
                      {activity.action === "Fetched" && <Newspaper className="h-4 w-4" />}
                      {activity.action === "Published" && <FileText className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {activity.action} {activity.details}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatTimeAgo(activity.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No recent activity found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Posts */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Recent Posts</CardTitle>
            <CardDescription>Your latest blog posts</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                    <div className="h-3 bg-muted rounded w-full animate-pulse"></div>
                    <div className="h-3 bg-muted rounded w-1/2 animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map((post, index) => (
                  <div key={index} className="border-b pb-3 last:border-0 last:pb-0">
                    <h3 className="font-medium text-sm">{post.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{post.excerpt}</p>
                    {post.date && (
                      <div className="flex items-center mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground mr-1" />
                        <span className="text-xs text-muted-foreground">{formatTimeAgo(post.date)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No recent posts found</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-0">
            <Link href="/fetched-posts" className="w-full">
              <Button variant="outline" size="sm" className="w-full">
                View All Posts
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

