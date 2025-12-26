"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Wand2,
  Shuffle,
  Edit3,
  Maximize2,
  Sparkles,
  Square,
  RectangleVertical,
  RectangleHorizontal,
} from "lucide-react"
import { templateDataset, type Template } from "../lib/template-dataset"
import { TemplateGenerator } from "../lib/template-generator"
import TemplatePreview from "./template-preview"
import AdvancedTemplateEditor from "./template-editor"

interface TemplateSectionProps {
  templates?: Template[]
  prompt: string
}

export default function TemplateSectionEnhanced({ templates, prompt }: TemplateSectionProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [generatedTemplates, setGeneratedTemplates] = useState<Template[]>(templates || [])
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false)

  const generateFromText = () => {
    if (!prompt.trim()) return
    const newTemplate = TemplateGenerator.generateFromText(prompt)
    setGeneratedTemplates((prev) => [newTemplate, ...prev])
    setSelectedTemplate(newTemplate)
  }

  const generateRandom = () => {
    const newTemplate = TemplateGenerator.generateRandom()
    setGeneratedTemplates((prev) => [newTemplate, ...prev])
    setSelectedTemplate(newTemplate)
  }

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template)
    setIsEditorOpen(true)
  }

  const handleSaveTemplate = (updatedTemplate: Template) => {
    // Update in generated templates if it exists there
    setGeneratedTemplates((prev) => prev.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t)))

    // Update selected template if it's the same
    if (selectedTemplate?.id === updatedTemplate.id) {
      setSelectedTemplate(updatedTemplate)
    }

    setIsEditorOpen(false)
    setEditingTemplate(null)
  }

  const handleFullscreenPreview = (template: Template) => {
    setSelectedTemplate(template)
    setIsFullscreenPreview(true)
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "square":
        return <Square className="w-3 h-3 mr-1" />
      case "vertical":
        return <RectangleVertical className="w-3 h-3 mr-1" />
      case "horizontal":
        return <RectangleHorizontal className="w-3 h-3 mr-1" />
      default:
        return null
    }
  }

  // Add layout icon support
  const getLayoutIcon = (layout: string) => {
    switch (layout) {
      case "logo":
        return <Sparkles className="w-3 h-3 mr-1" />
      case "poster":
        return <Square className="w-3 h-3 mr-1" />
      case "sale":
        return <Square className="w-3 h-3 mr-1" />
      default:
        return null
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex justify-between items-center mb-4">
        <Label className="text-base font-semibold">Professional Templates</Label>
        <div className="flex gap-2">
          <Button onClick={generateFromText} size="sm" variant="outline" disabled={!prompt.trim()}>
            <Wand2 className="w-4 h-4 mr-1" />
            From Text
          </Button>
          <Button onClick={generateRandom} size="sm" variant="outline">
            <Shuffle className="w-4 h-4 mr-1" />
            Random
          </Button>
        </div>
      </div>

      {selectedTemplate && (
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">Selected Template</h3>
          <Card className="border-2 border-blue-200">
            <CardContent className="p-4">
              <TemplatePreview template={selectedTemplate} className="h-48" />
              <div className="mt-3 flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">{selectedTemplate.name}</p>
                  <p className="text-xs text-gray-600">{selectedTemplate.description}</p>
                  <div className="flex gap-1 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {getFormatIcon(selectedTemplate.data.format)}
                      {selectedTemplate.data.format}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {getLayoutIcon(selectedTemplate.data.layout)}
                      {selectedTemplate.data.layout}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleFullscreenPreview(selectedTemplate)} size="sm" variant="outline">
                    <Maximize2 className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button onClick={() => handleEditTemplate(selectedTemplate)} size="sm" variant="outline">
                    <Edit3 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-medium">Available Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Pre-built templates */}
          {templateDataset.map((template) => (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedTemplate?.id === template.id ? "ring-2 ring-blue-500" : ""
              }`}
            >
              <CardContent className="p-3">
                <TemplatePreview template={template} className="h-32" />
                <div className="mt-2 flex justify-between items-center">
                  <div onClick={() => setSelectedTemplate(template)} className="flex-1 cursor-pointer">
                    <p className="font-medium text-xs">{template.name}</p>
                    <p className="text-xs text-gray-600">{template.category}</p>
                    <div className="flex gap-1 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {getFormatIcon(template.data.format)}
                        {template.data.format}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {getLayoutIcon(template.data.layout)}
                        {template.data.layout}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      onClick={() => handleFullscreenPreview(template)}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                    >
                      <Maximize2 className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={() => handleEditTemplate(template)}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Generated templates */}
          {generatedTemplates.map((template) => (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all hover:shadow-md border-purple-200 ${
                selectedTemplate?.id === template.id ? "ring-2 ring-purple-500" : ""
              }`}
            >
              <CardContent className="p-3">
                <TemplatePreview template={template} className="h-32" />
                <div className="mt-2 flex items-center justify-between">
                  <div onClick={() => setSelectedTemplate(template)} className="flex-1 cursor-pointer">
                    <p className="font-medium text-xs">{template.name}</p>
                    <p className="text-xs text-gray-600">{template.category}</p>
                    <div className="flex gap-1 mt-1">
                      <Badge className="bg-purple-100 text-purple-700 text-xs">AI Generated</Badge>
                      <Badge variant="secondary" className="text-xs">
                        {getFormatIcon(template.data.format)}
                        {template.data.format}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {getLayoutIcon(template.data.layout)}
                        {template.data.layout}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      onClick={() => handleFullscreenPreview(template)}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                    >
                      <Maximize2 className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={() => handleEditTemplate(template)}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {prompt && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <Sparkles className="w-4 h-4 inline mr-1" />
            Generate a template based on your prompt: "{prompt.slice(0, 100)}..."
          </p>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              <Square className="w-3 h-3 mr-1" />
              Square for Posts
            </Badge>
            <Badge variant="outline" className="text-xs">
              <RectangleVertical className="w-3 h-3 mr-1" />
              Vertical for Stories
            </Badge>
            <Badge variant="outline" className="text-xs">
              <RectangleHorizontal className="w-3 h-3 mr-1" />
              Horizontal for Banners
            </Badge>
          </div>
        </div>
      )}

      {/* Template Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
          {editingTemplate && (
            <AdvancedTemplateEditor
              template={editingTemplate}
              onSave={handleSaveTemplate}
              onClose={() => setIsEditorOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Fullscreen Preview Dialog */}
      <Dialog open={isFullscreenPreview} onOpenChange={setIsFullscreenPreview}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>{selectedTemplate?.name} - Full Screen Preview</span>
              <div className="flex gap-2">
                {selectedTemplate && (
                  <>
                    <Badge variant="outline">
                      {getFormatIcon(selectedTemplate.data.format)}
                      {selectedTemplate.data.format}
                    </Badge>
                    <Button
                      onClick={() => {
                        setIsFullscreenPreview(false)
                        handleEditTemplate(selectedTemplate)
                      }}
                      size="sm"
                      variant="outline"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Template
                    </Button>
                  </>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="flex-1 flex items-center justify-center p-8 rounded-lg overflow-auto">
              <div
                className={`${
                  selectedTemplate.data.format === "square"
                    ? "w-96 h-96"
                    : selectedTemplate.data.format === "vertical"
                      ? "w-80 h-[568px]"
                      : selectedTemplate.data.format === "horizontal"
                        ? "w-full max-w-6xl h-80"
                        : "w-full max-w-4xl h-96"
                }`}
              >
                <TemplatePreview template={selectedTemplate} className="w-full h-full" />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}