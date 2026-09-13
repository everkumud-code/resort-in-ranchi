"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { locationSchema, isValidParent } from "@/lib/validation/location";

export interface LocationFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

function parseForm(formData: FormData) {
  return locationSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    parentId: formData.get("parentId"),
    description: formData.get("description"),
    seoTitle: formData.get("seoTitle"),
    seoDescription: formData.get("seoDescription"),
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

export async function createLocation(_prevState: LocationFormState, formData: FormData): Promise<LocationFormState> {
  await requireAdmin();

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  if (!isValidParent(null, parsed.data.parentId)) {
    return { error: "Please fix the errors below.", fieldErrors: { parentId: "A location can't be its own parent." } };
  }

  const existing = await prisma.location.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return { error: "Please fix the errors below.", fieldErrors: { slug: "This slug is already in use." } };
  }

  const created = await prisma.location.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      parentId: parsed.data.parentId,
      description: parsed.data.description,
      seoTitle: parsed.data.seoTitle,
      seoDescription: parsed.data.seoDescription,
    },
  });

  revalidatePath("/admin/locations");
  redirect(`/admin/locations/${created.id}?saved=1`);
}

export async function updateLocation(
  locationId: string,
  _prevState: LocationFormState,
  formData: FormData
): Promise<LocationFormState> {
  await requireAdmin();

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  if (!isValidParent(locationId, parsed.data.parentId)) {
    return { error: "Please fix the errors below.", fieldErrors: { parentId: "A location can't be its own parent." } };
  }

  const slugOwner = await prisma.location.findUnique({ where: { slug: parsed.data.slug } });
  if (slugOwner && slugOwner.id !== locationId) {
    return { error: "Please fix the errors below.", fieldErrors: { slug: "This slug is already in use." } };
  }

  try {
    await prisma.location.update({
      where: { id: locationId },
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        parentId: parsed.data.parentId,
        description: parsed.data.description,
        seoTitle: parsed.data.seoTitle,
        seoDescription: parsed.data.seoDescription,
      },
    });
  } catch {
    return { error: "Could not save changes." };
  }

  revalidatePath("/admin/locations");
  revalidatePath(`/admin/locations/${locationId}`);
  redirect(`/admin/locations/${locationId}?saved=1`);
}
