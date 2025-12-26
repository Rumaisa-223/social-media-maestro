"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, ArrowLeft, HelpCircle, Cloud } from "lucide-react"
import Link from "next/link"

export default function BlueskyAuthPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [service] = useState(process.env.NEXT_PUBLIC_BLUESKY_SERVICE_URL || "https://bsky.social")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/bluesky/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password, service }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(String(data?.error || "Connect failed"))
      router.push("/dashboard/auth?success=bluesky&refetch=true")
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black/5 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <Card className="shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/auth" className="flex items-center">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <CardTitle>Connect to Bluesky</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex items-center gap-2 text-sky-700">
              <Cloud className="h-5 w-5" />
              <span className="font-medium">Bluesky</span>
            </div>
            <div className="space-y-1">
              <Label htmlFor="identifier">Handle</Label>
              <Input id="identifier" placeholder="yourname.bsky.social" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
              <p className="text-xs text-muted-foreground">For example: yourname.bsky.social</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Bluesky App Password</Label>
              <div className="flex gap-2">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="xxxx-xxxx-xxxx-xxxx" value={password} onChange={(e) => setPassword(e.target.value)} />
                <Button type="button" variant="outline" onClick={() => setShowPassword((s) => !s)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Use an app password to connect safely without giving full access. <a className="underline" href="https://bsky.app/settings/app-passwords" target="_blank" rel="noreferrer">Generate app password</a>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Button onClick={submit} disabled={loading || !identifier || !password}>
                {loading ? "Connecting…" : "Continue"}
              </Button>
              <a className="text-sm text-muted-foreground flex items-center gap-1" href="https://docs.bsky.app" target="_blank" rel="noreferrer">
                <HelpCircle className="h-4 w-4" /> Need Help
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}