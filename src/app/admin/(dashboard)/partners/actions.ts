"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOwnerAccessAdmin } from "@/lib/auth/session";

export interface CreatePartnerState {
  error?: string;
}

/**
 * ADMIN/SUPER_ADMIN only. A LeadPartner is always an explicit, data-driven
 * configuration on top of an existing Property — never hardcoded in
 * application logic. `propertyId` is @unique on LeadPartner, so a property
 * can only ever be configured as a partner once; the Prisma unique-
 * constraint error is the second line of defence behind the pre-check below.
 */
/** Re-validates category/location slugs against the live tables — never trusts a raw, unchecked slug from a form. */
async function sanitizeEligibilitySlugs(formData: FormData) {
  const eligibleCategorySlugs = Array.from(new Set(formData.getAll("eligibleCategorySlugs").map(String)));
  const eligibleLocationSlugs = Array.from(new Set(formData.getAll("eligibleLocationSlugs").map(String)));
  const [validCategories, validLocations] = await Promise.all([
    eligibleCategorySlugs.length
      ? prisma.category.findMany({ where: { slug: { in: eligibleCategorySlugs } }, select: { slug: true } })
      : Promise.resolve([]),
    eligibleLocationSlugs.length
      ? prisma.location.findMany({ where: { slug: { in: eligibleLocationSlugs } }, select: { slug: true } })
      : Promise.resolve([]),
  ]);
  return {
    eligibleCategorySlugs: validCategories.map((c) => c.slug),
    eligibleLocationSlugs: validLocations.map((l) => l.slug),
  };
}

/** Parses "priority" (defaults to 0) and "monthlyLeadCap" (blank = unlimited/null) from a form — never trusts an out-of-range or non-numeric value. */
function parsePriorityAndCap(formData: FormData): { error?: string; priority: number; monthlyLeadCap: number | null } {
  const rawPriority = String(formData.get("priority") ?? "0").trim();
  const priority = rawPriority === "" ? 0 : Number(rawPriority);
  if (!Number.isInteger(priority)) return { error: "Priority must be a whole number.", priority: 0, monthlyLeadCap: null };

  const rawCap = String(formData.get("monthlyLeadCap") ?? "").trim();
  if (rawCap === "") return { priority, monthlyLeadCap: null };
  const monthlyLeadCap = Number(rawCap);
  if (!Number.isInteger(monthlyLeadCap) || monthlyLeadCap < 0) {
    return { error: "Monthly lead cap must be a non-negative whole number, or left blank for unlimited.", priority, monthlyLeadCap: null };
  }
  return { priority, monthlyLeadCap };
}

export async function createLeadPartner(
  _previousState: CreatePartnerState,
  formData: FormData
): Promise<CreatePartnerState> {
  await requireOwnerAccessAdmin();

  const propertyId = String(formData.get("propertyId") ?? "").trim();
  if (!propertyId) return { error: "Please choose a property." };

  const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { id: true } });
  if (!property) return { error: "That property could not be found." };

  const existing = await prisma.leadPartner.findUnique({ where: { propertyId }, select: { id: true } });
  if (existing) return { error: "This property is already configured as a lead partner." };

  const { priority, monthlyLeadCap, error: numberError } = parsePriorityAndCap(formData);
  if (numberError) return { error: numberError };
  const { eligibleCategorySlugs, eligibleLocationSlugs } = await sanitizeEligibilitySlugs(formData);

  try {
    await prisma.leadPartner.create({
      data: { propertyId, eligibleCategorySlugs, eligibleLocationSlugs, priority, monthlyLeadCap },
    });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
      return { error: "This property is already configured as a lead partner." };
    }
    throw error;
  }

  revalidatePath("/admin/partners");
  return {};
}

export interface UpdatePartnerEligibilityState {
  error?: string;
}

export async function updatePartnerEligibility(
  partnerId: string,
  _previousState: UpdatePartnerEligibilityState,
  formData: FormData
): Promise<UpdatePartnerEligibilityState> {
  await requireOwnerAccessAdmin();

  const { priority, monthlyLeadCap, error: numberError } = parsePriorityAndCap(formData);
  if (numberError) return { error: numberError };
  const { eligibleCategorySlugs, eligibleLocationSlugs } = await sanitizeEligibilitySlugs(formData);

  await prisma.leadPartner.update({
    where: { id: partnerId },
    data: { eligibleCategorySlugs, eligibleLocationSlugs, priority, monthlyLeadCap },
  });
  revalidatePath("/admin/partners");
  return {};
}

export async function setPartnerEnabled(partnerId: string, enabled: boolean): Promise<void> {
  await requireOwnerAccessAdmin();
  await prisma.leadPartner.update({ where: { id: partnerId }, data: { enabled } });
  revalidatePath("/admin/partners");
}
