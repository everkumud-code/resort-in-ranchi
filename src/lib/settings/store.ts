import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret, isEncryptionConfigured } from "./crypto";
import {
  isSecretSetting,
  isSettingKey,
  mergeMailConfig,
  resolveResetPolicy,
  resolveSiteUrl,
  type MailSources,
  type ResetPolicy,
  type ResolvedMailConfig,
  type SettingKey,
  type SettingSource,
} from "./definitions";

/**
 * Database side of the Settings console. Reads are cached for a few seconds
 * (every e-mail send and reset request looks the values up) and the cache is
 * dropped on every write in this process.
 */

const CACHE_MS = 10_000;

interface Snapshot {
  at: number;
  values: Partial<Record<SettingKey, string>>;
  /** Secrets that exist but could not be decrypted (key missing or changed). */
  unreadable: SettingKey[];
}

let cache: Snapshot | null = null;

export function clearSettingsCache(): void {
  cache = null;
}

async function load(): Promise<Snapshot> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache;
  const values: Partial<Record<SettingKey, string>> = {};
  const unreadable: SettingKey[] = [];
  try {
    const rows = await prisma.siteSetting.findMany();
    for (const row of rows) {
      if (!isSettingKey(row.key)) continue;
      if (row.secret) {
        const plain = decryptSecret(row.value);
        if (plain === null) unreadable.push(row.key);
        else values[row.key] = plain;
      } else {
        values[row.key] = row.value;
      }
    }
  } catch (error) {
    // The site must keep working (falling back to the server environment) if this table is unreachable.
    console.error("[settings] could not read saved settings:", error instanceof Error ? error.message : "unknown error");
  }
  cache = { at: Date.now(), values, unreadable };
  return cache;
}

export async function getSavedSettings(): Promise<Snapshot> {
  return load();
}

export async function resolveMail(): Promise<{ config: ResolvedMailConfig | null; sources: MailSources; unreadable: boolean }> {
  const snap = await load();
  const merged = mergeMailConfig(snap.values, process.env);
  return { ...merged, unreadable: snap.unreadable.includes("mail.appPassword") };
}

export async function resolveEmailLinkBase(): Promise<{ value: string | undefined; source: SettingSource }> {
  const snap = await load();
  return resolveSiteUrl(snap.values["site.url"], process.env.NEXT_PUBLIC_SITE_URL);
}

export async function resolveResetRules(): Promise<ResetPolicy> {
  const snap = await load();
  return resolveResetPolicy(snap.values);
}

export type SaveResult = { ok: true } | { ok: false; error: string };

/** Stores an already-validated value; secrets are encrypted first and refused when no encryption key is set. */
export async function saveSetting(key: SettingKey, value: string, adminId: string): Promise<SaveResult> {
  const secret = isSecretSetting(key);
  if (secret && !isEncryptionConfigured()) {
    return { ok: false, error: "Secrets cannot be saved yet: the server has no SETTINGS_ENCRYPTION_KEY. See the note on this page." };
  }
  const stored = secret ? encryptSecret(value) : value;
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value: stored, secret, updatedById: adminId },
    update: { value: stored, secret, updatedById: adminId },
  });
  clearSettingsCache();
  return { ok: true };
}

export async function clearSetting(key: SettingKey): Promise<void> {
  await prisma.siteSetting.deleteMany({ where: { key } });
  clearSettingsCache();
}

/** History entry. `summary` is plain words and must never contain a value. */
export async function logSettingChange(area: string, summary: string, adminEmail: string): Promise<void> {
  await prisma.settingChange.create({ data: { area, summary, adminEmail } });
}
