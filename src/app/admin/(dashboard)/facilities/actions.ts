"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { facilitySchema } from "@/lib/validation/facility";

export interface FacilityFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

function parseForm(formData: FormData) {
  return facilitySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
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

export async function createFacility(_prevState: FacilityFormState, formData: FormData): Promise<FacilityFormState> {
  await requireAdmin();

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const existing = await prisma.facility.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return { error: "Please fix the errors below.", fieldErrors: { slug: "This slug is already in use." } };
  }

  const created = await prisma.facility.create({
    data: { name: parsed.data.name, slug: parsed.data.slug },
  });

  revalidatePath("/admin/facilities");
  redirect(`/admin/facilities/${created.id}?saved=1`);
}

export async function updateFacility(
  facilityId: string,
  _prevState: FacilityFormState,
  formData: FormData
): Promise<FacilityFormState> {
  await requireAdmin();

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const slugOwner = await prisma.facility.findUnique({ where: { slug: parsed.data.slug } });
  if (slugOwner && slugOwner.id !== facilityId) {
    return { error: "Please fix the errors below.", fieldErrors: { slug: "This slug is already in use." } };
  }

  try {
    await prisma.facility.update({
      where: { id: facilityId },
      data: { name: parsed.data.name, slug: parsed.data.slug },
    });
  } catch {
    return { error: "Could not save changes." };
  }

  revalidatePath("/admin/facilities");
  revalidatePath(`/admin/facilities/${facilityId}`);
  redirect(`/admin/facilities/${facilityId}?saved=1`);
}
