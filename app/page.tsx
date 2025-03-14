"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { isAuthenticated, fetchWithAuth } from "@/lib/utils"
import { Loader2, ArrowRight, FileText, RefreshCw, Globe, Search, Zap, Clock, Shield, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/components/ui/use-toast"

export default function Home() {
  const [authChecked, setAuthChecked] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Animated text state
  const [activeWordIndex, setActiveWordIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(true)
  const [typedText, setTypedText] = useState("")
  const words = ["Fetch", "Paraphrase", "Optimize", "Publish"]
  const typingSpeed = 100
  const deleteSpeed = 50
  const pauseDuration = 1500
  const typingRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Check authentication status on client-side
    setIsLoggedIn(isAuthenticated())
    setAuthChecked(true)
  }, [])

  // Improved typewriter effect
  useEffect(() => {
    const currentWord = words[activeWordIndex]

    if (isTyping) {
      if (typedText.length < currentWord.length) {
        // Still typing the current word
        typingRef.current = setTimeout(() => {
          setTypedText(currentWord.substring(0, typedText.length + 1))
        }, typingSpeed)
      } else {
        // Finished typing, pause before deleting
        typingRef.current = setTimeout(() => {
          setIsTyping(false)
        }, pauseDuration)
      }
    } else {
      if (typedText.length > 0) {
        // Deleting the current word
        typingRef.current = setTimeout(() => {
          setTypedText(typedText.substring(0, typedText.length - 1))
        }, deleteSpeed)
      } else {
        // Move to the next word
        const nextIndex = (activeWordIndex + 1) % words.length
        setActiveWordIndex(nextIndex)
        setIsTyping(true)
      }
    }

    return () => {
      if (typingRef.current) clearTimeout(typingRef.current)
    }
  }, [typedText, isTyping, activeWordIndex, words])

  // Function to handle the "Try It Now" button click
  const handleTryItNow = async () => {
    setIsLoading(true)

    try {
      let response

      // Use fetchWithAuth for authenticated requests, regular fetch for unauthenticated
      if (isLoggedIn) {
        response = await fetchWithAuth("/api/fetch-news/", {
          method: "GET",
        })
      } else {
        response = await fetch("/api/fetch-news/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })
      }

      const data = await response.json()

      if (!response.ok) {
        if (data.error === "User has already used free trial. No access!") {
          toast({
            title: "Free Trial Used",
            description: "You've already used your free trial. Sign up for a plan to continue.",
            variant: "destructive",
          })
          // Scroll to pricing section
          document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })
        } else {
          toast({
            title: "Error",
            description: data.error || "Something went wrong. Please try again.",
            variant: "destructive",
          })
        }
      } else {
        // Success - handle the paraphrasing
        if (isLoggedIn) {
          toast({
            title: "Success!",
            description: "Content fetched successfully. Check your dashboard for details.",
            variant: "default",
          })
          router.push("/dashboard")
        } else {
          // For non-logged in users, show a preview and prompt to sign up
          toast({
            title: "Success!",
            description: "Check out what our tool can do. Sign up to access all features.",
            variant: "default",
          })
          // You could show a modal with sample content here
        }
      }
    } catch (error) {
      console.error("Error fetching news:", error)
      toast({
        title: "Error",
        description: "Failed to connect to the server. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // If user is logged in, redirect to dashboard
  if (isLoggedIn) {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow">
          <section className="bg-primary text-primary-foreground py-16 sm:py-20">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Welcome Back!</h2>
              <p className="text-lg sm:text-xl mb-8 max-w-2xl mx-auto">
                Continue managing your WordPress blog with our AI-powered tools.
              </p>
              <Button
                size="lg"
                className="w-full sm:w-auto group relative overflow-hidden"
                onClick={() => router.push("/dashboard")}
              >
                <span className="relative z-10 flex items-center">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
                <span className="absolute inset-0 bg-primary-foreground/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
              </Button>
            </div>
          </section>

          {/* Try It Now Section for logged-in users */}
          <section className="py-16 sm:py-20 bg-secondary">
            <div className="container mx-auto px-4">
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold mb-4">Try Our Tools</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                  Fetch your WordPress posts and use our AI to paraphrase them instantly.
                </p>
                <Button
                  size="lg"
                  onClick={handleTryItNow}
                  disabled={isLoading}
                  className="relative group overflow-hidden"
                >
                  <span className="relative z-10 flex items-center">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Fetch Latest News
                        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </span>
                  <span className="absolute inset-0 bg-primary-foreground/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
                </Button>
              </div>
            </div>
          </section>
        </main>

        <footer className="bg-background py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="mb-4 md:mb-0">&copy; 2023 BlogMaster. All rights reserved.</p>
              <nav className="space-x-4">
                <Link href="/terms" className="hover:underline">
                  Terms of Service
                </Link>
                <Link href="/privacy" className="hover:underline">
                  Privacy Policy
                </Link>
                <Link href="/contact" className="hover:underline">
                  Contact Us
                </Link>
              </nav>
            </div>
          </div>
        </footer>
      </div>
    )
  }

  // For non-authenticated users, show the regular landing page
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-primary text-primary-foreground py-16 sm:py-24">
          <div className="container mx-auto px-4 text-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
              <motion.h2
                className="text-3xl sm:text-5xl font-bold mb-6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.8,
                  delay: 0.2,
                  type: "spring",
                  stiffness: 100,
                }}
              >
                Supercharge Your WordPress Blog
              </motion.h2>

              {/* Improved animated text display */}
              <div className="h-16 mb-6 flex items-center justify-center">
                <div className="text-2xl sm:text-3xl font-semibold inline-flex items-center">
                  <span className="mr-2">Easily</span>
                  <div className="relative h-10 overflow-hidden min-w-[180px] inline-flex items-center justify-start">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={typedText}
                        className="text-white dark:text-black font-bold"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        {typedText}
                        <motion.span
                          className="inline-block w-1 h-7 bg-white dark:bg-black ml-0.5"
                          animate={{ opacity: [1, 0] }}
                          transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
                        />
                      </motion.span>
                    </AnimatePresence>
                  </div>
                  <span className="ml-2">Your Content</span>
                </div>
              </div>

              <motion.p
                className="text-lg sm:text-xl mb-10 max-w-3xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                Revolutionize your content workflow with our comprehensive WordPress companion. Import posts directly
                from up-to-date sources, transform them with state-of-the-art AI, enhance SEO performance, and publish
                polished content—all from a single dashboard. Our platform eliminates content creation bottlenecks,
                saving you hours of work while maintaining your unique voice and boosting engagement across your entire
                blog.
              </motion.p>

              <motion.div
                className="space-y-4 sm:space-y-0 sm:space-x-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                <Link href="/auth/register">
                  <Button size="lg" className="w-full sm:w-auto group relative overflow-hidden">
                    <span className="relative z-10 flex items-center">
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </span>
                    <span className="absolute inset-0 bg-primary-foreground/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
                  </Button>
                </Link>
                <Link href="#pricing">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                    View Pricing
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6">Powerful Features</h2>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
              Our comprehensive toolkit is designed to streamline your content creation process from start to finish
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "WordPress Integration",
                  description: "Seamlessly connect to your WordPress site and import posts with a single click",
                  icon: <FileText className="h-10 w-10 text-primary" />,
                },
                {
                  title: "AI Paraphrasing",
                  description: "Transform your content with advanced AI that maintains your unique voice and style",
                  icon: <RefreshCw className="h-10 w-10 text-primary" />,
                },
                {
                  title: "URL Paraphraser",
                  description:
                    "Instantly rewrite content from any URL while preserving the original meaning and structure",
                  icon: <Globe className="h-10 w-10 text-primary" />,
                },
                {
                  title: "SEO Optimization",
                  description: "Enhance your content's search visibility with built-in SEO tools and recommendations",
                  icon: <Search className="h-10 w-10 text-primary" />,
                },
                {
                  title: "Instant Publishing",
                  description:
                    "Create and publish new blog posts directly to your WordPress site without switching platforms",
                  icon: <Zap className="h-10 w-10 text-primary" />,
                },
                {
                  title: "Content History",
                  description: "Access your complete history of fetched and paraphrased content for easy reference",
                  icon: <Clock className="h-10 w-10 text-primary" />,
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="flex flex-col h-full border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                    <CardHeader className="pb-2">
                      <div className="mb-4">{feature.icon}</div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">{feature.description}</CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 sm:py-20 bg-secondary/50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">Why Choose Us</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
              <div className="flex flex-col items-center">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Save Time</h3>
                <p className="text-muted-foreground">
                  Reduce content creation time by up to 70% with our streamlined workflow
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Unique Content</h3>
                <p className="text-muted-foreground">
                  Generate 100% unique content that passes plagiarism checks while maintaining your voice
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Boost Engagement</h3>
                <p className="text-muted-foreground">
                  Improve reader engagement with professionally optimized and polished content
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Try It Now Section for non-authenticated users */}
        <section className="py-16 sm:py-20 bg-secondary">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Try It Now</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Experience the power of our AI tools with a free sample. No login required.
            </p>
            <Button size="lg" onClick={handleTryItNow} disabled={isLoading} className="relative group overflow-hidden">
              <span className="relative z-10 flex items-center">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Fetch Latest News
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </span>
              <span className="absolute inset-0 bg-primary-foreground/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
            </Button>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-16 sm:py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Simple Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">{/* Pricing cards will be rendered here */}</div>
          </div>
        </section>
      </main>

      <footer className="bg-background py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="mb-4 md:mb-0">&copy; 2023 BlogMaster. All rights reserved.</p>
            <nav className="space-x-4">
              <Link href="/terms" className="hover:underline">
                Terms of Service
              </Link>
              <Link href="/privacy" className="hover:underline">
                Privacy Policy
              </Link>
              <Link href="/contact" className="hover:underline">
                Contact Us
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}

