import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth/session";
import { SocialProvider, Prisma } from "@prisma/client";
import { decrypt } from "@/lib/encrypt";
import path from "path";
import os from "os";
import { promises as fs } from "fs";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";

export const runtime = "nodejs";

ffmpeg.setFfmpegPath(String(ffmpegPath));

async function downloadToTemp(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download video (${res.status})`);
  const ab = await res.arrayBuffer();
  const buf = Buffer.from(ab);
  const tmpIn = path.join(os.tmpdir(), `in-${Date.now()}.bin`);
  await fs.writeFile(tmpIn, buf);
  const contentType = res.headers.get("content-type") || undefined;
  return { inputPath: tmpIn, contentType, size: buf.length };
}

function encodeMp4H264Aac(inputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const outPath = path.join(os.tmpdir(), `out-${Date.now()}.mp4`);
    ffmpeg(inputPath)
      .outputOptions(["-c:v libx264", "-preset medium", "-profile:v high", "-pix_fmt yuv420p", "-c:a aac", "-b:a 128k"])
      .format("mp4")
      .save(outPath)
      .on("end", () => resolve(outPath))
      .on("error", (err) => reject(err));
  });
}

async function uploadVideoThreePhase({ token, pageId, fileBuffer, title, description, scheduledPublishTimeSec }: { token: string; pageId: string; fileBuffer: Buffer; title?: string; description?: string; scheduledPublishTimeSec?: number; }) {
  const startForm = new FormData();
  startForm.append("access_token", token);
  startForm.append("upload_phase", "start");
  startForm.append("file_size", String(fileBuffer.length));
  const startRes = await fetch(`https://graph.facebook.com/v18.0/${pageId}/videos`, { method: "POST", body: startForm });
  const startJson = await startRes.json().catch(() => ({}));
  if (!startRes.ok) throw new Error(startJson?.error?.message || "Facebook video start failed");
  const sessionId = String(startJson.upload_session_id);
  let startOffset = Number(startJson.start_offset);
  let endOffset = Number(startJson.end_offset);
  while (startOffset < endOffset) {
    const chunk = fileBuffer.subarray(startOffset, endOffset);
    const blob = new Blob([Uint8Array.from(chunk)], { type: "video/mp4" });
    const transferForm = new FormData();
    transferForm.append("access_token", token);
    transferForm.append("upload_phase", "transfer");
    transferForm.append("upload_session_id", sessionId);
    transferForm.append("start_offset", String(startOffset));
    transferForm.append("video_file_chunk", blob, "chunk.mp4");
    const transferRes = await fetch(`https://graph.facebook.com/v18.0/${pageId}/videos`, { method: "POST", body: transferForm });
    const transferJson = await transferRes.json().catch(() => ({}));
    if (!transferRes.ok) throw new Error(transferJson?.error?.message || "Facebook video transfer failed");
    startOffset = Number(transferJson.start_offset);
    endOffset = Number(transferJson.end_offset);
  }
  const finishForm = new FormData();
  finishForm.append("access_token", token);
  finishForm.append("upload_phase", "finish");
  finishForm.append("upload_session_id", sessionId);
  if (title) finishForm.append("title", title);
  if (description) finishForm.append("description", description);
  if (scheduledPublishTimeSec && scheduledPublishTimeSec > Math.floor(Date.now() / 1000)) {
    finishForm.append("published", "false");
    finishForm.append("scheduled_publish_time", String(scheduledPublishTimeSec));
  }
  const finishRes = await fetch(`https://graph.facebook.com/v18.0/${pageId}/videos`, { method: "POST", body: finishForm });
  const finishJson = await finishRes.json().catch(() => ({}));
  if (!finishRes.ok) throw new Error(finishJson?.error?.message || "Facebook video finish failed");
  const videoId = String(startJson.video_id || finishJson.video_id || "");
  return { videoId, response: finishJson };
}

export async function POST(request: NextRequest) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const pexelsUrl = body?.pexelsUrl as string | undefined;
  const pageIdBody = body?.pageId as string | undefined;
  const title = body?.title as string | undefined;
  const description = body?.description as string | undefined;
  const scheduledPublishTimeSec = body?.scheduledPublishTimeSec as number | undefined;
  if (!pexelsUrl) return NextResponse.json({ error: "pexelsUrl is required" }, { status: 400 });
  const account = await prisma.socialAccount.findFirst({ where: { userId: session.user.id, provider: SocialProvider.FACEBOOK, isActive: true } });
  if (!account) return NextResponse.json({ error: "Facebook account not connected" }, { status: 400 });
  const meta = (account.meta as Record<string, any>) || {};
  const pageId = pageIdBody || meta.pageId;
  if (!pageId) return NextResponse.json({ error: "pageId is required" }, { status: 400 });
  let tokenToUse: string | undefined;
  if (meta.pageAccessTokenEncrypted) tokenToUse = decrypt(meta.pageAccessTokenEncrypted);
  if (!tokenToUse) {
    if (!account.accessToken) return NextResponse.json({ error: "Missing user token" }, { status: 400 });
    const userToken = decrypt(account.accessToken);
    const url = new URL("https://graph.facebook.com/v18.0/me/accounts");
    url.searchParams.set("fields", "id,name,access_token");
    url.searchParams.set("access_token", userToken);
    const res = await fetch(url.toString(), { method: "GET" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ error: json?.error?.message || "Failed to fetch pages" }, { status: 400 });
    const data = Array.isArray(json?.data) ? json.data : [];
    const page = data.find((p: any) => String(p.id) === String(pageId));
    if (!page?.access_token) return NextResponse.json({ error: "Missing page token" }, { status: 400 });
    tokenToUse = page.access_token as string;
  }
  try {
    const dl = await downloadToTemp(pexelsUrl);
    const outPath = await encodeMp4H264Aac(dl.inputPath);
    const fileBuffer = await fs.readFile(outPath);
    const upload = await uploadVideoThreePhase({ token: tokenToUse!, pageId: String(pageId), fileBuffer, title, description, scheduledPublishTimeSec });
    await fs.rm(dl.inputPath).catch(() => {});
    await fs.rm(outPath).catch(() => {});
    return NextResponse.json({ video_id: upload.videoId, response: upload.response });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}