import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getServerAuthSession } from "@/lib/auth/session";
import { ProviderKey, SOCIAL_PROVIDERS } from "@/lib/social/providers";
import { encodeState } from "@/lib/security/oauth-state";
import { deactivateSocialAccount } from "@/lib/services/social-accounts";

function resolveBaseUrl(req: NextRequest) {
  const envUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL;
  if (envUrl) {
    return envUrl.startsWith("http") ? envUrl : `https://${envUrl}`;
  }
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ platform: ProviderKey }> | { platform: ProviderKey } },
) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { platform: provider } =
    "then" in context.params ? await context.params : context.params;
  const cfg = SOCIAL_PROVIDERS[provider];
  if (!cfg?.clientId) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  const action = request.nextUrl.searchParams.get("action") === "reconnect" ? "reconnect" : "connect";
  const baseUrl = resolveBaseUrl(request);
  const redirectUri =
    provider === "linkedin" && process.env.LINKEDIN_REDIRECT_URI
      ? process.env.LINKEDIN_REDIRECT_URI
      : `${baseUrl}/api/social/callback/${provider}`;

  // PKCE: generate code_verifier (string) & code_challenge = base64url(SHA256(code_verifier))
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");

  const state = encodeState({
    userId: session.user.id,
    provider,
    action: action as "connect" | "reconnect",
    codeVerifier,
    ts: Date.now(),
  });

  const scope = encodeURIComponent(cfg.scopes.join(" "));
  const authUrl = `${cfg.authorizeUrl}?client_id=${encodeURIComponent(cfg.clientId || "")}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code&code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=S256&state=${encodeURIComponent(state)}`;

  return NextResponse.json({ authUrl, redirectUri });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ platform: ProviderKey }> | { platform: ProviderKey } },
) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    const { platform } =
      "then" in context.params ? await context.params : context.params;
    await deactivateSocialAccount(session.user.id, platform);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Disconnect failed", error);
    return NextResponse.json({ error: "Failed to disconnect account" }, { status: 500 });
  }
}
