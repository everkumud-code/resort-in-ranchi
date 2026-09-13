import { z } from "zod";
import { optionalInt, optionalText } from "./shared";

/**
 * Live — used by every owner Server Action in
 * src/app/owner/listing/[id]/actions.ts, each of which authenticates the
 * caller via requireOwnerAccessForProperty() (the passwordless owner-access
 * token/session system in lib/auth/ownerAccess.ts) before touching any
 * data. This module's job is narrower and stays true regardless of how that
 * authentication evolves: it's the allowlist boundary — validate input
 * through ownerPropertyUpdateSchema below, persist only via
 * buildOwnerPropertyUpdateData below.
 *
 * An owner may only ever touch business-facing fields. Lifecycle, trust,
 * provenance, and admin-only fields are permanently out of reach here —
 * this schema has no key for any of them, so they can never be smuggled in
 * as unrecognized/extra input.
 *
 * Not yet built: a per-edit audit log (who changed what, when) — a real gap
 * worth adding in a future pass, but out of scope for this one.
 */
/**
 * Kept as its own object schema (rather than only the refined export below)
 * so the field allowlist stays introspectable via `.shape` — see
 * ownerEdit.test.ts's "no key for any forbidden field" check, which would
 * otherwise have no direct way to enumerate the allowed keys once range
 * validation wraps the object in a ZodEffects.
 */
export const ownerPropertyUpdateShape = z.object({
  shortDescription: optionalText,
  fullDescription: optionalText,
  address: optionalText,
  pincode: optionalText,
  phone: optionalText,
  whatsapp: optionalText,
  email: optionalText,
  website: optionalText,
  googleMapsUrl: optionalText,
  priceMin: optionalInt,
  priceMax: optionalInt,
  priceLabel: optionalText,
  rooms: optionalInt,
  eventCapacityMin: optionalInt,
  eventCapacityMax: optionalInt,
});

/**
 * Range checks mirror venueSpaceSchema's existing capacityMin/capacityMax
 * pattern exactly (non-negative, max >= min) — same rule, same shape,
 * applied to price and room/event capacity so an owner gets an honest
 * inline error instead of a nonsensical value silently saving. Combined into
 * one superRefine (rather than several chained .refine() calls) so the
 * schema wraps ownerPropertyUpdateShape exactly once.
 */
export const ownerPropertyUpdateSchema = ownerPropertyUpdateShape.superRefine((v, ctx) => {
  if (v.priceMin !== null && v.priceMin < 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Must be 0 or more", path: ["priceMin"] });
  }
  if (v.priceMax !== null && v.priceMax < 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Must be 0 or more", path: ["priceMax"] });
  }
  if (v.priceMin !== null && v.priceMax !== null && v.priceMax < v.priceMin) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Max price must be greater than or equal to min price", path: ["priceMax"] });
  }
  if (v.rooms !== null && v.rooms < 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Must be 0 or more", path: ["rooms"] });
  }
  if (v.eventCapacityMin !== null && v.eventCapacityMin < 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Must be 0 or more", path: ["eventCapacityMin"] });
  }
  if (v.eventCapacityMax !== null && v.eventCapacityMax < 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Must be 0 or more", path: ["eventCapacityMax"] });
  }
  if (v.eventCapacityMin !== null && v.eventCapacityMax !== null && v.eventCapacityMax < v.eventCapacityMin) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Max capacity must be greater than or equal to min capacity",
      path: ["eventCapacityMax"],
    });
  }
});

export type OwnerPropertyUpdateInput = z.infer<typeof ownerPropertyUpdateSchema>;

/**
 * Fields an owner must never be able to set, regardless of what a future
 * form or client sends — asserted by tests against the schema/builder
 * outputs so a careless future edit can't silently widen owner access.
 */
export const OWNER_FORBIDDEN_FIELDS = [
  "id",
  "slug",
  "status",
  "verificationStatus",
  "claimed",
  "ownerVerified",
  "featured",
  "categoryId",
  "localityId",
  "sourceRecordId",
  "source",
  "sourceUrl",
  "sourceLastCheckedAt",
  "mergedFromSourceRecordIds",
  "lastVerifiedAt",
  "generatedIdentityMarkUrl",
  "createdAt",
  "updatedAt",
] as const;

/**
 * Pure transform from validated owner input to a Prisma update payload.
 * Only ever reads the allowlisted keys above — there is no path from
 * arbitrary/extra input fields into the returned object.
 */
export function buildOwnerPropertyUpdateData(input: OwnerPropertyUpdateInput) {
  return {
    shortDescription: input.shortDescription,
    fullDescription: input.fullDescription,
    address: input.address,
    pincode: input.pincode,
    phone: input.phone,
    whatsapp: input.whatsapp,
    email: input.email,
    website: input.website,
    googleMapsUrl: input.googleMapsUrl,
    priceMin: input.priceMin,
    priceMax: input.priceMax,
    priceLabel: input.priceLabel,
    rooms: input.rooms,
    eventCapacityMin: input.eventCapacityMin,
    eventCapacityMax: input.eventCapacityMax,
  };
}
