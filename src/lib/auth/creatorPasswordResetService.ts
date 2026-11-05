import { prisma } from "@/lib/prisma";
import { isMailConfigured, sendMail } from "@/lib/email/mailer";
import { resolveEmailLinkBase, resolveResetRules } from "@/lib/settings/store";
import { hashPassword } from "./password";
import { hashToken } from "./session";
import { evaluateCreatorAccess, influencerEligibleForOwnerAccess } from "./creatorAccess";
import {
  buildResetEmail,
  buildResetUrl,
  evaluateResetToken,
  generateResetToken,
  isResetRequestThrottled,
} from "./passwordReset";

/**
 * The creator version of ownerPasswordResetService.ts. A creator can only
 * reset a password they set up themselves (email + password on their own
 * dashboard), and only while their access is still valid and their profile is
 * published, i.e. under exactly the conditions loginCreatorWithPassword allows
 * a sign-in. Resetting the password never re-opens access that was revoked or
 * has expired.
 */

const CREATOR_RESET_PATH = "/creator/reset-password";

type CreatorAccessForReset = {
  expiresAt: Date;
  revokedAt: Date | null;
  passwordHash: string | null;
  influencer: { id: string; status: string };
};

/** Same test the sign-in uses: access valid, a password was set, profile eligible. */
function creatorCanSignIn(access: CreatorAccessForReset | null): boolean {
  return Boolean(access && access.passwordHash && evaluateCreatorAccess(access).authorized && influencerEligibleForOwnerAccess(access.influencer));
}

/**
 * Makes a one-time reset link for the creator login with this e-mail and mails
 * it. Silent (and the caller always shows the same answer) when the address is
 * unknown, no password was ever set, the access is revoked or expired, the
 * listing is not published, or too many links were already asked for this hour.
 */
export async function issueCreatorResetEmail(email: string): Promise<void> {
  const access = await prisma.influencerOwnerAccess.findUnique({
    where: { email },
    include: { influencer: { select: { id: true, status: true, name: true } } },
  });
  if (!access || !creatorCanSignIn(access) || !access.email) return;

  const rules = await resolveResetRules();
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await prisma.creatorPasswordResetToken.count({ where: { ownerAccessId: access.id, createdAt: { gte: since } } });
  if (isResetRequestThrottled(recent, rules.requestsPerHour)) {
    console.info("[creator-password-reset] too many requests this hour for one creator; no new e-mail sent");
    return;
  }

  const token = generateResetToken();
  const now = new Date();
  await prisma.$transaction([
    // Only the newest link works: older unused ones are retired.
    prisma.creatorPasswordResetToken.updateMany({ where: { ownerAccessId: access.id, usedAt: null }, data: { usedAt: now } }),
    prisma.creatorPasswordResetToken.create({
      data: { tokenHash: hashToken(token), ownerAccessId: access.id, expiresAt: new Date(now.getTime() + rules.linkMinutes * 60_000) },
    }),
  ]);

  const base = await resolveEmailLinkBase();
  const url = buildResetUrl(base.value, token, process.env.NODE_ENV, CREATOR_RESET_PATH);
  if (!url) {
    console.error("[creator-password-reset] no website address is set (Settings > Site & security, or NEXT_PUBLIC_SITE_URL), so no reset link was made.");
    return;
  }

  if (!(await isMailConfigured())) {
    if (process.env.NODE_ENV === "production") {
      console.error("[creator-password-reset] e-mail sending is not set up, so no e-mail was sent.");
    } else {
      console.info(`[creator-password-reset] (dev) mail is not configured. Reset link for ${access.email}: ${url}`);
    }
    return;
  }

  const mail = buildResetEmail({ name: access.influencer.name, url, audience: "creator", ttlMinutes: rules.linkMinutes });
  await sendMail({ to: access.email, ...mail });
}

/** Read-only check used by the reset page: does this link still work? */
export async function isCreatorResetTokenUsable(token: string): Promise<boolean> {
  if (!token) return false;
  const row = await prisma.creatorPasswordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { ownerAccess: { include: { influencer: { select: { id: true, status: true } } } } },
  });
  return evaluateResetToken(row, row ? { active: creatorCanSignIn(row.ownerAccess) } : null).valid;
}

/**
 * Sets the new password and uses the link up (claimed first with a conditional
 * update so two simultaneous submissions cannot both succeed). Every signed-in
 * session of that creator access is ended.
 */
export async function consumeCreatorResetToken(token: string, newPassword: string): Promise<{ ok: boolean }> {
  const row = await prisma.creatorPasswordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { ownerAccess: { include: { influencer: { select: { id: true, status: true } } } } },
  });
  if (!row || !evaluateResetToken(row, { active: creatorCanSignIn(row.ownerAccess) }).valid) return { ok: false };

  const passwordHash = await hashPassword(newPassword);
  const now = new Date();

  const done = await prisma.$transaction(async (tx) => {
    const claimed = await tx.creatorPasswordResetToken.updateMany({
      where: { id: row.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (claimed.count !== 1) return false;
    await tx.influencerOwnerAccess.update({ where: { id: row.ownerAccessId }, data: { passwordHash } });
    await tx.creatorPasswordResetToken.updateMany({ where: { ownerAccessId: row.ownerAccessId, usedAt: null }, data: { usedAt: now } });
    await tx.influencerOwnerSession.deleteMany({ where: { ownerAccessId: row.ownerAccessId } });
    return true;
  });

  return { ok: done };
}
