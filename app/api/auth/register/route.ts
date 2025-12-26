import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

import prisma from "@/lib/prisma"

type RegisterPayload = {
  name?: string
  email?: string
  password?: string
}

export async function POST(request: Request) {
  try {
    const { name, email, password }: RegisterPayload = await request.json()

    const normalizedEmail = email?.trim().toLowerCase()

    if (!normalizedEmail || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name: name?.trim() || null,
        email: normalizedEmail,
        password: hashedPassword,
        profile: {
          create: {},
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error("[Register API] Failed:", error)
    return NextResponse.json({ error: "Unable to create account" }, { status: 500 })
  }
}

