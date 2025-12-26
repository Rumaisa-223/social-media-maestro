"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ImageGenerator } from "@/components/ai-tools/image-generator"
import { ImageEnhancer } from "@/components/ai-tools/image-enhancer"
import { ContentAnalyzer } from "@/components/ai-tools/content-analyzer"
import { VideoGenerator } from "@/components/ai-tools/video-generator"
import { AudioGenerator } from "@/components/ai-tools/audio-generator"
import { Sparkles, Wand2, Brain, Video, Music, Bot, Upload, Image, Crown } from 'lucide-react'
import { UploadSystem } from "@/components/ai-tools/upload-system"
import { VideoImagesStock } from "@/components/ai-tools/video-images-stock"
import { SmartAnalyzer } from "@/components/ai-tools/smart-analyzer"

export function AIMediaToolsPage() {
  const [activeTab, setActiveTab] = useState("smart-analyzer")
  const [metrics, setMetrics] = useState({ analyses: 0, images: 0, videos: 0, audio: 0 })

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch("/api/ai/metrics", { cache: "no-store" })
        const json = await res.json()
        if (mounted && json && typeof json === "object") {
          setMetrics({
            analyses: Number(json.analyses || 0),
            images: Number(json.images || 0),
            videos: Number(json.videos || 0),
            audio: Number(json.audio || 0),
          })
        }
      } catch {}
    })()
    return () => {
      mounted = false
    }
  }, [])

  const tools = [
    {
      id: "smart-analyzer",
      title: "Smart Analyzer",
      description: "Real-time AI analysis ",
      icon: Brain,
      badge: "Real-time",
      badgeVariant: "default" as const,
      component: SmartAnalyzer
    },
    {
      id: "image-generation",
      title: "AI Image Generation",
      description: "Create stunning images ",
      icon: Sparkles,
      badge: "Pollination",
      badgeVariant: "default" as const,
      component: ImageGenerator
    },
    {
      id: "video-generation",
      title: "AI Video Creation",
      description: "Generate videos with Pexels integration",
      icon: Video,
      badge: "Pexels",
      badgeVariant: "outline" as const,
      component: VideoGenerator
    },
    {
      id: "audio-generation",
      title: "Audio Generation",
      description: "Music, voiceovers & sound effects - lifetime free",
      icon: Music,
      badge: "Lifetime Free",
      badgeVariant: "secondary" as const,
      component: AudioGenerator
    },
    {
      id: "upload-system",
      title: "Upload System",
      description: "Advanced file upload with processing",
      icon: Upload,
      badge: "New",
      badgeVariant: "secondary" as const,
      component: UploadSystem
    },
    {
      id: "video-images-stock",
      title: "Video & Images Stock",
      description: "50 high-quality videos and images library",
      icon: Image,
      badge: "50 Items",
      badgeVariant: "outline" as const,
      component: VideoImagesStock
    },
    {
      id: "image-enhancement",
      title: "Image Enhancement",
      description: "Upscale, colorize, and improve image quality",
      icon: Wand2,
      component: ImageEnhancer
    }
  ]

  const ActiveComponent = tools.find(tool => tool.id === activeTab)?.component || SmartAnalyzer

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI-Powered Media Tools</h1>
          <p className="text-muted-foreground mt-2">
            Transform your content creation with cutting-edge AI technology
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <Bot className="h-3 w-3 mr-1" />
            AI Powered
          </Badge>
          <Badge className="bg-green-100 text-green-800">
            <Crown className="h-3 w-3 mr-1" />
            Audio Lifetime Free
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Real-time Analyses</p>
                <p className="text-2xl font-bold">{metrics.analyses}</p>
              </div>
              <Brain className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Images Generated</p>
                <p className="text-2xl font-bold">{metrics.images}</p>
              </div>
              <Sparkles className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Videos Created</p>
                <p className="text-2xl font-bold">{metrics.videos}</p>
              </div>
              <Video className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Audio Generated</p>
                <p className="text-2xl font-bold">{metrics.audio}</p>
              </div>
              <Music className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          {tools.map((tool) => {
            const Icon = tool.icon
            return (
              <TabsTrigger key={tool.id} value={tool.id} className="flex flex-col gap-1 h-auto py-3">
                <Icon className="h-4 w-4" />
                <span className="text-xs hidden sm:inline">{tool.title.split(' ')[0]}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {tools.map((tool) => {
          const Icon = tool.icon
          const Component = tool.component
          return (
            <TabsContent key={tool.id} value={tool.id} className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg">
                        <Icon className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {tool.title}
                          {tool.badge && (
                            <Badge variant={tool.badgeVariant}>{tool.badge}</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{tool.description}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Component />
                </CardContent>
              </Card>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
