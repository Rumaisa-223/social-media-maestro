import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerAuthSession } from "@/lib/auth/session"

export async function POST() {
  const session = await getServerAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
  }
  const userId = session.user.id
  try {
    await prisma.post.deleteMany({ where: { userId } })
    await prisma.schedule.deleteMany({ where: { userId } })
    await prisma.contentItem.deleteMany({ where: { userId } })
    await prisma.socialAccount.deleteMany({ where: { userId } })
    await prisma.scheduledPost.deleteMany({ where: { userId } })
    await (prisma as any).oAuthEvent.deleteMany({ where: { userId } })
    await prisma.socialToken.deleteMany({ where: { userId } })
    await (prisma as any).userSettings.deleteMany({ where: { userId } })
    await prisma.profile.deleteMany({ where: { userId } })
    await prisma.user.delete({ where: { id: userId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }
}