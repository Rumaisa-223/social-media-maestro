import { Prisma, ScheduleStatus, SocialAccount, SocialProvider } from "@prisma/client";
import prisma from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encrypt";
import {
  ProviderKey,
  fetchProviderProfile,
  refreshAccessToken,
  toSocialProviderEnum,
  exchangeFacebookLongLivedToken,
} from "@/lib/social/providers";
import { emitRealtime } from "@/lib/realtime";

export type SanitizedAccount = {
  id: string;
  provider: ProviderKey;
  label: string;
  avatar?: string;
  isActive: boolean;
  tokenExpiresAt?: string | null;
  lastConnectedAt?: string | null;
  scope?: string | null;
  meta?: Record<string, any>;
};

export type OAuthLogEvent =
  | "CONNECT"
  | "RECONNECT"
  | "DISCONNECT"
  | "REFRESH_SUCCESS"
  | "REFRESH_FAILURE"
  | "TOKEN_REVOKED";

interface PersistTokensInput {
  userId: string;
  provider: ProviderKey;
  accessToken: string;
  refreshToken?: string | null;
  expiresIn?: number;
  scope?: string;
  meta?: Prisma.InputJsonObject;
  event?: Extract<OAuthLogEvent, "CONNECT" | "RECONNECT">;
}

function toJsonObject(
  value?: Prisma.JsonValue | Record<string, unknown> | null,
): Prisma.JsonObject {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Prisma.JsonObject;
  }
  return {};
}

export async function persistSocialAccountTokens({
  userId,
  provider,
  accessToken,
  refreshToken,
  expiresIn,
  scope,
  meta,
  event,
}: PersistTokensInput) {
  let providerEnum = toSocialProviderEnum(provider);
  let access = accessToken;
  let expires = expiresIn;
  let refresh = refreshToken;
  if (provider === "facebook" || provider === "instagram") {
    try {
      const exchanged = await exchangeFacebookLongLivedToken(accessToken);
      access = exchanged.access_token;
      expires = exchanged.expires_in ?? expiresIn;
      refresh = undefined;
    } catch {}
  }
  const encryptedAccess = encrypt(access);
  const encryptedRefresh = refresh ? encrypt(refresh) : null;
  const tokenExpiresAt = expires
    ? new Date(Date.now() + (expires as number) * 1000)
    : null;

  let profile: any = null;
  try {
    profile = await fetchProviderProfile(provider, access);
  } catch {
    profile = (meta as any)?.profile || null;
  }
  const profilePayload = profile ? (profile as Prisma.InputJsonObject) : null;
  const metaPayload: Prisma.InputJsonObject = {
    ...(meta ?? {}),
    profile: profilePayload,
  };
  if (!providerEnum) {
    // Try to persist as SocialAccount when enum exists in Prisma client
    const forceEnum = provider === "bluesky"
      ? (SocialProvider as any).BLUESKY
      : provider === "mastodon"
        ? (SocialProvider as any).MASTODON
        : undefined;
    if (forceEnum) {
      try {
        const forcedAccount = await prisma.socialAccount.upsert({
          where: { userId_provider: { userId, provider: forceEnum } },
          update: {
            accessToken: encryptedAccess,
            refreshToken: encryptedRefresh,
            tokenExpiresAt,
            scope: scope ?? null,
            meta: metaPayload,
            isActive: true,
            lastConnectedAt: new Date(),
          },
          create: {
            userId,
            provider: forceEnum,
            providerUserId: String(profile?.id ?? userId),
            accessToken: encryptedAccess,
            refreshToken: encryptedRefresh,
            tokenExpiresAt,
            scope: scope ?? null,
            meta: metaPayload,
            lastConnectedAt: new Date(),
          },
          include: { user: false },
        });
        await logOAuthEvent(userId, forceEnum, event ?? "CONNECT", {
          scope: scope ?? null,
          expiresIn: expiresIn ?? null,
        });
        emitRealtime({ type: "schedule.updated", userId, payload: { provider, event: "account-connected" } });
        return forcedAccount as SocialAccount;
      } catch {}
    }

    // Fallback to SocialToken storage for providers without enum support
    await prisma.socialToken.upsert({
      where: { userId_platform: { userId, platform: provider } },
      update: {
        accessToken: encrypt(access),
        refreshToken: refresh ? encrypt(refresh) : undefined,
        expiresAt: tokenExpiresAt || undefined,
        updatedAt: new Date(),
      },
      create: {
        userId,
        platform: provider,
        accessToken: encrypt(access),
        refreshToken: refresh ? encrypt(refresh) : undefined,
        expiresAt: tokenExpiresAt || undefined,
      },
    });
    return {
      id: `${provider}-${userId}`,
      userId,
      provider: providerEnum as any,
      providerUserId: String(profile?.id ?? userId),
      accessToken: encryptedAccess,
      refreshToken: encryptedRefresh || undefined,
      tokenExpiresAt,
      scope: scope ?? null,
      meta: metaPayload as any,
      isActive: true,
      lastConnectedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      contentItems: [],
      posts: [],
      schedules: [],
    } as unknown as SocialAccount;
  }

  const account = await prisma.socialAccount.upsert({
    where: { userId_provider: { userId, provider: providerEnum } },
    update: {
      accessToken: encryptedAccess,
      refreshToken: encryptedRefresh,
      tokenExpiresAt,
      scope: scope ?? null,
      meta: metaPayload,
      isActive: true,
      lastConnectedAt: new Date(),
    },
    create: {
      userId,
      provider: providerEnum,
      providerUserId: String(profile?.id ?? userId),
      accessToken: encryptedAccess,
      refreshToken: encryptedRefresh,
      tokenExpiresAt,
      scope: scope ?? null,
      meta: metaPayload,
      lastConnectedAt: new Date(),
    },
    include: { user: false },
  });

  if (providerEnum) {
    await logOAuthEvent(userId, providerEnum, event ?? "CONNECT", {
      scope: scope ?? null,
      expiresIn: expiresIn ?? null,
    });
  }

  emitRealtime({
    type: "schedule.updated",
    userId,
    payload: { provider, event: "account-connected" },
  });

  return account;
}

export async function logOAuthEvent(
  userId: string,
  provider: SocialProvider,
  event: OAuthLogEvent,
  details?: Prisma.InputJsonObject,
) {
  await prisma.oAuthEvent.create({
    data: {
      userId,
      provider,
      event,
      details: details ?? {},
    },
  });
}

export async function deactivateSocialAccount(
  userId: string,
  provider: ProviderKey,
  reason?: string,
) {
  const providerEnum = toSocialProviderEnum(provider);
  if (!providerEnum) {
    await prisma.socialToken.delete({
      where: { userId_platform: { userId, platform: provider } },
    }).catch(() => null);
    return;
  }
  const account = await prisma.socialAccount.findUnique({
    where: { userId_provider: { userId, provider: providerEnum } },
  });
  if (!account) return;

  await prisma.$transaction([
    prisma.socialAccount.update({
      where: { id: account.id },
      data: {
        isActive: false,
        accessToken: null,
        refreshToken: null,
        tokenExpiresAt: null,
        updatedAt: new Date(),
      },
    }),
    prisma.schedule.updateMany({
      where: {
        socialAccountId: account.id,
        status: { in: [ScheduleStatus.PENDING, ScheduleStatus.QUEUED] },
      },
      data: { status: ScheduleStatus.PAUSED, lastError: reason ?? "Disconnected" },
    }),
    prisma.post.updateMany({
      where: { socialAccountId: account.id, status: "PROCESSING" },
      data: { status: "FAILED" },
    }),
  ]);

  await logOAuthEvent(userId, providerEnum, "DISCONNECT", {
    reason: reason ?? null,
  });

  emitRealtime({
    type: "schedule.failed",
    userId,
    payload: { provider, reason: reason ?? "Disconnected" },
  });
}

export async function ensureFreshToken(
  account: SocialAccount,
): Promise<SocialAccount & { decryptedAccess?: string }> {
  if (
    !account.tokenExpiresAt ||
    account.tokenExpiresAt.getTime() > Date.now() + 2 * 60 * 1000 ||
    !account.refreshToken
  ) {
    return {
      ...account,
      decryptedAccess: account.accessToken ? decrypt(account.accessToken) : undefined,
    };
  }

  try {
    const refreshed = await refreshAccessToken(
      account.provider.toLowerCase() as ProviderKey,
      decrypt(account.refreshToken),
    );
    const updated = await prisma.socialAccount.update({
      where: { id: account.id },
      data: {
        accessToken: encrypt(refreshed.access_token),
        refreshToken: refreshed.refresh_token
          ? encrypt(refreshed.refresh_token)
          : account.refreshToken,
        tokenExpiresAt: refreshed.expires_in
          ? new Date(Date.now() + refreshed.expires_in * 1000)
          : account.tokenExpiresAt,
        meta: {
          ...toJsonObject(account.meta),
          refreshedAt: new Date().toISOString(),
        } as Prisma.InputJsonObject,
      },
    });
    await logOAuthEvent(account.userId, account.provider, "REFRESH_SUCCESS", {});
    return { ...updated, decryptedAccess: decrypt(updated.accessToken!) };
  } catch (error) {
    await prisma.socialAccount.update({
      where: { id: account.id },
      data: { isActive: false },
    });
    await logOAuthEvent(
      account.userId,
      account.provider,
      "REFRESH_FAILURE",
      {
        error: (error as Error).message,
      } as Prisma.InputJsonObject,
    );
    throw error;
  }
}

export async function listSanitizedAccounts(
  userId: string,
): Promise<SanitizedAccount[]> {
  const accounts = await prisma.socialAccount.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  const mappedAccounts = accounts.map((account) => ({
    id: account.id,
    provider: account.provider.toLowerCase() as ProviderKey,
    label:
      (account.meta as Record<string, any>)?.profile?.name ||
      account.providerUserId,
    avatar: (account.meta as Record<string, any>)?.profile?.avatar,
    isActive: account.isActive,
    tokenExpiresAt: account.tokenExpiresAt?.toISOString() ?? null,
    lastConnectedAt: account.lastConnectedAt?.toISOString() ?? null,
    scope: account.scope,
    meta: account.meta as Record<string, any>,
  }));

  const tokens = await prisma.socialToken.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  const mappedTokens: SanitizedAccount[] = tokens.map((t: any) => ({
    id: `${t.platform}-${userId}`,
    provider: String(t.platform).toLowerCase() as ProviderKey,
    label: String(t.platform),
    avatar: undefined,
    isActive: true,
    tokenExpiresAt: t.expiresAt ? new Date(t.expiresAt).toISOString() : null,
    lastConnectedAt: t.updatedAt ? new Date(t.updatedAt).toISOString() : null,
    scope: null,
    meta: {},
  }));

  return [...mappedAccounts, ...mappedTokens];
}

