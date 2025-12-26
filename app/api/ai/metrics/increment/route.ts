import { NextRequest, NextResponse } from "next/server"
import { getServerAuthSession } from "@/lib/auth/session"
import { queueConnection } from "@/lib/job-queue"

function key(userId: string, name: string) {
  return `metrics:${userId}:${name}`
}

export async function POST(request: NextRequest) {
  const session = await getServerAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
  const userId = session.user.id

  const url = new URL(request.url)
  const type = url.searchParams.get("type") || "analyses"
  const value = Number(url.searchParams.get("value") || "1")
  const valid = ["analyses", "images", "videos", "audio"]
  if (!valid.includes(type)) return NextResponse.json({ error: "invalid type" }, { status: 400 })

  await queueConnection.incrby(key(userId, type), value)
  const total = Number((await queueConnection.get(key(userId, type))) || 0)
  return NextResponse.json({ ok: true, total })
}