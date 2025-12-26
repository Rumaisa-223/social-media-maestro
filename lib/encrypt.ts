import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

const RAW_KEY = process.env.TOKEN_ENCRYPTION_KEY || "fallback-build-key-ignore-in-prod";

if (!process.env.TOKEN_ENCRYPTION_KEY) {
  console.warn("Missing TOKEN_ENCRYPTION_KEY environment variable. Using fallback.");
}

const SECRET =
  RAW_KEY.length === 32
    ? Buffer.from(RAW_KEY, "utf8")
    : crypto.createHash("sha256").update(RAW_KEY).digest();

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${encrypted.toString("hex")}:${authTag.toString("hex")}`;
}

export function decrypt(hash: string): string {
  if (typeof hash !== "string") return "";
  const parts = hash.split(":");
  if (parts.length !== 3) return hash;
  const [ivHex, encryptedHex, authTagHex] = parts;
  try {
    const iv = Buffer.from(ivHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(encrypted).toString("utf8") + decipher.final().toString("utf8");
  } catch {
    return hash;
  }
}