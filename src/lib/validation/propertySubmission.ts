import { z } from "zod";
import { optionalEmail, optionalText, requiredEmail, requiredPhone, requiredText } from "./shared";

/**
 * Public "Add Your Property" form. Deliberately mirrors claimSubmissionSchema's
 * philosophy — minimal, no proof required up front, only ever creates a
 * PENDING PropertySubmission row (see actions.ts). categoryId/localityId are
 * always real existing ids picked from a dropdown (validated again
 * server-side against the live Category/Location tables) — a vendor can
 * never introduce an invented category or area through this form.
 */
export const propertySubmissionSchema = z.object({
  name: requiredText("Business/property name"),
  categoryId: requiredText("Category"),
  localityId: optionalText,
  address: optionalText,
  phone: optionalText,
  email: optionalEmail,
  website: optionalText,
  description: optionalText,
  contactName: requiredText("Contact name"),
  contactRole: requiredText("Your role"),
  contactEmail: requiredEmail,
  contactPhone: requiredPhone,
  venueDetails: optionalText,
  logoUrl: z.preprocess(
    (v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null),
    z.string().url("Logo must be a valid URL (including https://)").nullable()
  ),
  // One URL per line, up to MAX_SUBMISSION_PHOTOS — parsed in
  // parsePhotoUrls below rather than by Zod, so a bad line can be reported
  // clearly instead of failing the whole field opaquely.
  photoUrlsRaw: optionalText,
  // A real visitor never sees or fills this — see AddYourPropertyForm.tsx.
  honeypot: optionalText,
});

export type PropertySubmissionInput = z.infer<typeof propertySubmissionSchema>;

export const MAX_SUBMISSION_PHOTOS = 5;

/** Splits the textarea into real URLs only — blank lines dropped, never more than MAX_SUBMISSION_PHOTOS kept. */
export function parsePhotoUrls(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, MAX_SUBMISSION_PHOTOS);
}

/** True only when every line that parsePhotoUrls would keep is actually a valid URL — used to surface one clear validation error instead of silently dropping bad entries. */
export function allPhotoUrlsValid(raw: string | null): boolean {
  return parsePhotoUrls(raw).every((url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  });
}

/**
 * Pure transform from validated form input + server-resolved context
 * (sanitized facility ids, parsed photo urls, any detected duplicate) to the
 * PropertySubmission create payload. propertyId/slug/status/verificationStatus
 * are never part of this — a submission never touches the public Property
 * table by itself.
 */
export function buildPropertySubmissionCreateData(
  input: PropertySubmissionInput,
  context: { facilityIds: string[]; photoUrls: string[]; duplicateOfPropertyId: string | null }
) {
  return {
    name: input.name,
    categoryId: input.categoryId,
    localityId: input.localityId,
    address: input.address,
    phone: input.phone,
    email: input.email,
    website: input.website,
    description: input.description,
    contactName: input.contactName,
    contactRole: input.contactRole,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    facilityIds: context.facilityIds,
    venueDetails: input.venueDetails,
    logoUrl: input.logoUrl,
    photoUrls: context.photoUrls,
    duplicateOfPropertyId: context.duplicateOfPropertyId,
  };
}

/** Trims/lowercases/collapses whitespace so "The  Aangan Resort" and "the aangan resort" are recognized as the same obvious match. */
export function normalizeNameForDuplicateMatch(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export interface DuplicateCandidate {
  id: string;
  name: string;
  localityId: string | null;
}

/**
 * An "obvious" duplicate only — an exact name match (after normalization).
 * When both sides have a locality set, it must also match; if either side
 * has none, the name match alone is enough to flag it (never silently
 * assumes two same-named, different-area businesses are unrelated, since a
 * vendor may not know their listed locality). Never does fuzzy/approximate
 * matching or any external verification — exactly the "obvious" bar asked
 * for, nothing cleverer.
 */
export function findObviousDuplicate(
  submission: { name: string; localityId: string | null },
  candidates: DuplicateCandidate[]
): DuplicateCandidate | null {
  const normalizedSubmission = normalizeNameForDuplicateMatch(submission.name);
  return (
    candidates.find((candidate) => {
      if (normalizeNameForDuplicateMatch(candidate.name) !== normalizedSubmission) return false;
      if (submission.localityId && candidate.localityId) return submission.localityId === candidate.localityId;
      return true;
    }) ?? null
  );
}

export interface ApprovedSubmissionLike {
  name: string;
  categoryId: string;
  localityId: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  description: string | null;
}

/**
 * Pure — maps an approved submission's fields to a Property create payload.
 * Always DRAFT/DISCOVERED-eligible-for-publish fields: status is PUBLISHED
 * (the vendor is presumably the real owner, submitting their own real
 * business — the same trust bar a claimed-and-approved Discovery listing
 * already clears) and claimed is true (the submitter IS the owner), but
 * verificationStatus stays DISCOVERED — approval never fabricates
 * verification; that remains a separate, later, explicit admin decision,
 * exactly like claim approval. `slug` is generated by the caller (see
 * uniqueSlug) since it depends on which slugs already exist.
 */
export function buildPropertyCreateDataFromSubmission(submission: ApprovedSubmissionLike, slug: string) {
  return {
    slug,
    name: submission.name,
    categoryId: submission.categoryId,
    localityId: submission.localityId,
    address: submission.address,
    phone: submission.phone,
    email: submission.email,
    website: submission.website,
    shortDescription: submission.description,
    status: "PUBLISHED" as const,
    verificationStatus: "DISCOVERED" as const,
    claimed: true as const,
    source: "Vendor self-submission",
  };
}

/** Pure — the ClaimRequest created alongside an approved submission, so the vendor gets the exact same owner-access mechanism a claimed listing's owner would. */
export function buildClaimRequestDataFromSubmission(
  submission: { contactName: string; contactRole: string; contactEmail: string; contactPhone: string },
  params: { propertyId: string; adminId: string; now: Date }
) {
  return {
    propertyId: params.propertyId,
    ownerName: submission.contactName,
    email: submission.contactEmail,
    phone: submission.contactPhone,
    businessRole: submission.contactRole,
    status: "APPROVED" as const,
    reviewedAt: params.now,
    reviewedById: params.adminId,
  };
}

/**
 * Pure — maps an approved submission's own logo/photo URLs to PropertyImage
 * create payloads. These are real, vendor-supplied URLs (never generated or
 * fabricated), so they get the default PHOTO kind like any other first-party
 * image; the logo (if given) is simply first in display order. Returns `[]`
 * when the vendor supplied neither, since photos were always optional.
 */
export function buildPropertyImagesCreateDataFromSubmission(submission: {
  logoUrl: string | null;
  photoUrls: string[];
}): { url: string; sortOrder: number }[] {
  const urls = [...(submission.logoUrl ? [submission.logoUrl] : []), ...submission.photoUrls];
  return urls.map((url, index) => ({ url, sortOrder: index }));
}
