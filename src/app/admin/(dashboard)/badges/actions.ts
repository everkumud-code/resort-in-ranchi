"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { trustBadgeSchema } from "@/lib/validation/trustBadge";

export interface TrustBadgeFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

function parseForm(formData: FormData) {
  return trustBadgeSchema.safeParse({
    key: formData.get("key"),
    label: formData.get("label"),
    description: formData.get("description"),
  });
}

function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

function revalidateBadges() {
  revalidatePath("/admin/badges");
  revalidatePath("/", "layout");
}

export async function createTrustBadge(_prevState: TrustBadgeFormState, formData: FormData): Promise<TrustBadgeFormState> {
  await requireAdmin();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };

  const existing = await prisma.trustBadge.findUnique({ where: { key: parsed.data.key } });
  if (existing) return { error: "Please fix the errors below.", fieldErrors: { key: "This key is already in use." } };

  const count = await prisma.trustBadge.count();
  const created = await prisma.trustBadge.create({ data: { ...parsed.data, order: count } });

  revalidateBadges();
  redirect(`/admin/badges/${created.id}?saved=1`);
}

export async function updateTrustBadge(badgeId: string, _prevState: TrustBadgeFormState, formData: FormData): Promise<TrustBadgeFormState> {
  await requireAdmin();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };

  const keyOwner = await prisma.trustBadge.findUnique({ where: { key: parsed.data.key } });
  if (keyOwner && keyOwner.id !== badgeId) {
    return { error: "Please fix the errors below.", fieldErrors: { key: "This key is already in use." } };
  }

  try {
    await prisma.trustBadge.update({ where: { id: badgeId }, data: parsed.data });
  } catch {
    return { error: "Could not save changes." };
  }

  revalidateBadges();
  revalidatePath(`/admin/badges/${badgeId}`);
  redirect(`/admin/badges/${badgeId}?saved=1`);
}

/** Deletes a badge definition and every assignment of it (Property/Influencer/EventBadge cascade). */
export async function deleteTrustBadge(badgeId: string): Promise<void> {
  await requireAdmin();
  await prisma.trustBadge.delete({ where: { id: badgeId } });
  revalidateBadges();
}
