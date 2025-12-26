import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerAuthSession } from "@/lib/auth/session"
import { decrypt } from "@/lib/encrypt"
import { db, getDecryptedToken } from "@/lib/db"

const GRAPH_API_BASE = "https://graph.facebook.com/v18.0"

async function instagramRequest(path: string, params: Record<string, string | undefined>, token: string) {
  const body = new URLSearchParams()
  body.set("access_token", token)
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null) body.set(k, v) })
  const res = await fetch(`${GRAPH_API_BASE}${path}`, { method: "POST", body })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = json?.error?.message || "Instagram API error"
    throw new Error(`${msg} (status ${res.status})`)
  }
  return json
}

async function getInstagramBusinessId(userToken: string): Promise<string | undefined> {
  const url = new URL(`${GRAPH_API_BASE}/me/accounts`)
  url.searchParams.set("fields", "instagram_business_account,name")
  url.searchParams.set("access_token", userToken)
  const res = await fetch(url.toString(), { method: "GET" })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) return undefined
  const data = Array.isArray(json?.data) ? json.data : []
  const first = data.find((p: any) => p?.instagram_business_account?.id)
  return first?.instagram_business_account?.id ? String(first.instagram_business_account.id) : undefined
}

export async function POST(req: NextRequest) {
  const session = await getServerAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const { imageUrl, videoUrl, caption } = (await req.json().catch(() => ({}))) as { imageUrl?: string; videoUrl?: string; caption?: string }
  if (!imageUrl && !videoUrl) return NextResponse.json({ error: "imageUrl or videoUrl required" }, { status: 400 })

  // Try socialAccount first (if Prisma enum includes INSTAGRAM), else fallback to socialToken
  const account = await prisma.socialAccount.findFirst({ where: { userId: session.user.id, provider: "INSTAGRAM", isActive: true } as any }).catch(() => null)
  let token: string | undefined
  let igUserId: string | undefined
  if (account?.accessToken) {
    token = decrypt(account.accessToken)
    igUserId = String(account.providerUserId || "") || undefined
  } else {
    const t = await getDecryptedToken(session.user.id, "instagram")
    token = t?.accessToken || undefined
  }

  if (!token) return NextResponse.json({ error: "Instagram not connected" }, { status: 400 })
  if (!igUserId) {
    igUserId = await getInstagramBusinessId(token)
  }
  if (!igUserId) return NextResponse.json({ error: "Instagram Business Account not found. Link IG to a Facebook Page and grant required permissions." }, { status: 400 })

  try {
    if (videoUrl) {
      const create = await instagramRequest(`/${igUserId}/media`, { video_url: videoUrl, caption }, token)
      const creationId = String(create.id)
      const checkUrl = new URL(`${GRAPH_API_BASE}/${creationId}`)
      checkUrl.searchParams.set("fields", "status_code")
      checkUrl.searchParams.set("access_token", token)
      let status = "IN_PROGRESS"
      const started = Date.now()
      while (status === "IN_PROGRESS" || status === "PROCESSING") {
        const res2 = await fetch(checkUrl.toString(), { method: "GET" })
        const json2 = await res2.json().catch(() => ({}))
        status = String(json2?.status_code || "FINISHED")
        if (status === "FINISHED") break
        if (Date.now() - started > 120000) throw new Error("Instagram video upload timed out")
        await new Promise((r) => setTimeout(r, 3000))
      }
      const publish = await instagramRequest(`/${igUserId}/media_publish`, { creation_id: creationId }, token)
      return NextResponse.json({ success: true, id: publish.id || creationId, response: publish })
    }

    const create = await instagramRequest(`/${igUserId}/media`, { image_url: imageUrl, caption }, token)
    const creationId = String(create.id)
    const publish = await instagramRequest(`/${igUserId}/media_publish`, { creation_id: creationId }, token)
    return NextResponse.json({ success: true, id: publish.id || creationId, response: publish })
  } catch (error) {
    const message = (error as Error)?.message || "Unknown error"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}