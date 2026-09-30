"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { ownerLoginSchema, ownerSetPasswordSchema } from "@/lib/validation/ownerPassword";
import {
  createOwnerSessionForAccess,
  destroyOwnerSessionByToken,
  evaluateOwnerAccess,
  getOwnerAccessPropertyId,
  OWNER_SESSION_COOKIE_NAME,
  OWNER_SESSION_DURATION_MS,
  propertyEligibleForOwnerAccess,
} from "@/lib/auth/ownerAccess";

/** Deletes the session row (not just the cookie) so a copied/leaked cookie value stops working immediately. */
export async function logoutOwner(): Promise<void> {
  const store = await cookies();
  const token = store.get(OWNER_SESSION_COOKIE_NAME)?.value;
  if (token) {
    await destroyOwnerSessionByToken(token);
  }
  store.delete({ name: OWNER_SESSION_COOKIE_NAME, path: "/owner" });
  redirect("/owner");
}

export interface OwnerPasswordFormState {
  error?: string;
  success?: boolean;
}

/**
 * Sets (or changes) this owner's own direct-login email+password —
 * only callable while already signed in via the one-time link, so it's
 * always the owner acting on their own access, never set on their behalf.
 */
export async function setOwnerPassword(_prevState: OwnerPasswordFormState, formData: FormData): Promise<OwnerPasswordFormState> {
  const propertyId = await getOwnerAccessPropertyId();
  if (!propertyId) return { error: "Your session has expired. Please sign in again." };

  const parsed = ownerSetPasswordSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  const emailOwner = await prisma.propertyOwnerAccess.findUnique({ where: { email: parsed.data.email } });
  if (emailOwner && emailOwner.propertyId !== propertyId) {
    return { error: "That email is already used for another listing's login." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.propertyOwnerAccess.update({
    where: { propertyId },
    data: { email: parsed.data.email, passwordHash },
  });

  return { success: true };
}

export interface OwnerLoginFormState {
  error?: string;
}

const GENERIC_LOGIN_ERROR = "Invalid email or password.";

/** Public — email+password login for an owner who has already set one up from their dashboard. */
export async function loginOwnerWithPassword(_prevState: OwnerLoginFormState, formData: FormData): Promise<OwnerLoginFormState> {
  const parsed = ownerLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: GENERIC_LOGIN_ERROR };

  // Never reveal whether the email exists — same generic error either way.
  const access = await prisma.propertyOwnerAccess.findUnique({
    where: { email: parsed.data.email },
    include: { property: { select: { id: true, status: true } } },
  });
  if (!access || !access.passwordHash) return { error: GENERIC_LOGIN_ERROR };
  if (!evaluateOwnerAccess(access).authorized) return { error: GENERIC_LOGIN_ERROR };
  if (!propertyEligibleForOwnerAccess(access.property)) return { error: GENERIC_LOGIN_ERROR };

  const validPassword = await verifyPassword(parsed.data.password, access.passwordHash);
  if (!validPassword) return { error: GENERIC_LOGIN_ERROR };

  const sessionToken = await createOwnerSessionForAccess(access.id);
  const store = await cookies();
  store.set(OWNER_SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/owner",
    maxAge: OWNER_SESSION_DURATION_MS / 1000,
  });

  redirect("/owner");
}
