import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getServerAuthSession();
  return NextResponse.json({ isAuthenticated: !!session });
}