import { NextRequest, NextResponse } from "next/server"

async function fetchGoogleDailyTrends(geo: string) {
  const url = `https://trends.google.com/trends/api/dailytrends?hl=en-US&tz=0&geo=${geo}`
  const res = await fetch(url)
  const text = await res.text()
  const jsonStr = text.replace(/^\)]}'\n/, "")
  const data = JSON.parse(jsonStr)
  const days = Array.isArray(data?.default?.trendingSearchesDays) ? data.default.trendingSearchesDays : []
  const topics: string[] = []
  for (const day of days.slice(0, 2)) {
    const searches = Array.isArray(day?.trendingSearches) ? day.trendingSearches : []
    for (const s of searches.slice(0, 20)) {
      if (s?.title?.query) topics.push(String(s.title.query))
    }
  }
  return topics
}

async function fetchRedditHot(sub: string) {
  const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=25`, { headers: { "User-Agent": "maestro" } })
  const json = await res.json().catch(() => ({}))
  const posts = json?.data?.children || []
  const topics = posts.map((p: any) => String(p?.data?.title || "")).filter(Boolean)
  return topics
}

function scoreTopic(t: string, industry: string) {
  const base = t.toLowerCase()
  const matches = base.includes(industry.toLowerCase()) ? 2 : 0
  const lenBoost = Math.min(base.split(" ").length, 6)
  return matches * 50 + lenBoost * 5
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const industry = url.searchParams.get("industry") || "technology"
  const geo = url.searchParams.get("geo") || "US"
  const redditSub = url.searchParams.get("sub") || "technology"

  const [gTrends, reddit] = await Promise.all([
    fetchGoogleDailyTrends(geo).catch(() => []),
    fetchRedditHot(redditSub).catch(() => []),
  ])

  const combined = [...gTrends, ...reddit]
  const scored = combined
    .map((t) => ({ topic: t, score: scoreTopic(t, industry) }))
    .sort((a, b) => b.score - a.score)

  const high = scored.slice(0, 6).map((s) => s.topic)
  const medium = scored.slice(6, 12).map((s) => s.topic)
  const emerging = scored.slice(12, 18).map((s) => s.topic)

  return NextResponse.json({ high, medium, emerging })
}