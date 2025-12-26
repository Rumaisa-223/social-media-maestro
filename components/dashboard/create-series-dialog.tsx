"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, BookOpen, X, Loader2, Sparkles, CheckCircle2 } from "lucide-react"

interface CreateSeriesDialogProps {
  open: boolean
  onOpenChangeAction: (open: boolean) => void
}

interface EpisodeSuggestion {
  title: string
  description: string
  importance: string
  postingTip: string
}

export function CreateSeriesDialog({ open, onOpenChangeAction }: CreateSeriesDialogProps) {
  const [step, setStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [formData, setFormData] = useState({
    seriesName: "",
    description: "",
    episodeCount: "5",
    industry: "SaaS",
  })
  const [generatedSuggestions, setGeneratedSuggestions] = useState<EpisodeSuggestion[]>([])
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const generateEpisodes = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch("/api/generate-series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seriesName: formData.seriesName,
          industry: formData.industry,
          episodeCount: formData.episodeCount,
        }),
      })

      const text = await response.text()

      // Parse JSON from streamed text
      try {
        const jsonMatch = text.match(/\[\s*{[\s\S]*}\s*\]/)
        if (jsonMatch) {
          const suggestions = JSON.parse(jsonMatch[0])
          setGeneratedSuggestions(suggestions)
          setSelectedTopics(suggestions.map((_: EpisodeSuggestion, idx: number) => `${idx + 1}`))
        }
      } catch (parseError) {
        console.log("[v0] Parse error:", parseError)
        // Fallback to default suggestions if parsing fails
        setGeneratedSuggestions([
          {
            title: "Introduction & Setup",
            description: "Getting started with the basics",
            importance: "Foundation for understanding",
            postingTip: "Post on Tuesday morning for best reach",
          },
          {
            title: "Core Features Overview",
            description: "Deep dive into main capabilities",
            importance: "Helps users explore the platform",
            postingTip: "Post on Thursday evening",
          },
          {
            title: "Advanced Tips & Tricks",
            description: "Power user techniques",
            importance: "Engages experienced users",
            postingTip: "Post on Wednesday",
          },
        ])
        setSelectedTopics(["1", "2", "3"])
      }
    } catch (error) {
      console.log("[v0] Generation error:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleNext = async () => {
    if (step === 1 && formData.seriesName.trim()) {
      setStep(2)
    } else if (step === 2) {
      await generateEpisodes()
      setStep(3)
    }
  }

  const handleCreate = () => {
    const selectedEpisodes = generatedSuggestions.filter((_, idx) => selectedTopics.includes(`${idx + 1}`))

    console.log("[v0] Series created:", {
      ...formData,
      episodes: selectedEpisodes,
    })
    setFormData({ seriesName: "", description: "", episodeCount: "5", industry: "SaaS" })
    setStep(1)
    setGeneratedSuggestions([])
    setSelectedTopics([])
    onOpenChangeAction(false)
  }

  const isStep1Valid = formData.seriesName.trim().length > 0
  const isStep2Valid = formData.description.trim().length > 0
  const isStep3Valid = selectedTopics.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg flex-shrink-0">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-xl mb-1">Create How-To Series</DialogTitle>
                <DialogDescription>
                  <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-0">
                    Step {step} of 3
                  </Badge>
                </DialogDescription>
              </div>
            </div>
            <button
              onClick={() => {
                onOpenChangeAction(false)
                setStep(1)
              }}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {/* Progress Bar */}
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full transition-all ${
                  s <= step ? "bg-blue-600 dark:bg-blue-500" : "bg-slate-200 dark:bg-slate-700"
                }`}
              />
            ))}
          </div>

          {/* Step 1: Series Name */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">Series Name</label>
                <Input
                  placeholder="e.g., Getting Started with Our Platform"
                  name="seriesName"
                  value={formData.seriesName}
                  onChange={handleInputChange}
                  className="border-slate-300 dark:border-slate-600"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Give your series a clear, engaging title that describes what viewers will learn.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Description & Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                  Series Description
                </label>
                <Textarea
                  placeholder="Describe what your series is about and what value it provides to your audience..."
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="border-slate-300 dark:border-slate-600"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  This will be shown in your series preview to attract viewers.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                    Industry/Niche
                  </label>
                  <Input
                    placeholder="e.g., SaaS, E-commerce, Education"
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    className="border-slate-300 dark:border-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                    Number of Episodes
                  </label>
                  <select
                    name="episodeCount"
                    value={formData.episodeCount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, episodeCount: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="3">3 episodes</option>
                    <option value="5">5 episodes</option>
                    <option value="10">10 episodes</option>
                    <option value="15">15 episodes</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex gap-2 items-start">
                  <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-medium mb-1">AI-Powered Next Step</p>
                    <p>
                      In the next step, AI will analyze your industry and suggest episode topics tailored to your
                      audience.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: AI-Generated Topics */}
          {step === 3 && (
            <div className="space-y-4">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
                  <p className="text-slate-700 dark:text-slate-300">Generating episode suggestions...</p>
                </div>
              ) : (
                <>
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <label className="block text-sm font-medium text-slate-900 dark:text-slate-100">
                        AI-Suggested Episodes
                      </label>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                      Click to select which episodes to include in your series
                    </p>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {generatedSuggestions.map((suggestion, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setSelectedTopics((prev) => {
                              const num = `${idx + 1}`
                              return prev.includes(num) ? prev.filter((x) => x !== num) : [...prev, num]
                            })
                          }}
                          className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                            selectedTopics.includes(`${idx + 1}`)
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-600"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                selectedTopics.includes(`${idx + 1}`)
                                  ? "border-blue-500 bg-blue-500"
                                  : "border-slate-300 dark:border-slate-600"
                              }`}
                            >
                              {selectedTopics.includes(`${idx + 1}`) && <CheckCircle2 className="w-4 h-4 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                                Episode {idx + 1}: {suggestion.title}
                              </h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                {suggestion.description}
                              </p>
                              <div className="flex flex-col gap-2 text-xs">
                                <div>
                                  <span className="font-medium text-slate-700 dark:text-slate-300">
                                    Why it matters:{" "}
                                  </span>
                                  <span className="text-slate-600 dark:text-slate-400">{suggestion.importance}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-slate-700 dark:text-slate-300">Best time: </span>
                                  <span className="text-slate-600 dark:text-slate-400">{suggestion.postingTip}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-4">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} disabled={isGenerating} className="flex-1">
                Back
              </Button>
            )}
            {step < 3 && (
              <Button
                onClick={handleNext}
                disabled={(step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid) || isGenerating}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
            {step === 3 && (
              <>
                <Button variant="outline" onClick={() => setStep(2)} disabled={isGenerating} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!isStep3Valid || isGenerating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Create Series
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
