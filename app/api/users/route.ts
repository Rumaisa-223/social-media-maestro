import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const user = await prisma.user.create({ data: body })
  return NextResponse.json(user, { status: 201 })
}