import crypto from "node:crypto";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { resolveMail } from "@/lib/settings/store";

/**
 * Sends mail through a Gmail account using an *app password* (not the normal
 * Gmail password). Create one in Google Account > Security > 2-Step
 * Verification > App passwords, then either enter it in the admin Settings
 * console (Settings > E-mail; stored encrypted, wins over .env) or set in .env:
 *
 *   SMTP_USER=the.gmail.address@gmail.com
 *   SMTP_APP_PASSWORD=abcd efgh ijkl mnop     (spaces are ignored)
 *   SMTP_FROM_NAME=ResortInRanchi             (optional)
 */
export interface MailConfig {
  user: string;
  pass: string;
  fromName: string;
}

export function getMailConfig(env: Record<string, string | undefined> = process.env): MailConfig | null {
  const user = env.SMTP_USER?.trim();
  const pass = env.SMTP_APP_PASSWORD?.replace(/\s+/g, "");
  if (!user || !pass) return null;
  return { user, pass, fromName: env.SMTP_FROM_NAME?.trim() || "ResortInRanchi" };
}

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

let cached: { key: string; transporter: Transporter } | null = null;

function transporterFor(config: MailConfig): Transporter {
  // Hash, not the password itself, so a changed password (even of the same length) gets a fresh connection.
  const key = `${config.user}:${crypto.createHash("sha256").update(config.pass).digest("hex")}`;
  if (!cached || cached.key !== key) {
    cached = { key, transporter: nodemailer.createTransport({ service: "gmail", auth: { user: config.user, pass: config.pass } }) };
  }
  return cached.transporter;
}

/** The live mail account: values saved in the Settings console first, then the server environment. */
async function currentConfig(): Promise<MailConfig | null> {
  try {
    return (await resolveMail()).config;
  } catch {
    return getMailConfig();
  }
}

/** True when a Gmail address and app password are available, so callers can tell "not set up" from "failed to send". */
export async function isMailConfigured(): Promise<boolean> {
  return (await currentConfig()) !== null;
}

export type MailResult = { ok: true } | { ok: false; reason: "not-configured" | "login-failed" | "failed" };

/** Like sendMail but says why it failed (used by the "send a test e-mail" button). Never throws, never logs the app password. */
export async function sendMailDetailed(message: MailMessage): Promise<MailResult> {
  const config = await currentConfig();
  if (!config) return { ok: false, reason: "not-configured" };
  try {
    await transporterFor(config).sendMail({
      from: { name: config.fromName, address: config.user },
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
    return { ok: true };
  } catch (error) {
    const code = (error as { code?: string; responseCode?: number })?.code;
    const responseCode = (error as { responseCode?: number })?.responseCode;
    console.error("[mail] could not send e-mail:", error instanceof Error ? error.message : "unknown error");
    return { ok: false, reason: code === "EAUTH" || responseCode === 535 ? "login-failed" : "failed" };
  }
}

/** Returns true when the mail server accepted the message. Never throws and never logs the app password. */
export async function sendMail(message: MailMessage): Promise<boolean> {
  return (await sendMailDetailed(message)).ok;
}
