// lib/social/providers.ts
import { SocialProvider } from "@prisma/client";

export type ProviderKey = "facebook" | "twitter" | "instagram" | "linkedin" | "bluesky" | "mastodon";

interface ProviderConfig {
  name: string;
  authorizeUrl: string;
  tokenUrl: string;
  refreshUrl?: string;
  scopes: string[];
  clientId?: string;
  clientSecret?: string;
  profileUrl: string;
}

export const SOCIAL_PROVIDERS: Record<ProviderKey, ProviderConfig> = {
  facebook: {
    name: "Facebook",
    authorizeUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    refreshUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    scopes: [
      "pages_manage_posts",
      "pages_read_engagement",
      "pages_show_list",
      "business_management",
    ],
    clientId: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    profileUrl: "https://graph.facebook.com/v18.0/me?fields=id,name,email,picture",
  },
  twitter: {
    name: "Twitter (X)",
    authorizeUrl: "https://twitter.com/i/oauth2/authorize",
    tokenUrl: "https://api.twitter.com/2/oauth2/token",
    scopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
    profileUrl:
      "https://api.twitter.com/2/users/me?user.fields=id,name,username,profile_image_url",
  },
  instagram: {
    name: "Instagram",
    authorizeUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    refreshUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    scopes: [
      "instagram_basic",
      "pages_show_list",
      "pages_read_engagement",
      "instagram_content_publish",
      "business_management",
    ],
    clientId: process.env.FACEBOOK2_CLIENT_ID,
    clientSecret: process.env.FACEBOOK2_CLIENT_SECRET,
    profileUrl: "https://graph.facebook.com/v18.0/me/accounts?fields=instagram_business_account,name",
  },
  linkedin: {
    name: "LinkedIn",
    authorizeUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    scopes: [
      "w_member_social",
      "profile",
      "email",
      "openid",
    ],
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    profileUrl: "https://api.linkedin.com/v2/me",
  },
  bluesky: {
    name: "Bluesky",
    authorizeUrl: process.env.BLUESKY_AUTHORIZE_URL || "",
    tokenUrl: process.env.BLUESKY_TOKEN_URL || "",
    scopes: ["atproto", "transition:generic", "transition:email"],
    clientId: process.env.BLUESKY_CLIENT_ID,
    clientSecret: process.env.BLUESKY_CLIENT_SECRET,
    profileUrl: process.env.BLUESKY_PROFILE_URL || "",
  },
  mastodon: {
    name: "Mastodon",
    authorizeUrl: `${process.env.MASTODON_INSTANCE_URL || ""}/oauth/authorize`,
    tokenUrl: `${process.env.MASTODON_INSTANCE_URL || ""}/oauth/token`,
    scopes:
      (process.env.MASTODON_SCOPES || "")
        .split(/[,\s]+/)
        .filter(Boolean).length
        ? (process.env.MASTODON_SCOPES || "")
            .split(/[,\s]+/)
            .filter(Boolean)
        : ["read", "write", "follow"],
    clientId: process.env.MASTODON_CLIENT_ID,
    clientSecret: process.env.MASTODON_CLIENT_SECRET,
    profileUrl: `${process.env.MASTODON_INSTANCE_URL || ""}/api/v1/accounts/verify_credentials`,
  },
};

// ---------- TOKEN HELPERS ----------

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  [key: string]: any;
}

export async function exchangeAuthorizationCode(
  provider: ProviderKey,
  code: string,
  redirectUri: string,
  codeVerifier?: string,
): Promise<TokenResponse> {
  const cfg = SOCIAL_PROVIDERS[provider];
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: cfg.clientId || "",
  });

  // Most providers accept client_secret in body, Twitter expects HTTP Basic auth instead
  if (cfg.clientSecret && provider !== "twitter") {
    params.set("client_secret", cfg.clientSecret);
  }
  if (codeVerifier) params.set("code_verifier", codeVerifier);

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  // Twitter OAuth 2.0 accepts HTTP Basic client auth
  if (provider === "twitter" && cfg.clientId && cfg.clientSecret) {
    const basic = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString("base64");
    headers.Authorization = `Basic ${basic}`;
  }

  console.log("OAuth token request", {
    provider,
    redirectUri,
    hasCodeVerifier: !!codeVerifier,
  });

  const res = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers,
    body: params,
  });

  if (!res.ok) {
    const err = await res.text();
    if (provider === "linkedin" && /invalid_client/i.test(err)) {
      throw new Error(
        `Token exchange failed for ${provider}: ${err}. Verify LINKEDIN_CLIENT_ID/LINKEDIN_CLIENT_SECRET and Authorized Redirect URL matches ${redirectUri}`,
      );
    }
    throw new Error(`Token exchange failed for ${provider}: ${err}`);
  }
  return res.json();
}

export async function exchangeFacebookLongLivedToken(shortLivedToken: string): Promise<TokenResponse> {
  const clientId = SOCIAL_PROVIDERS.facebook.clientId || "";
  const clientSecret = SOCIAL_PROVIDERS.facebook.clientSecret || "";
  const url = new URL("https://graph.facebook.com/v18.0/oauth/access_token");
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("client_secret", clientSecret);
  url.searchParams.set("fb_exchange_token", shortLivedToken);
  const res = await fetch(url.toString(), { method: "GET" });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Facebook long-lived exchange failed: ${err}`);
  }
  return res.json();
}

export async function refreshAccessToken(
  provider: ProviderKey,
  refreshToken: string,
): Promise<TokenResponse> {
  const cfg = SOCIAL_PROVIDERS[provider];
  if (!cfg.refreshUrl && provider !== "twitter") {
    throw new Error(`Provider ${provider} does not support refresh`);
  }

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: cfg.clientId || "",
  });

  // Most providers accept client_secret in body, Twitter expects HTTP Basic auth instead
  if (cfg.clientSecret && provider !== "twitter") {
    params.set("client_secret", cfg.clientSecret);
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  // Twitter OAuth 2.0 requires Authorization: Basic <client_id:client_secret>
  if (provider === "twitter" && cfg.clientId && cfg.clientSecret) {
    const basic = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString("base64");
    headers.Authorization = `Basic ${basic}`;
  }

  const res = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers,
    body: params,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed for ${provider}: ${err}`);
  }
  return res.json();
}

// ---------- PROFILE FETCH ----------

export async function fetchProviderProfile(provider: ProviderKey, accessToken: string) {
  const cfg = SOCIAL_PROVIDERS[provider];
  if (!cfg.profileUrl) {
    return { id: "", name: provider };
  }
  const res = await fetch(cfg.profileUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to fetch ${provider} profile: ${err}`);
  }

  const json = await res.json();

  switch (provider) {
    case "facebook":
      return {
        id: json.id,
        name: json.name,
        email: json.email,
        avatar: json.picture?.data?.url,
      };
    case "twitter":
      return {
        id: json.data?.id,
        name: json.data?.name,
        username: json.data?.username,
        avatar: json.data?.profile_image_url,
      };
    case "instagram": {
      const data = Array.isArray(json?.data) ? json.data : [];
      const first = data.find((p: any) => p?.instagram_business_account?.id);
      const ig = first?.instagram_business_account;
      return {
        id: ig?.id || "",
        name: first?.name || "Instagram Business",
      };
    }
    case "linkedin":
      return {
        id: json.id,
        name: `${json.localizedFirstName ?? ""} ${json.localizedLastName ?? ""}`.trim(),
      };
    case "mastodon":
      return {
        id: json.id,
        name: json.display_name || json.username,
        username: json.username,
        avatar: json.avatar,
      };
    case "bluesky":
      return {
        id: json.did || json.id || "",
        name: json.displayName || json.handle || "Bluesky User",
      };
    default:
      return json;
  }
}

// ---------- PRISMA ENUM MAPPER ----------

export function toSocialProviderEnum(provider: ProviderKey): SocialProvider | null {
  switch (provider) {
    case "facebook":
      return SocialProvider.FACEBOOK;
    case "twitter":
      return SocialProvider.TWITTER;
    case "instagram":
      return (SocialProvider as any).INSTAGRAM ?? null;
    case "linkedin":
      return SocialProvider.LINKEDIN;
    case "bluesky":
      return (SocialProvider as any).BLUESKY ?? null;
    case "mastodon":
      return (SocialProvider as any).MASTODON ?? null;
    default:
      return null;
  }
}