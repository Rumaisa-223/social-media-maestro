"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Instagram, Linkedin, MessageCircle, Facebook, Twitter } from "lucide-react"
import { useEffect, useState } from "react"

export function TopPerformingPosts() {
  const [posts, setPosts] = useState<any[]>([])
  useEffect(() => {
    let mounted = true
    fetch("/api/analytics").then(async (r) => {
      const data = await r.json()
      if (!mounted) return
      const iconMap: Record<string, any> = {
        Instagram, LinkedIn: Linkedin, Facebook, Twitter, Bluesky: Twitter, Mastodon: Twitter,
      }
      const colorMap: Record<string, string> = {
        Instagram: "text-pink-600", LinkedIn: "text-blue-700", Facebook: "text-blue-600", Twitter: "text-blue-400", Bluesky: "text-blue-400", Mastodon: "text-green-600",
      }
      const tp = Array.isArray(data?.topPosts) ? data.topPosts : []
      const mapped = tp.map((p: any, idx: number) => ({
        id: idx + 1,
        platform: String(p.platform || "Post"),
        platformIcon: iconMap[p.platform] || Instagram,
        platformColor: colorMap[p.platform] || "text-gray-600",
        image: "/placeholder.svg?height=300&width=400",
        title: String(p.title || ""),
        likes: String(Intl.NumberFormat().format(Number(p.likes || 0))),
        comments: String(Intl.NumberFormat().format(Number(p.comments || 0))),
        date: new Date(String(p.date || Date.now())).toLocaleDateString(),
        engagement: `${(Number(p.multiplier || 1)).toFixed(1)}x`,
      }))
      setPosts(mapped)
    }).catch(() => {})
    return () => { mounted = false }
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Performing Posts</CardTitle>
        <CardDescription>Your most engaging content across platforms</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden">
              <div className="h-48 bg-gray-200 relative">
                <img src={post.image || "/placeholder.svg"} alt="Post" className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3">
                  <Badge className="bg-white text-gray-900">
                    <post.platformIcon className={`h-3 w-3 mr-1 ${post.platformColor}`} />
                    {post.platform}
                  </Badge>
                </div>
                <div className="absolute top-3 right-3">
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                    {post.engagement}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <p className="text-sm line-clamp-2 font-medium mb-2">{post.title}</p>
                <div className="flex justify-between mb-2">
                  <div className="flex items-center text-gray-500 text-xs">
                    <Heart className="h-3 w-3 mr-1" />
                    {post.likes} likes
                  </div>
                  <div className="flex items-center text-gray-500 text-xs">
                    <MessageCircle className="h-3 w-3 mr-1" />
                    {post.comments} comments
                  </div>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <span>Posted on {post.date}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
