"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import FetchPostButton from "@/components/FetchPostButton"
import PricingSection from "@/components/PricingSection"
import { isAuthenticated } from "@/lib/utils"
import { Loader2, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

export default function Home() {
  const [authChecked, setAuthChecked] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check authentication status on client-side
    setIsLoggedIn(isAuthenticated())
    setAuthChecked(true)
  }, [])

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
                <FetchPostButton />
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
        <section className="bg-primary text-primary-foreground py-16 sm:py-20">
          <div className="container mx-auto px-4 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Supercharge Your WordPress Blog</h2>
              <p className="text-lg sm:text-xl mb-8 max-w-2xl mx-auto">
                Fetch, paraphrase, and optimize your content with ease using our AI-powered tools.
              </p>
              <div className="space-y-4 sm:space-y-0 sm:space-x-4">
                <Link href="/auth/register">
                  <Button size="lg" className="w-full sm:w-auto group relative overflow-hidden">
                    <span className="relative z-10 flex items-center">
                      Get Started
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
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { title: "Fetch Posts", description: "Easily import your WordPress posts with a single click" },
                { title: "AI Paraphrasing", description: "Rewrite your content with advanced AI assistance" },
                { title: "Make New Posts", description: "Create and publish new blog posts effortlessly" },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="flex flex-col h-full">
                    <CardHeader>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Try It Now Section for non-authenticated users */}
        <section className="py-16 sm:py-20 bg-secondary">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Try It Now</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Experience the power of our AI tools. Login required to access full features.
            </p>
            <FetchPostButton />
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-16 sm:py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Simple Pricing</h2>
            <PricingSection />
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

