import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(request: Request) {
  const { userId, plan = null } = await request.json()

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 })
  }

  try {
    const profile = await prisma.profile.create({
      data: { userId, plan },
    })
    return NextResponse.json(profile, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create profile" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "userId query param is required" }, { status: 400 })
  }

  try {
    const profile = await prisma.profile.findUnique({
      where: { userId },
    })

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const { userId, plan, bio } = await request.json()

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 })
  }

  try {
    const profile = await prisma.profile.upsert({
      where: { userId },
      update: ({ plan: plan ?? null, bio }) as any,
      create: ({ userId, plan: plan ?? null, bio }) as any,
    })
    return NextResponse.json(profile)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}

