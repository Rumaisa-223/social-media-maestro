import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerAuthSession } from "@/lib/auth/session"
import { ensureFreshToken } from "@/lib/services/social-accounts"
import { decrypt } from "@/lib/encrypt"
import { BskyAgent } from "@atproto/api"
import { Ollama } from "ollama"

async function fetchFacebookMetrics(pageId: string, token: string) {
  const url = new URL(`https://graph.facebook.com/v18.0/${pageId}/insights`)
  url.searchParams.set("metric", "page_impressions,page_engaged_users,page_actions_post_engagements")
  url.searchParams.set("period", "day")
  url.searchParams.set("access_token", token)
  const res = await fetch(url.toString())
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !Array.isArray(json?.data)) return { engagement: 0, reach: 0, conversions: 0 }
  const findMetric = (m: string) => json.data.find((d: any) => d.name === m)
  const impressions = findMetric("page_impressions")?.values?.[0]?.value ?? 0
  const engaged = findMetric("page_engaged_users")?.values?.[0]?.value ?? 0
  const actions = findMetric("page_actions_post_engagements")?.values?.[0]?.value ?? 0
  return { engagement: Number(engaged) || 0, reach: Number(impressions) || 0, conversions: Number(actions) || 0 }
}

async function fetchFacebookFollowers(pageId: string, token: string) {
  const url = new URL(`https://graph.facebook.com/v18.0/${pageId}`)
  url.searchParams.set("fields", "followers_count")
  url.searchParams.set("access_token", token)
  const res = await fetch(url.toString())
  const json = await res.json().catch(() => ({}))
  return Number(json?.followers_count || 0)
}

async function fetchLinkedInMetrics(ownerUrn: string, token: string) {
  const headers = { Authorization: `Bearer ${token}`, "X-Restli-Protocol-Version": "2.0.0" }
  const res = await fetch(`https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(${encodeURIComponent(ownerUrn)})&count=10`, { headers })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !Array.isArray(json?.elements)) return { engagement: 0, reach: 0, conversions: 0 }
  const engagement = json.elements.length
  return { engagement, reach: engagement * 100, conversions: 0 }
}

async function fetchInstagramMetrics(igUserId: string, token: string) {
  const url = new URL(`https://graph.facebook.com/v18.0/${igUserId}/insights`)
  url.searchParams.set("metric", "impressions,reach,profile_views")
  url.searchParams.set("period", "day")
  url.searchParams.set("access_token", token)
  const res = await fetch(url.toString())
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !Array.isArray(json?.data)) return { engagement: 0, reach: 0, conversions: 0 }
  const findMetric = (m: string) => json.data.find((d: any) => d.name === m)
  const reach = findMetric("reach")?.values?.[0]?.value ?? 0
  const impressions = findMetric("impressions")?.values?.[0]?.value ?? 0
  const profileViews = findMetric("profile_views")?.values?.[0]?.value ?? 0
  return { engagement: Number(profileViews) || 0, reach: Number(reach || impressions) || 0, conversions: 0 }
}

async function fetchInstagramFollowers(igUserId: string, token: string) {
  const url = new URL(`https://graph.facebook.com/v18.0/${igUserId}`)
  url.searchParams.set("fields", "followers_count")
  url.searchParams.set("access_token", token)
  const res = await fetch(url.toString())
  const json = await res.json().catch(() => ({}))
  return Number(json?.followers_count || 0)
}

async function fetchTwitterMetrics(token: string) {
  const headers = { Authorization: `Bearer ${token}` }
  const meRes = await fetch("https://api.twitter.com/2/users/me?user.fields=public_metrics", { headers })
  const meJson = await meRes.json().catch(() => ({}))
  const userId = meJson?.data?.id
  if (!meRes.ok || !userId) return { engagement: 0, reach: 0, conversions: 0 }
  const tweetsRes = await fetch(`https://api.twitter.com/2/users/${encodeURIComponent(userId)}/tweets?max_results=50&tweet.fields=public_metrics,created_at`, { headers })
  const tweetsJson = await tweetsRes.json().catch(() => ({}))
  if (!tweetsRes.ok || !Array.isArray(tweetsJson?.data)) return { engagement: 0, reach: 0, conversions: 0 }
  let likes = 0
  let replies = 0
  let retweets = 0
  for (const t of tweetsJson.data) {
    const pm = t.public_metrics || {}
    likes += Number(pm.like_count || 0)
    replies += Number(pm.reply_count || 0)
    retweets += Number(pm.retweet_count || 0)
  }
  const engagement = likes + replies + retweets
  const reach = retweets * 100 + likes * 10
  const conversions = 0
  return { engagement, reach, conversions }
}

async function fetchTwitterFollowers(token: string) {
  const headers = { Authorization: `Bearer ${token}` }
  const meRes = await fetch("https://api.twitter.com/2/users/me?user.fields=public_metrics", { headers })
  const meJson = await meRes.json().catch(() => ({}))
  return Number(meJson?.data?.public_metrics?.followers_count || 0)
}

async function fetchBlueskyMetrics(meta: Record<string, any>, accessJwt: string, refreshJwt?: string) {
  const service = String((meta?.service || process.env.NEXT_PUBLIC_BLUESKY_SERVICE_URL || "https://bsky.social")).replace(/\s+/g, "")
  const did = String(meta?.profile?.did || "")
  const handle = String(meta?.profile?.handle || meta?.profile?.name || "")
  if (!did) return { engagement: 0, reach: 0, conversions: 0 }
  const agent = new BskyAgent({ service })
  await agent.resumeSession({ did, handle, accessJwt, refreshJwt: refreshJwt || "", active: true })
  const feed = await agent.getAuthorFeed({ actor: did, limit: 50 }).catch(() => null)
  if (!feed || !Array.isArray((feed as any)?.data?.feed)) return { engagement: 0, reach: 0, conversions: 0 }
  let likes = 0
  let reposts = 0
  let replies = 0
  for (const item of (feed as any).data.feed) {
    const post = item?.post || {}
    likes += Number(post?.likeCount || 0)
    reposts += Number(post?.repostCount || 0)
    replies += Number(item?.replyCount || 0)
  }
  const engagement = likes + reposts + replies
  const reach = reposts * 100 + likes * 5
  return { engagement, reach, conversions: 0 }
}

async function fetchBlueskyFollowers(meta: Record<string, any>, accessJwt: string, refreshJwt?: string) {
  const service = String((meta?.service || process.env.NEXT_PUBLIC_BLUESKY_SERVICE_URL || "https://bsky.social")).replace(/\s+/g, "")
  const did = String(meta?.profile?.did || "")
  const handle = String(meta?.profile?.handle || meta?.profile?.name || "")
  if (!did) return 0
  const agent = new BskyAgent({ service })
  await agent.resumeSession({ did, handle, accessJwt, refreshJwt: refreshJwt || "", active: true })
  const profile = await agent.getProfile({ actor: did }).catch(() => null)
  return Number(((profile as any)?.data?.followersCount) || 0)
}

async function fetchMastodonMetrics(instanceBase: string, token: string) {
  const base = instanceBase.replace(/\/$/, "")
  const headers = { Authorization: `Bearer ${token}` }
  const meRes = await fetch(`${base}/api/v1/accounts/verify_credentials`, { headers })
  const meJson = await meRes.json().catch(() => ({}))
  const id = meJson?.id
  if (!meRes.ok || !id) return { engagement: 0, reach: 0, conversions: 0 }
  const stRes = await fetch(`${base}/api/v1/accounts/${encodeURIComponent(String(id))}/statuses?limit=50`, { headers })
  const stJson = await stRes.json().catch(() => ([]))
  if (!stRes.ok || !Array.isArray(stJson)) return { engagement: 0, reach: 0, conversions: 0 }
  let favourites = 0
  let replies = 0
  let reblogs = 0
  for (const s of stJson) {
    favourites += Number(s?.favourites_count || 0)
    replies += Number(s?.replies_count || 0)
    reblogs += Number(s?.reblogs_count || 0)
  }
  const engagement = favourites + replies + reblogs
  const reach = reblogs * 80 + favourites * 5
  return { engagement, reach, conversions: 0 }
}

async function fetchMastodonFollowers(instanceBase: string, token: string) {
  const base = instanceBase.replace(/\/$/, "")
  const headers = { Authorization: `Bearer ${token}` }
  const meRes = await fetch(`${base}/api/v1/accounts/verify_credentials`, { headers })
  const meJson = await meRes.json().catch(() => ({}))
  return Number(meJson?.followers_count || 0)
}

type TopPost = { platform: string; title: string; likes: number; comments: number; date: string; engagementScore: number }
type Breakdown = { likes: number; comments: number; shares: number; saves: number; profile_visits: number }
type Series = Record<string, { date: string; value: number }[]>
type PostInfo = { platform: string; text: string; timestamp: string; likes: number; comments: number; shares: number; mediaType?: string; hashtags: number }

function weekBuckets() {
  const today = new Date()
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`)
  }
  return days
}

export async function GET(request: NextRequest) {
  const session = await getServerAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
  }

  const accounts = await prisma.socialAccount.findMany({ where: { userId: session.user.id, isActive: true } })
  let engagement = 0
  let reach = 0
  let conversions = 0
  const perPlatform: Record<string, { engagement: number; reach: number; conversions: number }> = {}
  const followers: Record<string, number> = {}
  const breakdown: Breakdown = { likes: 0, comments: 0, shares: 0, saves: 0, profile_visits: 0 }
  const topPosts: TopPost[] = []
  const series: Series = { instagram: [], twitter: [], facebook: [], linkedin: [], bluesky: [], mastodon: [] }
  const allPosts: PostInfo[] = []

  const addSeries = (platform: string, dateIso: string, value: number) => {
    const d = new Date(dateIso)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    const arr = series[platform] || []
    const found = arr.find((x) => x.date === key)
    if (found) found.value += value
    else arr.push({ date: key, value })
    series[platform] = arr
  }

  for (const acc of accounts) {
    const fresh = await ensureFreshToken(acc).catch(() => acc)
    const token = (fresh as any).decryptedAccess || (acc.accessToken ? decrypt(acc.accessToken) : "")
    const meta = (acc.meta ?? {}) as Record<string, any>
    if (acc.provider === "FACEBOOK" && meta.pageId) {
      const pageTokenEnc = meta.pageAccessTokenEncrypted as string | undefined
      const pageToken = pageTokenEnc ? decrypt(pageTokenEnc) : token
      const fb = await fetchFacebookMetrics(String(meta.pageId), String(pageToken))
      engagement += fb.engagement
      reach += fb.reach
      conversions += fb.conversions
      perPlatform.facebook = fb
      followers.facebook = await fetchFacebookFollowers(String(meta.pageId), String(pageToken)).catch(() => 0)
      const postsUrl = new URL(`https://graph.facebook.com/v18.0/${meta.pageId}/posts`)
      postsUrl.searchParams.set("limit", "20")
      postsUrl.searchParams.set("fields", "created_time,message,permalink_url,shares,likes.summary(true),comments.summary(true)")
      postsUrl.searchParams.set("access_token", String(pageToken))
      const pRes = await fetch(postsUrl)
      const pJson = await pRes.json().catch(() => ({}))
      const plist = Array.isArray(pJson?.data) ? pJson.data : []
      for (const p of plist) {
        const likes = Number(p?.likes?.summary?.total_count || 0)
        const comments = Number(p?.comments?.summary?.total_count || 0)
        const shares = Number(p?.shares?.count || 0)
        breakdown.likes += likes
        breakdown.comments += comments
        breakdown.shares += shares
        const score = likes + comments * 2 + shares * 3
        topPosts.push({ platform: "Facebook", title: String(p?.message || "Post"), likes, comments, date: String(p?.created_time || ""), engagementScore: score })
        if (p?.created_time) addSeries("facebook", String(p.created_time), likes + comments + shares)
        allPosts.push({ platform: "Facebook", text: String(p?.message || ""), timestamp: String(p?.created_time || ""), likes, comments, shares, mediaType: "text", hashtags: (String(p?.message || "").match(/#\w+/g) || []).length })
      }
    } else if (acc.provider === "LINKEDIN") {
      const profile = meta.profile as Record<string, any> | undefined
      const ownerUrn = profile?.urn || (profile?.id ? `urn:li:person:${profile.id}` : `urn:li:person:${acc.providerUserId}`)
      const li = await fetchLinkedInMetrics(ownerUrn, String(token))
      engagement += li.engagement
      reach += li.reach
      conversions += li.conversions
      perPlatform.linkedin = li
    } else if (acc.provider === "TWITTER") {
      const tw = await fetchTwitterMetrics(String(token))
      engagement += tw.engagement
      reach += tw.reach
      conversions += tw.conversions
      perPlatform.twitter = tw
      followers.twitter = await fetchTwitterFollowers(String(token)).catch(() => 0)
      const headers = { Authorization: `Bearer ${String(token)}` }
      const meRes = await fetch("https://api.twitter.com/2/users/me?user.fields=public_metrics", { headers })
      const meJson = await meRes.json().catch(() => ({}))
      const userId = meJson?.data?.id
      if (userId) {
        const tweetsRes = await fetch(`https://api.twitter.com/2/users/${encodeURIComponent(userId)}/tweets?max_results=50&tweet.fields=public_metrics,created_at,text`, { headers })
        const tweetsJson = await tweetsRes.json().catch(() => ({}))
        const tlist = Array.isArray(tweetsJson?.data) ? tweetsJson.data : []
        for (const t of tlist) {
          const pm = t.public_metrics || {}
          const likes = Number(pm.like_count || 0)
          const comments = Number(pm.reply_count || 0)
          const shares = Number(pm.retweet_count || 0)
          breakdown.likes += likes
          breakdown.comments += comments
          breakdown.shares += shares
          const score = likes + comments * 2 + shares * 3
          topPosts.push({ platform: "Twitter", title: String(t?.text || "Tweet"), likes, comments, date: String(t?.created_at || ""), engagementScore: score })
          if (t?.created_at) addSeries("twitter", String(t.created_at), likes + comments + shares)
          allPosts.push({ platform: "Twitter", text: String(t?.text || ""), timestamp: String(t?.created_at || ""), likes, comments, shares, mediaType: "text", hashtags: (String(t?.text || "").match(/#\w+/g) || []).length })
        }
      }
    } else if (acc.provider === "INSTAGRAM") {
      const igUserId = String((meta?.profile as any)?.id || "")
      if (igUserId) {
        const ig = await fetchInstagramMetrics(igUserId, String(token))
        engagement += ig.engagement
        reach += ig.reach
        conversions += ig.conversions
        perPlatform.instagram = ig
        followers.instagram = await fetchInstagramFollowers(igUserId, String(token)).catch(() => 0)
        const listUrl = new URL(`https://graph.facebook.com/v18.0/${igUserId}/media`)
        listUrl.searchParams.set("fields", "id,caption,timestamp,permalink,like_count,comments_count,media_type")
        listUrl.searchParams.set("limit", "25")
        listUrl.searchParams.set("access_token", String(token))
        const mRes = await fetch(listUrl)
        const mJson = await mRes.json().catch(() => ({}))
        const mlist = Array.isArray(mJson?.data) ? mJson.data : []
        for (const m of mlist) {
          const likes = Number(m?.like_count || 0)
          const comments = Number(m?.comments_count || 0)
          breakdown.likes += likes
          breakdown.comments += comments
          const score = likes + comments * 2
          topPosts.push({ platform: "Instagram", title: String(m?.caption || "Post"), likes, comments, date: String(m?.timestamp || ""), engagementScore: score })
          if (m?.timestamp) addSeries("instagram", String(m.timestamp), likes + comments)
          allPosts.push({ platform: "Instagram", text: String(m?.caption || ""), timestamp: String(m?.timestamp || ""), likes, comments, shares: 0, mediaType: String(m?.media_type || "image"), hashtags: (String(m?.caption || "").match(/#\w+/g) || []).length })
        }
        const mediaIds = mlist.slice(0, 10).map((m: any) => String(m.id)).filter(Boolean)
        for (const mid of mediaIds) {
          const u = new URL(`https://graph.facebook.com/v18.0/${mid}/insights`)
          u.searchParams.set("metric", "saved")
          u.searchParams.set("access_token", String(token))
          const ir = await fetch(u.toString())
          const ij = await ir.json().catch(() => ({}))
          const val = Number(ij?.data?.[0]?.values?.[0]?.value || 0)
          breakdown.saves += val
        }
        breakdown.profile_visits += Number(ig.engagement || 0)
      }
    } else if (acc.provider === "BLUESKY") {
      const accessJwt = String(token)
      const refreshJwt = acc.refreshToken ? decrypt(acc.refreshToken) : undefined
      const bs = await fetchBlueskyMetrics(meta, accessJwt, refreshJwt)
      engagement += bs.engagement
      reach += bs.reach
      conversions += bs.conversions
      perPlatform.bluesky = bs
      followers.bluesky = await fetchBlueskyFollowers(meta, accessJwt, refreshJwt).catch(() => 0)
      const service = String((meta?.service || process.env.NEXT_PUBLIC_BLUESKY_SERVICE_URL || "https://bsky.social")).replace(/\s+/g, "")
      const did = String(meta?.profile?.did || "")
      const handle = String(meta?.profile?.handle || meta?.profile?.name || "")
      if (did) {
        const agent = new BskyAgent({ service })
        await agent.resumeSession({ did, handle, accessJwt, refreshJwt: refreshJwt || "", active: true })
        const feed = await agent.getAuthorFeed({ actor: did, limit: 50 }).catch(() => null)
        const flist = Array.isArray((feed as any)?.data?.feed) ? (feed as any).data.feed : []
        for (const item of flist) {
          const post = item?.post || {}
          const likes = Number(post?.likeCount || 0)
          const comments = Number(item?.replyCount || 0)
          const shares = Number(post?.repostCount || 0)
          breakdown.likes += likes
          breakdown.comments += comments
          breakdown.shares += shares
          const text = String(post?.record?.text || "Post")
          const score = likes + comments * 2 + shares * 3
          topPosts.push({ platform: "Bluesky", title: text, likes, comments, date: String(post?.indexedAt || ""), engagementScore: score })
          if (post?.indexedAt) addSeries("bluesky", String(post.indexedAt), likes + comments + shares)
          allPosts.push({ platform: "Bluesky", text, timestamp: String(post?.indexedAt || ""), likes, comments, shares, mediaType: "text", hashtags: (text.match(/#\w+/g) || []).length })
        }
      }
    } else if (acc.provider === "MASTODON") {
      const instance = String(meta?.instance || "")
      if (instance) {
        const ms = await fetchMastodonMetrics(instance, String(token))
        engagement += ms.engagement
        reach += ms.reach
        conversions += ms.conversions
        perPlatform.mastodon = ms
        followers.mastodon = await fetchMastodonFollowers(instance, String(token)).catch(() => 0)
        const base = instance.replace(/\/$/, "")
        const headers = { Authorization: `Bearer ${String(token)}` }
        const meRes = await fetch(`${base}/api/v1/accounts/verify_credentials`, { headers })
        const meJson = await meRes.json().catch(() => ({}))
        const id = meJson?.id
        if (id) {
          const stRes = await fetch(`${base}/api/v1/accounts/${encodeURIComponent(String(id))}/statuses?limit=50`, { headers })
          const stJson = await stRes.json().catch(() => ([]))
          const slist = Array.isArray(stJson) ? stJson : []
          for (const s of slist) {
            const likes = Number(s?.favourites_count || 0)
            const comments = Number(s?.replies_count || 0)
            const shares = Number(s?.reblogs_count || 0)
            breakdown.likes += likes
            breakdown.comments += comments
            breakdown.shares += shares
            const text = String(s?.content || "Post").replace(/<[^>]+>/g, " ").trim()
            const score = likes + comments * 2 + shares * 3
            topPosts.push({ platform: "Mastodon", title: text, likes, comments, date: String(s?.created_at || ""), engagementScore: score })
            if (s?.created_at) addSeries("mastodon", String(s.created_at), likes + comments + shares)
            allPosts.push({ platform: "Mastodon", text, timestamp: String(s?.created_at || ""), likes, comments, shares, mediaType: "text", hashtags: (text.match(/#\w+/g) || []).length })
          }
        }
      }
    }
  }

  const days = weekBuckets()
  const weekly = days.map((d) => ({ date: d, engagement: Math.round(engagement / 7), reach: Math.round(reach / 7), conversions: Math.round(conversions / 7) }))

  // Compute top 5 posts by engagement multiplier vs average
  const avgScore = topPosts.length ? (topPosts.reduce((n, p) => n + p.engagementScore, 0) / topPosts.length) : 1
  const topFive = topPosts
    .map((p) => ({ ...p, multiplier: avgScore ? p.engagementScore / avgScore : 1 }))
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, 5)

  const engagementFor = (p: PostInfo) => Number(p.likes || 0) + Number(p.comments || 0) + Number(p.shares || 0)
  const avgEngagement = allPosts.length ? (allPosts.reduce((n, p) => n + engagementFor(p), 0) / allPosts.length) : 1
  const isQuestion = (t: string) => /\?|^\s*(what|how|why|when|where|who)\b/i.test(t || "")
  const qPosts = allPosts.filter((p) => isQuestion(p.text))
  const sPosts = allPosts.filter((p) => !isQuestion(p.text))
  const pct = (arr: PostInfo[]) => {
    const avg = arr.length ? (arr.reduce((n, p) => n + engagementFor(p), 0) / arr.length) : 0
    return Math.round(((avg / avgEngagement) * 100) * 10) / 10
  }
  const captionPerformance = [
    { type: "With questions", value: pct(qPosts) },
    { type: "Without questions", value: pct(sPosts) },
  ]

  const dow = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
  const dayAgg: Record<string, { sum: number; count: number }> = {}
  for (const p of allPosts) {
    const d = new Date(p.timestamp)
    if (isNaN(d.getTime())) continue
    const key = dow[d.getDay()]
    const e = engagementFor(p)
    const obj = dayAgg[key] || { sum: 0, count: 0 }
    obj.sum += e
    obj.count += 1
    dayAgg[key] = obj
  }
  const optimalDays = dow.map((k) => ({ day: k, value: Math.round(((dayAgg[k]?.sum || 0) / Math.max(1, dayAgg[k]?.count || 0)) ) }))
  const bestDay = optimalDays.slice().sort((a,b)=> b.value - a.value)[0]

  const hourAggNum: Record<number, { sum: number; count: number }> = {}
  for (const p of allPosts) {
    const d = new Date(p.timestamp)
    if (isNaN(d.getTime())) continue
    const h = d.getHours()
    const e = engagementFor(p)
    const obj = hourAggNum[h] || { sum: 0, count: 0 }
    obj.sum += e
    obj.count += 1
    hourAggNum[h] = obj
  }
  const optimalHours = Array.from({ length: 24 }, (_, h) => ({
    hour: String(h).padStart(2, "0"),
    value: Math.round(((hourAggNum[h]?.sum || 0) / Math.max(1, hourAggNum[h]?.count || 0)))
  }))
  const bestHour = optimalHours.slice().sort((a,b)=> b.value - a.value)[0]

  const typeAgg: Record<string, { sum: number; count: number }> = {}
  for (const p of allPosts) {
    const t = (p.mediaType || "image").toLowerCase()
    const key = t.includes("video") ? "video" : t.includes("carousel") ? "carousel" : "image"
    const obj = typeAgg[key] || { sum: 0, count: 0 }
    obj.sum += engagementFor(p)
    obj.count += 1
    typeAgg[key] = obj
  }
  const typePct = (key: string) => {
    const avg = (typeAgg[key]?.sum || 0) / Math.max(1, typeAgg[key]?.count || 1)
    return Math.round(((avg / avgEngagement) * 100) * 10) / 10
  }
  const contentType = { video: typePct("video"), carousel: typePct("carousel"), image: typePct("image") }

  const tagBins = [
    { label: "1-2", min: 1, max: 2 },
    { label: "3-4", min: 3, max: 4 },
    { label: "5-7", min: 5, max: 7 },
    { label: "8-10", min: 8, max: 10 },
    { label: "11+", min: 11, max: Infinity },
  ]
  const tagAgg: Record<string, { sum: number; count: number }> = {}
  for (const p of allPosts) {
    const c = Number(p.hashtags || 0)
    const bin = tagBins.find((b) => c >= b.min && c <= b.max)
    const key = bin?.label || "0"
    const obj = tagAgg[key] || { sum: 0, count: 0 }
    obj.sum += engagementFor(p)
    obj.count += 1
    tagAgg[key] = obj
  }
  const hashtagsEffectiveness = tagBins.map((b) => ({ count: b.label, value: Math.round((( (tagAgg[b.label]?.sum || 0) / Math.max(1, tagAgg[b.label]?.count || 0) / avgEngagement ) * 100)) }))

  const ollama = new Ollama({ host: process.env.OLLAMA_HOST || "http://localhost:11434" })
  async function tinyClassify(text: string) {
    try {
      const prompt = `Classify sentiment as one of [positive, neutral, negative]. Respond ONLY with JSON {"label":"...","score":0.x}. Text:\n\n${text.slice(0, 2000)}`
      const res = await ollama.generate({ model: process.env.OLLAMA_MODEL || "tinyllama", prompt })
      const out = String(res?.response || "").trim()
      const parsed = JSON.parse(out)
      const label = String(parsed.label || "neutral")
      const score = Number(parsed.score || 0.5)
      return { label, score }
    } catch { return { label: "neutral", score: 0.5 } }
  }
  async function tinySummarize(text: string) {
    try {
      const prompt = `Summarize the content in 1-2 concise sentences:\n\n${text.slice(0, 4000)}`
      const res = await ollama.generate({ model: process.env.OLLAMA_MODEL || "tinyllama", prompt })
      return String(res?.response || "").trim().slice(0, 500)
    } catch { return text.split(/\.\s+/).slice(0,2).join(". ") }
  }

  const corpus = allPosts.map((p) => p.text).filter(Boolean).join("\n")
  const sentiment = await tinyClassify(corpus)
  const summary = await tinySummarize(corpus)

  const suggestions = {
    caption: `Questions average ${captionPerformance[0].value.toFixed(1)}% vs ${captionPerformance[1].value.toFixed(1)}%. Consider prompts to spark replies.`,
    time: `${bestDay ? `Best day: ${bestDay.day}. ` : ""}${bestHour ? `Best hour: ${bestHour.hour}:00.` : ""}`.trim(),
    type: `Video index ${contentType.video.toFixed(1)}%. Consider more short videos if resources allow.`,
    hashtag: `Optimal range appears ${hashtagsEffectiveness.sort((a,b)=>b.value-a.value)[0]?.count}. Keep hashtags relevant and consistent.`,
    sentiment: `Overall audience sentiment: ${String(sentiment.label)}. Summary: ${summary}`,
  }

  const aiInsights = {
    captionPerformance,
    optimalTimes: { days: optimalDays, hours: optimalHours },
    contentType,
    hashtagsEffectiveness,
    suggestions,
  }

  return NextResponse.json({ 
    totals: { engagement, reach, conversions }, 
    weekly, 
    platforms: perPlatform, 
    followers, 
    breakdown, 
    topPosts: topFive,
    series,
    aiInsights
  })
}