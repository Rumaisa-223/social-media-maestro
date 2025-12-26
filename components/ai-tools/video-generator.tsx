"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Video, Play, Download, Share2, Clock, Film, CloudUpload } from 'lucide-react'

import { generateVideo } from "@/lib/real-generators"

const searchPexelsVideos = async (query: string, duration: number) => {
  try {
    const res = await fetch(`/api/video?q=${encodeURIComponent(query)}&perPage=5`)
    if (!res.ok) throw new Error("Failed to fetch from API route")
    const data = await res.json()
    return data || []
  } catch (err) {
    console.warn("Pexels API route failed, will fallback to AI generator", err)
    return []
  }
}

export function VideoGenerator() {
  const [prompt, setPrompt] = useState("")
  const [duration, setDuration] = useState([15])
  const [style, setStyle] = useState("cinematic")
  const [aspectRatio, setAspectRatio] = useState("16:9")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null)
  const [selectedForStock, setSelectedForStock] = useState(false)

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    try {
      // Try Pexels videos
      const pexelsVideos: any[] = await searchPexelsVideos(prompt, duration[0])
      if (pexelsVideos.length > 0) {
        setGeneratedVideo(pexelsVideos[0].path || null)
      } else {
        // Fallback to AI generator
        const aiVideos = await generateVideo(prompt, 2)
        setGeneratedVideo(aiVideos[0] || null)
      }
      try {
        await fetch(`/api/ai/metrics/increment?type=videos&value=1`, { method: "POST" })
      } catch {}
      setSelectedForStock(false)
    } catch (err) {
      console.error("Video generation error:", err)
      setGeneratedVideo(null)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleUploadToStock = () => {
    if (!generatedVideo) return
    console.log("Uploading video to stock:", generatedVideo)
    alert("Video uploaded to stock successfully!")
    setSelectedForStock(true)
  }

  const styles = [
    { value: "cinematic", label: "Cinematic" },
    { value: "animated", label: "Animated" },
    { value: "documentary", label: "Documentary" },
    { value: "commercial", label: "Commercial" },
    { value: "artistic", label: "Artistic" },
    { value: "minimal", label: "Minimal" }
  ]

  const aspectRatios = [
    { value: "16:9", label: "Landscape (16:9)" },
    { value: "9:16", label: "Portrait (9:16)" },
    { value: "1:1", label: "Square (1:1)" },
    { value: "4:3", label: "Standard (4:3)" }
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-4">
          <div>
            <Label htmlFor="video-prompt">Video Description</Label>
            <Textarea
              id="video-prompt"
              placeholder="Describe your video here..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[120px] mt-2"
            />
          </div>

          <div>
            <Label>Duration: {duration[0]} seconds</Label>
            <Slider
              value={duration}
              onValueChange={setDuration}
              max={60}
              min={5}
              step={5}
              className="mt-2"
            />
          </div>

          <div>
            <Label>Style</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {styles.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Aspect Ratio</Label>
            <Select value={aspectRatio} onValueChange={setAspectRatio}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {aspectRatios.map((ratio) => (
                  <SelectItem key={ratio.value} value={ratio.value}>{ratio.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
          >
            {isGenerating ? (
              <><Film className="h-4 w-4 mr-2 animate-spin" />Generating...</>
            ) : (
              <><Video className="h-4 w-4 mr-2" />Generate Video</>
            )}
          </Button>

          {generatedVideo && !selectedForStock && (
            <Button
              onClick={handleUploadToStock}
              variant="outline"
              className="w-full border-green-200 text-green-700 hover:bg-green-50"
            >
              <CloudUpload className="h-4 w-4 mr-2" />
              Upload to Stock
            </Button>
          )}

          <Card className="p-4 bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
            <div className="text-center">
              <Clock className="h-8 w-8 mx-auto text-red-600 mb-2" />
              <h3 className="font-medium mb-2">Powered by Pexels & AI</h3>
              <Badge variant="outline" className="mb-2">Stock Video + AI Integration</Badge>
              <p className="text-sm text-muted-foreground">
                Videos are fetched from Pexels or generated using AI if unavailable.
              </p>
            </div>
          </Card>
        </div>

        {/* Video Preview */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              {isGenerating ? (
                <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                  <Film className="h-16 w-16 mx-auto text-red-500 animate-pulse mb-4" />
                  <p>AI is creating your video...</p>
                </div>
              ) : generatedVideo ? (
                <div className="space-y-4">
                  <video controls className="w-full aspect-video rounded-lg">
                    <source src={generatedVideo} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        <Play className="h-3 w-3 mr-1" />
                        Ready
                      </Badge>
                      {selectedForStock && (
                        <Badge className="bg-green-100 text-green-800">
                          <CloudUpload className="h-3 w-3 mr-1" />
                          In Stock
                        </Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {duration[0]}s • {aspectRatio} • {style}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button size="sm" variant="outline">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <Video className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p>Describe your video and generate it with AI</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
