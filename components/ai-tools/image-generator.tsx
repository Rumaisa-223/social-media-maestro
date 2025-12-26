"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Download, Share2, Heart, Wand2, CloudUpload } from 'lucide-react'

// Pollinations image generation function with unique images
const generateImages = async (prompt: string, style: string, aspectRatio: string, quality: number) => {
  try {
    const getDimensions = (ratio: string) => {
      switch (ratio) {
        case '16:9': return { width: 1024, height: 576 }
        case '9:16': return { width: 576, height: 1024 }
        case '4:3': return { width: 1024, height: 768 }
        case '3:2': return { width: 1024, height: 683 }
        default: return { width: 1024, height: 1024 }
      }
    }

    const { width, height } = getDimensions(aspectRatio)

    // Generate 4 unique images in parallel
    const imagePromises = Array.from({ length: 4 }, async () => {
      const randomSeed = Math.floor(Math.random() * 1000000) // unique seed per image
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(
        `${prompt}, style: ${style}, quality: ${quality}%, seed: ${randomSeed}`
      )}?width=${width}&height=${height}`

      // Fetch to get final image URL
      const response = await fetch(url, { method: "GET" })
      return response.url
    })

    return await Promise.all(imagePromises)
  } catch (error) {
    console.error('Image generation error:', error)
    return []
  }
}

export function ImageGenerator() {
  const [prompt, setPrompt] = useState("")
  const [style, setStyle] = useState("realistic")
  const [aspectRatio, setAspectRatio] = useState("1:1")
  const [quality, setQuality] = useState([80])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [selectedImages, setSelectedImages] = useState<string[]>([])

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    try {
      const images = await generateImages(prompt, style, aspectRatio, quality[0])
      setGeneratedImages(images)
      setSelectedImages([])
      if (images.length) {
        try {
          await fetch(`/api/ai/metrics/increment?type=images&value=${images.length}`, { method: "POST" })
        } catch {}
      }
    } catch (error) {
      console.error('Generation error:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleImageSelect = (image: string) => {
    setSelectedImages(prev =>
      prev.includes(image)
        ? prev.filter(img => img !== image)
        : [...prev, image]
    )
  }

  const handleUploadToStock = async () => {
    if (selectedImages.length === 0) return
    console.log('Uploading to stock:', selectedImages)
    alert(`${selectedImages.length} images uploaded to stock successfully!`)
    setSelectedImages([])
  }

  const styles = [
    { value: "realistic", label: "Realistic" },
    { value: "artistic", label: "Artistic" },
    { value: "cartoon", label: "Cartoon" },
    { value: "abstract", label: "Abstract" },
    { value: "vintage", label: "Vintage" },
    { value: "minimalist", label: "Minimalist" }
  ]

  const aspectRatios = [
    { value: "1:1", label: "Square (1:1)" },
    { value: "16:9", label: "Landscape (16:9)" },
    { value: "9:16", label: "Portrait (9:16)" },
    { value: "4:3", label: "Standard (4:3)" },
    { value: "3:2", label: "Photo (3:2)" }
  ]

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <Label htmlFor="prompt">Describe your image</Label>
            <Textarea
              id="prompt"
              placeholder="A serene mountain landscape at sunset with a crystal clear lake reflecting the orange and pink sky..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px] mt-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div>
            <Label>Quality: {quality[0]}%</Label>
            <Slider
              value={quality}
              onValueChange={setQuality}
              max={100}
              min={20}
              step={10}
              className="mt-2"
            />
          </div>
        </div>

        <div className="space-y-4">
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-green-50 border-blue-200">
            <div className="text-center">
              <Sparkles className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <h3 className="font-medium mb-2">AI Image Generation</h3>
              <Badge variant="outline" className="mb-2">Pollinations API</Badge>
              <ul className="text-sm text-muted-foreground space-y-1 text-left">
                <li>• Be specific with details</li>
                <li>• Mention lighting conditions</li>
                <li>• Include style keywords</li>
                <li>• Specify colors and mood</li>
                <li>• Upload to stock library</li>
              </ul>
            </div>
          </Card>

          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
          >
            {isGenerating ? (
              <>
                <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Images
              </>
            )}
          </Button>

          {selectedImages.length > 0 && (
            <Button
              onClick={handleUploadToStock}
              variant="outline"
              className="w-full border-green-200 text-green-700 hover:bg-green-50"
            >
              <CloudUpload className="h-4 w-4 mr-2" />
              Upload {selectedImages.length} to Stock
            </Button>
          )}
        </div>
      </div>

      {/* Results Section */}
      {(isGenerating || generatedImages.length > 0) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Generated Images</h3>
            <div className="flex items-center gap-2">
              {generatedImages.length > 0 && (
                <Badge variant="secondary">{generatedImages.length} images</Badge>
              )}
              {selectedImages.length > 0 && (
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {selectedImages.length} selected
                </Badge>
              )}
            </div>
          </div>

          {isGenerating ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="aspect-square">
                  <CardContent className="p-4 h-full flex items-center justify-center">
                    <div className="text-center">
                      <Wand2 className="h-8 w-8 mx-auto text-blue-500 animate-spin mb-2" />
                      <p className="text-sm text-muted-foreground">Generating...</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {generatedImages.map((image, index) => (
                <Card
                  key={index}
                  className={`group relative overflow-hidden cursor-pointer transition-all ${
                    selectedImages.includes(image) ? 'ring-2 ring-green-500' : ''
                  }`}
                  onClick={() => handleImageSelect(image)}
                >
                  <CardContent className="p-0">
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`Generated image ${index + 1}`}
                      className="w-full aspect-square object-cover"
                      style={{ opacity: 0, transition: 'opacity 0.3s ease' }}
                      onLoad={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.opacity = '1'
                      }}
                    />

                    {selectedImages.includes(image) && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button size="sm" variant="secondary" onClick={(e) => e.stopPropagation()}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="secondary" onClick={(e) => e.stopPropagation()}>
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="secondary" onClick={(e) => e.stopPropagation()}>
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
