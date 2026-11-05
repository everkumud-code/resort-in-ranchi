import { prisma } from "@/lib/prisma";
import { isMailConfigured, sendMail } from "@/lib/email/mailer";
import { resolveEmailLinkBase, resolveResetRules } from "@/lib/settings/store";
import { hashPassword } from "./password";
import { hashToken } from "./session";
import {
  buildResetEmail,
  buildResetUrl,
  evaluateResetToken,
  generateResetToken,
  isResetRequestThrottled,
} from "./passwordReset";

/**
 * Makes a one-time reset link for the admin with this e-mail and mails it.
 * Does nothing (and says nothing) when the address is unknown, the account is
 * switched off, or too many links were already asked for this hour, so the
 * caller can always show the same "if that address is ours, we sent a link"
 * answer and never reveals which e-mails are admins.
 */
export async function issueResetEmail(email: string): Promise<void> {
  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin || !admin.active) return;

  const rules = await resolveResetRules();
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await prisma.passwordResetToken.count({ where: { adminUserId: admin.id, createdAt: { gte: since } } });
  if (isResetRequestThrottled(recent, rules.requestsPerHour)) {
    console.info("[password-reset] too many requests this hour for one admin; no new e-mail sent");
    return;
  }

  const token = generateResetToken();
  const now = new Date();
  await prisma.$transaction([
    // Only the newest link works: older unused ones are retired.
    prisma.passwordResetToken.updateMany({ where: { adminUserId: admin.id, usedAt: null }, data: { usedAt: now } }),
    prisma.passwordResetToken.create({
      data: { tokenHash: hashToken(token), adminUserId: admin.id, expiresAt: new Date(now.getTime() + rules.linkMinutes * 60_000) },
    }),
  ]);

  const base = await resolveEmailLinkBase();
  const url = buildResetUrl(base.value, token, process.env.NODE_ENV);
  if (!url) {
    console.error("[password-reset] no website address is set (Settings > Site & security, or NEXT_PUBLIC_SITE_URL), so no reset link was made.");
    return;
  }

  if (!(await isMailConfigured())) {
    if (process.env.NODE_ENV === "production") {
      console.error("[password-reset] SMTP_USER / SMTP_APP_PASSWORD are not set, so no e-mail was sent.");
    } else {
      // Local development without a mail account: show the link here so the flow can still be tried.
      console.info(`[password-reset] (dev) mail is not configured. Reset link for ${admin.email}: ${url}`);
    }
    return;
  }

  const mail = buildResetEmail({ name: admin.name, url, ttlMinutes: rules.linkMinutes });
  await sendMail({ to: admin.email, ...mail });
}

/** Read-only check used by the reset page: does this link still work? */
export async function isResetTokenUsable(token: string): Promise<boolean> {
  if (!token) return false;
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) }, include: { adminUser: true } });
  return evaluateResetToken(row, row?.adminUser ?? null).valid;
}

export type ConsumeResetResult = { ok: true } | { ok: false };

/**
 * Sets the new password and uses the link up. The link is claimed first with a
 * conditional update, so two simultaneous submissions cannot both succeed.
 * Every signed-in session of that admin is ended.
 */
export async function consumeResetToken(token: string, newPassword: string): Promise<ConsumeResetResult> {
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) }, include: { adminUser: true } });
  if (!evaluateResetToken(row, row?.adminUser ?? null).valid || !row) return { ok: false };

  const passwordHash = await hashPassword(newPassword);
  const now = new Date();

  const done = await prisma.$transaction(async (tx) => {
    const claimed = await tx.passwordResetToken.updateMany({
      where: { id: row.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (claimed.count !== 1) return false;
    await tx.adminUser.update({ where: { id: row.adminUserId }, data: { passwordHash } });
    await tx.passwordResetToken.updateMany({ where: { adminUserId: row.adminUserId, usedAt: null }, data: { usedAt: now } });
    await tx.adminSession.deleteMany({ where: { adminUserId: row.adminUserId } });
    return true;
  });

  return done ? { ok: true } : { ok: false };
}
