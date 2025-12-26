// Fully typed, zero API keys (where possible), zero RapidAPI, lifetime free

import { templateDataset, type Template } from "./template-dataset"
import { TemplateGenerator } from "./template-generator"

/* 0️⃣  UTIL ------------------------------------------------------ */
async function ollamaGenerate(prompt: string): Promise<string> {
  try {
    const res = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "tinyllama", prompt, stream: false }),
    })
    if (!res.ok) throw new Error("ollama offline")
    const json = await res.json().catch(() => ({} as any))
    const text = (json as any)?.response || ""
    return text.trim() || generateFallbackText(prompt)
  } catch {
    return generateFallbackText(prompt)
  }
}

function generateFallbackText(prompt: string): string {
  const bank = [
    "Calmness over chaos",
    "Always classy, never trashy",
    "Flawless",
    "Independent",
    "Quiet luxury",
    "Grace over noise",
    "Soft power",
    "Own your aura",
    "Simply iconic",
    "Elegance in motion",
  ]
  return bank[Math.floor(Math.random() * bank.length)]
}

/* 1️⃣  CAPTION --------------------------------------------------- */
export async function generateText(prompt: string, tone = "classy"): Promise<string> {
  const fullPrompt = `Generate one short, classy, confident Instagram caption for: ${prompt}. Requirements: 1–6 words, minimal, elegant, punchy, no hashtags, no emojis, no storytelling. Themes: self-confidence, calmness, independence, elegance, positivity. Examples: Calmness over chaos; Always classy, never trashy; Flawless; Independent. Return only the caption text.`;
  return ollamaGenerate(fullPrompt)
}


/* 2️⃣  HASHTAGS -------------------------------------------------- */
export async function generateHashtags(prompt: string): Promise<string[]> {
  const fullPrompt = `Return exactly 12 Instagram hashtags relevant to: ${prompt}. Output only hashtags, comma-separated, no commentary.`
  const raw = await ollamaGenerate(fullPrompt)
  const found = raw.match(/#[A-Za-z0-9_]+/g) || []
  const cleanSet = new Set<string>()
  const pushTag = (t: string) => {
    const x = t.replace(/^[#\s]+/, "").replace(/[^a-zA-Z0-9]+/g, "").toLowerCase()
    if (!x) return
    const tag = `#${x}`
    if (tag.length <= 30) cleanSet.add(tag)
  }
  found.forEach(pushTag)
  if (cleanSet.size < 12) {
    const txt = (prompt || "").toLowerCase()
    const words = (txt.match(/[a-z0-9]+/g) || []).filter(
      (w) => !["a","an","the","and","or","of","for","to","in","on","at","is","are","be","am","was","were","this","that","these","those","with","by","from","about","into","over","under","up","down"].includes(w) && w.length >= 3,
    )
    const uniq = Array.from(new Set(words)).slice(0, 6)
    uniq.forEach((w) => pushTag(`#${w}`))
    if (/water|ocean|river|lake|hydro|drink/i.test(txt)) {
      ["#waterforall","#watersustainability","#cleanwater","#savetheearth","#ecofriendly"].forEach(pushTag)
    }
    if (/earth|planet|climate|green|eco|sustain/i.test(txt)) {
      ["#saveourearth","#sustainablefuture","#planet","#zerowaste","#reusable"].forEach(pushTag)
    }
    if (/fashion|style|classy|elegant|luxury|chic|minimal/i.test(txt)) {
      ["#classy","#elegance","#quietluxury","#chic","#minimal","#softpower","#grace"].forEach(pushTag)
    }
    if (/new\s?year|202[0-9]/i.test(txt)) {
      ["#newyear","#newyeargoals","#goodenergy","#freshstart"].forEach(pushTag)
    }
  }
  return Array.from(cleanSet).slice(0, 12)
}

/* 3️⃣  IMAGE ----------------------------------------------------- */
export async function generateImage(prompt: string, count = 4): Promise<string[]> {
  return Array.from({ length: count }).map(
    (_, i) => `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${i}`,
  )
}

/* 4️⃣  CAROUSEL -------------------------------------------------- */
export async function generateCarousel(prompt: string): Promise<string[]> {
  return generateImage(`${prompt} carousel slide`, 3)
}

/* 5️⃣  STORY ----------------------------------------------------- */
export async function generateStory(prompt: string): Promise<string[]> {
  const urls = await generateImage(`${prompt} instagram story`, 2)
  return urls.map((u) => u.replace("1024x1024", "1080x1920")) // Adjust resolution
}

/* 6️⃣  VIDEO ----------------------------------------------------- */
export async function generateVideo(keyword: string, perPage = 3): Promise<string[]> {
  const res = await fetch(
    `https://api.pexels.com/videos/search?query=${encodeURIComponent(keyword)}&per_page=${perPage}`,
    {
      headers: {
        Authorization: process.env.PEXELS_API_KEY || "",
      },
    },
  )

  if (!res.ok) return []
  const data = await res.json()
  return data.videos
    ?.map((v: any) => v.video_files.find((f: any) => f.quality === "hd")?.link || v.video_files[0]?.link)
    .filter(Boolean)
}

/* 7️⃣  TEMPLATES ------------------------------------------------- */
export async function generateTemplates(prompt: string): Promise<Template[]> {
  try {
    // Generate a custom template based on the prompt
    const customTemplate = TemplateGenerator.generateFromText(prompt)

    // Get relevant pre-built templates based on detected profession
    const words = prompt.toLowerCase().split(" ")
    const relevantTemplates = templateDataset.filter(
      (template) =>
        template.tags.some((tag) => words.some((word) => word.includes(tag))) ||
        words.some((word) => template.category.toLowerCase().includes(word)),
    )

    // Return custom template plus relevant pre-built ones
    return [customTemplate, ...relevantTemplates.slice(0, 3)]
  } catch (error) {
    console.error("Template generation error:", error)
    // Fallback to first few templates if generation fails
    return templateDataset.slice(0, 4)
  }
}

/* 8️⃣  SOCIAL MEDIA GENERATOR ------------------------------------ */
export async function generateSocialMediaGenerator(prompt: string): Promise<any> {
  // This can be your existing social media generator logic
  // For now, returning a placeholder
  return {
    type: "social_media_generator",
    content: `Generated social media content for: ${prompt}`,
    timestamp: new Date().toISOString(),
  }
}
