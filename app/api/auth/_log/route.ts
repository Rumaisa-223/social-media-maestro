import { NextRequest, NextResponse } from "next/server"

const allowHeader = "GET,POST,HEAD,OPTIONS"

function jsonSuccess() {
  return NextResponse.json({ success: true }, { status: 200 })
}

/**
 * NextAuth internal logging endpoint
 * This endpoint is used by NextAuth for internal logging/debugging
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "development") {
    try {
      const body = await request.json().catch(() => ({}))
      console.log("[NextAuth] Log:", body)
    } catch {
      // Ignore parsing errors
    }
  }

  return jsonSuccess()
}

export function GET() {
  return jsonSuccess()
}

export function HEAD() {
  return new NextResponse(null, { status: 204 })
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: allowHeader,
    },
  })
}
