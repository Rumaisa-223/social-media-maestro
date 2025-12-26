"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, TrendingUp, Sparkles, X, CheckCircle2 } from "lucide-react"
import { CreateSeriesDialog } from "./create-series-dialog"
import { OptimizeTimingDialog } from "./optimize-timing-dialog"
import { TrendingHashtagDialog } from "./trending-hashtag-dialog"

interface Suggestion {
  id: string
  title: string
  icon: React.ReactNode
  category: string
  preview: string
  description: string
  metric: string
  actions: Array<{
    label: string
    variant: "default" | "outline"
    onClick: () => void
  }>
}

export function SmartSuggestions() {
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [showCreateSeries, setShowCreateSeries] = useState(false)
  const [showOptimizeTiming, setShowOptimizeTiming] = useState(false)
  const [showTrendingHashtag, setShowTrendingHashtag] = useState(false)

  const suggestions: Suggestion[] = [
    {
      id: "timing",
      title: "Optimize Post Timing",
      icon: <Clock className="w-6 h-6" />,
      category: "Engagement",
      preview: "Your audience is most active between 7-9 PM",
      description:
        "Your audience is most active between 7-9 PM. Consider rescheduling your evening posts to this timeframe for 28% higher engagement.",
      metric: "28% higher engagement",
      actions: [
        {
          label: "Apply",
          variant: "default",
          onClick: () => {
            setShowOptimizeTiming(true)
            handleDismiss("timing")
          },
        },
        {
          label: "Dismiss",
          variant: "outline",
          onClick: () => handleDismiss("timing"),
        },
      ],
    },
    {
      id: "content-gap",
      title: "Content Gap Opportunity",
      icon: <Sparkles className="w-6 h-6" />,
      category: "Content Strategy",
      preview: "Your competitors are getting traction with tutorial content",
      description:
        "Your competitors are getting traction with tutorial content. Consider creating a how-to series for your product features.",
      metric: "Competitive advantage",
      actions: [
        {
          label: "Create Series",
          variant: "default",
          onClick: () => {
            setShowCreateSeries(true)
            handleDismiss("content-gap")
          },
        },
        {
          label: "Dismiss",
          variant: "outline",
          onClick: () => handleDismiss("content-gap"),
        },
      ],
    },
    {
      id: "hashtag",
      title: "Trending Hashtag Alert",
      icon: <TrendingUp className="w-6 h-6" />,
      category: "Trends",
      preview: "#SustainableBusiness is trending in your industry",
      description:
        "#SustainableBusiness is trending in your industry. Add this to your next post about your eco-friendly initiatives.",
      metric: "Real-time trend",
      actions: [
        {
          label: "Add to Post",
          variant: "default",
          onClick: () => {
            setShowTrendingHashtag(true)
            handleDismiss("hashtag")
          },
        },
        {
          label: "Dismiss",
          variant: "outline",
          onClick: () => handleDismiss("hashtag"),
        },
      ],
    },
  ]

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id))
    setSelectedSuggestion(null)
  }

  const visibleSuggestions = suggestions.filter((s) => !dismissedIds.has(s.id))

  if (visibleSuggestions.length === 0) {
    return null
  }

  return (
    <>
      <Card className="md:col-span-2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">AI-Powered Suggestions</h3>
          </div>

          <p className="text-sm text-blue-700 dark:text-blue-300 mb-6">
            We found {visibleSuggestions.length} opportunity to boost your social media performance
          </p>

          <div className="space-y-3">
            {visibleSuggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => setSelectedSuggestion(suggestion.id)}
                className="w-full text-left p-4 bg-white dark:bg-slate-800 rounded-lg border border-blue-200 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors flex-shrink-0">
                    <div className="text-blue-600 dark:text-blue-400">{suggestion.icon}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100">{suggestion.title}</h4>
                      <Badge
                        variant="secondary"
                        className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-0"
                      >
                        {suggestion.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{suggestion.preview}</p>
                  </div>
                  <div className="flex-shrink-0 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Modal Dialog */}
      <Dialog open={!!selectedSuggestion} onOpenChange={() => setSelectedSuggestion(null)}>
        <DialogContent className="max-w-2xl">
          {selectedSuggestion &&
            (() => {
              const suggestion = suggestions.find((s) => s.id === selectedSuggestion)
              if (!suggestion) return null

              return (
                <>
                  <DialogHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg flex-shrink-0">
                          <div className="text-blue-600 dark:text-blue-400">{suggestion.icon}</div>
                        </div>
                        <div>
                          <DialogTitle className="text-xl mb-1">{suggestion.title}</DialogTitle>
                          <DialogDescription className="flex items-center gap-2">
                            <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-0">
                              {suggestion.category}
                            </Badge>
                            <span className="text-blue-600 dark:text-blue-400 font-medium">{suggestion.metric}</span>
                          </DialogDescription>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedSuggestion(null)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </DialogHeader>

                  <div className="space-y-6 py-4">
                    {/* Description */}
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Details</h3>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{suggestion.description}</p>
                    </div>

                    {/* Key Benefits */}
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">What you'll get</h3>
                      <div className="space-y-2">
                        {suggestion.id === "timing" && (
                          <>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                              <span className="text-slate-700 dark:text-slate-300">
                                Higher engagement rates on evening content
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                              <span className="text-slate-700 dark:text-slate-300">Optimized posting schedule</span>
                            </div>
                          </>
                        )}
                        {suggestion.id === "content-gap" && (
                          <>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                              <span className="text-slate-700 dark:text-slate-300">Stand out from competitors</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                              <span className="text-slate-700 dark:text-slate-300">
                                Educational, valuable content series
                              </span>
                            </div>
                          </>
                        )}
                        {suggestion.id === "hashtag" && (
                          <>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                              <span className="text-slate-700 dark:text-slate-300">Reach trending conversations</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                              <span className="text-slate-700 dark:text-slate-300">Increased discoverability</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                      {suggestion.actions.map((action) => (
                        <Button key={action.label} variant={action.variant} onClick={action.onClick} className="flex-1">
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )
            })()}
        </DialogContent>
      </Dialog>

      {/* Create Series Dialog */}
      <CreateSeriesDialog open={showCreateSeries} onOpenChangeAction={setShowCreateSeries} />

      {/* Optimize Timing Dialog */}
      <OptimizeTimingDialog open={showOptimizeTiming} onOpenChangeAction={setShowOptimizeTiming} />

      {/* Trending Hashtag Dialog */}
      <TrendingHashtagDialog open={showTrendingHashtag} onOpenChangeAction={setShowTrendingHashtag} />
    </>
  )
}
