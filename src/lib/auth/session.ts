import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { AdminUser } from "@prisma/client";
import { SESSION_COOKIE_NAME, SESSION_DURATION_MS } from "./constants";

export { SESSION_COOKIE_NAME, SESSION_DURATION_MS };

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export interface SessionLike {
  expiresAt: Date;
}
export interface AdminUserLike {
  active: boolean;
}

export interface SessionEvaluation {
  authorized: boolean;
  reason?: "no-session" | "expired" | "inactive-user";
}

/**
 * Pure decision logic for whether a session grants admin access, kept
 * separate from cookie/DB access so it can be unit tested directly.
 */
export function evaluateSession(
  session: SessionLike | null,
  adminUser: AdminUserLike | null,
  now: Date = new Date()
): SessionEvaluation {
  if (!session || !adminUser) {
    return { authorized: false, reason: "no-session" };
  }
  if (session.expiresAt.getTime() <= now.getTime()) {
    return { authorized: false, reason: "expired" };
  }
  if (!adminUser.active) {
    return { authorized: false, reason: "inactive-user" };
  }
  return { authorized: true };
}

/** Create a session row + return the raw token to set as a cookie. */
export async function createSession(adminUserId: string): Promise<string> {
  const token = generateSessionToken();
  await prisma.adminSession.create({
    data: {
      tokenHash: hashToken(token),
      adminUserId,
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
    },
  });
  return token;
}

export async function destroySessionByToken(token: string): Promise<void> {
  await prisma.adminSession.deleteMany({ where: { tokenHash: hashToken(token) } });
}

/** Reads the session cookie and returns the authenticated admin, or null. */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { adminUser: true },
  });

  const evaluation = evaluateSession(session, session?.adminUser ?? null);
  if (!evaluation.authorized) {
    if (evaluation.reason === "expired" && session) {
      await prisma.adminSession.delete({ where: { id: session.id } }).catch(() => {});
    }
    return null;
  }

  return session!.adminUser;
}

/** Server-side guard: use at the top of every protected page and Server Action. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/admin/login");
  }
  return admin;
}

/** Ownership credentials are a higher-risk admin operation: Editors cannot issue or revoke them. */
export function canManageOwnerAccess(role: AdminUser["role"]): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export async function requireOwnerAccessAdmin(): Promise<AdminUser> {
  const admin = await requireAdmin();
  if (!canManageOwnerAccess(admin.role)) {
    throw new Error("Not authorized to manage owner access.");
  }
  return admin;
}
