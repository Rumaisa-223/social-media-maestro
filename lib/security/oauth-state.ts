import crypto from "crypto";

const SECRET =
  process.env.OAUTH_STATE_SECRET ||
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET;

if (!SECRET) {
  console.warn("OAuth state secret is not configured. Set OAUTH_STATE_SECRET.");
}

export type OAuthStatePayload = {
  userId: string;
  provider: string;
  redirect?: string;
  action?: "connect" | "reconnect";
  codeVerifier?: string;
  ts: number;
};

export function encodeState(payload: OAuthStatePayload) {
  const base = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", SECRET || "state").update(base).digest("hex");
  return `${base}.${signature}`;
}

export function decodeState(state?: string): OAuthStatePayload | null {
  if (!state) return null;
  const [base, signature] = state.split(".");
  if (!base || !signature) return null;
  const expected = crypto.createHmac("sha256", SECRET || "state").update(base).digest("hex");
  if (expected !== signature) return null;
  try {
    return JSON.parse(Buffer.from(base, "base64url").toString()) as OAuthStatePayload;
  } catch (error) {
    console.error("Failed to parse OAuth state", error);
    return null;
  }
}

