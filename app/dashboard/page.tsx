import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cookies } from "next/headers"
import { SmartSuggestions } from "@/components/dashboard/smart-suggestions"
import { DashboardChart } from "@/components/dashboard/dashboard-chart"
export const dynamic = "force-dynamic"
export const revalidate = 0

function formatTime(date: Date) {
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
}

function toDateString(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

type ApiSchedule = {
  id: string
  scheduledFor: string
  socialAccount: { provider: string }
  contentItem?: { id: string; metadata: any } | null
}

export default async function Dashboard() {
  const today = new Date()
  const base = process.env.NEXT_PUBLIC_BASE_URL || ""
  const url = `${base}/api/schedules`
  const res = await fetch(url, {
    cache: "no-store",
    headers: { cookie: (await cookies()).toString() },
  }).catch(() => null)
  const json = await res?.json().catch(() => null)
  const schedules: ApiSchedule[] = Array.isArray(json?.schedules) ? json!.schedules : []
  const items = schedules
    .filter((s) => {
      const d = new Date(s.scheduledFor)
      return d.toDateString() === today.toDateString()
    })
    .map((s) => {
    const time = formatTime(new Date(s.scheduledFor))
    const provider = String(s.socialAccount?.provider || "UNKNOWN")
    const caption = String((s.contentItem?.metadata as any)?.caption || "")
    return { id: s.id, time, provider, caption }
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Your Marketing Dashboard</h1>
        <p className="text-gray-500">Friday, April 25, 2025</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Scheduled Posts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Today's Scheduled Posts</CardTitle>
            <Button variant="link" className="text-primary p-0 h-auto">
              View All
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-1 h-4 w-4"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="border-l-4 border-blue-500 pl-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-center min-w-16">
                      <div className="text-sm font-medium text-gray-500">{item.time}</div>
                      <Badge variant="secondary" className="mt-1 bg-blue-100 text-blue-700 hover:bg-blue-100">
                        {item.provider.charAt(0) + item.provider.slice(1).toLowerCase()}
                      </Badge>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{item.caption ? item.caption.slice(0, 80) : "Scheduled post"}</h3>
                      <p className="text-sm text-gray-500 mt-1">{item.caption ? `${item.caption.slice(0, 200)}…` : ""}</p>
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          Reschedule
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Performance Overview</CardTitle>
            <div className="flex gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                This Week
              </Badge>
              <Badge variant="outline">Last Week</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-gray-50 p-3 rounded-xl">
                <div className="text-sm text-gray-500">Engagement</div>
                <div className="text-xl font-semibold mt-1">8,742</div>
                <div className="text-xs text-green-600 flex items-center mt-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3 w-3 mr-1"
                  >
                    <path d="m18 15-6-6-6 6" />
                  </svg>
                  <span>12.3%</span>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl">
                <div className="text-sm text-gray-500">Reach</div>
                <div className="text-xl font-semibold mt-1">24,591</div>
                <div className="text-xs text-green-600 flex items-center mt-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3 w-3 mr-1"
                  >
                    <path d="m18 15-6-6-6 6" />
                  </svg>
                  <span>8.7%</span>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl">
                <div className="text-sm text-gray-500">Conversions</div>
                <div className="text-xl font-semibold mt-1">1,283</div>
                <div className="text-xs text-red-600 flex items-center mt-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3 w-3 mr-1"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                  <span>2.1%</span>
                </div>
              </div>
            </div>

            <DashboardChart />
          </CardContent>
        </Card>

        <SmartSuggestions />

        {/* Trending Topics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Trending Topics</CardTitle>
            <select className="bg-white border border-gray-200 text-gray-600 px-3 py-1 text-sm rounded pr-8">
              <option>Your Industry</option>
              <option>Technology</option>
              <option>Marketing</option>
              <option>E-commerce</option>
            </select>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">High Relevance</h3>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 text-green-600"
                  >
                    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                  </svg>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="hover:bg-primary/5 cursor-pointer">
                    #SustainableBusiness
                  </Badge>
                  <Badge variant="outline" className="hover:bg-primary/5 cursor-pointer">
                    #DigitalTransformation
                  </Badge>
                  <Badge variant="outline" className="hover:bg-primary/5 cursor-pointer">
                    #CustomerExperience
                  </Badge>
                  <Badge variant="outline" className="hover:bg-primary/5 cursor-pointer">
                    #RemoteWork
                  </Badge>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">Medium Relevance</h3>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 text-yellow-600"
                  >
                    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                  </svg>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="hover:bg-primary/5 cursor-pointer">
                    #ArtificialIntelligence
                  </Badge>
                  <Badge variant="outline" className="hover:bg-primary/5 cursor-pointer">
                    #FutureOfWork
                  </Badge>
                  <Badge variant="outline" className="hover:bg-primary/5 cursor-pointer">
                    #DataPrivacy
                  </Badge>
                  <Badge variant="outline" className="hover:bg-primary/5 cursor-pointer">
                    #InnovationStrategy
                  </Badge>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">Emerging Topics</h3>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 text-blue-600"
                  >
                    <path d="M22 2 11 13" />
                    <path d="M22 2 15 22 11 13 2 9 22 2z" />
                  </svg>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="hover:bg-primary/5 cursor-pointer">
                    #CircularEconomy
                  </Badge>
                  <Badge variant="outline" className="hover:bg-primary/5 cursor-pointer">
                    #Web3Marketing
                  </Badge>
                  <Badge variant="outline" className="hover:bg-primary/5 cursor-pointer">
                    #AugmentedReality
                  </Badge>
                  <Badge variant="outline" className="hover:bg-primary/5 cursor-pointer">
                    #VoiceSearch
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
