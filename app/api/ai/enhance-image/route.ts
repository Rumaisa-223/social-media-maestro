import { NextRequest, NextResponse } from "next/server"
import sharp from "sharp"

export const runtime = "nodejs"

function dataUrlToBuffer(dataUrl: string): Buffer {
  const [, base64] = dataUrl.split(",")
  return Buffer.from(base64, "base64")
}

async function processImage(input: Buffer, type: string, intensity: number): Promise<Buffer> {
  let img = sharp(input)
  switch (type) {
    case "upscale": {
      const factor = intensity >= 75 ? 3 : intensity >= 50 ? 2 : 1.5
      const meta = await img.metadata()
      const w = Math.round((meta.width || 512) * factor)
      const h = Math.round((meta.height || 512) * factor)
      img = img.resize(w, h, { fit: "cover" })
      break
    }
    case "denoise": {
      const sigma = Math.max(0.3, Math.min(2, intensity / 50))
      img = img.blur(sigma)
      break
    }
    case "sharpen": {
      const sharpness = Math.max(0.3, Math.min(3, intensity / 20))
      img = img.sharpen(sharpness)
      break
    }
    case "colorize": {
      const sat = Math.max(0.8, Math.min(2, 1 + intensity / 100))
      img = img.modulate({ saturation: sat })
      break
    }
    case "restore": {
      img = img.sharpen(1).median(3).modulate({ saturation: 1.1, brightness: 1.05 })
      break
    }
    case "enhance": {
      img = img.sharpen(1).modulate({ saturation: 1.1 })
      break
    }
    default:
      break
  }
  return img.png().toBuffer()
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const image: string | null = body?.image ?? null
  const type: string = String(body?.type || "enhance")
  const intensity: number = Number(body?.intensity ?? 50)
  if (!image || !image.startsWith("data:")) {
    return NextResponse.json({ error: "Invalid image" }, { status: 400 })
  }
  try {
    const input = dataUrlToBuffer(image)
    const out = await processImage(input, type, intensity)
    const dataUrl = `data:image/png;base64,${out.toString("base64")}`
    return NextResponse.json({ enhancedImage: dataUrl })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Enhancement failed" }, { status: 500 })
  }
}
