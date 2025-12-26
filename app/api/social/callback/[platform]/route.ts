import { NextRequest, NextResponse } from "next/server";
import { ProviderKey, SOCIAL_PROVIDERS, exchangeAuthorizationCode } from "@/lib/social/providers";
import { decodeState } from "@/lib/security/oauth-state";
import { persistSocialAccountTokens } from "@/lib/services/social-accounts";

function resolveBaseUrl(req: NextRequest) {
  const envUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL;
  if (envUrl) {
    return envUrl.startsWith("http") ? envUrl : `https://${envUrl}`;
  }
  const { protocol, host } = new URL(req.url);
  return `${protocol}//${host}`;
}

function buildRedirect(baseUrl: string, path: string, params: Record<string, string | undefined>) {
  const url = new URL(path, baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ platform: ProviderKey }> | { platform: ProviderKey } },
) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const { platform: provider } =
    "then" in context.params ? await context.params : context.params;
  const baseUrl = resolveBaseUrl(request);
  const fallbackPath = "/dashboard/auth";

  // Handle OAuth provider errors
  if (error) {
    console.error(`OAuth error from ${provider}:`, error);
    const redirectUrl = buildRedirect(baseUrl, fallbackPath, { error });
    return NextResponse.redirect(redirectUrl, { status: 302 });
  }

  // Validate state
  const state = decodeState(stateParam ?? undefined);
  if (!state || state.provider !== provider || !state.userId) {
    console.error(`Invalid OAuth state for ${provider}:`, {
      hasState: !!state,
      stateProvider: state?.provider,
      expectedProvider: provider,
      hasUserId: !!state?.userId,
    });
    const redirectUrl = buildRedirect(baseUrl, fallbackPath, { error: "invalid_state" });
    return NextResponse.redirect(redirectUrl, { status: 302 });
  }

  // Validate authorization code
  if (!code) {
    console.error(`Missing authorization code for ${provider}`);
    const redirectUrl = buildRedirect(baseUrl, fallbackPath, { error: "missing_code" });
    return NextResponse.redirect(redirectUrl, { status: 302 });
  }

  try {
  const redirectUri =
    provider === "linkedin" && process.env.LINKEDIN_REDIRECT_URI
      ? process.env.LINKEDIN_REDIRECT_URI
      : `${baseUrl}/api/social/callback/${provider}`;
    console.log(`Exchanging authorization code for ${provider}...`);
    
    const tokenResponse = await exchangeAuthorizationCode(provider, code, redirectUri, state.codeVerifier);

    console.log(`Token exchange successful for ${provider}, persisting tokens...`);
    
    const instanceBase = provider === "mastodon"
      ? (() => {
          try {
            const a = new URL(SOCIAL_PROVIDERS.mastodon.authorizeUrl);
            return a.origin;
          } catch { return undefined; }
        })()
      : undefined;

    await persistSocialAccountTokens({
      userId: state.userId,
      provider,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresIn: tokenResponse.expires_in,
      scope: tokenResponse.scope,
      meta: { token_type: tokenResponse.token_type, instance: instanceBase },
      event: state.action === "reconnect" ? "RECONNECT" : "CONNECT",
    });

    console.log(`OAuth callback completed successfully for ${provider}`);
    const redirectUrl = buildRedirect(baseUrl, fallbackPath, { success: provider });
    return NextResponse.redirect(redirectUrl, { status: 302 });
  } catch (err) {
    console.error(`OAuth callback failed for ${provider}:`, err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    const redirectUrl = buildRedirect(baseUrl, fallbackPath, { 
      error: "oauth_failed",
      message: errorMessage,
    });
    return NextResponse.redirect(redirectUrl, { status: 302 });
  }
}


