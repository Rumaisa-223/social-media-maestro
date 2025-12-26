import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerAuthSession } from "@/lib/auth/session"
import { queueConnection } from "@/lib/job-queue"

function key(userId: string, name: string) {
  return `metrics:${userId}:${name}`
}

export async function GET(request: NextRequest) {
  const session = await getServerAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
  const userId = session.user.id
  try {
    const [analysesRaw, imagesRaw, videosRaw, audioRaw] = await queueConnection.mget(
      key(userId, "analyses"),
      key(userId, "images"),
      key(userId, "videos"),
      key(userId, "audio"),
    )
    let images = Number(imagesRaw || 0)
    let videos = Number(videosRaw || 0)
    const analyses = Number(analysesRaw || 0)
    const audio = Number(audioRaw || 0)

    if (!images || !videos) {
      const [imgDb, vidDb] = await Promise.all([
        prisma.contentItem.count({ where: { userId, type: "IMAGE" } }),
        prisma.contentItem.count({ where: { userId, type: "VIDEO" } }),
      ])
      images = images || imgDb
      videos = videos || vidDb
    }

    return NextResponse.json({ analyses, images, videos, audio })
  } catch {
    return NextResponse.json({ analyses: 0, images: 0, videos: 0, audio: 0 })
  }
}