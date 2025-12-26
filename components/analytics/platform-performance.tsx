"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Facebook, Instagram, Twitter } from "lucide-react"
import { useEffect, useState } from "react"

export function PlatformPerformance() {
  const [platformsData, setPlatformsData] = useState<Record<string, { engagement: number; reach: number; conversions: number }>>({})
  const [deltaReach, setDeltaReach] = useState<Record<string, number>>({})
  const [dataFollowers, setDataFollowers] = useState<Record<string, number>>({})
  useEffect(() => {
    let mounted = true
    fetch("/api/analytics").then(async (r) => {
      const data = await r.json()
      if (!mounted) return
      setPlatformsData(data?.platforms || {})
      setDataFollowers(data?.followers || {})
      const weekly = Array.isArray(data?.weekly) ? data.weekly : []
      const half = Math.max(1, Math.floor(weekly.length / 2))
      const first = weekly.slice(0, half)
      const last = weekly.slice(half)
      const sum = (arr: any[], key: string) => arr.reduce((n, i) => n + Number(i?.[key] || 0), 0)
      const prev = sum(first, "reach") || 1
      const curr = sum(last, "reach")
      const pct = prev ? (curr - prev) / prev : 0
      setDeltaReach({ all: pct * 100 })
    }).catch(() => {})
    return () => { mounted = false }
  }, [])

  const platforms = [
    {
      name: "Instagram",
      icon: Instagram,
      iconColor: "text-pink-600",
      bgColor: "bg-pink-100",
    },
    {
      name: "Twitter",
      icon: Twitter,
      iconColor: "text-blue-400",
      bgColor: "bg-blue-100",
    },
    {
      name: "Facebook",
      icon: Facebook,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-100",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Performance</CardTitle>
        <CardDescription>Compare metrics across different social media platforms</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {platforms.map((platform) => (
            <Card key={platform.name}>
              <CardContent className="p-4">
                <div className="flex items-center mb-3">
                  <div
                    className={`w-8 h-8 flex items-center justify-center rounded-full ${platform.bgColor} ${platform.iconColor} mr-3`}
                  >
                    <platform.icon className="h-4 w-4" />
                  </div>
                  <h3 className="font-medium">{platform.name}</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Followers</span>
                    <span className="text-sm font-medium">{(() => {
                      const key = platform.name.toLowerCase()
                      const f = (dataFollowers as any)[key]
                      if (!f) return "-"
                      return Intl.NumberFormat().format(Number(f))
                    })()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Engagement</span>
                    <span className="text-sm font-medium">{(() => {
                      const key = platform.name.toLowerCase()
                      const p = platformsData[key]
                      if (!p) return "-"
                      const rate = p.reach ? (p.engagement / p.reach) * 100 : 0
                      return `${rate.toFixed(1)}%`
                    })()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Reach</span>
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-1">{(() => {
                        const key = platform.name.toLowerCase()
                        const p = platformsData[key]
                        if (!p) return "-"
                        return Intl.NumberFormat().format(Math.round(p.reach))
                      })()}</span>
                      <span className={`text-xs ${Number((deltaReach.all || 0)).toFixed(1).startsWith("-") ? "text-red-500" : "text-green-500"}`}>{`${(deltaReach.all || 0).toFixed(1)}%`}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
