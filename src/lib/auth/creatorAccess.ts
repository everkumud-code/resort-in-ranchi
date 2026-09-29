import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { generateSessionToken, hashToken } from "./session";

/**
 * Passwordless creator (influencer) access — the exact same pattern as
 * ownerAccess.ts, applied to Influencer instead of Property. Kept as a
 * separate cookie/path ("/creator") so a creator session and a vendor/owner
 * session never collide even if the same person holds both.
 */
export const CREATOR_SESSION_COOKIE_NAME = "creator_session";
export const CREATOR_INITIAL_TOKEN_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
export const CREATOR_SESSION_DURATION_MS = 90 * 24 * 60 * 60 * 1000;

type CreatorAccessLike = { expiresAt: Date; revokedAt: Date | null } | null;
type InitialCreatorAccessLike = { expiresAt: Date; revokedAt: Date | null; consumedAt: Date | null };

export function evaluateCreatorAccess(access: CreatorAccessLike, now: Date = new Date()) {
  if (!access) return { authorized: false as const, reason: "no-token" as const };
  if (access.revokedAt) return { authorized: false as const, reason: "revoked" as const };
  if (access.expiresAt.getTime() <= now.getTime()) return { authorized: false as const, reason: "expired" as const };
  return { authorized: true as const };
}

export function evaluateInitialCreatorAccess(access: InitialCreatorAccessLike | null, now: Date = new Date()) {
  const result = evaluateCreatorAccess(access, now);
  if (!access || !result.authorized) return result;
  if (access.consumedAt) return { authorized: false as const, reason: "consumed" as const };
  return result;
}

/** Only a published creator profile can be signed into — mirrors propertyEligibleForOwnerAccess. */
export function influencerEligibleForOwnerAccess(influencer: { id: string; status: string } | null): boolean {
  return Boolean(influencer && influencer.status === "PUBLISHED");
}

/** Atomically consumes a one-time initial credential and establishes a new creator browser session. */
export async function exchangeCreatorAccessToken(initialToken: string): Promise<{ influencerId: string; sessionToken: string } | null> {
  const now = new Date();
  const initialTokenHash = hashToken(initialToken);
  const sessionToken = generateSessionToken();

  return prisma.$transaction(async (tx) => {
    const access = await tx.influencerOwnerAccess.findUnique({
      where: { tokenHash: initialTokenHash },
      include: { influencer: { select: { id: true, status: true } } },
    });
    if (!access || !evaluateInitialCreatorAccess(access, now).authorized || !influencerEligibleForOwnerAccess(access.influencer)) {
      return null;
    }

    const consumed = await tx.influencerOwnerAccess.updateMany({
      where: { id: access.id, consumedAt: null, revokedAt: null, expiresAt: { gt: now } },
      data: { consumedAt: now, expiresAt: new Date(now.getTime() + CREATOR_SESSION_DURATION_MS) },
    });
    if (consumed.count !== 1) return null;

    await tx.influencerOwnerSession.create({
      data: {
        ownerAccessId: access.id,
        tokenHash: hashToken(sessionToken),
        expiresAt: new Date(now.getTime() + CREATOR_SESSION_DURATION_MS),
      },
    });
    return { influencerId: access.influencerId, sessionToken };
  });
}

/** Resolves only the separate creator-session cookie, never a URL/form influencer ID. */
export async function getCreatorAccessInfluencerId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(CREATOR_SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.influencerOwnerSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { ownerAccess: { include: { influencer: { select: { id: true, status: true } } } } },
  });
  if (!session || session.expiresAt.getTime() <= Date.now()) return null;
  if (!evaluateCreatorAccess(session.ownerAccess).authorized) return null;
  if (!influencerEligibleForOwnerAccess(session.ownerAccess.influencer)) return null;
  return session.ownerAccess.influencerId;
}

export async function destroyCreatorSessionByToken(token: string): Promise<void> {
  await prisma.influencerOwnerSession.deleteMany({ where: { tokenHash: hashToken(token) } });
}
