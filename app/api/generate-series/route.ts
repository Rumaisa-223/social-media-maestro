import { NextResponse } from "next/server"
import ollama from "ollama"

export const maxDuration = 30

export async function POST(req: Request) {
  const { seriesName, industry, episodeCount } = await req.json()
  const count = Number(episodeCount) || 5

  const prompt = `You are a social media strategy expert. The user wants to create a "${seriesName}" content series for their ${industry} business.

Based on current trends and best practices, suggest ${count} compelling tutorial/how-to episodes for this series. For each episode, provide:
1. Episode title
2. Brief description (1 sentence)
3. Why this topic matters for their audience
4. Best day/time to post

Format your response as a JSON array with objects containing: title, description, importance, and postingTip.

Be specific, actionable, and focused on what would resonate with their ${industry} audience.`

  try {
    const res = await ollama.generate({ model: "tinyllama", prompt })
    const text = res?.response || ""
    const match = text.match(/\[\s*{[\s\S]*}\s*\]/)
    if (match) {
      const arr = JSON.parse(match[0])
      return NextResponse.json(arr)
    }
  } catch (error) {
    console.error("[generate-series] ollama error:", error)
  }

  const fallback = [
    {
      title: "Introduction & Setup",
      description: "Getting started with the basics",
      importance: "Foundation for understanding",
      postingTip: "Post on Tuesday morning for best reach",
    },
    {
      title: "Core Features Overview",
      description: "Deep dive into main capabilities",
      importance: "Helps users explore the platform",
      postingTip: "Post on Thursday evening",
    },
    {
      title: "Advanced Tips & Tricks",
      description: "Power user techniques",
      importance: "Engages experienced users",
      postingTip: "Post on Wednesday",
    },
  ]

  return NextResponse.json(fallback.slice(0, count))
}
