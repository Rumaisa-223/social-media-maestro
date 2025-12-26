import type { Session } from "next-auth"
import { getServerSession } from "next-auth"

import { authConfig } from "@/lib/auth"

type SessionUser = Session["user"] & { id: string }

export type AppSession = {
  user: SessionUser
  expires: string
}

export async function getServerAuthSession(): Promise<AppSession | null> {
  const session = await getServerSession(authConfig)

  if (!session?.user?.id) {
    return null
  }

  return session as AppSession
}

