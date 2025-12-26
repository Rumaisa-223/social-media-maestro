"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Wand2, Download, RotateCcw, Zap } from "lucide-react"

export function ImageEnhancer() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [enhancementType, setEnhancementType] = useState("upscale")
  const [intensity, setIntensity] = useState([50])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedImage, setProcessedImage] = useState<string | null>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string)
      setProcessedImage(null)
    }
    reader.readAsDataURL(file)
  }

  const handleEnhance = async () => {
    if (!selectedImage) return
    setIsProcessing(true)

    try {
      // Call your AI enhancement API (replace URL with your endpoint)
      const response = await fetch("/api/ai/enhance-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: selectedImage,
          type: enhancementType,
          intensity: intensity[0],
        }),
      })
      const data = await response.json()
      setProcessedImage(data.enhancedImage) // base64 or URL returned by your AI
    } catch (err) {
      console.error("Enhancement failed", err)
    } finally {
      setIsProcessing(false)
    }
  }

  const enhancementTypes = [
    { value: "upscale", label: "Upscale (2x-4x)", description: "Increase resolution while maintaining quality" },
    { value: "denoise", label: "Noise Reduction", description: "Remove grain and artifacts" },
    { value: "sharpen", label: "Sharpen", description: "Enhance image clarity and details" },
    { value: "colorize", label: "Colorize", description: "Add color to black & white images" },
    { value: "restore", label: "Restore", description: "Fix old or damaged photos" },
    { value: "enhance", label: "Auto Enhance", description: "Automatic overall improvement" }
  ]

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      {!selectedImage ? (
        <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
          <CardContent className="p-8">
            <div className="text-center">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Upload Image to Enhance</h3>
              <p className="text-muted-foreground mb-4">
                Drag and drop your image here, or click to browse
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <Button asChild>
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Image
                </label>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="space-y-4">
            <div>
              <Label>Enhancement Type</Label>
              <Select value={enhancementType} onValueChange={setEnhancementType}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {enhancementTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Intensity: {intensity[0]}%</Label>
              <Slider
                value={intensity}
                onValueChange={setIntensity}
                max={100}
                min={10}
                step={5}
                className="mt-2"
              />
            </div>

            <div className="space-y-2">
              <Button 
                onClick={handleEnhance} 
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Enhance Image
                  </>
                )}
              </Button>

              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedImage(null)
                  setProcessedImage(null)
                }}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload New Image
              </Button>
            </div>
          </div>

          {/* Image Comparison */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="before" className="w-full">
              <div className="flex items-center justify-between mb-4">
                <TabsList>
                  <TabsTrigger value="before">Original</TabsTrigger>
                  <TabsTrigger value="after" disabled={!processedImage && !isProcessing}>
                    Enhanced
                  </TabsTrigger>
                  <TabsTrigger value="compare" disabled={!processedImage}>
                    Compare
                  </TabsTrigger>
                </TabsList>

                {processedImage && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => {
                      const link = document.createElement("a")
                      link.href = processedImage
                      link.download = "enhanced-image.png"
                      link.click()
                    }}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setProcessedImage(null)}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                )}
              </div>

              <TabsContent value="before">
                <Card>
                  <CardContent className="p-4">
                    <img
                      src={selectedImage!}
                      alt="Original"
                      className="w-full h-auto rounded-lg"
                    />
                    <div className="mt-2 text-center">
                      <Badge variant="outline">Original</Badge>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="after">
                <Card>
                  <CardContent className="p-4">
                    {isProcessing ? (
                      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <Wand2 className="h-8 w-8 mx-auto text-purple-500 animate-spin mb-2" />
                          <p className="text-sm text-muted-foreground">Enhancing image...</p>
                        </div>
                      </div>
                    ) : processedImage ? (
                      <>
                        <img
                          src={processedImage}
                          alt="Enhanced"
                          className="w-full h-auto rounded-lg"
                        />
                        <div className="mt-2 text-center">
                          <Badge className="bg-green-100 text-green-800">Enhanced</Badge>
                        </div>
                      </>
                    ) : (
                      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                        <p className="text-muted-foreground">Click "Enhance Image" to see results</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="compare">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <img
                        src={selectedImage!}
                        alt="Original"
                        className="w-full h-auto rounded-lg"
                      />
                      <div className="mt-2 text-center">
                        <Badge variant="outline">Before</Badge>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <img
                        src={processedImage || selectedImage!}
                        alt="Enhanced"
                        className="w-full h-auto rounded-lg"
                      />
                      <div className="mt-2 text-center">
                        <Badge className="bg-green-100 text-green-800">After</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  )
}
