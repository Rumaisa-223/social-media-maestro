import { Prisma, ContentStatus, ContentType, ScheduleStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { enqueueScheduleJob } from "@/lib/job-queue";
import { emitRealtime } from "@/lib/realtime";
import { getDecryptedToken } from "@/lib/db";
import { encrypt } from "@/lib/encrypt";
import { fetchProviderProfile, toSocialProviderEnum } from "@/lib/social/providers";

export type ContentAssetPayload = {
  caption?: string;
  hashtags?: string[];
  images?: string | string[];
  carousel?: string[];
  story?: string[];
  video?: string;
  inspiration?: Prisma.InputJsonObject;
  templates?: Prisma.InputJsonValue[];
};

interface CreateSchedulesInput {
  userId: string;
  socialAccountIds: string[];
  scheduledFor: Date;
  timezone: string;
  repeat?: string;
  contentItemId?: string;
  content?: ContentAssetPayload;
  generatedBy?: string;
  type?: ContentType;
}

export async function createSchedulesForAccounts({
  userId,
  socialAccountIds,
  scheduledFor,
  timezone,
  repeat,
  contentItemId,
  content,
  generatedBy,
  type = ContentType.MIXED,
}: CreateSchedulesInput) {
  if (!socialAccountIds.length) {
    throw new Error("At least one social account is required");
  }

  let contentItemIdToUse = contentItemId;

  if (!contentItemIdToUse) {
    if (!content) {
      throw new Error("content payload required when contentItemId is missing");
    }

    const metadata: Prisma.InputJsonObject = {
      caption: content.caption ?? null,
      hashtags: content.hashtags ?? null,
      images: content.images ?? null,
      carousel: content.carousel ?? null,
      story: content.story ?? null,
      video: content.video ?? null,
      inspiration: content.inspiration ?? null,
      templates: content.templates ?? null,
    };

    const previewUrl =
      Array.isArray(content.images) && content.images.length
        ? content.images[0]
        : typeof content.images === "string"
          ? content.images
          : Array.isArray(content.carousel) && content.carousel.length
            ? content.carousel[0]
            : undefined;

    const createdContent = await prisma.contentItem.create({
      data: {
        userId,
        type,
        status: ContentStatus.GENERATED,
        metadata,
        previewUrl,
        generatedBy: generatedBy ?? "schedule-form",
      },
    });
    contentItemIdToUse = createdContent.id;
  } else {
    const existing = await prisma.contentItem.findFirst({
      where: { id: contentItemIdToUse, userId },
    });
    if (!existing) {
      throw new Error("Content item not found");
    }
  }

  const accounts = await prisma.socialAccount.findMany({
    where: { id: { in: socialAccountIds }, userId, isActive: true },
  });

  if (!accounts.length) {
    const tokenBasedIds = socialAccountIds.filter((id) => /^(facebook|instagram|twitter|linkedin|bluesky|mastodon)-/.test(id));
    const selectedRaw = await prisma.socialAccount.findMany({ where: { id: { in: socialAccountIds }, userId } });
    const targetProviders = new Set<"facebook" | "instagram" | "twitter" | "linkedin" | "bluesky" | "mastodon">();
    for (const tokenId of tokenBasedIds) {
      targetProviders.add(tokenId.split("-")[0] as any);
    }
    for (const acc of selectedRaw) {
      targetProviders.add(acc.provider.toLowerCase() as any);
    }

    const newlyCreated: string[] = [];
    for (const platform of Array.from(targetProviders)) {
      const providerEnum = toSocialProviderEnum(platform);
      const token = await getDecryptedToken(userId, platform);
      if (!providerEnum || !token?.accessToken) continue;
      let profile: any = null;
      try { profile = await fetchProviderProfile(platform, token.accessToken); } catch {}
      const meta: Prisma.InputJsonObject = { profile: profile ? (profile as any) : {} };
      const created = await prisma.socialAccount.upsert({
        where: { userId_provider: { userId, provider: providerEnum } },
        update: {
          accessToken: encrypt(token.accessToken),
          tokenExpiresAt: token.expiresAt ?? null,
          scope: null,
          meta,
          isActive: true,
          lastConnectedAt: new Date(),
        },
        create: {
          userId,
          provider: providerEnum,
          providerUserId: String(profile?.id ?? userId),
          accessToken: encrypt(token.accessToken),
          refreshToken: token.refreshToken ? encrypt(token.refreshToken) : undefined,
          tokenExpiresAt: token.expiresAt ?? null,
          scope: null,
          meta,
          lastConnectedAt: new Date(),
        },
        include: { user: false },
      }).catch(() => null);
      if (created?.id) newlyCreated.push(created.id);
    }
    if (newlyCreated.length) {
      const refreshed = await prisma.socialAccount.findMany({
        where: { id: { in: newlyCreated }, userId, isActive: true },
      });
      accounts.push(...refreshed);
    }
    if (!accounts.length) {
      throw new Error("No active social accounts were found");
    }
  }

  const schedules = await prisma.$transaction(
    accounts.map((account) =>
      prisma.schedule.create({
        data: {
          userId,
          contentItemId: contentItemIdToUse!,
          socialAccountId: account.id,
          scheduledFor,
          timezone,
          status: ScheduleStatus.PENDING,
          lastError: null,
          attempts: 0,
        },
        include: {
          socialAccount: true,
          contentItem: true,
        },
      }),
    ),
  );

  await Promise.all(
    schedules.map((schedule) => enqueueScheduleJob(schedule.id, scheduledFor)),
  );

  schedules.forEach((schedule) => {
    emitRealtime({
      type: "schedule.created",
      userId,
      payload: {
        scheduleId: schedule.id,
        provider: schedule.socialAccount.provider,
        scheduledFor,
      },
    });
  });

  return schedules;
}

