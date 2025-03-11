"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { encrypt, decrypt } from "@/utils/encryption"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface Settings {
  name: string
  siteUrl: string
}

interface Tag {
  id: string
  name: string
  slug: string
}

interface Category {
  id: string
  name: string
  slug: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    name: "",
    siteUrl: "",
  })
  const [newPassword, setNewPassword] = useState("")
  const [newTag, setNewTag] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = () => {
    const savedSettings = localStorage.getItem("encryptedBlogSettings")
    if (savedSettings) {
      try {
        const decryptedSettings = JSON.parse(decrypt(savedSettings))
        setSettings(decryptedSettings)
      } catch (error) {
        console.error("Error decrypting settings:", error)
        setError("Failed to load saved settings. Please re-enter your details.")
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPassword(e.target.value)
  }

  const saveSettings = async (updatedSettings: Settings) => {
    try {
      const encryptedSettings = encrypt(JSON.stringify(updatedSettings))
      localStorage.setItem("encryptedBlogSettings", encryptedSettings)
      await fetchInfo(encryptedSettings)
      return true
    } catch (error) {
      console.error("Error saving settings:", error)
      setError("Failed to save settings. Please try again.")
      return false
    }
  }

  const fetchInfo = async (encryptedSettings: string) => {
    try {
      const response = await fetch("http://127.0.0.1:5000/fetchinfo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encryptedBlogSettings: encryptedSettings }),
      })
      if (response.ok) {
        const data = await response.json()
        localStorage.setItem("blogInfo", JSON.stringify(data))
      } else {
        throw new Error("Failed to fetch info")
      }
    } catch (error) {
      console.error("Error fetching info:", error)
      setError("Failed to fetch blog information. Please check your settings and try again.")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const updatedSettings = {
      ...settings,
      ...(newPassword && { password: newPassword }),
    }

    try {
      const success = await saveSettings(updatedSettings)
      if (success) {
        toast({
          title: "Settings saved successfully",
          description: "Your WordPress settings have been updated and encrypted.",
        })
        setNewPassword("")
        router.push("/") // Redirect to dashboard
      } else {
        throw new Error("Failed to save settings")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error saving settings",
        description: "There was a problem saving your settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSettings = () => {
    setIsLoading(true)
    localStorage.removeItem("encryptedBlogSettings")
    localStorage.removeItem("blogInfo")
    setSettings({ name: "", siteUrl: "" })
    setNewPassword("")
    toast({
      title: "Settings deleted",
      description: "Your WordPress settings have been deleted.",
    })
    setIsLoading(false)
  }

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("http://127.0.0.1:5000/add_tag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTag }),
      })

      if (!response.ok) {
        throw new Error("Failed to add tag")
      }

      const result = await response.json()

      // Update localStorage
      const blogInfo = localStorage.getItem("blogInfo")
      if (blogInfo) {
        const parsedInfo = JSON.parse(blogInfo)
        parsedInfo.tags = { ...parsedInfo.tags, [result.data.id]: result.data.name }
        localStorage.setItem("blogInfo", JSON.stringify(parsedInfo))
      }

      toast({
        title: "Tag added successfully",
        description: `The tag "${result.data.name}" has been added.`,
      })

      setNewTag("")
    } catch (error) {
      console.error("Error adding tag:", error)
      toast({
        title: "Error adding tag",
        description: "There was a problem adding the new tag. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("http://127.0.0.1:5000/add_category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategory }),
      })

      if (!response.ok) {
        throw new Error("Failed to add category")
      }

      const result = await response.json()

      // Update localStorage
      const blogInfo = localStorage.getItem("blogInfo")
      if (blogInfo) {
        const parsedInfo = JSON.parse(blogInfo)
        parsedInfo.categories = { ...parsedInfo.categories, [result.data.id]: result.data.name }
        localStorage.setItem("blogInfo", JSON.stringify(parsedInfo))
      }

      toast({
        title: "Category added successfully",
        description: `The category "${result.data.name}" has been added.`,
      })

      setNewCategory("")
    } catch (error) {
      console.error("Error adding category:", error)
      toast({
        title: "Error adding category",
        description: "There was a problem adding the new category. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">WordPress Settings</h1>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Blog Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">WordPress Name</Label>
              <Input id="name" name="name" value={settings.name} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                onChange={handlePasswordChange}
                placeholder="Enter new password (leave blank to keep current)"
              />
            </div>
            <div>
              <Label htmlFor="siteUrl">Site URL</Label>
              <Input id="siteUrl" name="siteUrl" type="url" value={settings.siteUrl} onChange={handleChange} required />
            </div>
            <div className="flex justify-between">
              <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Settings"}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteSettings}
                className="w-full md:w-auto mt-2 md:mt-0"
                disabled={isLoading}
              >
                {isLoading ? "Deleting..." : "Delete Settings"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New Tag</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddTag} className="space-y-4">
            <div>
              <Label htmlFor="newTag">Tag Name</Label>
              <Input
                id="newTag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Enter new tag name"
                required
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Tag"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add New Category</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddCategory} className="space-y-4">
            <div>
              <Label htmlFor="newCategory">Category Name</Label>
              <Input
                id="newCategory"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Enter new category name"
                required
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Category"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

