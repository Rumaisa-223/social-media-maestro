"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Brain, TrendingUp, Eye, Heart, MessageCircle, Share2, Target, Lightbulb } from 'lucide-react'

export function ContentAnalyzer() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<any>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
        setAnalysisResults(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAnalyze = async () => {
    if (!selectedImage) return
    
    setIsAnalyzing(true)
    // Simulate analysis
    setTimeout(() => {
      setAnalysisResults({
        engagementScore: 87,
        visualAppeal: 92,
        brandAlignment: 78,
        accessibility: 85,
        emotions: [
          { emotion: "Joy", confidence: 89 },
          { emotion: "Trust", confidence: 76 },
          { emotion: "Excitement", confidence: 64 }
        ],
        colors: [
          { color: "#3B82F6", name: "Blue", percentage: 35 },
          { color: "#EF4444", name: "Red", percentage: 25 },
          { color: "#10B981", name: "Green", percentage: 20 },
          { color: "#F59E0B", name: "Yellow", percentage: 20 }
        ],
        objects: [
          { object: "Person", confidence: 95 },
          { object: "Technology", confidence: 88 },
          { object: "Office", confidence: 72 }
        ],
        suggestions: [
          "Consider adding more contrast to improve accessibility",
          "The composition could benefit from rule of thirds alignment",
          "Colors evoke positive emotions - great for engagement",
          "Consider adding text overlay for better social media performance"
        ]
      })
      setIsAnalyzing(false)
    }, 2000)
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      {!selectedImage ? (
        <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
          <CardContent className="p-8">
            <div className="text-center">
              <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Upload Image for AI Analysis</h3>
              <p className="text-muted-foreground mb-4">
                Get insights on engagement potential, visual appeal, and optimization suggestions
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="analysis-image-upload"
              />
              <Button asChild>
                <label htmlFor="analysis-image-upload" className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Image
                </label>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Preview */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <img
                  src={selectedImage || "/placeholder.svg"}
                  alt="Analysis target"
                  className="w-full h-auto rounded-lg"
                />
              </CardContent>
            </Card>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleAnalyze} 
                disabled={isAnalyzing}
                className="flex-1"
              >
                {isAnalyzing ? (
                  <>
                    <Brain className="h-4 w-4 mr-2 animate-pulse" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Analyze Image
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedImage(null)
                  setAnalysisResults(null)
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                New Image
              </Button>
            </div>
          </div>
          
          {/* Analysis Results */}
          <div className="space-y-4">
            {isAnalyzing ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <Brain className="h-8 w-8 mx-auto text-purple-500 animate-pulse mb-4" />
                    <h3 className="font-semibold mb-2">AI Analysis in Progress</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Analyzing visual elements, colors, composition, and engagement potential...
                    </p>
                    <Progress value={65} className="w-full" />
                  </div>
                </CardContent>
              </Card>
            ) : analysisResults ? (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="emotions">Emotions</TabsTrigger>
                  <TabsTrigger value="colors">Colors</TabsTrigger>
                  <TabsTrigger value="suggestions">Tips</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Engagement Score</p>
                            <p className="text-2xl font-bold text-green-600">{analysisResults.engagementScore}%</p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-green-500" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Visual Appeal</p>
                            <p className="text-2xl font-bold text-blue-600">{analysisResults.visualAppeal}%</p>
                          </div>
                          <Eye className="h-8 w-8 text-blue-500" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Brand Alignment</p>
                            <p className="text-2xl font-bold text-purple-600">{analysisResults.brandAlignment}%</p>
                          </div>
                          <Target className="h-8 w-8 text-purple-500" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Accessibility</p>
                            <p className="text-2xl font-bold text-orange-600">{analysisResults.accessibility}%</p>
                          </div>
                          <Heart className="h-8 w-8 text-orange-500" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Detected Objects</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analysisResults.objects.map((obj: any, index: number) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm">{obj.object}</span>
                            <Badge variant="outline">{obj.confidence}% confidence</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="emotions" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Emotional Response Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {analysisResults.emotions.map((emotion: any, index: number) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{emotion.emotion}</span>
                            <span className="text-sm text-muted-foreground">{emotion.confidence}%</span>
                          </div>
                          <Progress value={emotion.confidence} className="h-2" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="colors" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Color Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {analysisResults.colors.map((color: any, index: number) => (
                        <div key={index} className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-full border-2 border-gray-200"
                            style={{ backgroundColor: color.color }}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{color.name}</span>
                              <span className="text-sm text-muted-foreground">{color.percentage}%</span>
                            </div>
                            <Progress value={color.percentage} className="h-2 mt-1" />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="suggestions" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Lightbulb className="h-5 w-5" />
                        AI Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {analysisResults.suggestions.map((suggestion: string, index: number) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                          <p className="text-sm text-blue-900">{suggestion}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">Ready for Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Click "Analyze Image" to get AI-powered insights about your content
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
