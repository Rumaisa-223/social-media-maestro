import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth/session";
import { SocialProvider } from "@prisma/client";
import { decrypt } from "@/lib/encrypt";

export async function GET(request: NextRequest) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const account = await prisma.socialAccount.findFirst({
    where: { userId: session.user.id, provider: SocialProvider.FACEBOOK, isActive: true },
  });
  if (!account?.accessToken) {
    return NextResponse.json({ error: "Facebook account not connected" }, { status: 400 });
  }
  const token = decrypt(account.accessToken);
  const url = new URL("https://graph.facebook.com/v18.0/me/accounts");
  url.searchParams.set("fields", "id,name,category,access_token");
  url.searchParams.set("access_token", token);
  const res = await fetch(url.toString(), { method: "GET" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json({ error: json?.error?.message || "Failed to fetch pages" }, { status: 400 });
  }
  const data = Array.isArray(json?.data) ? json.data : [];
  const pages = data.map((p: any) => ({ id: String(p.id), name: String(p.name), category: String(p.category || "") }));
  return NextResponse.json({ pages });
}