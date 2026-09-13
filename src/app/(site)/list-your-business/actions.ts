"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { dedupeFacilityIds } from "@/lib/validation/facility";
import {
  propertySubmissionSchema,
  buildPropertySubmissionCreateData,
  findObviousDuplicate,
  parsePhotoUrls,
  allPhotoUrlsValid,
} from "@/lib/validation/propertySubmission";

export interface PropertySubmissionFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

/**
 * Public — anyone can submit, no login required. Only ever creates a
 * PENDING PropertySubmission row; never creates or modifies a Property.
 * category/locality are re-validated against the live tables server-side
 * even though the form only ever offers a <select> of real ids, so a
 * tampered request can't smuggle in an id for a category/location that
 * doesn't exist.
 */
export async function submitPropertySubmission(
  _prevState: PropertySubmissionFormState,
  formData: FormData
): Promise<PropertySubmissionFormState> {
  const parsed = propertySubmissionSchema.safeParse({
    name: formData.get("name"),
    categoryId: formData.get("categoryId"),
    localityId: formData.get("localityId"),
    address: formData.get("address"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    website: formData.get("website"),
    description: formData.get("description"),
    contactName: formData.get("contactName"),
    contactRole: formData.get("contactRole"),
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone"),
    venueDetails: formData.get("venueDetails"),
    logoUrl: formData.get("logoUrl"),
    photoUrlsRaw: formData.get("photoUrlsRaw"),
    // Honeypot: a real visitor never sees or fills this (see AddYourPropertyForm.tsx).
    honeypot: formData.get("hp_field"),
  });
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  if (parsed.data.honeypot) {
    // Silently pretend success — never tip off a bot about what tripped it.
    redirect("/list-your-business?submitted=1");
  }

  if (!allPhotoUrlsValid(parsed.data.photoUrlsRaw)) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: { photoUrlsRaw: "Each line must be a valid URL (including https://)." },
    };
  }

  const category = await prisma.category.findUnique({ where: { id: parsed.data.categoryId }, select: { id: true } });
  if (!category) {
    return { error: "Please choose a valid category.", fieldErrors: { categoryId: "Please choose a category from the list." } };
  }
  if (parsed.data.localityId) {
    const locality = await prisma.location.findUnique({ where: { id: parsed.data.localityId }, select: { id: true } });
    if (!locality) {
      return { error: "Please choose a valid location.", fieldErrors: { localityId: "Please choose a location from the list." } };
    }
  }

  const submittedFacilityIds = dedupeFacilityIds(formData.getAll("facilityIds").map(String));
  const validFacilities = submittedFacilityIds.length
    ? await prisma.facility.findMany({ where: { id: { in: submittedFacilityIds } }, select: { id: true } })
    : [];
  const facilityIds = validFacilities.map((f) => f.id);
  const photoUrls = parsePhotoUrls(parsed.data.photoUrlsRaw);

  // "Obvious duplicate" only — a bounded, cheap name-prefix query, never a
  // full-table scan and never any external/manual verification. A match
  // never blocks the submission; it's flagged for the admin to judge (see
  // findObviousDuplicate's own doc comment for exactly what counts as
  // "obvious").
  const firstWord = parsed.data.name.trim().split(/\s+/)[0];
  const candidateProperties = firstWord
    ? await prisma.property.findMany({
        where: { name: { contains: firstWord, mode: "insensitive" } },
        select: { id: true, name: true, localityId: true },
        take: 20,
      })
    : [];
  const duplicate = findObviousDuplicate(
    { name: parsed.data.name, localityId: parsed.data.localityId },
    candidateProperties
  );

  await prisma.propertySubmission.create({
    data: buildPropertySubmissionCreateData(parsed.data, {
      facilityIds,
      photoUrls,
      duplicateOfPropertyId: duplicate?.id ?? null,
    }),
  });

  redirect("/list-your-business?submitted=1");
}
