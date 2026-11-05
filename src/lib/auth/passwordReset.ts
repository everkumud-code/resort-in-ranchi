import crypto from "node:crypto";

/**
 * Pure rules for the admin "forgot password" flow, kept apart from the
 * database and the mail server so they can be unit tested directly.
 */

/** A reset link works for one hour. */
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

/** At most this many reset e-mails per admin per hour, so the form cannot be used to flood an inbox. */
export const MAX_RESET_REQUESTS_PER_HOUR = 3;

/** The raw token is only ever in the e-mailed link; the database keeps its hash. */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export interface ResetTokenLike {
  expiresAt: Date;
  usedAt: Date | null;
}

export type ResetTokenEvaluation =
  | { valid: true }
  | { valid: false; reason: "not-found" | "used" | "expired" | "inactive-user" };

export function evaluateResetToken(
  token: ResetTokenLike | null,
  adminUser: { active: boolean } | null,
  now: Date = new Date()
): ResetTokenEvaluation {
  if (!token || !adminUser) return { valid: false, reason: "not-found" };
  if (token.usedAt) return { valid: false, reason: "used" };
  if (token.expiresAt.getTime() <= now.getTime()) return { valid: false, reason: "expired" };
  if (!adminUser.active) return { valid: false, reason: "inactive-user" };
  return { valid: true };
}

export function isResetRequestThrottled(requestsInLastHour: number): boolean {
  return requestsInLastHour >= MAX_RESET_REQUESTS_PER_HOUR;
}

/**
 * The link is built from the configured public site URL, never from the
 * request's Host header (a forged Host header could otherwise point the
 * e-mailed link at someone else's server). In production a missing
 * NEXT_PUBLIC_SITE_URL means no link is made at all.
 */
export function buildResetUrl(siteUrl: string | undefined, token: string, nodeEnv: string | undefined): string | null {
  const base = siteUrl?.trim().replace(/\/+$/, "");
  if (!base) {
    if (nodeEnv === "production") return null;
    return `http://localhost:3000/admin/reset-password?token=${encodeURIComponent(token)}`;
  }
  return `${base}/admin/reset-password?token=${encodeURIComponent(token)}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface ResetEmail {
  subject: string;
  text: string;
  html: string;
}

export function buildResetEmail(input: { name: string; url: string }): ResetEmail {
  const minutes = Math.round(RESET_TOKEN_TTL_MS / 60000);
  const name = input.name.trim() || "there";
  const subject = "Reset your ResortInRanchi admin password";
  const text = [
    `Hello ${name},`,
    "",
    "Someone asked to reset the password of your ResortInRanchi admin account.",
    `Open this link to choose a new password (it works once and expires in ${minutes} minutes):`,
    "",
    input.url,
    "",
    "If you did not ask for this, ignore this e-mail: your password stays as it is.",
  ].join("\n");
  const html = [
    `<p>Hello ${escapeHtml(name)},</p>`,
    "<p>Someone asked to reset the password of your ResortInRanchi admin account.</p>",
    `<p><a href="${escapeHtml(input.url)}">Choose a new password</a><br>`,
    `The link works once and expires in ${minutes} minutes.</p>`,
    "<p>If you did not ask for this, ignore this e-mail: your password stays as it is.</p>",
  ].join("\n");
  return { subject, text, html };
}
