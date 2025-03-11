"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle, Loader2, ArrowRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { PageTransition } from "@/components/page-transition"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"

interface SubscriptionPlan {
  id: number
  name: string
  price: string
  daily_limit: number
  duration: number
  description: {
    title: string
    details: string[]
  }
}

export default function PricingPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchSubscriptionPlans = async () => {
      setIsLoading(true)
      console.log("Fetching subscription plans...")

      try {
        const response = await fetch("http://127.0.0.1:8000/api/subscription/plans")

        // Log the raw response for debugging
        const responseText = await response.text()
        console.log("Subscription plans API response:", responseText)

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`)
        }

        const data = JSON.parse(responseText)
        console.log("Parsed subscription plans:", data)
        setPlans(data)
      } catch (error) {
        console.error("Error fetching subscription plans:", error)
        toast({
          title: "Error loading pricing plans",
          description: "Please refresh the page or try again later.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubscriptionPlans()
  }, [toast])

  const formatCurrency = (amount: string) => {
    try {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Number.parseFloat(amount))
    } catch (error) {
      console.error("Currency formatting error:", error)
      return `₦${amount}`
    }
  }

  // Replace the handleSubscribe function with this version that checks authentication
  const handleSubscribe = (planId: number) => {
    // Check if user is logged in by looking for auth token
    const token = localStorage.getItem("authToken")

    if (!token) {
      // If not logged in, redirect to login page with return URL
      toast({
        title: "Authentication required",
        description: "Please log in to subscribe to a plan.",
      })
      router.push(`/auth/login?returnUrl=${encodeURIComponent(`/payment?plan_id=${planId}`)}`)
    } else {
      // If logged in, proceed to payment page
      router.push(`/payment?plan_id=${planId}`)
    }
  }

  const renderSkeletons = () => {
    return Array(3)
      .fill(0)
      .map((_, index) => (
        <Card key={index} className="flex flex-col h-full">
          <CardHeader>
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-10 w-32" />
          </CardHeader>
          <CardContent className="flex-grow space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      ))
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-12 pb-safe">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Subscription Plans</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect plan for your blogging needs. All plans include access to our AI-powered paraphrasing
            tools.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">{renderSkeletons()}</div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No subscription plans found</h3>
            <p className="text-muted-foreground">
              We couldn't find any subscription plans at the moment. Please check back later.
            </p>
          </div>
        ) : (
          <motion.div
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {plans.map((plan) => (
              <motion.div key={plan.id} variants={item}>
                <Card
                  className={`flex flex-col h-full transition-all duration-300 hover:shadow-lg ${
                    plan.name === "Pro" ? "border-primary/50 shadow-md" : ""
                  }`}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      {plan.name === "Pro" && (
                        <Badge className="bg-primary/20 text-primary hover:bg-primary/30">Popular</Badge>
                      )}
                    </div>
                    <CardDescription className="text-3xl font-bold mt-2">
                      {formatCurrency(plan.price)}
                      <span className="text-sm font-normal text-muted-foreground"> / month</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-4">
                    <ul className="space-y-3">
                      {plan.description.details.map((detail, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={() => handleSubscribe(plan.id)}
                      className="w-full relative overflow-hidden group"
                      variant={plan.name === "Pro" ? "default" : "outline"}
                    >
                      <span className="relative z-10 flex items-center justify-center">
                        Subscribe Now
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                      <span className="absolute inset-0 bg-primary/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </PageTransition>
  )
}

