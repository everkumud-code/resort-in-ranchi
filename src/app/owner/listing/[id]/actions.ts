"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOwnerAccessForProperty } from "@/lib/auth/ownerAccess";
import { ownerPropertyUpdateSchema, buildOwnerPropertyUpdateData } from "@/lib/validation/ownerEdit";
import { venueSpaceSchema, buildVenueSpaceData } from "@/lib/validation/venueSpace";
import { propertyImageSchema, resolveImageSortOrder } from "@/lib/validation/propertyImage";
import { dedupeFacilityIds } from "@/lib/validation/facility";

export interface OwnerActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
  /** Only set on a validation failure, so a re-rendered form can echo back what the owner just typed instead of silently reverting every field to its last-saved value. */
  values?: Record<string, string>;
}

/** Every owner action starts here. Throws if the token doesn't authorize propertyId — never trusts the caller's claim about which property this is. */
async function assertOwnerAccess(propertyId: string) {
  const authorized = await requireOwnerAccessForProperty(propertyId);
  if (!authorized) throw new Error("Not authorized for this property.");
}

/** Every mutation revalidates both the edit page and the dashboard, so the Listing Quality section there always reflects the latest saved data. */
function revalidateOwnerPaths(propertyId: string) {
  revalidatePath(`/owner/listing/${propertyId}`);
  revalidatePath("/owner");
}

export async function updateOwnerProperty(
  propertyId: string,
  _prevState: OwnerActionState,
  formData: FormData
): Promise<OwnerActionState> {
  await assertOwnerAccess(propertyId);

  const rawValues = Object.fromEntries(formData.entries()) as Record<string, string>;
  const parsed = ownerPropertyUpdateSchema.safeParse(rawValues);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] = issue.message;
    return { error: "Please fix the errors below.", fieldErrors, values: rawValues };
  }

  await prisma.property.update({ where: { id: propertyId }, data: buildOwnerPropertyUpdateData(parsed.data) });
  revalidateOwnerPaths(propertyId);
  return { success: true };
}

export async function updateOwnerFacilities(
  propertyId: string,
  _prevState: OwnerActionState,
  formData: FormData
): Promise<OwnerActionState> {
  await assertOwnerAccess(propertyId);

  const submittedIds = dedupeFacilityIds(formData.getAll("facilityIds").map(String));
  const validFacilities = await prisma.facility.findMany({ where: { id: { in: submittedIds } }, select: { id: true } });
  const validIds = validFacilities.map((f) => f.id);

  await prisma.$transaction([
    prisma.propertyFacility.deleteMany({ where: { propertyId } }),
    prisma.propertyFacility.createMany({
      data: validIds.map((facilityId) => ({ propertyId, facilityId })),
      skipDuplicates: true,
    }),
  ]);
  revalidateOwnerPaths(propertyId);
  return { success: true };
}

export async function addOwnerVenueSpace(
  propertyId: string,
  _prevState: OwnerActionState,
  formData: FormData
): Promise<OwnerActionState> {
  await assertOwnerAccess(propertyId);

  const parsed = venueSpaceSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    capacityMin: formData.get("capacityMin"),
    capacityMax: formData.get("capacityMax"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] = issue.message;
    return { error: "Please fix the errors below.", fieldErrors };
  }

  await prisma.venueSpace.create({ data: { propertyId, ...buildVenueSpaceData(parsed.data) } });
  revalidateOwnerPaths(propertyId);
  return { success: true };
}

export async function deleteOwnerVenueSpace(propertyId: string, venueSpaceId: string): Promise<void> {
  await assertOwnerAccess(propertyId);
  await prisma.venueSpace.deleteMany({ where: { id: venueSpaceId, propertyId } });
  revalidateOwnerPaths(propertyId);
}

/** Owner-uploaded images are always the owner's own real photo or their real logo — never ILLUSTRATIVE, which is system-generated only. */
export async function addOwnerImage(
  propertyId: string,
  _prevState: OwnerActionState,
  formData: FormData
): Promise<OwnerActionState> {
  await assertOwnerAccess(propertyId);

  const requestedKind = formData.get("kind");
  const kind = requestedKind === "LOGO" ? "LOGO" : "PHOTO"; // never trust ILLUSTRATIVE from a client

  const parsed = propertyImageSchema.safeParse({
    url: formData.get("url"),
    altText: formData.get("altText"),
    caption: formData.get("caption"),
    sortOrder: "",
    kind,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] = issue.message;
    return { error: "Please fix the errors below.", fieldErrors };
  }

  const existingCount = await prisma.propertyImage.count({ where: { propertyId } });
  await prisma.propertyImage.create({
    data: {
      propertyId,
      url: parsed.data.url,
      altText: parsed.data.altText,
      caption: parsed.data.caption,
      sortOrder: resolveImageSortOrder(null, existingCount),
      kind: parsed.data.kind,
    },
  });
  revalidateOwnerPaths(propertyId);
  return { success: true };
}

export async function deleteOwnerImage(propertyId: string, imageId: string): Promise<void> {
  await assertOwnerAccess(propertyId);
  await prisma.propertyImage.deleteMany({ where: { id: imageId, propertyId } });
  revalidateOwnerPaths(propertyId);
}
