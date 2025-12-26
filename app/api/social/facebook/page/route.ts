import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth/session";
import { SocialProvider, Prisma } from "@prisma/client";
import { encrypt, decrypt } from "@/lib/encrypt";

export async function POST(request: NextRequest) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const pageId = body?.pageId as string | undefined;
  const pageAccessToken = body?.pageAccessToken as string | undefined;

  if (!pageId) {
    return NextResponse.json({ error: "pageId is required" }, { status: 400 });
  }

  const account = await prisma.socialAccount.findFirst({
    where: { userId: session.user.id, provider: SocialProvider.FACEBOOK },
  });
  if (!account) {
    return NextResponse.json({ error: "Facebook account not connected" }, { status: 400 });
  }

  let tokenToStore = pageAccessToken;
  if (!tokenToStore) {
    if (!account.accessToken) {
      return NextResponse.json({ error: "Missing user token" }, { status: 400 });
    }
    const userToken = decrypt(account.accessToken);
    const url = new URL("https://graph.facebook.com/v18.0/me/accounts");
    url.searchParams.set("fields", "id,name,access_token");
    url.searchParams.set("access_token", userToken);
    const res = await fetch(url.toString(), { method: "GET" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json({ error: json?.error?.message || "Failed to fetch pages" }, { status: 400 });
    }
    const data = Array.isArray(json?.data) ? json.data : [];
    const page = data.find((p: any) => String(p.id) === String(pageId));
    if (!page?.access_token) {
      return NextResponse.json({ error: "Missing page token" }, { status: 400 });
    }
    tokenToStore = page.access_token as string;
  }
  const existingMeta = (account.meta ?? {}) as Record<string, any>;
  const updatedMeta: Prisma.InputJsonObject = {
    ...existingMeta,
    pageId,
    pageAccessTokenEncrypted: encrypt(tokenToStore),
    pageTokenUpdatedAt: new Date().toISOString(),
  };

  await prisma.socialAccount.update({
    where: { id: account.id },
    data: { meta: updatedMeta },
  });

  return NextResponse.json({ success: true, pageId });
}