import NextAuth, { type NextAuthOptions, getServerSession } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import LinkedIn from "next-auth/providers/linkedin"
import bcrypt from "bcryptjs"

import prisma from "@/lib/prisma"

async function ensureProfile(userId: string) {
  const existingProfile = await prisma.profile.findUnique({
    where: { userId },
  })

  if (existingProfile) {
    return existingProfile
  }

  return prisma.profile.create({
    data: { userId },
  })
}

const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  (process.env.NODE_ENV === "development" ? "dev-insecure-auth-secret" : undefined)

if (!AUTH_SECRET) {
  console.warn("Missing AUTH_SECRET or NEXTAUTH_SECRET. Using fallback for build.")
}

export const authConfig: NextAuthOptions = {
  debug: false,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim().toLowerCase()
        const password = credentials?.password?.toString()

        if (!email || !password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user?.password) {
          return null
        }

        const ok = await bcrypt.compare(password, user.password)

        if (!ok) {
          return null
        }

        return { id: user.id, email: user.email, name: user.name }
      },
    }),
    LinkedIn({
      clientId: process.env.LINKEDIN_CLIENT_ID || "",
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || "",
      issuer: "https://www.linkedin.com",
      wellKnown: "https://www.linkedin.com/oauth/.well-known/openid-configuration",
      authorization: {
        url: "https://www.linkedin.com/oauth/v2/authorization",
        params: {
          scope: "openid profile email",
          response_type: "code",
        },
      },
      token: {
        url: "https://www.linkedin.com/oauth/v2/accessToken",
      },
      userinfo: {
        url: "https://api.linkedin.com/v2/userinfo",
      },
      client: { token_endpoint_auth_method: "client_secret_post" },
      checks: ["pkce", "state"],
      profile(profile) {
        return {
          id: (profile as any).sub,
          name: (profile as any).name,
          email: (profile as any).email,
          image: (profile as any).picture,
        }
      },
    }),
  ],
  pages: { signIn: "/auth/login" },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: AUTH_SECRET || "fallback-build-secret",
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        await prisma.user.upsert({
          where: { id: user.id as string },
          update: { email: user.email ?? null, name: user.name ?? null },
          create: { id: user.id as string, email: user.email ?? null, name: user.name ?? null },
        })
        const profile = await ensureProfile(user.id as string)
        token.plan = profile.plan ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (!session || !session.user) {
        return session
      }

      session.user.id = token.id as string
      session.user.email = (token.email as string | null) ?? null
      session.user.name = (token.name as string | null) ?? null
      session.user.image = session.user.image ?? null
      const existingUser = await prisma.user.findUnique({ where: { id: session.user.id } })
      if (!existingUser) {
        await prisma.user.create({
          data: { id: session.user.id, email: session.user.email ?? undefined, name: session.user.name ?? undefined },
        })
      }
      const profile = await prisma.profile.findUnique({
        where: { userId: session.user.id },
      })
      session.user.plan = profile?.plan ?? null
      token.plan = session.user.plan

      return session
    },
  },
  cookies: {
    sessionToken: {
      name: "maestro.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: "maestro.csrf-token",
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
}

const nextAuthHandler = NextAuth(authConfig)

export const handlers = {
  GET: nextAuthHandler,
  POST: nextAuthHandler,
}

export async function auth() {
  return getServerSession(authConfig)
}