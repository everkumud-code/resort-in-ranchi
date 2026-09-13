"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { venueSpaceSchema, buildVenueSpaceData } from "@/lib/validation/venueSpace";

export interface VenueSpaceFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

function parseForm(formData: FormData) {
  return venueSpaceSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    capacityMin: formData.get("capacityMin"),
    capacityMax: formData.get("capacityMax"),
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

export async function addVenueSpace(
  propertyId: string,
  _prevState: VenueSpaceFormState,
  formData: FormData
): Promise<VenueSpaceFormState> {
  await requireAdmin();

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) {
    return { error: "Property not found." };
  }

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  await prisma.venueSpace.create({
    data: { propertyId, ...buildVenueSpaceData(parsed.data) },
  });

  revalidatePath(`/admin/properties/${propertyId}`);
  redirect(`/admin/properties/${propertyId}?saved=1`);
}

export async function updateVenueSpace(
  venueSpaceId: string,
  _prevState: VenueSpaceFormState,
  formData: FormData
): Promise<VenueSpaceFormState> {
  await requireAdmin();

  const existing = await prisma.venueSpace.findUnique({ where: { id: venueSpaceId } });
  if (!existing) {
    return { error: "Venue space not found." };
  }

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  await prisma.venueSpace.update({
    where: { id: venueSpaceId },
    data: buildVenueSpaceData(parsed.data),
  });

  revalidatePath(`/admin/properties/${existing.propertyId}`);
  redirect(`/admin/properties/${existing.propertyId}?saved=1`);
}

/** Deleting always keeps its own confirmation step client-side (ConfirmForm). */
export async function deleteVenueSpace(venueSpaceId: string): Promise<void> {
  await requireAdmin();

  const existing = await prisma.venueSpace.findUnique({ where: { id: venueSpaceId } });
  if (!existing) return;

  await prisma.venueSpace.delete({ where: { id: venueSpaceId } });

  revalidatePath(`/admin/properties/${existing.propertyId}`);
  redirect(`/admin/properties/${existing.propertyId}?saved=1`);
}
