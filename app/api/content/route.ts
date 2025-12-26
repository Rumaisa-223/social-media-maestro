import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ContentStatus, ContentType, Prisma } from "@prisma/client";
import { generateText, generateHashtags, generateImage, generateTemplates, generateVideo } from "@/lib/real-generators";
import { emitRealtime } from "@/lib/realtime";
import { requestSeaweedUploadIntent } from "@/lib/seaweed";
import { getServerAuthSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Number.parseInt(url.searchParams.get("limit") ?? "50", 10);

  const items = await prisma.contentItem.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 200),
  });

  return NextResponse.json({ items });
}

type ContentRequestBody = {
  prompt?: string;
  tone?: string;
  types?: string[];
  uploads?: { filename: string; mimeType: string }[];
};

export async function POST(request: NextRequest) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const body = (await request.json()) as ContentRequestBody;
  const { prompt, tone = "friendly", types = ["caption"], uploads = [] } = body;

  const shouldGenerate = Boolean(prompt?.trim() && types.length);
  if (!shouldGenerate && uploads.length === 0) {
    return NextResponse.json({ error: "Provide a prompt or upload at least one file." }, { status: 400 });
  }

  const assets: Record<string, Prisma.InputJsonValue> = {};

  if (shouldGenerate && prompt) {
    await Promise.all(
      types.map(async (type) => {
        switch (type) {
          case "caption":
            assets.caption = await generateText(prompt, tone);
            break;
          case "hashtags":
            assets.hashtags = await generateHashtags(prompt);
            break;
          case "image":
            assets.images = await generateImage(prompt, 4);
            break;
          case "video":
            assets.video = await generateVideo(prompt, 3);
            break;
          case "templates":
            assets.templates = (await generateTemplates(prompt)) as unknown as Prisma.InputJsonValue;
            break;
          default:
            break;
        }
      }),
    );
  }

  let uploadIntents: { fileId: string; uploadUrl: string; publicUrl: string }[] | undefined;
  if (uploads.length) {
    uploadIntents = await Promise.all(
      uploads.map((file) => requestSeaweedUploadIntent(file.filename, file.mimeType)),
    );
    assets.uploads = uploadIntents.map((intent, index) => ({
      fileId: intent.fileId,
      publicUrl: intent.publicUrl,
      filename: uploads[index]?.filename,
      mimeType: uploads[index]?.mimeType,
    }));
  }

  const previewUrl =
    (Array.isArray(assets.images) && assets.images[0]) ||
    (Array.isArray(assets.carousel) && assets.carousel[0]) ||
    (Array.isArray(assets.story) && assets.story[0]) ||
    (typeof assets.video === "string" ? assets.video : undefined) ||
    ((assets.uploads as { publicUrl: string }[] | undefined)?.[0]?.publicUrl);

  const contentItem = await prisma.contentItem.create({
    data: {
      userId: session.user.id,
      type: ContentType.MIXED,
      status: ContentStatus.GENERATED,
      metadata: assets,
      previewUrl,
      generatedBy: uploads.length ? "dashboard.upload" : "generate-content-unified",
    },
  });

  emitRealtime({
    type: "content.created",
    userId: session.user.id,
    payload: {
      id: contentItem.id,
      metadata: assets,
      createdAt: contentItem.createdAt,
      previewUrl,
    },
  });

  return NextResponse.json({
    contentItem,
    assets,
    uploadIntents,
  });
}


