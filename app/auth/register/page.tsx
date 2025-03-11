"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

export default function Register() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [wordpressUsername, setWordpressUsername] = useState("")
  const [wordpressPassword, setWordpressPassword] = useState("")
  const [wordpressUrl, setWordpressUrl] = useState("")
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const returnUrl = searchParams.get("returnUrl") || "/auth/login"

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    // Prevent multiple submissions
    if (isSubmitting) return

    setErrors({})
    setIsSubmitting(true)

    try {
      const response = await fetch("http://127.0.0.1:8000/api/users/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
          wordpress_username: wordpressUsername,
          wordpress_password: wordpressPassword,
          wordpress_url: wordpressUrl,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors(data)
        return
      }

      toast({
        title: "Registration successful",
        description: "Your account has been created. Please log in.",
      })

      // Redirect to login with the return URL preserved
      router.push(returnUrl === "/auth/login" ? returnUrl : `/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`)
    } catch (error) {
      toast({
        title: "Registration failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Register</CardTitle>
          <CardDescription>
            Create a new account
            {returnUrl !== "/auth/login" && (
              <p className="mt-1 text-sm text-primary">You'll need to log in after registration</p>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Input
                  id="username"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                {errors.username && <p className="text-sm text-destructive">{errors.username[0]}</p>}
              </div>
              <div className="flex flex-col space-y-1.5">
                <Input
                  id="email"
                  placeholder="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email[0]}</p>}
              </div>
              <div className="flex flex-col space-y-1.5">
                <Input
                  id="password"
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {errors.password && <p className="text-sm text-destructive">{errors.password[0]}</p>}
              </div>
              <div className="flex flex-col space-y-1.5">
                <Input
                  id="wordpress_username"
                  placeholder="WordPress Username"
                  value={wordpressUsername}
                  onChange={(e) => setWordpressUsername(e.target.value)}
                  required
                />
                {errors.wordpress_username && (
                  <p className="text-sm text-destructive">{errors.wordpress_username[0]}</p>
                )}
              </div>
              <div className="flex flex-col space-y-1.5">
                <Input
                  id="wordpress_password"
                  placeholder="WordPress Password"
                  type="password"
                  value={wordpressPassword}
                  onChange={(e) => setWordpressPassword(e.target.value)}
                  required
                />
                {errors.wordpress_password && (
                  <p className="text-sm text-destructive">{errors.wordpress_password[0]}</p>
                )}
              </div>
              <div className="flex flex-col space-y-1.5">
                <Input
                  id="wordpress_url"
                  placeholder="WordPress URL"
                  type="url"
                  value={wordpressUrl}
                  onChange={(e) => setWordpressUrl(e.target.value)}
                  required
                />
                {errors.wordpress_url && <p className="text-sm text-destructive">{errors.wordpress_url[0]}</p>}
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col">
          <Button className="w-full" onClick={handleRegister} disabled={isSubmitting}>
            {isSubmitting ? "Registering..." : "Register"}
          </Button>
          <p className="mt-4 text-sm text-center">
            Already have an account?{" "}
            <Link
              href={`/auth/login${returnUrl !== "/auth/login" ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ""}`}
              className="text-primary hover:underline"
            >
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

