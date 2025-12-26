"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertTriangle, Loader2 } from "lucide-react"

export default function AuthCallback() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")

    if (error) {
      setStatus("error")
      setMessage(`Authentication failed: ${error}`)
      return
    }

    if (!code || !state) {
      setStatus("error")
      setMessage("Missing required parameters")
      return
    }

    // Extract platform from state
    const platform = state.split("_")[0]

    // Verify state matches what we stored
    const storedState = localStorage.getItem(`auth_state_${platform}`)
    if (storedState !== state) {
      setStatus("error")
      setMessage("Invalid state parameter")
      return
    }

    // Exchange code for access token
    exchangeCodeForToken(platform, code)
  }, [searchParams])

  const exchangeCodeForToken = async (platform: string, code: string) => {
    try {
      // In a real implementation, this would be done on the server
      // For demo purposes, we'll simulate the token exchange

      setMessage("Exchanging authorization code for access token...")

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simulate successful token exchange
      const tokenData = {
        access_token: `${platform}_access_token_${Date.now()}`,
        refresh_token: `${platform}_refresh_token_${Date.now()}`,
        expires_in: 3600,
        token_type: "Bearer",
      }

      // Store token data
      const tokens = JSON.parse(localStorage.getItem("socialTokens") || "[]")
      const newToken = {
        id: `${platform}_${Date.now()}`,
        platform,
        userId: "1", // Default user for demo
        userName: "Current User",
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        isActive: true,
        scopes: ["default"],
        lastRefreshed: new Date(),
        rateLimitRemaining: 1000,
        rateLimitReset: new Date(Date.now() + 15 * 60 * 1000),
      }

      tokens.push(newToken)
      localStorage.setItem("socialTokens", JSON.stringify(tokens))

      // Clean up stored state
      localStorage.removeItem(`auth_state_${platform}`)

      setStatus("success")
      setMessage(`Successfully connected to ${platform}!`)

      // Close popup if this is running in a popup
      if (window.opener) {
        window.opener.postMessage({ type: "auth_success", platform }, "*")
        window.close()
      }
    } catch (error) {
      setStatus("error")
      setMessage("Failed to exchange authorization code for access token")
    }
  }

  const handleClose = () => {
    if (window.opener) {
      window.close()
    } else {
      window.location.href = "/tokens"
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === "loading" && <Loader2 className="h-8 w-8 animate-spin text-blue-500" />}
            {status === "success" && <CheckCircle className="h-8 w-8 text-green-500" />}
            {status === "error" && <AlertTriangle className="h-8 w-8 text-red-500" />}
          </div>
          <CardTitle>
            {status === "loading" && "Processing Authentication..."}
            {status === "success" && "Authentication Successful!"}
            {status === "error" && "Authentication Failed"}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          {status !== "loading" && (
            <Button onClick={handleClose} className="w-full">
              {window.opener ? "Close Window" : "Continue to Dashboard"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
