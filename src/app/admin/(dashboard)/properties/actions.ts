"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { buildPropertyCreateData, buildPropertyUpdateData, propertyUpdateSchema } from "@/lib/validation/property";
import { dedupeFacilityIds } from "@/lib/validation/facility";

export interface UpdatePropertyState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Admin only. Manually adds a listing (as opposed to a bulk import). Starts
 * DRAFT/DISCOVERED like every other new listing — see buildPropertyCreateData.
 */
export async function createProperty(_prevState: UpdatePropertyState, formData: FormData): Promise<UpdatePropertyState> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = propertyUpdateSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.map(String).join(".");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Please fix the errors below.", fieldErrors };
  }

  const slugOwner = await prisma.property.findUnique({ where: { slug: parsed.data.slug } });
  if (slugOwner) {
    return { error: "Please fix the errors below.", fieldErrors: { slug: "This slug is already used by another property." } };
  }

  const data = buildPropertyCreateData(parsed.data);

  let created;
  try {
    created = await prisma.property.create({ data });
  } catch {
    return { error: "Could not create the listing. The category or location may not exist." };
  }

  revalidatePath("/admin/properties");
  redirect(`/admin/properties/${created.id}?created=1`);
}

export async function updateProperty(
  propertyId: string,
  _prevState: UpdatePropertyState,
  formData: FormData
): Promise<UpdatePropertyState> {
  await requireAdmin(); // never trust the client — re-verify on every mutation

  const raw = Object.fromEntries(formData.entries());
  const parsed = propertyUpdateSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.map(String).join(".");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Please fix the errors below.", fieldErrors };
  }

  const existing = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!existing) {
    return { error: "Property not found." };
  }

  // Slug must stay unique — check against every other property.
  const slugOwner = await prisma.property.findUnique({ where: { slug: parsed.data.slug } });
  if (slugOwner && slugOwner.id !== propertyId) {
    return { error: "Please fix the errors below.", fieldErrors: { slug: "This slug is already used by another property." } };
  }

  const data = buildPropertyUpdateData(parsed.data);

  try {
    await prisma.property.update({ where: { id: propertyId }, data });
  } catch {
    return { error: "Could not save changes. The category or location may no longer exist." };
  }

  revalidatePath("/admin/properties");
  revalidatePath(`/admin/properties/${propertyId}`);
  redirect(`/admin/properties/${propertyId}?saved=1`);
}

export interface UpdateFacilitiesState {
  error?: string;
}

/**
 * Replaces a property's full set of PropertyFacility links with the
 * submitted selection. Deliberately its own action — separate from
 * updateProperty — since it edits a relation table, not a Property column.
 */
export async function updatePropertyFacilities(
  propertyId: string,
  _prevState: UpdateFacilitiesState,
  formData: FormData
): Promise<UpdateFacilitiesState> {
  await requireAdmin();

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) {
    return { error: "Property not found." };
  }

  const submittedIds = dedupeFacilityIds(formData.getAll("facilityIds").map(String));
  const validFacilities = await prisma.facility.findMany({
    where: { id: { in: submittedIds } },
    select: { id: true },
  });
  const validIds = validFacilities.map((f) => f.id);

  await prisma.$transaction([
    prisma.propertyFacility.deleteMany({ where: { propertyId } }),
    prisma.propertyFacility.createMany({
      data: validIds.map((facilityId) => ({ propertyId, facilityId })),
      skipDuplicates: true,
    }),
  ]);

  revalidatePath(`/admin/properties/${propertyId}`);
  redirect(`/admin/properties/${propertyId}?saved=1`);
}
