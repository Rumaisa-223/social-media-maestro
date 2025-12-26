import { NextRequest, NextResponse } from "next/server"
import { BskyAgent } from "@atproto/api"
import prisma from "@/lib/prisma"
import { getServerAuthSession } from "@/lib/auth/session"
import { persistSocialAccountTokens } from "@/lib/services/social-accounts"

function toService(url?: string) {
  const base = url || process.env.NEXT_PUBLIC_BLUESKY_SERVICE_URL || "https://bsky.social"
  return base.replace(/\s+/g, "")
}

export async function POST(req: NextRequest) {
  const session = await getServerAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const { identifier, password, service } = (await req.json().catch(() => ({}))) as {
    identifier?: string
    password?: string
    service?: string
  }

  if (!identifier || !password) return NextResponse.json({ error: "Missing credentials" }, { status: 400 })

  const agent = new BskyAgent({ service: toService(service) })
  await agent.login({ identifier, password })

  const did = agent.session?.did || ""
  const handle = agent.session?.handle || identifier
  await prisma.user.upsert({ where: { id: session.user.id }, update: {}, create: { id: session.user.id } })

  const account = await persistSocialAccountTokens({
    userId: session.user.id,
    provider: "bluesky",
    accessToken: agent.session?.accessJwt || "",
    refreshToken: agent.session?.refreshJwt || undefined,
    scope: "atproto",
    meta: { profile: { did, handle, name: handle }, service: toService(service) },
    event: "CONNECT",
  })

  return NextResponse.json({ success: true, did, accountId: account.id })
}