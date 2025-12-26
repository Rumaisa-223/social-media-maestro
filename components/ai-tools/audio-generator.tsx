"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Music, Mic, Volume2, Download, Play, Pause, RotateCcw, Crown, Infinity } from 'lucide-react'

export function AudioGenerator() {
  const [activeTab, setActiveTab] = useState("music")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // Music generation state
  const [musicPrompt, setMusicPrompt] = useState("")
  const [musicGenre, setMusicGenre] = useState("ambient")
  const [musicDuration, setMusicDuration] = useState([30])

  // Voice generation state
  const [voiceText, setVoiceText] = useState("")
  const [voiceType, setVoiceType] = useState("professional")
  const [voiceSpeed, setVoiceSpeed] = useState([1])

  // Sound effects state
  const [effectPrompt, setEffectPrompt] = useState("")
  const [effectCategory, setEffectCategory] = useState("nature")
  const [effectDuration, setEffectDuration] = useState([5])

  const handleGenerate = async () => {
    setIsGenerating(true)
    // Simulate audio generation
    setTimeout(() => {
      setGeneratedAudio("generated-audio.mp3")
      fetch(`/api/ai/metrics/increment?type=audio&value=1`, { method: "POST" }).catch(() => {})
      setIsGenerating(false)
    }, 3000)
  }

  const musicGenres = [
    { value: "ambient", label: "Ambient" },
    { value: "electronic", label: "Electronic" },
    { value: "acoustic", label: "Acoustic" },
    { value: "cinematic", label: "Cinematic" },
    { value: "jazz", label: "Jazz" },
    { value: "classical", label: "Classical" },
    { value: "rock", label: "Rock" },
    { value: "pop", label: "Pop" },
    { value: "hip-hop", label: "Hip-Hop" },
    { value: "folk", label: "Folk" }
  ]

  const voiceTypes = [
    { value: "professional", label: "Professional" },
    { value: "friendly", label: "Friendly" },
    { value: "authoritative", label: "Authoritative" },
    { value: "casual", label: "Casual" },
    { value: "energetic", label: "Energetic" },
    { value: "calm", label: "Calm" },
    { value: "narrator", label: "Narrator" },
    { value: "commercial", label: "Commercial" }
  ]

  const effectCategories = [
    { value: "nature", label: "Nature" },
    { value: "urban", label: "Urban" },
    { value: "mechanical", label: "Mechanical" },
    { value: "ambient", label: "Ambient" },
    { value: "notification", label: "Notification" },
    { value: "transition", label: "Transition" },
    { value: "impact", label: "Impact" },
    { value: "whoosh", label: "Whoosh" }
  ]

  return (
    <div className="space-y-6">
      {/* Lifetime Free Notice */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <Crown className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">Lifetime Free Audio Generation</h3>
                <Badge className="bg-green-600 hover:bg-green-700">
                  <Infinity className="h-3 w-3 mr-1" />
                  Unlimited
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Generate unlimited music, voiceovers, and sound effects - completely free forever!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="music" className="flex items-center gap-2">
            <Music className="h-4 w-4" />
            Music
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Free</Badge>
          </TabsTrigger>
          <TabsTrigger value="voice" className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            Voiceover
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Free</Badge>
          </TabsTrigger>
          <TabsTrigger value="effects" className="flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            Sound Effects
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Free</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="music" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div>
                <Label htmlFor="music-prompt">Music Description</Label>
                <Textarea
                  id="music-prompt"
                  placeholder="Upbeat electronic music with a modern feel, perfect for a tech startup video..."
                  value={musicPrompt}
                  onChange={(e) => setMusicPrompt(e.target.value)}
                  className="min-h-[100px] mt-2"
                />
              </div>
              
              <div>
                <Label>Genre</Label>
                <Select value={musicGenre} onValueChange={setMusicGenre}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {musicGenres.map((genre) => (
                      <SelectItem key={genre.value} value={genre.value}>
                        {genre.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Duration: {musicDuration[0]} seconds</Label>
                <Slider
                  value={musicDuration}
                  onValueChange={setMusicDuration}
                  max={300}
                  min={10}
                  step={10}
                  className="mt-2"
                />
              </div>
              
              <Button 
                onClick={handleGenerate} 
                disabled={!musicPrompt.trim() || isGenerating}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isGenerating ? (
                  <>
                    <Music className="h-4 w-4 mr-2 animate-pulse" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Music className="h-4 w-4 mr-2" />
                    Generate Music (Free)
                  </>
                )}
              </Button>
            </div>
            
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  {isGenerating ? (
                    <div className="text-center py-12">
                      <Music className="h-16 w-16 mx-auto text-purple-500 animate-pulse mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Composing Your Music</h3>
                      <p className="text-muted-foreground">
                        AI is creating your custom music track...
                      </p>
                    </div>
                  ) : generatedAudio ? (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold">Generated Music Track</h3>
                            <p className="text-sm text-muted-foreground">
                              {musicGenre} • {musicDuration[0]}s
                            </p>
                          </div>
                          <Badge className="bg-green-100 text-green-800">Ready</Badge>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <Button
                            size="sm"
                            variant={isPlaying ? "secondary" : "default"}
                            onClick={() => setIsPlaying(!isPlaying)}
                          >
                            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          
                          <div className="flex-1 bg-white rounded-full h-2">
                            <div className="bg-purple-500 h-2 rounded-full" style={{ width: '35%' }}></div>
                          </div>
                          
                          <span className="text-sm text-muted-foreground">0:12 / 0:{musicDuration[0]}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1">
                          <Download className="h-4 w-4 mr-2" />
                          Download MP3
                        </Button>
                        <Button variant="outline">
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Regenerate
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Music className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">AI Music Generator</h3>
                      <p className="text-muted-foreground">
                        Describe the music you want and let AI compose it for you
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="voice" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div>
                <Label htmlFor="voice-text">Text to Speech</Label>
                <Textarea
                  id="voice-text"
                  placeholder="Welcome to our company! We're excited to share our latest innovations with you..."
                  value={voiceText}
                  onChange={(e) => setVoiceText(e.target.value)}
                  className="min-h-[120px] mt-2"
                />
              </div>
              
              <div>
                <Label>Voice Style</Label>
                <Select value={voiceType} onValueChange={setVoiceType}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {voiceTypes.map((voice) => (
                      <SelectItem key={voice.value} value={voice.value}>
                        {voice.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Speed: {voiceSpeed[0]}x</Label>
                <Slider
                  value={voiceSpeed}
                  onValueChange={setVoiceSpeed}
                  max={2}
                  min={0.5}
                  step={0.1}
                  className="mt-2"
                />
              </div>
              
              <Button 
                onClick={handleGenerate} 
                disabled={!voiceText.trim() || isGenerating}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                {isGenerating ? (
                  <>
                    <Mic className="h-4 w-4 mr-2 animate-pulse" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Generate Voice (Free)
                  </>
                )}
              </Button>
            </div>
            
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <Mic className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">AI Voice Generator</h3>
                    <p className="text-muted-foreground">
                      Convert your text into natural-sounding speech
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="effects" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div>
                <Label htmlFor="effect-prompt">Sound Effect Description</Label>
                <Textarea
                  id="effect-prompt"
                  placeholder="Rain falling on leaves, gentle thunder in the distance..."
                  value={effectPrompt}
                  onChange={(e) => setEffectPrompt(e.target.value)}
                  className="min-h-[100px] mt-2"
                />
              </div>
              
              <div>
                <Label>Category</Label>
                <Select value={effectCategory} onValueChange={setEffectCategory}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {effectCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Duration: {effectDuration[0]} seconds</Label>
                <Slider
                  value={effectDuration}
                  onValueChange={setEffectDuration}
                  max={30}
                  min={1}
                  step={1}
                  className="mt-2"
                />
              </div>
              
              <Button 
                onClick={handleGenerate} 
                disabled={!effectPrompt.trim() || isGenerating}
                className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
              >
                {isGenerating ? (
                  <>
                    <Volume2 className="h-4 w-4 mr-2 animate-pulse" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4 mr-2" />
                    Generate Effect (Free)
                  </>
                )}
              </Button>
            </div>
            
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <Volume2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Sound Effects Generator</h3>
                    <p className="text-muted-foreground mb-4">
                      Generate custom sound effects for your content
                    </p>
                    <Badge className="bg-green-100 text-green-800">
                      <Crown className="h-3 w-3 mr-1" />
                      Lifetime Free
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
