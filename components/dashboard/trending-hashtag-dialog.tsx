"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, CheckCircle2, TrendingUp, Hash, Copy, Check } from "lucide-react"
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface TrendingHashtagDialogProps {
  open: boolean
  onOpenChangeAction: (open: boolean) => void
}

export function TrendingHashtagDialog({ open, onOpenChangeAction }: TrendingHashtagDialogProps) {
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>(["#SustainableBusiness"])
  const [copiedHashtag, setCopiedHashtag] = useState<string | null>(null)

  // Trending hashtags data
  const [trendingHashtags, setTrendingHashtags] = useState([
    {
      tag: "#SustainableBusiness",
      mentions: 45230,
      growth: "+125%",
      relevance: "Very High",
      color: "#3b82f6",
      posts: 12450,
      engagement: 8.5,
    },
    {
      tag: "#EcoFriendly",
      mentions: 38920,
      growth: "+98%",
      relevance: "High",
      color: "#10b981",
      posts: 10230,
      engagement: 7.2,
    },
    {
      tag: "#GreenBusiness",
      mentions: 28450,
      growth: "+87%",
      relevance: "High",
      color: "#059669",
      posts: 8920,
      engagement: 6.8,
    },
    {
      tag: "#ClimateAction",
      mentions: 25670,
      growth: "+156%",
      relevance: "Medium",
      color: "#06b6d4",
      posts: 7120,
      engagement: 5.9,
    },
    {
      tag: "#ESG",
      mentions: 22340,
      growth: "+72%",
      relevance: "Medium",
      color: "#8b5cf6",
      posts: 5890,
      engagement: 5.2,
    },
  ])

  const [trendingData, setTrendingData] = useState([
    { name: "#SustainableBusiness", value: 45230 },
    { name: "#EcoFriendly", value: 38920 },
    { name: "#GreenBusiness", value: 28450 },
    { name: "#ClimateAction", value: 25670 },
    { name: "#ESG", value: 22340 },
  ])

  const COLORS = ["#3b82f6", "#10b981", "#059669", "#06b6d4", "#8b5cf6"]

  const toggleHashtag = (tag: string) => {
    setSelectedHashtags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const copyToClipboard = (tag: string) => {
    navigator.clipboard.writeText(tag)
    setCopiedHashtag(tag)
    setTimeout(() => setCopiedHashtag(null), 2000)
  }

  const handleAddToPost = async () => {
    console.log("Adding hashtags to post:", selectedHashtags)
    // API call to add hashtags
    onOpenChangeAction(false)
  }

  useEffect(() => {
    async function loadTrending() {
      try {
        const res = await fetch(`/api/trending-hashtags?industry=SaaS&geo=US&limit=5`)
        const data = await res.json().catch(() => null)
        if (data?.hashtags && Array.isArray(data.hashtags)) {
          setTrendingHashtags(data.hashtags)
        }
        if (data?.trendingData && Array.isArray(data.trendingData)) {
          setTrendingData(data.trendingData)
        }
      } catch {}
    }
    if (open) {
      loadTrending()
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-xl mb-1">Trending Hashtag Alert</DialogTitle>
                <DialogDescription className="flex items-center gap-2">
                  <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-0">
                    Trends
                  </Badge>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">Real-time trending</span>
                </DialogDescription>
              </div>
            </div>
            <button
              onClick={() => onOpenChangeAction(false)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Trending Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Trending Hashtags</h3>
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={trendingData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${(value / 1000).toFixed(0)}k`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--background)",
                        border: "1px solid var(--border)",
                      }}
                      labelStyle={{ color: "var(--foreground)" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Mentions by Hashtag</h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {trendingHashtags.map((item) => (
                  <div key={item.tag} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{item.tag}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {(item.mentions / 1000).toFixed(1)}k mentions
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-green-600 dark:text-green-400 border-green-200 dark:border-green-900"
                    >
                      {item.growth}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hashtag Selection */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Top Hashtags for Your Industry</h3>
            <div className="space-y-2">
              {trendingHashtags.map((item) => (
                <Card
                  key={item.tag}
                  className={`p-4 cursor-pointer transition-all border-2 ${
                    selectedHashtags.includes(item.tag)
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                  onClick={() => toggleHashtag(item.tag)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Hash className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{item.tag}</span>
                        <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-0 text-xs">
                          {item.relevance}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-slate-600 dark:text-slate-400">Mentions</p>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {(item.mentions / 1000).toFixed(1)}k
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-600 dark:text-slate-400">Growth</p>
                          <p className="font-semibold text-green-600 dark:text-green-400">{item.growth}</p>
                        </div>
                        <div>
                          <p className="text-slate-600 dark:text-slate-400">Engagement</p>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{item.engagement}%</p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard(item.tag)
                      }}
                      className="ml-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
                    >
                      {copiedHashtag === item.tag ? (
                        <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <Copy className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">What You'll Get</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">
                  Access to trending conversations in your industry
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">
                  Increased post visibility and discoverability
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">Real-time hashtag recommendations</span>
              </div>
            </div>
          </div>

          {/* Selected Summary */}
          {selectedHashtags.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                Ready to add {selectedHashtags.length} hashtag{selectedHashtags.length !== 1 ? "s" : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedHashtags.map((tag) => (
                  <Badge key={tag} className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-0">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button onClick={handleAddToPost} disabled={selectedHashtags.length === 0} className="flex-1">
              Add to Next Post
            </Button>
            <Button variant="outline" onClick={() => onOpenChangeAction(false)} className="flex-1">
              Dismiss
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
