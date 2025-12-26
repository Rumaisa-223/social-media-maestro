import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth"; // ✅ import from helper file

export async function GET(req: NextRequest) {
  const session = await auth(); // ✅ use auth()

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const url = new URL(req.url);
  const platform = url.searchParams.get("platform");

  if (platform === "twitter") {
    const origin = req.headers.get("origin") || "";
    const callbackUrl = `${origin}/dashboard/auth?success=twitter&refetch=true`;
    const twitterAuthUrl = new URL("/api/auth/signin/twitter", origin);
    twitterAuthUrl.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(twitterAuthUrl);
  }

  return NextResponse.json({ error: "Unsupported platform" }, { status: 400 });
}