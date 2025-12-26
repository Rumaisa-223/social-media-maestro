import "dotenv/config";
import { Worker, Job } from "bullmq";
import { Prisma, SocialProvider } from "@prisma/client";
import { Buffer } from "node:buffer";
import prisma from "../lib/prisma";
import { queueConnection, scheduleQueue } from "../lib/job-queue";
import { ensureFreshToken } from "../lib/services/social-accounts";
import { decrypt } from "../lib/encrypt";

const GRAPH_API_BASE = "https://graph.facebook.com/v18.0";
const TWITTER_MEDIA_UPLOAD_URL = "https://upload.twitter.com/1.1/media/upload.json";
const TWITTER_TWEETS_URL = "https://api.twitter.com/2/tweets";
const LINKEDIN_ASSET_URL = "https://api.linkedin.com/v2/assets?action=registerUpload";
const LINKEDIN_UGC_URL = "https://api.linkedin.com/v2/ugcPosts";
const BLUESKY_DEFAULT_PDS = "https://bsky.social";
function getMastodonBase(meta?: Record<string, unknown>): string {
  const fromMeta = typeof meta?.instance === "string" ? String(meta.instance) : "";
  return (fromMeta || process.env.MASTODON_INSTANCE_URL || "").replace(/\/$/, "");
}

const SCHEDULE_STATUS = {
  PAUSED: "PAUSED",
  POSTING: "POSTING",
  POSTED: "POSTED",
  FAILED: "FAILED",
} as const;

const POST_STATUS = {
  PROCESSING: "PROCESSING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
} as const;

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
type JsonRecord = Record<string, unknown>;

const INTERNAL_BASE_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXTAUTH_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
const INTERNAL_TOKEN = process.env.INTERNAL_API_TOKEN;

const BLUESKY_TEXT_MAX = 300;
function truncateGraphemes(input: string, max: number): string {
  const txt = (input || "").toString();
  try {
    const seg = new (Intl as any).Segmenter("und", { granularity: "grapheme" });
    const iter = (seg.segment(txt) as any)[Symbol.iterator]();
    let out = "";
    let count = 0;
    for (const s of iter) {
      if (count >= max) break;
      out += s.segment;
      count++;
    }
    return out;
  } catch {
    // Fallback: code point slicing
    return Array.from(txt).slice(0, max).join("");
  }
}
function countGraphemes(input: string): number {
  const txt = (input || "").toString();
  try {
    const seg = new (Intl as any).Segmenter("und", { granularity: "grapheme" });
    let count = 0;
    for (const _ of (seg.segment(txt) as any)) count++;
    return count;
  } catch {
    return Array.from(txt).length;
  }
}
function sanitizeBlueskyText(input: string): string {
  const base = String(input || " ").replace(/[\s\n\r]+/g, " ").trim();
  const baseCount = countGraphemes(base);
  if (baseCount <= BLUESKY_TEXT_MAX) return base;
  let out = truncateGraphemes(base, BLUESKY_TEXT_MAX);
  if (countGraphemes(out) < BLUESKY_TEXT_MAX) {
    const withEllipsis = `${out.replace(/\s+$/, "")}…`;
    if (countGraphemes(withEllipsis) <= BLUESKY_TEXT_MAX) return withEllipsis;
  }
  return out.trim();
}

interface ProviderPostResult {
  platformPostId?: string;
  response: any;
}

interface ContentMetadata {
  caption?: string;
  hashtags?: string[] | string;
  images?: string | string[];
  carousel?: string[];
  story?: string[];
  video?: string;
}

async function pushRealtime(event: { userId: string; type: string; payload?: Record<string, unknown> }) {
  if (!INTERNAL_BASE_URL) {
    return;
  }
  try {
    await fetch(`${INTERNAL_BASE_URL.replace(/\/$/, "")}/api/internal/realtime`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: INTERNAL_TOKEN ? `Bearer ${INTERNAL_TOKEN}` : "",
      },
      body: JSON.stringify(event),
    });
  } catch (error) {
    console.error("Failed to push realtime event", error);
  }
}

function parseMetadata(metadata: any): ContentMetadata {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }
  return metadata as ContentMetadata;
}

function normalizeStringArray(value?: string[] | string | null): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((entry) => typeof entry === "string" && entry.trim().length).map((entry) => entry.trim());
  }
  return value.trim().length ? [value.trim()] : [];
}

function collectImages(meta: ContentMetadata): string[] {
  const images: string[] = [];
  const append = (value?: string | string[]) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (typeof item === "string" && item.trim()) {
          images.push(item);
        }
      });
    } else if (typeof value === "string" && value.trim()) {
      images.push(value);
    }
  };
  append(meta.images);
  append(meta.carousel);
  append(meta.story);
  const uploads = (meta as any)?.uploads as { publicUrl?: string; mimeType?: string }[] | undefined;
  if (Array.isArray(uploads)) {
    uploads.forEach((u) => {
      const url = u?.publicUrl;
      const mt = (u?.mimeType || "").toLowerCase();
      if (url && mt.startsWith("image/")) {
        images.push(url);
      }
    });
  }
  return images;
}

function isVideoUrl(url?: string): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  return /\.(mp4|mov|webm|mkv|m4v)(\?.*)?$/.test(u);
}

function getVideo(meta: ContentMetadata): string | undefined {
  if (typeof meta.video === "string" && meta.video.trim()) {
    return meta.video.trim();
  }
  // Fallback: some flows store video in images/carousel/story fields
  const checkValue = (value?: string | string[]): string | undefined => {
    if (!value) return undefined;
    if (Array.isArray(value)) {
      const found = value.find((v) => typeof v === "string" && isVideoUrl(v));
      return found;
    }
    return isVideoUrl(value) ? value : undefined;
  };
  return (
    checkValue(meta.images) ||
    checkValue(meta.carousel) ||
    checkValue(meta.story) ||
    (() => {
      const uploads = (meta as any)?.uploads as { publicUrl?: string; mimeType?: string }[] | undefined;
      if (Array.isArray(uploads)) {
        const found = uploads.find((u) => (u?.mimeType || "").toLowerCase().startsWith("video/") && typeof u?.publicUrl === "string");
        return found?.publicUrl;
      }
      return undefined;
    })() ||
    undefined
  );
}

function buildCaption(meta: ContentMetadata): string {
  const parts: string[] = [];
  if (meta.caption?.trim()) {
    parts.push(meta.caption.trim());
  }
  const hashtags = normalizeStringArray(meta.hashtags).map((tag) =>
    tag.startsWith("#") ? tag : `#${tag.replace(/^#/, "")}`,
  );
  if (hashtags.length) {
    parts.push(hashtags.join(" "));
  }
  return parts.join("\n\n").trim() || "Scheduled post";
}

function extractUrls(text?: string): string[] {
  if (!text) return [];
  const regex = /(https?:\/\/[^\s)"']+)/gi;
  const matches = text.match(regex) || [];
  return matches.map((m) => m.trim());
}

async function facebookRequest(path: string, params: Record<string, string | undefined>, token: string) {
  const body = new URLSearchParams();
  body.set("access_token", token);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      body.set(key, value);
    }
  });

  const res = await fetch(`${GRAPH_API_BASE}${path}`, {
    method: "POST",
    body,
  });

  let json: any;
  try {
    json = await res.json();
  } catch (e) {
    throw new Error("Facebook API returned an unexpected response");
  }
  if (!res.ok) {
    const msg = json?.error?.message || "Facebook API error";
    throw new Error(`${msg} (status ${res.status})`);
  }
  return json;
}

async function instagramRequest(path: string, params: Record<string, string | undefined>, token: string) {
  const body = new URLSearchParams();
  body.set("access_token", token);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      body.set(key, value);
    }
  });

  const res = await fetch(`${GRAPH_API_BASE}${path}`, { method: "POST", body });
  let json: any;
  try { json = await res.json(); } catch { json = {}; }
  if (!res.ok) {
    const msg = json?.error?.message || "Instagram API error";
    throw new Error(`${msg} (status ${res.status})`);
  }
  return json;
}

async function getFacebookPages(userToken: string): Promise<{ id: string; name: string; access_token?: string }[]> {
  const url = new URL(`${GRAPH_API_BASE}/me/accounts`);
  url.searchParams.set("fields", "id,name,access_token");
  url.searchParams.set("access_token", userToken);

  const res = await fetch(url.toString(), { method: "GET" });
  let json: any;
  try {
    json = await res.json();
  } catch (e) {
    throw new Error("Failed to list Facebook pages");
  }
  if (!res.ok) {
    throw new Error(json?.error?.message || "Facebook pages listing failed");
  }
  const data = Array.isArray(json?.data) ? json.data : [];
  return data.map((p: any) => ({ id: String(p.id), name: String(p.name), access_token: p.access_token }));
}

async function postToFacebook({
  token,
  pageId,
  caption,
  imageUrl,
  videoUrl,
  scheduledPublishTimeSec,
}: {
  token: string;
  pageId: string;
  caption: string;
  imageUrl?: string;
  videoUrl?: string;
  scheduledPublishTimeSec?: number;
}): Promise<ProviderPostResult> {
  if (!pageId) {
    throw new Error("Missing Facebook page identifier");
  }

  if (videoUrl) {
    const { buffer, contentType } = await downloadMediaBuffer(videoUrl);
    const startForm = new FormData();
    startForm.append("access_token", token);
    startForm.append("upload_phase", "start");
    startForm.append("file_size", String(buffer.length));
    let startRes = await fetch(`${GRAPH_API_BASE}/${pageId}/videos`, { method: "POST", body: startForm });
    let startJson = await startRes.json();
    if (!startRes.ok) throw new Error(startJson?.error?.message || "Facebook video start failed");
    const sessionId = String(startJson.upload_session_id);
    let startOffset = Number(startJson.start_offset);
    let endOffset = Number(startJson.end_offset);
    const mime = contentType || "video/mp4";
    while (startOffset < endOffset) {
      const chunk = buffer.subarray(startOffset, endOffset);
      const blob = new Blob([Uint8Array.from(chunk)], { type: mime });
      const transferForm = new FormData();
      transferForm.append("access_token", token);
      transferForm.append("upload_phase", "transfer");
      transferForm.append("upload_session_id", sessionId);
      transferForm.append("start_offset", String(startOffset));
      transferForm.append("video_file_chunk", blob, "chunk.mp4");
      const transferRes = await fetch(`${GRAPH_API_BASE}/${pageId}/videos`, { method: "POST", body: transferForm });
      const transferJson = await transferRes.json();
      if (!transferRes.ok) throw new Error(transferJson?.error?.message || "Facebook video transfer failed");
      startOffset = Number(transferJson.start_offset);
      endOffset = Number(transferJson.end_offset);
    }
    const finishForm = new FormData();
    finishForm.append("access_token", token);
    finishForm.append("upload_phase", "finish");
    finishForm.append("upload_session_id", sessionId);
    finishForm.append("title", caption.substring(0, 80));
    finishForm.append("description", caption);
    if (scheduledPublishTimeSec && scheduledPublishTimeSec > Math.floor(Date.now() / 1000)) {
      finishForm.append("published", "false");
      finishForm.append("scheduled_publish_time", String(scheduledPublishTimeSec));
    }
    const finishRes = await fetch(`${GRAPH_API_BASE}/${pageId}/videos`, { method: "POST", body: finishForm });
    const finishJson = await finishRes.json();
    if (!finishRes.ok) throw new Error(finishJson?.error?.message || "Facebook video finish failed");
    return { platformPostId: String(startJson.video_id || finishJson.video_id), response: finishJson };
  }

  if (imageUrl) {
    const response = await facebookRequest(`/${pageId}/photos`, { url: imageUrl, caption }, token);
    return { platformPostId: response.id, response };
  }

  const response = await facebookRequest(`/${pageId}/feed`, { message: caption }, token);
  return { platformPostId: response.id, response };
}

async function getInstagramBusinessId(userToken: string): Promise<string | undefined> {
  const url = new URL(`${GRAPH_API_BASE}/me/accounts`);
  url.searchParams.set("fields", "instagram_business_account,name");
  url.searchParams.set("access_token", userToken);
  const res = await fetch(url.toString(), { method: "GET" });
  let json: any;
  try { json = await res.json(); } catch { json = {}; }
  if (!res.ok) return undefined;
  const data = Array.isArray(json?.data) ? json.data : [];
  const first = data.find((p: any) => p?.instagram_business_account?.id);
  return first?.instagram_business_account?.id ? String(first.instagram_business_account.id) : undefined;
}

async function postToInstagram({
  token,
  igUserId,
  caption,
  imageUrl,
  videoUrl,
}: {
  token: string;
  igUserId: string;
  caption: string;
  imageUrl?: string;
  videoUrl?: string;
}): Promise<ProviderPostResult> {
  if (!igUserId) {
    throw new Error("Missing Instagram Business Account ID");
  }

  if (videoUrl) {
    const create = await instagramRequest(`/${igUserId}/media`, { video_url: videoUrl, caption }, token);
    const creationId = String(create.id);
    const checkUrl = new URL(`${GRAPH_API_BASE}/${creationId}`);
    checkUrl.searchParams.set("fields", "status_code");
    checkUrl.searchParams.set("access_token", token);
    let status = "IN_PROGRESS";
    const started = Date.now();
    while (status === "IN_PROGRESS" || status === "PROCESSING") {
      const res = await fetch(checkUrl.toString(), { method: "GET" });
      const json = await res.json().catch(() => ({}));
      status = String(json?.status_code || "FINISHED");
      if (status === "FINISHED") break;
      if (Date.now() - started > 120000) {
        throw new Error("Instagram video upload timed out");
      }
      await new Promise((r) => setTimeout(r, 3000));
    }
    const publish = await instagramRequest(`/${igUserId}/media_publish`, { creation_id: creationId }, token);
    return { platformPostId: String(publish.id || creationId), response: publish };
  }

  if (imageUrl) {
    const create = await instagramRequest(`/${igUserId}/media`, { image_url: imageUrl, caption }, token);
    const creationId = String(create.id);
    const publish = await instagramRequest(`/${igUserId}/media_publish`, { creation_id: creationId }, token);
    return { platformPostId: String(publish.id || creationId), response: publish };
  }

  throw new Error("Instagram requires image_url or video_url");
}

async function downloadMediaBuffer(url: string): Promise<{ buffer: Buffer; contentType?: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download media from ${url}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = response.headers.get("content-type") ?? undefined;
  return { buffer, contentType };
}

async function uploadTwitterMedia(token: string, mediaUrl: string, mediaCategory: "tweet_image" | "tweet_video") {
  const { buffer, contentType } = await downloadMediaBuffer(mediaUrl);
  const form = new FormData();
  const uint8 = Uint8Array.from(buffer);
  const blob = new Blob([uint8], { type: contentType || "application/octet-stream" });
  form.append("media", blob, "upload");
  form.append("media_category", mediaCategory);

  let response = await fetch(TWITTER_MEDIA_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });
  let text = await response.text().catch(() => "");
  let json: any;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = {};
  }
  if (!response.ok) {
    const code = Array.isArray(json?.errors) ? json.errors[0]?.code : undefined;
    const msg = Array.isArray(json?.errors) ? json.errors[0]?.message : undefined;
    if (code === 215) {
      throw new Error("Bad Authentication data (code 215). Ensure OAuth user token with tweet.write scope.");
    }
    
    const params = new URLSearchParams();
    params.append("media_data", buffer.toString("base64"));
    params.append("media_category", mediaCategory);
    response = await fetch(TWITTER_MEDIA_UPLOAD_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    const text2 = await response.text().catch(() => "");
    try {
      json = text2 ? JSON.parse(text2) : {};
    } catch {
      json = {};
    }
    if (!response.ok) {
      const code2 = Array.isArray(json?.errors) ? json.errors[0]?.code : undefined;
      const msg2 = Array.isArray(json?.errors) ? json.errors[0]?.message : undefined;
      if (code2 === 215) {
        throw new Error("Bad Authentication data (code 215). Reconnect X with correct scopes or OAuth 1.0a.");
      }
      throw new Error(msg2 || "Twitter media upload failed");
    }
  }
  return json.media_id_string as string;
}

async function postToTwitter({
  token,
  text,
  imageUrl,
  videoUrl,
}: {
  token: string;
  text: string;
  imageUrl?: string;
  videoUrl?: string;
}): Promise<ProviderPostResult> {
  const payload: Record<string, unknown> = { text: text || " " };

  const mediaUrl = videoUrl ?? imageUrl;
  if (mediaUrl) {
    const mediaCategory = videoUrl ? "tweet_video" : "tweet_image";
    const mediaId = await uploadTwitterMedia(token, mediaUrl, mediaCategory);
    payload.media = { media_ids: [mediaId] };
  }

  const response = await fetch(TWITTER_TWEETS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  let responseText: string | undefined;
  let json: any;
  try {
    responseText = await response.text();
    json = responseText ? JSON.parse(responseText) : {};
  } catch {
    json = undefined;
  }
  if (!response.ok) {
    const code = Array.isArray(json?.errors) ? json.errors[0]?.code : undefined;
    const msg = Array.isArray(json?.errors) ? json.errors[0]?.message : undefined;
    if (code === 215) {
      throw new Error("Bad Authentication data (code 215). Ensure OAuth user token with tweet.write scope.");
    }
    if (response.status === 403) {
      const title = typeof json?.title === "string" ? json.title : undefined;
      const detail = typeof json?.detail === "string" ? json.detail : undefined;
      const forbidden = (title || "").toLowerCase() === "forbidden" || (detail || "").toLowerCase().includes("not permitted");
      if (forbidden) {
        throw new Error(
          "Forbidden by X API. Ensure the developer app has User authentication set to Read and write, the connection granted tweet.write, and the project has required access. Reconnect the account after updating."
        );
      }
    }
    const snippet = (responseText || "").slice(0, 200);
    throw new Error(msg || `Twitter posting failed (status ${response.status}). Body: ${snippet}`);
  }
  return { platformPostId: json?.data?.id, response: json ?? { raw: responseText } };
}

async function registerLinkedInUpload(token: string, ownerUrn: string, isVideo: boolean) {
  const payload = {
    registerUploadRequest: {
      recipes: [isVideo ? "urn:li:digitalmediaRecipe:feedshare-video" : "urn:li:digitalmediaRecipe:feedshare-image"],
      owner: ownerUrn,
      serviceRelationships: [
        {
          relationshipType: "OWNER",
          identifier: "urn:li:userGeneratedContent",
        },
      ],
    },
  };

  const response = await fetch(LINKEDIN_ASSET_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(payload),
  });

  let txt = await response.text().catch(() => "");
  let json: any;
  try {
    json = txt ? JSON.parse(txt) : {};
  } catch {
    json = {};
  }
  if (!response.ok) {
    const msg = (json && typeof json.message === "string" ? json.message : undefined) || txt || "LinkedIn registerUpload failed";
    throw new Error(msg);
  }

  const uploadMechanism = json?.value?.uploadMechanism?.["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"];
  if (!uploadMechanism?.uploadUrl || !json?.value?.asset) {
    throw new Error("LinkedIn registerUpload response missing upload URL");
  }

  return {
    uploadUrl: uploadMechanism.uploadUrl as string,
    asset: json.value.asset as string,
  };
}

function isValidDidOrHandle(value?: string): boolean {
  if (!value) return false;
  if (/^did:/.test(value)) return true;
  // simple handle/domain check: must contain a dot and allowed chars
  return /^[a-z0-9.-]+\.[a-z0-9.-]+$/i.test(value);
}

async function resolveBlueskyRepo({ token, pdsBase }: { token: string; pdsBase: string }): Promise<string | undefined> {
  const useDpop = String(process.env.BLUESKY_USE_DPOP || "").toLowerCase() === "true";
  try {
    const res = await fetch(`${pdsBase}/xrpc/com.atproto.server.getSession`, {
      method: "GET",
      headers: {
        Authorization: `${useDpop ? "DPoP" : "Bearer"} ${token}`,
        Accept: "application/json",
      },
    });
    const txt = await res.text().catch(() => "");
    const json = txt ? JSON.parse(txt) : {};
    const did = json?.did as string | undefined;
    const handle = json?.handle as string | undefined;
    return did || handle || undefined;
  } catch {
    return undefined;
  }
}

async function postToBluesky({
  token,
  repoDid,
  text,
  pdsUrl,
  imageUrl,
}: {
  token: string;
  repoDid: string;
  text: string;
  pdsUrl?: string;
  imageUrl?: string;
}): Promise<ProviderPostResult> {
  const pdsBase = (pdsUrl || BLUESKY_DEFAULT_PDS).replace(/\/$/, "");
  let embed: any | undefined;
  if (imageUrl) {
    const useDpopUpload = String(process.env.BLUESKY_USE_DPOP || "").toLowerCase() === "true";
    const { buffer, contentType } = await downloadMediaBuffer(imageUrl);
    const fileBlob = new Blob([Uint8Array.from(buffer)], { type: contentType || "application/octet-stream" });
    const uploadRes = await fetch(`${pdsBase}/xrpc/com.atproto.repo.uploadBlob`, {
      method: "POST",
      headers: {
        Authorization: `${useDpopUpload ? "DPoP" : "Bearer"} ${token}`,
        "Content-Type": contentType || "application/octet-stream",
        Accept: "application/json",
      },
      body: fileBlob,
    });
    const uploadTxt = await uploadRes.text().catch(() => "");
    let uploadJson: any;
    try { uploadJson = uploadTxt ? JSON.parse(uploadTxt) : {}; } catch { uploadJson = {}; }
    if (!uploadRes.ok) {
      const msg = typeof uploadJson?.message === "string" ? uploadJson.message : uploadTxt || "Bluesky uploadBlob failed";
      throw new Error(msg);
    }
    const uploadedBlob = uploadJson?.blob;
    if (uploadedBlob) {
      embed = {
        $type: "app.bsky.embed.images",
        images: [
          {
            image: uploadedBlob,
            alt: "",
          },
        ],
      };
    }
  }
  let repo = repoDid;
  if (!isValidDidOrHandle(repo)) {
    const resolved = await resolveBlueskyRepo({ token, pdsBase });
    repo = resolved || repoDid;
  }
  if (!isValidDidOrHandle(repo)) {
    throw new Error("Bluesky repo DID/handle missing or invalid");
  }
  const payload = {
    repo,
    collection: "app.bsky.feed.post",
    record: {
      $type: "app.bsky.feed.post",
      text: sanitizeBlueskyText(text),
      createdAt: new Date().toISOString(),
      ...(embed ? { embed } : {}),
    },
  };
  const useDpop = String(process.env.BLUESKY_USE_DPOP || "").toLowerCase() === "true";
  const response = await fetch(`${pdsBase}/xrpc/com.atproto.repo.createRecord`, {
    method: "POST",
    headers: {
      Authorization: `${useDpop ? "DPoP" : "Bearer"} ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  const textBody = await response.text().catch(() => "");
  let json: any;
  try {
    json = textBody ? JSON.parse(textBody) : {};
  } catch {
    json = {};
  }
  if (!response.ok) {
    const msg = typeof json?.message === "string" ? json.message : textBody || "Bluesky post failed";
    throw new Error(msg);
  }
  return { platformPostId: String(json?.uri || json?.cid || ""), response: json };
}

async function uploadMastodonMedia(token: string, mediaUrl: string, base: string): Promise<string> {
  if (!base) {
    throw new Error("Missing Mastodon base URL");
  }
  const { buffer, contentType } = await downloadMediaBuffer(mediaUrl);
  const form = new FormData();
  const blob = new Blob([Uint8Array.from(buffer)], { type: contentType || "application/octet-stream" });
  form.append("file", blob, "upload");
  const response = await fetch(`${base}/api/v2/media`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const txt = await response.text().catch(() => "");
  let json: any;
  try {
    json = txt ? JSON.parse(txt) : {};
  } catch {
    json = {};
  }
  if (!response.ok) {
    const msg = typeof json?.error === "string" ? json.error : txt || "Mastodon media upload failed";
    throw new Error(msg);
  }
  return String(json?.id || json?.media?.id || "");
}

async function postToMastodon({
  token,
  text,
  imageUrl,
  base,
}: {
  token: string;
  text: string;
  imageUrl?: string;
  base: string;
}): Promise<ProviderPostResult> {
  if (!base) {
    throw new Error("Missing Mastodon base URL");
  }
  const mediaIds: string[] = [];
  if (imageUrl) {
    const id = await uploadMastodonMedia(token, imageUrl, base);
    if (id) mediaIds.push(id);
  }
  const body: Record<string, any> = { status: text || " " };
  if (mediaIds.length) body.media_ids = mediaIds;
  const response = await fetch(`${base}/api/v1/statuses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  const txt = await response.text().catch(() => "");
  let json: any;
  try {
    json = txt ? JSON.parse(txt) : {};
  } catch {
    json = {};
  }
  if (!response.ok) {
    const msg = typeof json?.error === "string" ? json.error : txt || "Mastodon post failed";
    throw new Error(msg);
  }
  return { platformPostId: String(json?.id || ""), response: json };
}

async function uploadLinkedInMedia(uploadUrl: string, buffer: Buffer, contentType?: string) {
  const binary = Uint8Array.from(buffer);
  const blob = new Blob([binary.buffer], { type: contentType || "application/octet-stream" });
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": blob.type || "application/octet-stream",
      "Content-Length": binary.byteLength.toString(),
    },
    body: blob,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "LinkedIn media upload failed");
  }
}

async function createLinkedInPost(token: string, params: { ownerUrn: string; text: string; asset?: string; isVideo?: boolean }) {
  const shareMediaCategory = params.asset ? (params.isVideo ? "VIDEO" : "IMAGE") : "NONE";
  const specificContent: JsonRecord = {
    "com.linkedin.ugc.ShareContent": {
      shareCommentary: { text: params.text || "Scheduled post" },
      shareMediaCategory,
    },
  };

  if (params.asset) {
    (specificContent["com.linkedin.ugc.ShareContent"] as any).media = [
      {
        status: "READY",
        description: { text: params.text },
        media: params.asset,
        title: { text: "Scheduled post" },
      },
    ];
  }

  const payload = {
    author: params.ownerUrn,
    lifecycleState: "PUBLISHED",
    specificContent,
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  };

  const response = await fetch(LINKEDIN_UGC_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(payload),
  });

  let txt2 = await response.text().catch(() => "");
  let json: any;
  try {
    json = txt2 ? JSON.parse(txt2) : {};
  } catch {
    json = {};
  }
  if (!response.ok) {
    const msg = (json && typeof json.message === "string" ? json.message : undefined) || txt2 || "LinkedIn post failed";
    throw new Error(msg);
  }
  return json;
}

async function postToLinkedIn({
  token,
  ownerUrn,
  text,
  imageUrl,
  videoUrl,
}: {
  token: string;
  ownerUrn: string;
  text: string;
  imageUrl?: string;
  videoUrl?: string;
}): Promise<ProviderPostResult> {
  if (!ownerUrn) {
    throw new Error("Missing LinkedIn owner URN");
  }
  const mediaUrl = videoUrl ?? imageUrl;
  const isVideo = Boolean(videoUrl);

  if (!mediaUrl) {
    const response = await createLinkedInPost(token, { ownerUrn, text, isVideo: false });
    return { platformPostId: response?.id, response };
  }

  const registration = await registerLinkedInUpload(token, ownerUrn, isVideo);
  const { buffer, contentType } = await downloadMediaBuffer(mediaUrl);
  await uploadLinkedInMedia(registration.uploadUrl, buffer, contentType);
  const response = await createLinkedInPost(token, {
    ownerUrn,
    text,
    asset: registration.asset,
    isVideo,
  });
  return { platformPostId: response?.id ?? registration.asset, response };
}

/**
 * Main worker function that processes scheduled posts.
 * This function:
 * 1. Picks up the scheduled job from the BullMQ queue
 * 2. Fetches the schedule record from the database
 * 3. Parses the social account's access token for the correct platform
 * 4. Extracts the caption and media from the saved content
 * 5. Publishes the post using the platform-specific API (Facebook, LinkedIn, Twitter)
 */
async function publishToProvider(job: Job) {
  const scheduleId = job.data.scheduleId as string;
  console.log(`[Worker] Processing schedule job: ${scheduleId}`);

  // Step 1: Fetch the schedule record from the database
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: {
      socialAccount: true,
      contentItem: true,
    },
  });

  if (!schedule) {
    console.warn(`[Worker] Schedule not found: ${scheduleId}`);
    return;
  }

  console.log(`[Worker] Schedule found for ${schedule.socialAccount.provider} account ${schedule.socialAccount.id}`);

  if (!schedule.socialAccount.isActive) {
    console.warn(`[Worker] Account ${schedule.socialAccount.id} is inactive, pausing schedule`);
    await prisma.schedule.update({
      where: { id: schedule.id },
      data: { status: SCHEDULE_STATUS.PAUSED, lastError: "Account inactive" },
    });
    return;
  }

  // Step 2: Parse the social account's access token for the correct platform
  console.log(`[Worker] Ensuring fresh access token for ${schedule.socialAccount.provider}...`);
  const freshAccount = await ensureFreshToken(schedule.socialAccount);
  const decryptedAccess = freshAccount.decryptedAccess;
  if (!decryptedAccess) {
    throw new Error("Missing access token");
  }
  console.log(`[Worker] Access token obtained for ${schedule.socialAccount.provider}`);

  // Update schedule status to POSTING
  await prisma.schedule.update({
    where: { id: schedule.id },
    data: { status: SCHEDULE_STATUS.POSTING, attempts: { increment: 1 }, lastError: null },
  });

  const mediaPayload =
    (schedule.contentItem.metadata ?? Prisma.JsonNull) as unknown as Prisma.InputJsonValue;

  await prisma.post.upsert({
    where: { scheduleId: schedule.id },
    update: {
      status: POST_STATUS.PROCESSING,
      platformPostId: null,
      responseMeta: Prisma.JsonNull,
      mediaUrls: mediaPayload,
    },
    create: {
      scheduleId: schedule.id,
      userId: schedule.userId,
      socialAccountId: schedule.socialAccountId,
      status: POST_STATUS.PROCESSING,
      mediaUrls: mediaPayload,
    },
  });

  // Step 3: Extract the caption and media from the saved content
  console.log(`[Worker] Extracting content from contentItem ${schedule.contentItem.id}...`);
  const metadata = parseMetadata(schedule.contentItem.metadata);
  const caption = buildCaption(metadata);
  const images = collectImages(metadata);
  const primaryImage = images[0];
  const videoUrl = getVideo(metadata);
  let effectiveImageUrl = primaryImage;
  let effectiveVideoUrl = videoUrl;

  if (!effectiveImageUrl && !effectiveVideoUrl) {
    const preview = String(schedule.contentItem.previewUrl || "").trim();
    if (preview) {
      if (isVideoUrl(preview)) {
        effectiveVideoUrl = preview;
      } else {
        effectiveImageUrl = preview;
      }
    }
  }

  if (!effectiveVideoUrl && !effectiveImageUrl) {
    const urls = extractUrls(caption);
    const v = urls.find((u) => isVideoUrl(u));
    const img = urls.find((u) => /\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i.test(u));
    if (v) effectiveVideoUrl = v;
    if (!effectiveVideoUrl && img) effectiveImageUrl = img;
  }

  console.log(`[Worker] Content extracted - Caption: ${caption.substring(0, 50)}..., Images: ${images.length}, Video: ${videoUrl ? "Yes" : "No"}`);

  // Step 4: Publish the post using the platform-specific API
  try {
    console.log(`[Worker] Publishing to ${schedule.socialAccount.provider}...`);
    let result: ProviderPostResult | undefined;
    const socialMeta = (schedule.socialAccount.meta ?? {}) as JsonRecord;
    const providerKey = String(schedule.socialAccount.provider).toLowerCase();
    switch (providerKey) {
      case "facebook": {
        const preferredPageId = (socialMeta?.pageId as string | undefined) || undefined;
        const storedPageTokenEncrypted = socialMeta?.pageAccessTokenEncrypted as string | undefined;
        if (preferredPageId && storedPageTokenEncrypted) {
          const pageToken = decrypt(storedPageTokenEncrypted);
          result = await postToFacebook({
            token: pageToken,
            pageId: String(preferredPageId),
            caption,
            imageUrl: primaryImage,
            videoUrl,
            scheduledPublishTimeSec: Math.floor(schedule.scheduledFor.getTime() / 1000),
          });
        } else {
          const pages = await getFacebookPages(decryptedAccess);
          const page =
            (preferredPageId ? pages.find((p) => p.id === preferredPageId) : undefined) || pages[0];
          if (!page?.id) {
            throw new Error(
              "No Facebook pages available for this account. Ensure pages_show_list and admin rights are granted."
            );
          }
          const pageToken = page.access_token;
          if (!pageToken) {
            throw new Error(
              "Missing page access token. Grant pages_manage_posts and pages_read_engagement permissions."
            );
          }
          result = await postToFacebook({
            token: pageToken,
            pageId: String(page.id),
            caption,
            imageUrl: primaryImage,
            videoUrl,
            scheduledPublishTimeSec: Math.floor(schedule.scheduledFor.getTime() / 1000),
          });
        }
        break;
      }
      case "instagram": {
        const profile = socialMeta?.profile as JsonRecord | undefined;
        const igUserId = String(
          (profile?.id as string | undefined) ||
          (schedule.socialAccount.providerUserId as string | undefined) ||
          (await getInstagramBusinessId(decryptedAccess)) ||
          ""
        );
        if (!igUserId) {
          throw new Error("Instagram Business Account is not linked. Connect IG to a Facebook Page and grant instagram_basic & instagram_content_publish.");
        }
        result = await postToInstagram({ token: decryptedAccess, igUserId, caption, imageUrl: effectiveImageUrl, videoUrl: effectiveVideoUrl });
        break;
      }
      case "twitter": {
        const scopeStr = String(schedule.socialAccount.scope || "");
        if (!scopeStr.includes("tweet.write")) {
          throw new Error(
            "Twitter account lacks tweet.write permission. Update app to Read and write and reconnect the account."
          );
        }
        result = await postToTwitter({
          token: decryptedAccess,
          text: caption,
          imageUrl: primaryImage,
          videoUrl,
        });
        break;
      }
      case "linkedin": {
        const profile = socialMeta?.profile as JsonRecord | undefined;
        const ownerUrn =
          (profile?.urn as string | undefined) ||
          (profile?.id ? `urn:li:person:${profile.id}` : `urn:li:person:${schedule.socialAccount.providerUserId}`);
        result = await postToLinkedIn({
          token: decryptedAccess,
          ownerUrn,
          text: caption,
          imageUrl: primaryImage,
          videoUrl,
        });
        break;
      }
      case "bluesky": {
        const profile = socialMeta?.profile as JsonRecord | undefined;
        const repoDid = (profile?.did as string) || (profile?.id as string) || String(schedule.socialAccount.providerUserId);
        const pdsUrl = (socialMeta?.service as string) || BLUESKY_DEFAULT_PDS;
        result = await postToBluesky({ token: decryptedAccess, repoDid, text: caption, imageUrl: primaryImage, pdsUrl });
        break;
      }
      case "mastodon": {
        const base = getMastodonBase(socialMeta);
        console.log(`[Worker] Mastodon base resolved: ${base || "<empty>"}`);
        result = await postToMastodon({ token: decryptedAccess, text: caption, imageUrl: primaryImage, base });
        break;
      }
      default:
        throw new Error(`Unsupported provider ${schedule.socialAccount.provider}`);
    }

    console.log(`[Worker] Post published successfully to ${schedule.socialAccount.provider}, platformPostId: ${result?.platformPostId || "N/A"}`);

    const post = await prisma.$transaction(async (tx: TransactionClient) => {
      const created = await tx.post.upsert({
        where: { scheduleId: schedule.id },
        update: {
          status: POST_STATUS.SUCCESS,
          platformPostId: result?.platformPostId ?? null,
          responseMeta: result?.response ?? Prisma.JsonNull,
          mediaUrls: mediaPayload,
        },
        create: {
          scheduleId: schedule.id,
          userId: schedule.userId,
          socialAccountId: schedule.socialAccountId,
          platformPostId: result?.platformPostId ?? null,
          mediaUrls: mediaPayload,
          status: POST_STATUS.SUCCESS,
          responseMeta: result?.response ?? Prisma.JsonNull,
        },
      });

      await tx.schedule.update({
        where: { id: schedule.id },
        data: { status: SCHEDULE_STATUS.POSTED, lastError: null },
      });
      return created;
    }, { timeout: 10000 });

    await pushRealtime({
      type: "post.created",
      userId: schedule.userId,
      payload: { 
        postId: post.id, 
        scheduleId: schedule.id,
        platformPostId: result?.platformPostId,
        provider: schedule.socialAccount.provider,
        status: "SUCCESS",
        message: `Post successfully published to ${schedule.socialAccount.provider}`,
      },
    });
  } catch (error) {
    await prisma.$transaction(async (tx: TransactionClient) => {
      await tx.post.upsert({
        where: { scheduleId: schedule.id },
        update: {
          status: POST_STATUS.FAILED,
          platformPostId: null,
          responseMeta: {
            error: (error as Error).message,
          },
          mediaUrls: mediaPayload,
        },
        create: {
          scheduleId: schedule.id,
          userId: schedule.userId,
          socialAccountId: schedule.socialAccountId,
          status: POST_STATUS.FAILED,
          platformPostId: null,
          responseMeta: {
            error: (error as Error).message,
          },
          mediaUrls: mediaPayload,
        },
      });
      await tx.schedule.update({
        where: { id: schedule.id },
        data: { status: SCHEDULE_STATUS.FAILED, lastError: (error as Error).message },
      });
    });
    const message = (error as Error).message || "";
    const isAuthError = /Invalid OAuth|invalid token|\(#200\)|permissions/i.test(message);
    if (schedule?.socialAccount?.provider === SocialProvider.FACEBOOK && isAuthError) {
      const acc = await prisma.socialAccount.findUnique({ where: { id: schedule.socialAccountId } });
      if (acc) {
        const meta = (acc.meta as Record<string, any>) || {};
        const updatedMeta = { ...meta, pageAccessTokenEncrypted: null } as Prisma.InputJsonObject;
        await prisma.socialAccount.update({
          where: { id: acc.id },
          data: { isActive: false, meta: updatedMeta },
        });
        await pushRealtime({
          type: "account.deauthorized",
          userId: schedule.userId,
          payload: { provider: SocialProvider.FACEBOOK, reason: message },
        });
      }
    }
    const isTransient = /status\s+5\d\d|429|rate limit|temporar/i.test(message);
    const maxAttempts = Number(process.env.SOCIAL_MAX_RETRIES ?? 5);
    if (schedule.attempts < maxAttempts && isTransient) {
      const attempt = schedule.attempts + 1;
      const backoffMs = Math.min(60 * 60 * 1000, Math.pow(2, attempt) * 30_000);
      await prisma.schedule.update({
        where: { id: schedule.id },
        data: { status: SCHEDULE_STATUS.POSTING, lastError: null },
      });
      await scheduleQueue.add(
        "publish",
        { scheduleId: schedule.id },
        { delay: backoffMs, jobId: `${schedule.id}__${attempt}` },
      );
      await pushRealtime({
        type: "schedule.retried",
        userId: schedule.userId,
        payload: { scheduleId: schedule.id, delayMs: backoffMs, attempt },
      });
    }
    throw error;
  }
}

/**
 * Starts the BullMQ worker that processes scheduled social media posts.
 * The worker listens to the "social-schedules" queue and processes jobs when they're due.
 * 
 * To run the worker:
 *   npm run worker
 *   or
 *   tsx worker/publisher.ts
 */
export function startWorker() {
  const disableQueue = String(process.env.DISABLE_QUEUE || '').toLowerCase() === 'true';
  if (disableQueue || !process.env.REDIS_URL) {
    console.log("[Worker] Queue disabled or Redis not configured. Skipping worker start.");
    return {} as any;
  }
  console.log("[Worker] Starting social media publisher worker...");
  console.log(`[Worker] Queue: social-schedules`);
  console.log(`[Worker] Concurrency: ${process.env.SOCIAL_WORKER_CONCURRENCY ?? 3}`);
  console.log(`[Worker] Redis: ${process.env.REDIS_URL ?? "redis://127.0.0.1:6379"}`);

  const worker = new Worker("social-schedules", publishToProvider, {
    connection: queueConnection,
    concurrency: Number(process.env.SOCIAL_WORKER_CONCURRENCY ?? 3),
  });

  worker.on("ready", () => {
    console.log("[Worker] Worker is ready and listening for jobs");
  });

  worker.on("active", (job) => {
    console.log(`[Worker] Job ${job.id} is now active (schedule: ${job.data.scheduleId})`);
  });

  worker.on("failed", async (job, err) => {
    if (!job?.data?.scheduleId) {
      console.error("[Worker] Job failed but no scheduleId found", err);
      return;
    }
    const scheduleId = job.data.scheduleId as string;
    console.error(`[Worker] Job failed for schedule ${scheduleId}:`, err?.message);
    
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: { socialAccount: true },
    });
    if (!schedule) {
      console.warn(`[Worker] Schedule ${scheduleId} not found in database`);
      return;
    }

    if (schedule.status !== SCHEDULE_STATUS.FAILED) {
      await prisma.schedule.update({
        where: { id: scheduleId },
        data: {
          status: SCHEDULE_STATUS.FAILED,
          lastError: err?.message ?? "Unknown error",
        },
      });
    }

    const errorMessage = err?.message ?? "Unknown error";
    await pushRealtime({
      type: "schedule.failed",
      userId: schedule.userId,
      payload: { 
        scheduleId, 
        error: errorMessage,
        provider: schedule?.socialAccount?.provider || "unknown",
        message: `Failed to publish post: ${errorMessage}`,
      },
    });
  });

  worker.on("completed", (job) => {
    console.log(`[Worker] Job ${job.id} completed successfully (schedule: ${job.data.scheduleId})`);
  });

  worker.on("error", (err) => {
    console.error("[Worker] Worker error:", err);
  });

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    console.log("[Worker] SIGTERM received, closing worker...");
    await worker.close();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    console.log("[Worker] SIGINT received, closing worker...");
    await worker.close();
    process.exit(0);
  });

  return worker;
}

// Start the worker if this file is run directly
const shouldStart =
  typeof require === "undefined" || (typeof require !== "undefined" && require.main === module);
if (shouldStart) {
  console.log("[Worker] Starting worker process...");
  const worker = startWorker();
  console.log("[Worker] Worker started successfully. Press Ctrl+C to stop.");
}
