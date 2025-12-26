import { PrismaClient } from "@prisma/client";
import { encrypt, decrypt } from "./encrypt";

declare global {
  var prisma: PrismaClient | undefined;
}

export const db = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") global.prisma = db;

export async function saveToken(
  userId: string,
  platform: string,
  data: {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    pageId?: string;
  }
) {
  const encryptedAccess = encrypt(data.access_token);
  const encryptedRefresh = data.refresh_token ? encrypt(data.refresh_token) : null;

  return db.socialToken.upsert({
    where: { userId_platform: { userId, platform } },
    update: {
      accessToken: encryptedAccess,
      refreshToken: encryptedRefresh,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : null,
      pageId: data.pageId,
    },
    create: {
      userId,
      platform,
      accessToken: encryptedAccess,
      refreshToken: encryptedRefresh,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : null,
      pageId: data.pageId,
    },
  });
}

export async function getDecryptedToken(userId: string, platform: string) {
  const token = await db.socialToken.findUnique({
    where: { userId_platform: { userId, platform } },
  });
  if (!token) return null;

  return {
    accessToken: decrypt(token.accessToken),
    refreshToken: token.refreshToken ? decrypt(token.refreshToken) : null,
    expiresAt: token.expiresAt,
    pageId: token.pageId,
  };
}