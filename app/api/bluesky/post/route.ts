import { NextRequest, NextResponse } from "next/server"
import { BskyAgent } from "@atproto/api"
import prisma from "@/lib/prisma"
import { decrypt, encrypt } from "@/lib/encrypt"

function toService(meta: Record<string, any> | null | undefined) {
  const s = (meta || {}).service as string | undefined
  const base = s || process.env.NEXT_PUBLIC_BLUESKY_SERVICE_URL || "https://bsky.social"
  return base.replace(/\s+/g, "")
}

export async function POST(req: NextRequest) {
  const { userId, content } = (await req.json().catch(() => ({}))) as {
    userId?: string
    content?: string
  }
  if (!userId || !content) return NextResponse.json({ error: "Missing parameters" }, { status: 400 })

  const accounts = await prisma.socialAccount.findMany({ where: { userId, isActive: true } })
  const account = accounts.find((a) => String(a.provider).toLowerCase() === "bluesky") || null
  if (!account || !account.accessToken) return NextResponse.json({ error: "Bluesky not connected" }, { status: 400 })

  const accessJwt = decrypt(account.accessToken)
  const refreshJwt = account.refreshToken ? decrypt(account.refreshToken) : undefined
  const agent = new BskyAgent({ service: toService(account.meta as any) })
  const did = String(((account.meta as any)?.profile?.did || account.providerUserId || ""))
  const handle = String(((account.meta as any)?.profile?.handle || (account.meta as any)?.profile?.name || ""))
  await agent.resumeSession({ did, handle, accessJwt, refreshJwt: refreshJwt || "", active: true })

  if (refreshJwt) {
    await agent.sessionManager.refreshSession()
    const newAccess = agent.session?.accessJwt
    const newRefresh = agent.session?.refreshJwt
    if (newAccess) {
      await prisma.socialAccount.update({
        where: { id: account.id },
        data: {
          accessToken: encrypt(newAccess),
          refreshToken: newRefresh ? encrypt(newRefresh) : account.refreshToken,
        },
      })
    }
  }

  const res = await agent.post({ text: content, createdAt: new Date().toISOString() })
  return NextResponse.json({ success: true, post: { uri: res.uri, cid: res.cid } })
}