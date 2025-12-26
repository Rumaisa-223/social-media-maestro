"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Loader2 } from "lucide-react"

export default function AuthSuccess() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const tokenData = searchParams.get("token")

    if (tokenData) {
      try {
        const token = JSON.parse(decodeURIComponent(tokenData))

        // Store token in localStorage
        const existingTokens = JSON.parse(localStorage.getItem("socialTokens") || "[]")

        const newToken = {
          id: `${token.platform}_${token.userId}_${Date.now()}`,
          platform: token.platform,
          userId: token.userId,
          userName: token.platformUserName,
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
          expiresAt: new Date(Date.now() + token.expiresIn * 1000),
          isActive: true,
          scopes: token.scopes,
          lastRefreshed: new Date(),
          rateLimitRemaining: 1000,
          rateLimitReset: new Date(Date.now() + 15 * 60 * 1000),
        }

        const updatedTokens = [...existingTokens, newToken]
        localStorage.setItem("socialTokens", JSON.stringify(updatedTokens))

        // Redirect to tokens page after 2 seconds
        setTimeout(() => {
          router.push("/tokens?success=true")
        }, 2000)
      } catch (error) {
        console.error("Error processing token:", error)
        router.push("/tokens?error=processing_failed")
      }
    } else {
      router.push("/tokens?error=no_token")
    }
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle>Authentication Successful!</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing your token and redirecting...
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
