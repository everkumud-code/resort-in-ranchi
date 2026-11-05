"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  createCreatorSessionForAccess,
  destroyCreatorSessionByToken,
  evaluateCreatorAccess,
  getCreatorAccessInfluencerId,
  influencerEligibleForOwnerAccess,
  CREATOR_SESSION_COOKIE_NAME,
  CREATOR_SESSION_DURATION_MS,
} from "@/lib/auth/creatorAccess";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { consumeCreatorResetToken, issueCreatorResetEmail } from "@/lib/auth/creatorPasswordResetService";
import { creatorProfileSchema } from "@/lib/validation/creatorProfile";
import { ownerLoginSchema, ownerSetPasswordSchema } from "@/lib/validation/ownerPassword";
import { forgotPasswordSchema, resetPasswordSchema } from "@/lib/validation/auth";

export interface CreatorActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
}

function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

async function assertCreatorAccess(influencerId: string): Promise<void> {
  const actual = await getCreatorAccessInfluencerId();
  if (actual !== influencerId) throw new Error("Not authorized for this creator profile.");
}

/**
 * The creator's own edit of their profile. Deliberately never touches
 * `featured`, `status`, `order` or `claimed` — the same admin-only boundary
 * OwnerEdit draws for vendors (see updateOwnerProperty).
 */
export async function updateCreatorProfile(influencerId: string, _prevState: CreatorActionState, formData: FormData): Promise<CreatorActionState> {
  await assertCreatorAccess(influencerId);

  const parsed = creatorProfileSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    photoUrl: formData.get("photoUrl"),
    videoUrl: formData.get("videoUrl"),
    bio: formData.get("bio"),
    category: formData.get("category"),
    instagramUrl: formData.get("instagramUrl"),
    youtubeUrl: formData.get("youtubeUrl"),
    websiteUrl: formData.get("websiteUrl"),
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone"),
  });
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const current = await prisma.influencer.findUnique({ where: { id: influencerId }, select: { slug: true } });
  if (!current) return { error: "Profile not found." };

  const slugOwner = await prisma.influencer.findUnique({ where: { slug: parsed.data.slug } });
  if (slugOwner && slugOwner.id !== influencerId) {
    return { error: "Please fix the errors below.", fieldErrors: { slug: "That username is already taken." } };
  }

  await prisma.influencer.update({ where: { id: influencerId }, data: parsed.data });

  revalidatePath("/creator");
  revalidatePath("/creator/edit");
  revalidatePath("/influencers");
  revalidatePath("/");
  revalidatePath(`/influencers/${current.slug}`);
  if (parsed.data.slug !== current.slug) revalidatePath(`/influencers/${parsed.data.slug}`);
  return { success: true };
}

export async function updateCreatorEnquiryStatus(influencerId: string, enquiryId: string, formData: FormData): Promise<void> {
  await assertCreatorAccess(influencerId);
  const status = String(formData.get("status") ?? "");
  const validStatuses = ["NEW", "CONTACTED", "CONVERTED", "CLOSED", "SPAM"];
  if (!validStatuses.includes(status)) return;
  await prisma.influencerEnquiry.updateMany({
    where: { id: enquiryId, influencerId },
    data: { status: status as "NEW" | "CONTACTED" | "CONVERTED" | "CLOSED" | "SPAM" },
  });
  revalidatePath("/creator/enquiries");
}

export async function logoutCreator(): Promise<void> {
  const store = await cookies();
  const token = store.get(CREATOR_SESSION_COOKIE_NAME)?.value;
  if (token) await destroyCreatorSessionByToken(token);
  store.delete({ name: CREATOR_SESSION_COOKIE_NAME, path: "/creator" });
  redirect("/creator");
}

export interface CreatorPasswordFormState {
  error?: string;
  success?: boolean;
}

/**
 * Sets (or changes) this creator's own direct-login email+password — only
 * callable while already signed in, so it is always the creator acting on
 * their own access, never set on their behalf. Mirrors setOwnerPassword.
 */
export async function setCreatorPassword(_prevState: CreatorPasswordFormState, formData: FormData): Promise<CreatorPasswordFormState> {
  const influencerId = await getCreatorAccessInfluencerId();
  if (!influencerId) return { error: "Your session has expired. Please sign in again." };

  const parsed = ownerSetPasswordSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check your details." };

  const emailOwner = await prisma.influencerOwnerAccess.findUnique({ where: { email: parsed.data.email } });
  if (emailOwner && emailOwner.influencerId !== influencerId) {
    return { error: "That email is already used for another creator profile's login." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.influencerOwnerAccess.update({
    where: { influencerId },
    data: { email: parsed.data.email, passwordHash },
  });
  return { success: true };
}

export interface CreatorLoginFormState {
  error?: string;
}

const GENERIC_LOGIN_ERROR = "Invalid email or password.";

/** Public — email+password login for a creator who has already set one up from their dashboard. */
export async function loginCreatorWithPassword(_prevState: CreatorLoginFormState, formData: FormData): Promise<CreatorLoginFormState> {
  const parsed = ownerLoginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: GENERIC_LOGIN_ERROR };

  // Never reveal whether the email exists — same generic error either way.
  const access = await prisma.influencerOwnerAccess.findUnique({
    where: { email: parsed.data.email },
    include: { influencer: { select: { id: true, status: true } } },
  });
  if (!access || !access.passwordHash) return { error: GENERIC_LOGIN_ERROR };
  if (!evaluateCreatorAccess(access).authorized) return { error: GENERIC_LOGIN_ERROR };
  if (!influencerEligibleForOwnerAccess(access.influencer)) return { error: GENERIC_LOGIN_ERROR };

  const validPassword = await verifyPassword(parsed.data.password, access.passwordHash);
  if (!validPassword) return { error: GENERIC_LOGIN_ERROR };

  const sessionToken = await createCreatorSessionForAccess(access.id);
  const store = await cookies();
  store.set(CREATOR_SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/creator",
    maxAge: CREATOR_SESSION_DURATION_MS / 1000,
  });

  redirect("/creator");
}

export interface CreatorForgotPasswordState {
  error?: string;
  sent?: boolean;
}

/**
 * Public "forgot password" for a creator who set up an email + password. The
 * answer is the same whether or not the e-mail is one of ours, and the lookup
 * and mailing run after the response so the reply takes the same time either way.
 */
export async function requestCreatorPasswordReset(_prevState: CreatorForgotPasswordState, formData: FormData): Promise<CreatorForgotPasswordState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter a valid email." };

  const { email } = parsed.data;
  after(async () => {
    try {
      await issueCreatorResetEmail(email);
    } catch (error) {
      console.error("[creator-password-reset] could not issue a reset e-mail:", error instanceof Error ? error.message : "unknown error");
    }
  });
  return { sent: true };
}

export interface CreatorResetPasswordState {
  error?: string;
}

export async function resetCreatorPassword(_prevState: CreatorResetPasswordState, formData: FormData): Promise<CreatorResetPasswordState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const result = await consumeCreatorResetToken(parsed.data.token, parsed.data.newPassword);
  if (!result.ok) return { error: "This reset link is invalid or has expired. Request a new one." };

  redirect("/creator?reset=1");
}
