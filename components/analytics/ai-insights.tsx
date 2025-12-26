"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { MessageSquare, Clock, ImageIcon, HashIcon as Hashtag } from "lucide-react"

export function AIInsights() {
  const [captionData, setCaptionData] = useState([
    { type: "With questions", value: 6.8 },
    { type: "Without questions", value: 2.8 },
  ])
  const [timeData, setTimeData] = useState([
    { day: "Mon", value: 45 },
    { day: "Tue", value: 52 },
    { day: "Wed", value: 48 },
    { day: "Thu", value: 74 },
    { day: "Fri", value: 52 },
    { day: "Sat", value: 38 },
    { day: "Sun", value: 32 },
  ])
  const [hashtagData, setHashtagData] = useState([
    { count: "1-2", value: 28 },
    { count: "3-4", value: 42 },
    { count: "5-7", value: 68 },
    { count: "8-10", value: 48 },
    { count: "11+", value: 32 },
  ])
  const [contentType, setContentType] = useState({ video: 8.7, carousel: 5.2, image: 2.8 })
  const [captionSuggestion, setCaptionSuggestion] = useState("Posts with questions in captions receive 2.4x higher engagement compared to statements. Consider adding questions to encourage audience interaction.")
  const [timeSuggestion, setTimeSuggestion] = useState("Thursday posts at 10 AM consistently outperform other days and times with 37% higher reach. Consider adjusting your posting schedule.")
  const [typeSuggestion, setTypeSuggestion] = useState("Video content generates 3.1x more engagement than static images. Consider increasing video content in your strategy.")
  const [hashtagSuggestion, setHashtagSuggestion] = useState("Using 5-7 niche hashtags results in 42% more reach than using more than 10 hashtags. Focus on quality over quantity.")

  useEffect(() => {
    let mounted = true
    fetch("/api/analytics").then(async (r) => {
      const d = await r.json()
      if (!mounted) return
      const ai = d?.aiInsights || {}
      const cap = ai?.captionPerformance || []
      const times = ai?.optimalTimes?.days || []
      const types = ai?.contentType || {}
      const tags = ai?.hashtagsEffectiveness || []
      const fmtCap = cap.map((c: any) => ({ type: String(c.type), value: Number(c.value || 0) }))
      const fmtTimes = times.map((x: any) => ({ day: String(x.day), value: Number(x.value || 0) }))
      const fmtTags = tags.map((t: any) => ({ count: String(t.count), value: Number(t.value || 0) }))
      if (fmtCap.length) setCaptionData(fmtCap)
      if (fmtTimes.length) setTimeData(fmtTimes)
      if (fmtTags.length) setHashtagData(fmtTags)
      setContentType({
        video: Number(types.video || 0),
        carousel: Number(types.carousel || 0),
        image: Number(types.image || 0),
      })
      if (ai?.suggestions?.caption) setCaptionSuggestion(String(ai.suggestions.caption))
      if (ai?.suggestions?.time) setTimeSuggestion(String(ai.suggestions.time))
      if (ai?.suggestions?.type) setTypeSuggestion(String(ai.suggestions.type))
      if (ai?.suggestions?.hashtag) setHashtagSuggestion(String(ai.suggestions.hashtag))
    }).catch(() => {})
    return () => { mounted = false }
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Insights</CardTitle>
        <CardDescription>Data-driven recommendations to improve your content</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600 mr-4">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Caption Performance</h3>
                  <p className="text-sm text-gray-600 mb-3">{captionSuggestion}</p>
                  <div className="bg-gray-50 p-3 rounded border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-500">With questions</span>
                      <span className="text-sm font-medium text-gray-900">{captionData[0]?.value?.toFixed(1)}% engagement</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${captionData[0]?.value || 0}%` }}></div>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-500">Without questions</span>
                      <span className="text-sm font-medium text-gray-900">{captionData[1]?.value?.toFixed(1)}% engagement</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${captionData[1]?.value || 0}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 mr-4">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Optimal Posting Time</h3>
                  <p className="text-sm text-gray-600 mb-3">{timeSuggestion}</p>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={timeData}>
                        <XAxis
                          dataKey="day"
                          stroke="hsl(var(--border))"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="hsl(var(--border))"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `${value}`}
                          hide
                        />
                        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 mr-4">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Content Type Analysis</h3>
                  <p className="text-sm text-gray-600 mb-3">{typeSuggestion}</p>
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="bg-gray-50 p-3 rounded border border-gray-200 text-center">
                      <div className="flex h-8 w-8 items-center justify-center mx-auto mb-2 text-green-600">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-video"
                        >
                          <path d="m22 8-6 4 6 4V8Z" />
                          <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
                        </svg>
                      </div>
                      <p className="text-xs font-medium text-gray-500">Videos</p>
                      <p className="text-sm font-bold text-gray-900">{contentType.video?.toFixed(1)}%</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded border border-gray-200 text-center">
                      <div className="flex h-8 w-8 items-center justify-center mx-auto mb-2 text-blue-600">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-images"
                        >
                          <path d="M4 5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5Z" />
                          <path d="M4 15a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3Z" />
                          <path d="M14 5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1V5Z" />
                          <path d="M14 15a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-3Z" />
                        </svg>
                      </div>
                      <p className="text-xs font-medium text-gray-500">Carousels</p>
                      <p className="text-sm font-bold text-gray-900">{contentType.carousel?.toFixed(1)}%</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded border border-gray-200 text-center">
                      <div className="flex h-8 w-8 items-center justify-center mx-auto mb-2 text-purple-600">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-image"
                        >
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                          <circle cx="9" cy="9" r="2" />
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                      </div>
                      <p className="text-xs font-medium text-gray-500">Images</p>
                      <p className="text-sm font-bold text-gray-900">{contentType.image?.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600 mr-4">
                  <Hashtag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Hashtag Effectiveness</h3>
                  <p className="text-sm text-gray-600 mb-3">{hashtagSuggestion}</p>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hashtagData}>
                        <XAxis
                          dataKey="count"
                          stroke="hsl(var(--border))"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="hsl(var(--border))"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `${value}`}
                          hide
                        />
                        <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}
