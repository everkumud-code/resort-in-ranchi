"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { canBeHero, propertyImageSchema, resolveImageSortOrder } from "@/lib/validation/propertyImage";
import { clearPropertyHero, setPropertyHero } from "@/lib/propertyImageHero";

export interface PropertyImageFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

function parseForm(formData: FormData) {
  return propertyImageSchema.safeParse({
    url: formData.get("url"),
    altText: formData.get("altText"),
    caption: formData.get("caption"),
    sortOrder: formData.get("sortOrder"),
    kind: formData.get("kind"),
    tag: formData.get("tag"),
    isHero: formData.get("isHero"),
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

export async function addPropertyImage(
  propertyId: string,
  _prevState: PropertyImageFormState,
  formData: FormData
): Promise<PropertyImageFormState> {
  await requireAdmin();

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) {
    return { error: "Property not found." };
  }

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const existingCount = await prisma.propertyImage.count({ where: { propertyId } });

  const created = await prisma.propertyImage.create({
    data: {
      propertyId,
      url: parsed.data.url,
      altText: parsed.data.altText,
      caption: parsed.data.caption,
      sortOrder: resolveImageSortOrder(parsed.data.sortOrder, existingCount),
      kind: parsed.data.kind,
      tag: parsed.data.tag,
    },
  });
  if (parsed.data.isHero) await setPropertyHero(propertyId, created.id);

  revalidatePath(`/admin/properties/${propertyId}`);
  revalidatePath("/", "layout");
  redirect(`/admin/properties/${propertyId}?saved=1`);
}

export async function updatePropertyImage(
  imageId: string,
  _prevState: PropertyImageFormState,
  formData: FormData
): Promise<PropertyImageFormState> {
  await requireAdmin();

  const existing = await prisma.propertyImage.findUnique({ where: { id: imageId } });
  if (!existing) {
    return { error: "Image not found." };
  }

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  await prisma.propertyImage.update({
    where: { id: imageId },
    data: {
      url: parsed.data.url,
      altText: parsed.data.altText,
      caption: parsed.data.caption,
      sortOrder: resolveImageSortOrder(parsed.data.sortOrder, existing.sortOrder),
      kind: parsed.data.kind,
      tag: parsed.data.tag,
    },
  });
  if (parsed.data.isHero && canBeHero(parsed.data.kind)) await setPropertyHero(existing.propertyId, imageId);
  else await clearPropertyHero(existing.propertyId, imageId);

  revalidatePath(`/admin/properties/${existing.propertyId}`);
  revalidatePath("/", "layout");
  redirect(`/admin/properties/${existing.propertyId}?saved=1`);
}

/** Deleting always keeps its own confirmation step client-side (ConfirmForm). */
export async function deletePropertyImage(imageId: string): Promise<void> {
  await requireAdmin();

  const existing = await prisma.propertyImage.findUnique({ where: { id: imageId } });
  if (!existing) return;

  await prisma.propertyImage.delete({ where: { id: imageId } });

  revalidatePath(`/admin/properties/${existing.propertyId}`);
  redirect(`/admin/properties/${existing.propertyId}?saved=1`);
}
