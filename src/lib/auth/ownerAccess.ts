import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { generateSessionToken, hashToken } from "./session";
import { BULK_PUBLISH_EXCLUDED_PROPERTY_IDS } from "@/lib/validation/bulkPublish";

export const OWNER_SESSION_COOKIE_NAME = "owner_session";
export const OWNER_INITIAL_TOKEN_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
// Vendors update their listing occasionally, not daily — a longer session keeps an
// approved owner signed in between updates. Revoking the owner access still ends
// every session immediately.
export const OWNER_SESSION_DURATION_MS = 90 * 24 * 60 * 60 * 1000;

type OwnerAccessLike = { expiresAt: Date; revokedAt: Date | null } | null;
type InitialOwnerAccessLike = { expiresAt: Date; revokedAt: Date | null; consumedAt: Date | null };

export function evaluateOwnerAccess(access: OwnerAccessLike, now: Date = new Date()) {
  if (!access) return { authorized: false as const, reason: "no-token" as const };
  if (access.revokedAt) return { authorized: false as const, reason: "revoked" as const };
  if (access.expiresAt.getTime() <= now.getTime()) return { authorized: false as const, reason: "expired" as const };
  return { authorized: true as const };
}

/** The initial credential can be exchanged exactly once; owner sessions use a distinct token. */
export function evaluateInitialOwnerAccess(access: InitialOwnerAccessLike | null, now: Date = new Date()) {
  const result = evaluateOwnerAccess(access, now);
  if (!access || !result.authorized) return result;
  if (access.consumedAt) return { authorized: false as const, reason: "consumed" as const };
  return result;
}

export function propertyEligibleForOwnerAccess(property: { id: string; status: string } | null): boolean {
  return Boolean(property && property.status === "PUBLISHED" && !BULK_PUBLISH_EXCLUDED_PROPERTY_IDS.has(property.id));
}

/**
 * Atomically consumes a one-time initial credential and establishes a new
 * owner browser session. Only hashes are persisted for either credential.
 */
export async function exchangeOwnerAccessToken(initialToken: string): Promise<{ propertyId: string; sessionToken: string } | null> {
  const now = new Date();
  const initialTokenHash = hashToken(initialToken);
  const sessionToken = generateSessionToken();

  return prisma.$transaction(async (tx) => {
    const access = await tx.propertyOwnerAccess.findUnique({
      where: { tokenHash: initialTokenHash },
      include: { property: { select: { id: true, status: true } } },
    });
    if (!access || !evaluateInitialOwnerAccess(access, now).authorized || !propertyEligibleForOwnerAccess(access.property)) {
      return null;
    }

    // The conditional update makes simultaneous exchanges race safely.
    const consumed = await tx.propertyOwnerAccess.updateMany({
      where: { id: access.id, consumedAt: null, revokedAt: null, expiresAt: { gt: now } },
      // Sessions are also bounded by their parent access row's expiry, so it is extended to match.
      data: { consumedAt: now, expiresAt: new Date(now.getTime() + OWNER_SESSION_DURATION_MS) },
    });
    if (consumed.count !== 1) return null;

    await tx.propertyOwnerSession.create({
      data: {
        ownerAccessId: access.id,
        tokenHash: hashToken(sessionToken),
        expiresAt: new Date(now.getTime() + OWNER_SESSION_DURATION_MS),
      },
    });
    return { propertyId: access.propertyId, sessionToken };
  });
}

/**
 * Establishes a fresh owner browser session for an already-authorized
 * access row — used after a successful email+password login (see
 * loginOwnerWithPassword). Mirrors the session half of
 * exchangeOwnerAccessToken, without consuming any one-time credential.
 */
export async function createOwnerSessionForAccess(ownerAccessId: string): Promise<string> {
  const sessionToken = generateSessionToken();
  const now = new Date();
  await prisma.propertyOwnerSession.create({
    data: {
      ownerAccessId,
      tokenHash: hashToken(sessionToken),
      expiresAt: new Date(now.getTime() + OWNER_SESSION_DURATION_MS),
    },
  });
  return sessionToken;
}

/** Resolves only the separate owner-session cookie, never a URL/form property ID. */
export async function getOwnerAccessPropertyId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(OWNER_SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.propertyOwnerSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { ownerAccess: { include: { property: { select: { id: true, status: true } } } } },
  });
  if (!session || session.expiresAt.getTime() <= Date.now()) return null;
  if (!evaluateOwnerAccess(session.ownerAccess).authorized) return null;
  if (!propertyEligibleForOwnerAccess(session.ownerAccess.property)) return null;
  return session.ownerAccess.propertyId;
}

export function ownerAccessGrantsProperty(actualPropertyId: string | null, requestedPropertyId: string): boolean {
  return actualPropertyId !== null && actualPropertyId === requestedPropertyId;
}

/** Removes the owner-session row by its token's hash — used by logout. Mirrors destroySessionByToken (admin sessions). */
export async function destroyOwnerSessionByToken(token: string): Promise<void> {
  await prisma.propertyOwnerSession.deleteMany({ where: { tokenHash: hashToken(token) } });
}

export async function requireOwnerAccessForProperty(propertyId: string): Promise<boolean> {
  return ownerAccessGrantsProperty(await getOwnerAccessPropertyId(), propertyId);
}
