import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

/**
 * Sends mail through a Gmail account using an *app password* (not the normal
 * Gmail password). Create one in Google Account > Security > 2-Step
 * Verification > App passwords, then set in .env:
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
  const key = `${config.user}:${config.pass.length}`;
  if (!cached || cached.key !== key) {
    cached = { key, transporter: nodemailer.createTransport({ service: "gmail", auth: { user: config.user, pass: config.pass } }) };
  }
  return cached.transporter;
}

/** Returns true when the mail server accepted the message. Never throws and never logs the app password. */
export async function sendMail(message: MailMessage): Promise<boolean> {
  const config = getMailConfig();
  if (!config) return false;
  try {
    await transporterFor(config).sendMail({
      from: { name: config.fromName, address: config.user },
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
    return true;
  } catch (error) {
    console.error("[mail] could not send e-mail:", error instanceof Error ? error.message : "unknown error");
    return false;
  }
}
