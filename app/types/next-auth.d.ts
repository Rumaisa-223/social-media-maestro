// types/next-auth.d.ts
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string | null
      name: string | null
      image: string | null
      plan: string | null
    }
    twitter?: {
      accessToken: string
      refreshToken?: string
      expiresAt?: number
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    sub: string
    twitter?: {
      accessToken: string
      refreshToken?: string
      expiresAt?: number
    }
    plan?: string | null
  }
}