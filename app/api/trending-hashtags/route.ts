import { NextRequest, NextResponse } from "next/server"
import ollama from "ollama"

type HashtagItem = {
  tag: string
  mentions: number
  growth: string
  relevance: string
  color: string
  posts: number
  engagement: number
}

const COLORS = ["#3b82f6", "#10b981", "#059669", "#06b6d4", "#8b5cf6", "#f59e0b", "#ef4444", "#14b8a6"]

function toHashtag(raw: string) {
  const cleaned = raw.replace(/[^a-zA-Z0-9\s]/g, "").trim().toLowerCase()
  const noSpaces = cleaned.replace(/\s+/g, "")
  if (!noSpaces) return ""
  return `#${noSpaces}`
}

function parseTraffic(s?: string): number {
  if (!s) return 0
  const m = s.match(/([0-9,.]+)\s*(K|M)?/i)
  if (!m) return 0
  const base = parseFloat(m[1].replace(/,/g, ""))
  const unit = (m[2] || "").toUpperCase()
  if (unit === "M") return Math.round(base * 1_000_000)
  if (unit === "K") return Math.round(base * 1_000)
  return Math.round(base)
}

async function scoreRelevanceWithOllama(industry: string, hashtags: string[]): Promise<number[]> {
  try {
    const prompt = `Rate relevance (0-100) for these hashtags to the ${industry} industry. Return numbers only, comma-separated, same order. Hashtags: ${hashtags.join(", ")}`
    const response = await ollama.generate({ model: "llama3.1", prompt })
    const text = response?.response || ""
    return text
      .split(/[,\n]/)
      .map((x) => parseFloat(x.trim()))
      .map((n) => (isFinite(n) ? Math.max(0, Math.min(100, n)) : 50))
  } catch {
    return hashtags.map((h) => (h.toLowerCase().includes(industry.toLowerCase()) ? 85 : 60))
  }
}

async function loadGoogleDailyTrends(geo: string) {
  const trends = await import("google-trends-api").catch(() => null)
  if (!trends) throw new Error("google-trends-api is not installed. Run: npm i google-trends-api")
  const googleTrends: any = (trends as any).default || trends
  const result = await googleTrends.dailyTrends({ geo })
  const json = JSON.parse(result)
  const days = json?.default?.trendingSearchesDays || []
  const searches = Array.isArray(days[0]?.trendingSearches) ? days[0].trendingSearches : []
  return searches.map((s: any) => ({
    query: String(s?.title?.query || ""),
    formattedTraffic: String(s?.formattedTraffic || ""),
    articleCount: Number((s?.articles || []).length || 0),
  }))
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const industry = url.searchParams.get("industry") || "SaaS"
  const geo = url.searchParams.get("geo") || "US"
  const limit = Number(url.searchParams.get("limit") || 5)

  let items: Array<{ query: string; formattedTraffic: string; articleCount: number }> = []
  try {
    items = await loadGoogleDailyTrends(geo)
  } catch (error) {
    const fallback = ["Sustainable Business", "Eco Friendly", "Green Business", "Climate Action", "ESG"]
    items = fallback.map((q) => ({ query: q, formattedTraffic: "45K", articleCount: 12 }))
  }

  const list: HashtagItem[] = items
    .slice(0, Math.max(1, limit))
    .map((it, idx) => {
      const tag = toHashtag(it.query)
      const mentions = parseTraffic(it.formattedTraffic) || 45000
      const posts = Math.max(1000, Math.round(mentions / 4))
      const engagement = 6 + Math.random() * 3
      const growth = `+${Math.round(60 + Math.random() * 70)}%`
      return {
        tag,
        mentions,
        posts,
        engagement,
        growth,
        relevance: "",
        color: COLORS[idx % COLORS.length],
      }
    })

  const relevanceScores = await scoreRelevanceWithOllama(industry, list.map((x) => x.tag))
  list.forEach((item, i) => {
    const score = Math.round(relevanceScores[i] ?? 60)
    item.relevance = score >= 80 ? "Very High" : score >= 65 ? "High" : score >= 50 ? "Medium" : "Low"
  })

  const trendingData = list.map((x) => ({ name: x.tag, value: x.mentions }))

  return NextResponse.json({ hashtags: list, trendingData })
}