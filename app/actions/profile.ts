// app/actions/profile.ts
"use server"

import prisma from "@/lib/prisma"

type ProfilePayload = {
  userId: string
  plan?: string | null
}

export async function createProfileAction({ userId, plan = null }: ProfilePayload) {
  return prisma.profile.create({
    data: {
      userId,
      plan,
    },
  })
}

export async function getProfileByUserIdAction(userId: string) {
  return prisma.profile.findUnique({
    where: { userId },
  })
}

export async function updateProfilePlanAction(userId: string, plan: string | null) {
  return prisma.profile.update({
    where: { userId },
    data: { plan },
  })
}

