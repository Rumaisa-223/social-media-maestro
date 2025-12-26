import { NextRequest, NextResponse } from "next/server"
import { getServerAuthSession } from "@/lib/auth/session"
import prisma from "@/lib/prisma"
import { generateText } from "@/lib/real-generators"

function formatPercentChange(curr: number, prev: number) {
  if (prev <= 0) return 0
  return Math.round(((curr - prev) / prev) * 100)
}

export async function GET(request: NextRequest) {
  const session = await getServerAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
  }

  const now = new Date()
  const startWeek = new Date(now)
  startWeek.setDate(now.getDate() - 7)
  const prevStart = new Date(startWeek)
  prevStart.setDate(startWeek.getDate() - 7)

  const thisWeek = await prisma.post.count({ where: { userId: session.user.id, createdAt: { gte: startWeek } } })
  const lastWeek = await prisma.post.count({ where: { userId: session.user.id, createdAt: { gte: prevStart, lt: startWeek } } })
  const engagementChange = formatPercentChange(thisWeek, lastWeek)

  const timingText = await generateText("Best time to post based on audience activity", "informative")
  const contentGapText = await generateText("Suggest tutorial series based on competitor traction", "neutral")
  const hashtagText = await generateText("Suggest trending hashtag relevant to eco-friendly initiatives", "neutral")

  return NextResponse.json({
    insights: {
      engagementChange,
    },
    suggestions: [
      { title: "Optimize Post Timing", text: timingText },
      { title: "Content Gap Opportunity", text: contentGapText },
      { title: "Trending Hashtag", text: hashtagText },
    ],
  })
}