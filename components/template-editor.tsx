"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Save,
  Upload,
  Download,
  Maximize2,
  X,
  Palette,
  Type,
  ImageIcon,
  Undo,
  Redo,
  Wand2,
  Layers,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Square,
} from "lucide-react"
import { colorSchemes, type Template } from "../lib/template-dataset"
import { Logo } from "@/components/logo"
import { Playfair_Display, Inter, Dancing_Script, Cinzel, Pacifico } from "next/font/google"

const playfair = Playfair_Display({ subsets: ["latin"] })
const inter = Inter({ subsets: ["latin"] })
const dancingScript = Dancing_Script({ weight: ["400", "700"], subsets: ["latin"] })
const cinzel = Cinzel({ weight: "400", subsets: ["latin"] })
const pacifico = Pacifico({ weight: "400", subsets: ["latin"] })

interface AdvancedTemplateEditorProps {
  template: Template
  onSave?: (template: Template) => void
  onClose?: () => void
}

interface Layer {
  id: string
  type: "text" | "image" | "shape"
  content: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  visible: boolean
  style: {
    fontSize?: number
    fontFamily?: string
    fontWeight?: string
    color?: string
    backgroundColor?: string
    borderRadius?: number
    border?: string
    textAlign?: "left" | "center" | "right"
  }
}

export default function AdvancedTemplateEditor({ template, onSave, onClose }: AdvancedTemplateEditorProps) {
  const [editedTemplate, setEditedTemplate] = useState<Template>(template)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeTab, setActiveTab] = useState("design")
  const [history, setHistory] = useState<Template[]>([template])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [layers, setLayers] = useState<Layer[]>([])
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null)
  const [isGeneratingBackground, setIsGeneratingBackground] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const backgroundInputRef = useRef<HTMLInputElement>(null)

  const updateTemplate = useCallback(
    (updates: Partial<Template["data"]>) => {
      const newTemplate = {
        ...editedTemplate,
        data: { ...editedTemplate.data, ...updates },
      }
      setEditedTemplate(newTemplate)

      // Add to history
      const newHistory = history.slice(0, historyIndex + 1)
      newHistory.push(newTemplate)
      setHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)
    },
    [editedTemplate, history, historyIndex],
  )

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setEditedTemplate(history[historyIndex - 1])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setEditedTemplate(history[historyIndex + 1])
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        updateTemplate({ imageUrl: e.target?.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleBackgroundUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        updateTemplate({ imageUrl: e.target?.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

 const generateAIBackground = async (prompt: string) => {
  if (!prompt.trim()) return;
  setIsGeneratingBackground(true);
  try {
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      prompt
    )}?width=1024&height=1024&seed=${Date.now()}`;
    updateTemplate({ imageUrl });
  } catch (error) {
    console.error("Failed to generate background:", error);
  } finally {
    setIsGeneratingBackground(false);
  }
};

  const addLayer = (type: Layer["type"]) => {
    const newLayer: Layer = {
      id: `layer-${Date.now()}`,
      type,
      content: type === "text" ? "New Text" : type === "image" ? "" : "shape",
      x: 50,
      y: 50,
      width: type === "text" ? 200 : 100,
      height: type === "text" ? 50 : 100,
      rotation: 0,
      opacity: 1,
      visible: true,
      style: {
        fontSize: 16,
        fontFamily: "Arial",
        fontWeight: "normal",
        color: "#000000",
        backgroundColor: type === "shape" ? "#ffffff" : "transparent",
        borderRadius: 0,
        textAlign: "center",
      },
    }
    setLayers([...layers, newLayer])
    setSelectedLayer(newLayer.id)
  }

  const updateLayer = (layerId: string, updates: Partial<Layer>) => {
    setLayers(layers.map((layer) => (layer.id === layerId ? { ...layer, ...updates } : layer)))
  }

  const deleteLayer = (layerId: string) => {
    setLayers(layers.filter((layer) => layer.id !== layerId))
    if (selectedLayer === layerId) {
      setSelectedLayer(null)
    }
  }

  const duplicateLayer = (layerId: string) => {
    const layer = layers.find((l) => l.id === layerId)
    if (layer) {
      const newLayer = {
        ...layer,
        id: `layer-${Date.now()}`,
        x: layer.x + 10,
        y: layer.y + 10,
      }
      setLayers([...layers, newLayer])
    }
  }

  const handleSave = () => {
    onSave?.(editedTemplate)
    localStorage.setItem(`template-${editedTemplate.id}`, JSON.stringify(editedTemplate))
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(editedTemplate, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
    const exportFileDefaultName = `${editedTemplate.data.name?.toLowerCase().replace(/\s+/g, "-") || "template"}-template.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const currentColorScheme = colorSchemes[editedTemplate.data.colorScheme as keyof typeof colorSchemes]

  const renderTemplate = () => {
    const { data } = editedTemplate

    const getContainerClass = () => {
      switch (data.format) {
        case "square":
          return "w-96 h-96"
        case "vertical":
          return "w-80 h-[568px]"
        case "horizontal":
          return "w-full max-w-6xl h-80"
        default:
          return "w-full max-w-4xl h-96"
      }
    }

    if (data.layout === "logo" && (editedTemplate.id?.startsWith("creative-minds") ?? false)) {
      const variant = editedTemplate.id === "creative-minds-bold-logo"
        ? "creative-minds-bold"
        : editedTemplate.id === "creative-minds-luxury-logo"
          ? "creative-minds-luxury"
          : "creative-minds-minimal"
      return (
        <div
          className={`${getContainerClass()} relative overflow-hidden rounded-lg flex items-center justify-center`}
          style={{ backgroundColor: "transparent" }}
        >
          <Logo size="lg" animated={false} variant={variant as any} />
        </div>
      )
    }

    if (data.layout === "logo") {
      if ((data.title || "").toLowerCase().includes("ginger")) {
        return (
          <div
            className={`${getContainerClass()} relative overflow-hidden rounded-lg flex items-center justify-center`}
            style={{ backgroundColor: "#DEDBD3" }}
          >
            <div className="cq-container w-full h-full flex items-center justify-center p-[clamp(8px,3cqi,24px)] text-[#1A1A1A]">
              <div className="max-w-[92%] max-h-[92%] w-full flex flex-col items-center justify-center gap-2">
                <h1
                  className={`${playfair.className} text-center whitespace-nowrap text-[clamp(2rem,12cqw,10rem)] leading-[0.9] font-bold tracking-tighter`}
                >
                  {data.title}
                </h1>
                <div className="flex w-full items-center justify-center gap-2 px-[clamp(4px,1cqi,12px)]">
                  <div className="h-[1px] flex-1 bg-[#1A1A1A]/20" />
                  {data.subtitle && (
                    <p className={`${inter.className} text-[clamp(0.5rem,2.5cqw,1rem)] font-bold tracking-[0.6em] whitespace-nowrap uppercase`}>
                      {data.subtitle}
                    </p>
                  )}
                  <div className="h-[1px] flex-1 bg-[#1A1A1A]/20" />
                </div>
              </div>
            </div>
          </div>
      )
      }
      
      if ((data.title || "").toLowerCase().includes("olivia wilson")) {
        return (
          <div
            className={`${getContainerClass()} relative overflow-hidden rounded-lg flex items-center justify-center`}
            style={{ backgroundColor: "#000000" }}
          >
            <div className="absolute inset-0 flex items-start justify-center pt-[clamp(6px,2cqh,16px)]">
              <svg width="300" height="150" viewBox="0 0 300 150" className="w-[85%] h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="topGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#d4a5a5" />
                    <stop offset="50%" stopColor="#c89595" />
                    <stop offset="100%" stopColor="#000000" />
                  </linearGradient>
                </defs>
                <path d="M 30 120 Q 75 20, 150 10 T 270 120" stroke="url(#topGradient)" strokeWidth="2" strokeLinecap="round" fill="none" />
              </svg>
            </div>
            <div className="cq-container relative z-10 w-full h-full flex items-center justify-center p-[clamp(12px,3cqi,36px)]">
              <div className="max-w-[90%] max-h-[90%] w-full flex flex-col items-center justify-center text-center">
                <h1 className={`${dancingScript.className} text-[clamp(3rem,14cqw,9rem)] leading-[0.95] text-[#d4a5a5] mb-2`}>{data.title}</h1>
                {data.subtitle && (
                  <p className={`${cinzel.className} text-[#d4a5a5] text-[clamp(0.7rem,2cqw,1rem)] tracking-[0.3em] uppercase`}>{data.subtitle}</p>
                )}
              </div>
            </div>
            <div className="absolute inset-0 flex items-end justify-center pb-[clamp(6px,2cqh,16px)]">
              <svg width="300" height="150" viewBox="0 0 300 150" className="w-[85%] h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="bottomGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#000000" />
                    <stop offset="50%" stopColor="#c89595" />
                    <stop offset="100%" stopColor="#d4a5a5" />
                  </linearGradient>
                </defs>
                <path d="M 30 30 Q 75 130, 150 140 T 270 30" stroke="url(#bottomGradient)" strokeWidth="2" strokeLinecap="round" fill="none" />
              </svg>
            </div>
          </div>
        )
      }
      if ((data.title || "").toLowerCase().includes("verde")) {
        return (
          <div
            className={`${getContainerClass()} relative overflow-hidden rounded-lg flex items-center justify-center`}
            style={{ backgroundColor: "#5bc8a8" }}
          >
            <div className="cq-container relative z-10 w-full h-full flex items-center justify-center p-[clamp(12px,3cqi,36px)]">
              <div className="max-w-[90%] max-h-[90%] w-full flex flex-col items-center justify-center text-center text-white select-none">
                <h1 className={`${pacifico.className} text-[clamp(3rem,16cqw,10rem)] leading-[0.8] mb-2 drop-shadow-sm`}>{data.title}</h1>
                {data.subtitle && (
                  <p className={`${inter.className} text-[clamp(0.7rem,2cqw,1rem)] font-medium tracking-[0.4em] uppercase opacity-90 mt-[clamp(6px,2cqh,12px)]`}>{data.subtitle}</p>
                )}
              </div>
            </div>
          </div>
        )
      }
      if ((data.title || "").toLowerCase().includes("arion")) {
        return (
          <div
            className={`${getContainerClass()} relative overflow-hidden rounded-lg flex items-center justify-center`}
            style={{ backgroundColor: "#fde2e4" }}
          >
            <div className="cq-container relative z-10 w-full h-full flex items-center justify-center p-[clamp(12px,3cqi,36px)]">
              <div className="max-w-[90%] max-h-[90%] w-full flex flex-col items-center justify-center text-center text-black select-none">
                <div className="relative flex items-center justify-center mb-[clamp(12px,3cqh,24px)]">
                  <div className="relative w-[clamp(72px,22cqw,128px)] h-[clamp(72px,22cqw,128px)]">
                    <div className="absolute inset-0 rounded-full border border-black/80" />
                    <div className="absolute inset-[clamp(2px,0.8cqi,6px)] rounded-full border-[3px] border-black/90" />
                    <span className={`${playfair.className} absolute inset-0 flex items-center justify-center italic text-[clamp(2rem,9cqw,5rem)] leading-[1]`}>A</span>
                  </div>
                </div>
                <h1 className={`${playfair.className} text-[clamp(2rem,9cqw,6.5rem)] tracking-[0.03em] uppercase text-black mb-1 whitespace-nowrap`}>{data.title}</h1>
                {data.subtitle && (
                  <p className={`${inter.className} text-black text-[clamp(0.6rem,1.8cqw,1rem)] font-light tracking-[0.35em] uppercase border-t border-black/20 pt-[clamp(8px,2cqh,16px)] w-full text-center whitespace-nowrap`}>{data.subtitle}</p>
                )}
              </div>
            </div>
          </div>
        )
      }
      return (
        <div
          className={`${getContainerClass()} relative overflow-hidden rounded-lg flex items-center justify-center`}
          style={{
            backgroundColor: data.backgroundColor || "#FF1493",
          }}
        >
          <div className="absolute top-4 left-4 text-white text-xs">✦</div>
          <div className="absolute top-4 right-4 text-white text-xs">✦</div>
          <div className="absolute bottom-4 left-4 text-white text-xs">✦</div>
          <div className="absolute bottom-4 right-4 text-white text-xs">✦</div>
          <div className="text-center text-white">
            <h1 className="text-3xl font-black mb-2" style={{ 
              fontFamily: data.fontFamily === "mixed" ? "Arial Black, sans-serif" : "Arial Black, sans-serif",
              color: data.textColor || "#FFFFFF"
            }}>
              {data.title || "Adorable."}
            </h1>
            <p className="text-xs tracking-[0.3em] font-light" style={{ 
              fontFamily: "Times New Roman, serif",
              color: data.textColor || "#FFFFFF"
            }}>
              {data.subtitle || "FASHION & BEAUTY."}
            </p>
          </div>
          <div className="absolute left-1/2 top-1/2 transform -translate-x-12 -translate-y-2 text-white text-xs">✦</div>
          <div className="absolute left-1/2 top-1/2 transform translate-x-12 translate-y-2 text-white text-xs">✦</div>
        </div>
      )
    }

    // Render different layouts based on template type
    if (data.layout === "poster" || data.layout === "sale") {
      return (
        <div
          className={`${getContainerClass()} relative overflow-hidden rounded-lg`}
          style={{
            backgroundImage: `url(${data.imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to right, ${currentColorScheme.from}${Math.round(
                (data.overlayOpacity || 0.9) * 255,
              )
                .toString(16)
                .padStart(2, "0")}, ${currentColorScheme.to}${Math.round((data.overlayOpacity || 0.9) * 255)
                .toString(16)
                .padStart(2, "0")})`,
            }}
          />

          {/* Content */}
          <div className="relative z-10 h-full flex items-center justify-center p-8">
            <div
              className="text-center p-6 rounded-lg"
              style={{
                backgroundColor: data.backgroundColor || "#F5F5DC",
                borderRadius: `${data.borderRadius || 8}px`,
                boxShadow: data.shadow ? "0 10px 25px rgba(0,0,0,0.2)" : "none",
                color: data.textColor || "#000000",
              }}
            >
              {data.title && (
                <h1
                  className="mb-2"
                  style={{
                    fontSize: data.fontSize === "large" ? "4rem" : "3rem",
                    fontFamily: data.fontFamily === "mixed" ? "Dancing Script, cursive" : "Arial, sans-serif",
                    fontWeight: data.fontWeight || "bold",
                    textAlign: data.alignment || "center",
                  }}
                >
                  {data.title}
                </h1>
              )}

              {data.subtitle && (
                <h2
                  className="mb-4"
                  style={{
                    fontSize: data.fontSize === "large" ? "3rem" : "2rem",
                    fontFamily: "Arial Black, sans-serif",
                    fontWeight: "900",
                    textAlign: data.alignment || "center",
                    letterSpacing: "0.1em",
                    WebkitTextStroke: "2px white",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {data.subtitle}
                </h2>
              )}

              {data.subtext && (
                <p
                  className="mb-4"
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    textAlign: data.alignment || "center",
                  }}
                >
                  {data.subtext}
                </p>
              )}

              {data.cta && (
                <button
                  className="px-6 py-3 rounded-lg font-bold text-lg transition-all hover:scale-105"
                  style={{
                    backgroundColor: "#ffffff",
                    color: "#000000",
                    border: "2px solid #000000",
                  }}
                >
                  {data.cta}
                </button>
              )}
            </div>
          </div>

          {/* Render additional layers */}
          {layers.map((layer) => (
            <div
              key={layer.id}
              className={`absolute ${selectedLayer === layer.id ? "ring-2 ring-blue-500" : ""}`}
              style={{
                left: `${layer.x}px`,
                top: `${layer.y}px`,
                width: `${layer.width}px`,
                height: `${layer.height}px`,
                transform: `rotate(${layer.rotation}deg)`,
                opacity: layer.opacity,
                display: layer.visible ? "block" : "none",
                cursor: "move",
              }}
              onClick={() => setSelectedLayer(layer.id)}
            >
              {layer.type === "text" && (
                <div
                  style={{
                    ...layer.style,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      layer.style.textAlign === "center"
                        ? "center"
                        : layer.style.textAlign === "right"
                          ? "flex-end"
                          : "flex-start",
                  }}
                >
                  {layer.content}
                </div>
              )}
              {layer.type === "shape" && (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: layer.style.backgroundColor,
                    borderRadius: `${layer.style.borderRadius}px`,
                    border: layer.style.border,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )
    }

    // Default template rendering for other layouts
    return (
      <div
        className={`${getContainerClass()} relative overflow-hidden rounded-lg`}
        style={{
          background: `linear-gradient(to right, ${currentColorScheme.from}, ${currentColorScheme.to})`,
        }}
      >
        <div className="h-full flex items-center justify-center p-8">
          {/* Your existing template rendering logic */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">{data.name || data.title || "Template"}</h1>
            <p className="text-lg text-gray-600">{data.profession || data.subtitle || "Professional Template"}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-white border-b shadow-sm">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">Template Editor</h2>
          <div className="flex gap-1">
            {editedTemplate.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={undo} disabled={historyIndex === 0} size="sm" variant="outline">
            <Undo className="w-4 h-4" />
          </Button>
          <Button onClick={redo} disabled={historyIndex === history.length - 1} size="sm" variant="outline">
            <Redo className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Maximize2 className="w-4 h-4 mr-2" />
                Preview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full">
              <DialogHeader>
                <DialogTitle className="flex justify-between items-center">
                  <span>{editedTemplate.name} - Full Preview</span>
                  <Button onClick={() => setIsFullscreen(false)} size="sm" variant="ghost">
                    <X className="w-4 h-4" />
                  </Button>
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 flex items-center justify-center p-8 bg-gray-100 rounded-lg overflow-auto">
                {renderTemplate()}
              </div>
            </DialogContent>
          </Dialog>

          <Button onClick={handleSave} size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button onClick={handleExport} size="sm" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          {onClose && (
            <Button onClick={onClose} size="sm" variant="ghost">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Left Sidebar - Tools */}
        <div className="w-80 bg-white border-r overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 p-1">
              <TabsTrigger value="design" className="text-xs">
                <Palette className="w-3 h-3 mr-1" />
                Design
              </TabsTrigger>
              <TabsTrigger value="text" className="text-xs">
                <Type className="w-3 h-3 mr-1" />
                Text
              </TabsTrigger>
              <TabsTrigger value="media" className="text-xs">
                <ImageIcon className="w-3 h-3 mr-1" />
                Media
              </TabsTrigger>
              <TabsTrigger value="elements" className="text-xs">
                <Square className="w-3 h-3 mr-1" />
                Elements
              </TabsTrigger>
              <TabsTrigger value="layers" className="text-xs">
                <Layers className="w-3 h-3 mr-1" />
                Layers
              </TabsTrigger>
            </TabsList>

            <div className="p-4">
              <TabsContent value="design" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Background</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => backgroundInputRef.current?.click()}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <Upload className="w-3 h-3 mr-1" />
                        Upload
                      </Button>
                      <Button
                        onClick={() => generateAIBackground("beautiful summer beach scene")}
                        variant="outline"
                        size="sm"
                        disabled={isGeneratingBackground}
                      >
                        <Wand2 className="w-3 h-3 mr-1" />
                        AI Generate
                      </Button>
                    </div>
                    <input
                      ref={backgroundInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBackgroundUpload}
                      className="hidden"
                    />

                    <div>
                      <Label className="text-xs">AI Background Prompt</Label>
                      <div className="flex gap-1 mt-1">
                        <Input
                          placeholder="ocean sunset, mountains..."
                          className="text-xs"
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              generateAIBackground(e.currentTarget.value)
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement
                            generateAIBackground(input.value)
                          }}
                          disabled={isGeneratingBackground}
                        >
                          <Wand2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Colors</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(colorSchemes).map(([key, scheme]) => (
                        <Button
                          key={key}
                          onClick={() => updateTemplate({ colorScheme: key })}
                          variant={editedTemplate.data.colorScheme === key ? "default" : "outline"}
                          size="sm"
                          className="justify-start text-xs"
                        >
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ background: `linear-gradient(to right, ${scheme.from}, ${scheme.to})` }}
                          />
                          {scheme.name}
                        </Button>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Text Color</Label>
                      <input
                        type="color"
                        value={editedTemplate.data.textColor || "#000000"}
                        onChange={(e) => updateTemplate({ textColor: e.target.value })}
                        className="w-full h-8 rounded border"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Background Color</Label>
                      <input
                        type="color"
                        value={editedTemplate.data.backgroundColor || "#F5F5DC"}
                        onChange={(e) => updateTemplate({ backgroundColor: e.target.value })}
                        className="w-full h-8 rounded border"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Effects</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Overlay Opacity</Label>
                      <Slider
                        value={[editedTemplate.data.overlayOpacity || 0.9]}
                        onValueChange={([value]) => updateTemplate({ overlayOpacity: value })}
                        max={1}
                        min={0}
                        step={0.1}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Border Radius</Label>
                      <Slider
                        value={[editedTemplate.data.borderRadius || 8]}
                        onValueChange={([value]) => updateTemplate({ borderRadius: value })}
                        max={50}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Drop Shadow</Label>
                      <Switch
                        checked={editedTemplate.data.shadow || false}
                        onCheckedChange={(checked) => updateTemplate({ shadow: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="text" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Text Content</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs">Title</Label>
                      <Input
                        value={editedTemplate.data.title || ""}
                        onChange={(e) => updateTemplate({ title: e.target.value })}
                        placeholder="Enter title"
                        className="text-xs mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Subtitle</Label>
                      <Input
                        value={editedTemplate.data.subtitle || ""}
                        onChange={(e) => updateTemplate({ subtitle: e.target.value })}
                        placeholder="Enter subtitle"
                        className="text-xs mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Subtext</Label>
                      <Input
                        value={editedTemplate.data.subtext || ""}
                        onChange={(e) => updateTemplate({ subtext: e.target.value })}
                        placeholder="Enter subtext"
                        className="text-xs mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Call to Action</Label>
                      <Input
                        value={editedTemplate.data.cta || ""}
                        onChange={(e) => updateTemplate({ cta: e.target.value })}
                        placeholder="Enter CTA"
                        className="text-xs mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Typography</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs">Font Family</Label>
                      <select
                        value={editedTemplate.data.fontFamily || "Arial"}
                        onChange={(e) => updateTemplate({ fontFamily: e.target.value })}
                        className="w-full p-2 text-xs border rounded mt-1"
                      >
                        <option value="Arial">Arial</option>
                        <option value="mixed">Mixed (Script + Sans)</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Times">Times New Roman</option>
                        <option value="Helvetica">Helvetica</option>
                        <option value="Courier">Courier New</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-xs">Font Size</Label>
                      <select
                        value={editedTemplate.data.fontSize || "medium"}
                        onChange={(e) => updateTemplate({ fontSize: e.target.value })}
                        className="w-full p-2 text-xs border rounded mt-1"
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                        <option value="extra-large">Extra Large</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-xs">Text Alignment</Label>
                      <div className="flex gap-1 mt-1">
                        <Button
                          size="sm"
                          variant={editedTemplate.data.alignment === "left" ? "default" : "outline"}
                          onClick={() => updateTemplate({ alignment: "left" })}
                        >
                          <AlignLeft className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant={editedTemplate.data.alignment === "center" ? "default" : "outline"}
                          onClick={() => updateTemplate({ alignment: "center" })}
                        >
                          <AlignCenter className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant={editedTemplate.data.alignment === "right" ? "default" : "outline"}
                          onClick={() => updateTemplate({ alignment: "right" })}
                        >
                          <AlignRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="media" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Images</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Image
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      {["beach", "sunset", "mountains", "city", "nature", "abstract"].map((prompt) => (
                        <Button
                          key={prompt}
                          onClick={() => generateAIBackground(`beautiful ${prompt} background`)}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          disabled={isGeneratingBackground}
                        >
                          {prompt}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="elements" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Add Elements</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={() => addLayer("text")}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                    >
                      <Type className="w-4 h-4 mr-2" />
                      Add Text
                    </Button>
                    <Button
                      onClick={() => addLayer("shape")}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Add Shape
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="layers" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Layers</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {layers.map((layer) => (
                      <div
                        key={layer.id}
                        className={`flex items-center gap-2 p-2 rounded border ${
                          selectedLayer === layer.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                        }`}
                        onClick={() => setSelectedLayer(layer.id)}
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateLayer(layer.id, { visible: !layer.visible })}
                        >
                          {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        </Button>
                        <span className="flex-1 text-xs truncate">{layer.content}</span>
                        <Button size="sm" variant="ghost" onClick={() => duplicateLayer(layer.id)}>
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteLayer(layer.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {selectedLayer && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Layer Properties</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(() => {
                        const layer = layers.find((l) => l.id === selectedLayer)
                        if (!layer) return null

                        return (
                          <>
                            {layer.type === "text" && (
                              <div>
                                <Label className="text-xs">Text Content</Label>
                                <Input
                                  value={layer.content}
                                  onChange={(e) => updateLayer(layer.id, { content: e.target.value })}
                                  className="text-xs mt-1"
                                />
                              </div>
                            )}

                            <div className="space-y-2">
                              <Label className="text-xs">Opacity</Label>
                              <Slider
                                value={[layer.opacity]}
                                onValueChange={([value]) => updateLayer(layer.id, { opacity: value })}
                                max={1}
                                min={0}
                                step={0.1}
                                className="w-full"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs">Rotation</Label>
                              <Slider
                                value={[layer.rotation]}
                                onValueChange={([value]) => updateLayer(layer.id, { rotation: value })}
                                max={360}
                                min={-360}
                                step={1}
                                className="w-full"
                              />
                            </div>
                          </>
                        )
                      })()}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 flex items-center justify-center p-8 bg-gray-100">
          <div className="relative">{renderTemplate()}</div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-64 bg-white border-l p-4 overflow-y-auto">
          <h3 className="font-semibold mb-4">Template Properties</h3>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Format</Label>
              <select
                value={editedTemplate.data.format}
                onChange={(e) => updateTemplate({ format: e.target.value as any })}
                className="w-full p-2 text-sm border rounded mt-1"
              >
                <option value="classic">Classic (4:3)</option>
                <option value="square">Square (1:1)</option>
                <option value="vertical">Vertical (9:16)</option>
                <option value="horizontal">Horizontal (16:9)</option>
              </select>
            </div>

            <div>
              <Label className="text-sm font-medium">Layout Style</Label>
              <select
                value={editedTemplate.data.layout}
                onChange={(e) => updateTemplate({ layout: e.target.value as any })}
                className="w-full p-2 text-sm border rounded mt-1"
              >
                <option value="classic">Classic</option>
                <option value="modern">Modern</option>
                <option value="minimal">Minimal</option>
                <option value="creative">Creative</option>
                <option value="poster">Poster</option>
                <option value="sale">Sale</option>
                <option value="logo">Logo</option>
              </select>
            </div>

            <div>
              <Label className="text-sm font-medium">Style</Label>
              <select
                value={editedTemplate.data.style || "modern"}
                onChange={(e) => updateTemplate({ style: e.target.value as any })}
                className="w-full p-2 text-sm border rounded mt-1"
              >
                <option value="modern">Modern</option>
                <option value="vintage">Vintage</option>
                <option value="playful">Playful</option>
                <option value="elegant">Elegant</option>
                <option value="bold">Bold</option>
                <option value="minimal">Minimal</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}