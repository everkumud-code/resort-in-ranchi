"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { canPublish, IDENTITY_CONFLICT_PROPERTY_IDS } from "@/lib/validation/propertyLifecycle";
import { isValidCommercialTier } from "@/lib/validation/commercial";

async function getPropertyOrThrow(propertyId: string) {
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) throw new Error("Property not found.");
  return property;
}

/** Flags a property for admin review. Never touches lastVerifiedAt or status. */
export async function markNeedsReview(propertyId: string): Promise<void> {
  await requireAdmin();
  await getPropertyOrThrow(propertyId);

  await prisma.property.update({
    where: { id: propertyId },
    data: { verificationStatus: "NEEDS_REVIEW" },
  });

  revalidatePath("/admin/properties");
  revalidatePath(`/admin/properties/${propertyId}`);
  redirect(`/admin/properties/${propertyId}?lifecycle=needs-review`);
}

/**
 * The ONLY action in this codebase that stamps lastVerifiedAt — a deliberate
 * admin confirmation that they checked this listing against a real source,
 * never a side effect of opening or editing a record. Never touches status.
 */
export async function markVerified(propertyId: string): Promise<void> {
  await requireAdmin();
  await getPropertyOrThrow(propertyId);

  await prisma.property.update({
    where: { id: propertyId },
    data: { verificationStatus: "VERIFIED", lastVerifiedAt: new Date() },
  });

  revalidatePath("/admin/properties");
  revalidatePath(`/admin/properties/${propertyId}`);
  redirect(`/admin/properties/${propertyId}?lifecycle=verified`);
}

export interface SetCommercialTierState {
  error?: string;
}

/**
 * A deliberately separate, explicit action — never bundled into the general
 * updateProperty edit form — so a commercial-tier change is always its own
 * distinct decision, easy to audit later once real billing exists. Never
 * touches featured/verificationStatus/status, and nothing else in this
 * codebase ever calls this: no action anywhere sets commercialTier as a side
 * effect of publishing, verifying, featuring, or configuring a LeadPartner.
 */
export async function setCommercialTier(
  propertyId: string,
  _prevState: SetCommercialTierState,
  formData: FormData
): Promise<SetCommercialTierState> {
  await requireAdmin();
  await getPropertyOrThrow(propertyId);

  const tier = String(formData.get("commercialTier") ?? "");
  if (!isValidCommercialTier(tier)) {
    return { error: "Invalid commercial tier." };
  }

  await prisma.property.update({ where: { id: propertyId }, data: { commercialTier: tier } });

  revalidatePath("/admin/properties");
  revalidatePath("/admin/vendors");
  revalidatePath(`/admin/properties/${propertyId}`);
  return {};
}

export interface PublishState {
  error?: string;
  reasons?: string[];
}

/**
 * Publishing is deliberately its own action, gated by canPublish() using
 * data re-read fresh from the database (never trusting whatever the client
 * last rendered) — this is the server-side half of the two-step publish
 * confirmation; PublishPanel.tsx provides the client-side review step.
 * Only ever sets `status`. Never touches verificationStatus or
 * lastVerifiedAt — publishing and verifying stay conceptually separate.
 */
/* eslint-disable @typescript-eslint/no-unused-vars -- prevState/formData are required by useActionState's action signature even though this action takes no form fields */
export async function publishProperty(
  propertyId: string,
  _prevState: PublishState,
  _formData: FormData
): Promise<PublishState> {
  /* eslint-enable @typescript-eslint/no-unused-vars */
  await requireAdmin();
  const property = await getPropertyOrThrow(propertyId);

  const eligibility = canPublish({
    verificationStatus: property.verificationStatus,
    address: property.address,
    phone: property.phone,
    website: property.website,
    blockedByIdentityConflict: IDENTITY_CONFLICT_PROPERTY_IDS.has(property.id),
  });

  if (!eligibility.ok) {
    return { error: "This property can't be published yet.", reasons: eligibility.reasons };
  }

  await prisma.property.update({
    where: { id: propertyId },
    data: { status: "PUBLISHED" },
  });

  revalidatePath("/admin/properties");
  revalidatePath(`/admin/properties/${propertyId}`);
  revalidatePath("/");
  redirect(`/admin/properties/${propertyId}?lifecycle=published`);
}

/**
 * PUBLISHED → DRAFT. Used when a listing is intentionally taken off the
 * public site but may still be reviewed, edited, verified and published
 * again later (as opposed to Close Listing, which is a more permanent
 * retirement). Never touches lastVerifiedAt.
 */
export async function unpublishProperty(propertyId: string): Promise<void> {
  await requireAdmin();
  await getPropertyOrThrow(propertyId);

  await prisma.property.update({
    where: { id: propertyId },
    data: { status: "DRAFT" },
  });

  revalidatePath("/admin/properties");
  revalidatePath(`/admin/properties/${propertyId}`);
  revalidatePath("/");
  redirect(`/admin/properties/${propertyId}?lifecycle=unpublished`);
}

/**
 * Marks a business as permanently closed — sets both status and
 * verificationStatus to CLOSED, since a closed business is both confirmed
 * closed (a verification fact) and must never be publicly visible.
 */
export async function closeListing(propertyId: string): Promise<void> {
  await requireAdmin();
  await getPropertyOrThrow(propertyId);

  await prisma.property.update({
    where: { id: propertyId },
    data: { status: "CLOSED", verificationStatus: "CLOSED" },
  });

  revalidatePath("/admin/properties");
  revalidatePath(`/admin/properties/${propertyId}`);
  revalidatePath("/");
  redirect(`/admin/properties/${propertyId}?lifecycle=closed`);
}
