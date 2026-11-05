import crypto from "node:crypto";

/**
 * Encrypts secrets (the Gmail app password) before they are stored in the
 * database, so a copy of the database alone does not reveal them. AES-256-GCM
 * with a random IV per value; the key lives only in the server environment
 * (SETTINGS_ENCRYPTION_KEY: 64 hex characters, or base64 of 32 bytes).
 *
 * Stored format: "v1:" + base64(iv) + ":" + base64(authTag) + ":" + base64(ciphertext)
 */

const PREFIX = "v1";

/** Returns the 32-byte key, or null when it is missing or not a valid key. */
export function parseEncryptionKey(raw: string | undefined): Buffer | null {
  const value = raw?.trim();
  if (!value) return null;
  if (/^[0-9a-fA-F]{64}$/.test(value)) return Buffer.from(value, "hex");
  try {
    const buf = Buffer.from(value, "base64");
    return buf.length === 32 ? buf : null;
  } catch {
    return null;
  }
}

export function isEncryptionConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return parseEncryptionKey(env.SETTINGS_ENCRYPTION_KEY) !== null;
}

export function encryptSecret(plain: string, env: Record<string, string | undefined> = process.env): string {
  const key = parseEncryptionKey(env.SETTINGS_ENCRYPTION_KEY);
  if (!key) throw new Error("SETTINGS_ENCRYPTION_KEY is not set or is not a valid 32-byte key.");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [PREFIX, iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(":");
}

/** Returns the original text, or null when the key is missing/changed or the value was tampered with. */
export function decryptSecret(payload: string, env: Record<string, string | undefined> = process.env): string | null {
  const key = parseEncryptionKey(env.SETTINGS_ENCRYPTION_KEY);
  if (!key) return null;
  const parts = payload.split(":");
  if (parts.length !== 4 || parts[0] !== PREFIX) return null;
  try {
    const iv = Buffer.from(parts[1], "base64");
    const tag = Buffer.from(parts[2], "base64");
    const data = Buffer.from(parts[3], "base64");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
