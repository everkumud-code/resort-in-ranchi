import { z } from "zod";

/**
 * The settings an admin can edit from the Settings console, with their rules.
 * Pure (no database, no Node builtins) so every rule is unit tested directly.
 *
 * A value saved in the console overrides the matching server environment
 * variable; clearing it falls back to the variable (or to the built-in default).
 */

export const SETTING_KEYS = [
  "mail.user",
  "mail.appPassword",
  "mail.fromName",
  "site.url",
  "security.resetLinkMinutes",
  "security.resetRequestsPerHour",
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

export const SECRET_SETTING_KEYS: readonly SettingKey[] = ["mail.appPassword"];

export function isSecretSetting(key: SettingKey): boolean {
  return SECRET_SETTING_KEYS.includes(key);
}

export function isSettingKey(value: string): value is SettingKey {
  return (SETTING_KEYS as readonly string[]).includes(value);
}

export const RESET_LINK_MINUTES = { min: 10, max: 1440, default: 60 } as const;
export const RESET_REQUESTS_PER_HOUR = { min: 1, max: 10, default: 3 } as const;

// ---- field rules -----------------------------------------------------------

export const gmailAddressSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Enter the Gmail address that sends the e-mails.")
  .max(254)
  .email("Enter a valid e-mail address.");

/** Google shows the app password as four groups of four letters; spaces are ignored. */
export const appPasswordSchema = z
  .string()
  .transform((v) => v.replace(/\s+/g, ""))
  .pipe(z.string().min(8, "That is too short for a Gmail app password (it is 16 letters).").max(64, "That is too long for a Gmail app password."));

export const fromNameSchema = z.string().trim().min(1, "Enter a sender name.").max(80, "Keep the sender name under 80 characters.");

/**
 * The public address used for links inside e-mails. Origin only (no path),
 * https everywhere except localhost, so a typo cannot send reset links to a
 * plain-http or script address.
 */
export function normalizeSiteUrl(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  const text = raw.trim();
  if (!text) return { ok: false, error: "Enter the website address, for example https://www.resortinranchi.com" };
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return { ok: false, error: "That is not a web address. Start it with https://" };
  }
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !(local && url.protocol === "http:")) {
    return { ok: false, error: "Use an https:// address (http:// is only allowed for localhost)." };
  }
  if (url.username || url.password) return { ok: false, error: "The address must not contain a user name or password." };
  if ((url.pathname !== "/" && url.pathname !== "") || url.search || url.hash) {
    return { ok: false, error: "Give only the website address, without a page path (https://www.example.com)." };
  }
  return { ok: true, value: url.origin };
}

export function parseBoundedInt(raw: string, range: { min: number; max: number }, label: string): { ok: true; value: number } | { ok: false; error: string } {
  const text = raw.trim();
  if (!/^\d+$/.test(text)) return { ok: false, error: `${label} must be a whole number.` };
  const value = Number(text);
  if (value < range.min || value > range.max) return { ok: false, error: `${label} must be between ${range.min} and ${range.max}.` };
  return { ok: true, value };
}

// ---- resolving the live value ---------------------------------------------

export type SettingSource = "console" | "environment" | "default" | "none";

export interface ResolvedMailConfig {
  user: string;
  pass: string;
  fromName: string;
}

export interface MailSources {
  user: SettingSource;
  appPassword: SettingSource;
  fromName: SettingSource;
}

/**
 * Console values win over the server environment, field by field. Returns
 * null when there is still no address or no app password.
 */
export function mergeMailConfig(
  saved: Partial<Record<"mail.user" | "mail.appPassword" | "mail.fromName", string>>,
  env: Record<string, string | undefined>
): { config: ResolvedMailConfig | null; sources: MailSources } {
  const envUser = env.SMTP_USER?.trim() || undefined;
  const envPass = env.SMTP_APP_PASSWORD?.replace(/\s+/g, "") || undefined;
  const envName = env.SMTP_FROM_NAME?.trim() || undefined;

  const user = saved["mail.user"] || envUser;
  const pass = saved["mail.appPassword"] || envPass;
  const fromName = saved["mail.fromName"] || envName || "ResortInRanchi";

  const sources: MailSources = {
    user: saved["mail.user"] ? "console" : envUser ? "environment" : "none",
    appPassword: saved["mail.appPassword"] ? "console" : envPass ? "environment" : "none",
    fromName: saved["mail.fromName"] ? "console" : envName ? "environment" : "default",
  };

  if (!user || !pass) return { config: null, sources };
  return { config: { user, pass, fromName }, sources };
}

export function resolveSiteUrl(saved: string | undefined, envUrl: string | undefined): { value: string | undefined; source: SettingSource } {
  if (saved) return { value: saved, source: "console" };
  const fromEnv = envUrl?.trim().replace(/\/+$/, "");
  if (fromEnv) return { value: fromEnv, source: "environment" };
  return { value: undefined, source: "none" };
}

export interface ResetPolicy {
  linkMinutes: number;
  requestsPerHour: number;
}

export const DEFAULT_RESET_POLICY: ResetPolicy = {
  linkMinutes: RESET_LINK_MINUTES.default,
  requestsPerHour: RESET_REQUESTS_PER_HOUR.default,
};

/** Falls back to the safe default for anything missing or out of range, so a bad stored value can never disable the limits. */
export function resolveResetPolicy(saved: { "security.resetLinkMinutes"?: string; "security.resetRequestsPerHour"?: string }): ResetPolicy {
  const minutes = parseBoundedInt(saved["security.resetLinkMinutes"] ?? "", RESET_LINK_MINUTES, "Link lifetime");
  const requests = parseBoundedInt(saved["security.resetRequestsPerHour"] ?? "", RESET_REQUESTS_PER_HOUR, "Requests");
  return {
    linkMinutes: minutes.ok ? minutes.value : DEFAULT_RESET_POLICY.linkMinutes,
    requestsPerHour: requests.ok ? requests.value : DEFAULT_RESET_POLICY.requestsPerHour,
  };
}

/** "abcd efgh ijkl mnop" -> "•••• •••• •••• ••••": shows that a password exists without revealing any of it. */
export const SECRET_MASK = "•••• •••• •••• ••••";
