import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const pingController = new AbortController()
    const pingTimeout = setTimeout(() => pingController.abort(), 3000)
    const ping = await fetch("http://localhost:11434/api/tags", { signal: pingController.signal })
      .finally(() => clearTimeout(pingTimeout))
    if (!ping.ok) {
      const stub =
        "Here are actionable tips to improve social media engagement:\n\n" +
        "1) Post consistently (2–3x per week per platform).\n" +
        "2) Use strong hooks in the first 2 lines.\n" +
        "3) Add 1 CTA per post (comment, save, share).\n" +
        "4) Repurpose content into short video, image, and text.\n" +
        "5) Analyze top posts weekly and double down on themes.\n\n" +
        "Start Ollama on http://localhost:11434 for AI-generated answers."
      return NextResponse.json({ response: stub, meta: { stub: true } })
    }
    const tags = await ping.json()
    const hasTiny = Array.isArray(tags?.models) && tags.models.some((m: any) => m?.name?.includes("tinyllama"))
    if (!hasTiny) {
      const stub =
        "Tinyllama model not found. Tips:\n\n" +
        "• Pull the model: ollama pull tinyllama\n" +
        "• Meanwhile: focus on value-first posts, consistent cadence, and community replies."
      return NextResponse.json({ response: stub, meta: { stub: true } })
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60000)
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tinyllama",
        prompt: prompt,
        stream: false,
        options: { num_predict: 128, temperature: 0.7 },
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout))

    if (!response.ok) {
      const message = `Ollama API error: ${response.status} ${response.statusText}`
      const stub =
        "AI temporarily unavailable. Strategy pointers:\n\n" +
        "• Hook: lead with a question or stat.\n" +
        "• Format: carousel or short video for complex topics.\n" +
        "• Distribution: cross-post with platform-native tweaks."
      return NextResponse.json({ response: stub, meta: { stub: true, message } })
    }

    const data = await response.json()

    return NextResponse.json({
      response: data.response || "No response generated",
    })
  } catch (error) {
    const message =
      (error as Error)?.name === "AbortError"
        ? "Timed out. Start Ollama on http://localhost:11434 or retry."
        : "AI unavailable. Using suggestions until Ollama is ready."
    const stub =
      "Quick wins:\n\n" +
      "• Post timing: align with audience timezone.\n" +
      "• Hashtags: 3–5 relevant, avoid spam.\n" +
      "• Engagement: reply within 1 hour to top comments."
    return NextResponse.json({ response: stub, meta: { stub: true, message } })
  }
}
