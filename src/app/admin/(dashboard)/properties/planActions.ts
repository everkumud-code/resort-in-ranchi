"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { saveExtraCategoriesForProperty, saveSponsoredPlacementForProperty } from "@/lib/propertyPlan";

export interface PlanFormState {
  error?: string;
  success?: boolean;
}

function revalidatePlan(propertyId: string) {
  revalidatePath(`/admin/properties/${propertyId}`);
  revalidatePath("/", "layout");
}

function parseDate(value: FormDataEntryValue | null): Date | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Admin only. Extra categories are checked against the listing's plan (Free 1, Premium 3, Lead Partner all). */
export async function saveExtraCategories(propertyId: string, _prev: PlanFormState, formData: FormData): Promise<PlanFormState> {
  await requireAdmin();
  const result = await saveExtraCategoriesForProperty(
    propertyId,
    formData.getAll("extraCategoryIds").map(String)
  );
  if (!result.ok) return { error: result.error };
  revalidatePlan(propertyId);
  return { success: true };
}

/** Admin only. A sponsored placement needs a paid plan and is limited to what that plan allows. */
export async function saveSponsoredPlacement(propertyId: string, _prev: PlanFormState, formData: FormData): Promise<PlanFormState> {
  await requireAdmin();
  const result = await saveSponsoredPlacementForProperty(propertyId, {
    enabled: formData.get("enabled") === "on",
    allCategories: formData.get("allCategories") === "on",
    categorySlugs: formData.getAll("categorySlugs").map(String),
    positions: formData.getAll("positions").map(Number),
    startsAt: parseDate(formData.get("startsAt")),
    endsAt: parseDate(formData.get("endsAt")),
  });
  if (!result.ok) return { error: result.error };
  revalidatePlan(propertyId);
  return { success: true };
}

/** Admin only. Ends a sponsored placement immediately by removing it. */
export async function removeSponsoredPlacement(propertyId: string): Promise<void> {
  await requireAdmin();
  await prisma.sponsoredPlacement.deleteMany({ where: { propertyId } });
  revalidatePlan(propertyId);
}
