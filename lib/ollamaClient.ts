export async function ollamaGenerate(prompt: string): Promise<string> {
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

function generateFallbackText(_prompt: string): string {
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