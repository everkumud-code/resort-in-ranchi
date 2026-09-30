import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { checkbox, optionalFloat, optionalInt, optionalText, slugField } from "./shared";

export const PROPERTY_STATUS_VALUES = ["DRAFT", "PUBLISHED", "ARCHIVED", "CLOSED"] as const;
export const VERIFICATION_STATUS_VALUES = [
  "DISCOVERED",
  "VERIFIED",
  "OWNER_CLAIMED",
  "OWNER_VERIFIED",
  "CLOSED",
  "NEEDS_REVIEW",
] as const;

/**
 * Generic property details schema — deliberately excludes `status` and
 * `verificationStatus`. Lifecycle transitions (publish, verify, review,
 * close) are separate, explicit Server Actions in lifecycleActions.ts —
 * an ordinary "save my edits" submit from this form can never change
 * publish/verification state or touch `lastVerifiedAt`. See
 * propertyLifecycle.ts and lifecycleActions.ts.
 */
export const propertyUpdateSchema = z
  .object({
    name: z.preprocess((v) => (typeof v === "string" ? v.trim() : v), z.string().min(1, "Name is required")),
    slug: slugField,
    categoryId: z.preprocess((v) => (typeof v === "string" ? v.trim() : v), z.string().min(1, "Category is required")),
    localityId: optionalText,
    shortDescription: optionalText,
    fullDescription: optionalText,
    address: optionalText,
    city: z.preprocess((v) => (typeof v === "string" ? v.trim() : v), z.string().min(1, "City is required")),
    state: z.preprocess((v) => (typeof v === "string" ? v.trim() : v), z.string().min(1, "State is required")),
    pincode: optionalText,
    latitude: optionalFloat,
    longitude: optionalFloat,
    phone: optionalText,
    whatsapp: optionalText,
    email: optionalText,
    website: optionalText,
    googleMapsUrl: optionalText,
    generatedIdentityMarkUrl: optionalText,
    googleRating: optionalFloat,
    reviewCount: optionalInt,
    priceMin: optionalInt,
    priceMax: optionalInt,
    priceLabel: optionalText,
    rooms: optionalInt,
    eventCapacityMin: optionalInt,
    eventCapacityMax: optionalInt,
    claimed: checkbox,
    ownerVerified: checkbox,
    featured: checkbox,
  })
  .refine((v) => v.googleRating === null || (v.googleRating >= 0 && v.googleRating <= 5), {
    message: "Rating must be between 0 and 5",
    path: ["googleRating"],
  })
  .refine((v) => v.priceMin === null || v.priceMin >= 0, { message: "Must be 0 or more", path: ["priceMin"] })
  .refine((v) => v.priceMax === null || v.priceMax >= 0, { message: "Must be 0 or more", path: ["priceMax"] })
  .refine((v) => v.priceMin === null || v.priceMax === null || v.priceMax >= v.priceMin, {
    message: "Max price must be greater than or equal to min price",
    path: ["priceMax"],
  })
  .refine((v) => v.rooms === null || v.rooms >= 0, { message: "Must be 0 or more", path: ["rooms"] })
  .refine((v) => v.reviewCount === null || v.reviewCount >= 0, { message: "Must be 0 or more", path: ["reviewCount"] })
  .refine(
    (v) => v.eventCapacityMin === null || v.eventCapacityMax === null || v.eventCapacityMax >= v.eventCapacityMin,
    { message: "Max capacity must be greater than or equal to min capacity", path: ["eventCapacityMax"] }
  );

export type PropertyUpdateInput = z.infer<typeof propertyUpdateSchema>;

/**
 * Pure transform from validated input to a Prisma update payload. Contains
 * no lifecycle fields at all — status/verificationStatus/lastVerifiedAt are
 * only ever written by the dedicated actions in lifecycleActions.ts.
 */
export function buildPropertyUpdateData(input: PropertyUpdateInput): Prisma.PropertyUpdateInput {
  return {
    name: input.name,
    slug: input.slug,
    category: { connect: { id: input.categoryId } },
    locality: input.localityId ? { connect: { id: input.localityId } } : { disconnect: true },
    shortDescription: input.shortDescription,
    fullDescription: input.fullDescription,
    address: input.address,
    city: input.city,
    state: input.state,
    pincode: input.pincode,
    latitude: input.latitude,
    longitude: input.longitude,
    phone: input.phone,
    whatsapp: input.whatsapp,
    email: input.email,
    website: input.website,
    googleMapsUrl: input.googleMapsUrl,
    generatedIdentityMarkUrl: input.generatedIdentityMarkUrl,
    googleRating: input.googleRating,
    reviewCount: input.reviewCount,
    priceMin: input.priceMin,
    priceMax: input.priceMax,
    priceLabel: input.priceLabel,
    rooms: input.rooms,
    eventCapacityMin: input.eventCapacityMin,
    eventCapacityMax: input.eventCapacityMax,
    claimed: input.claimed,
    ownerVerified: input.ownerVerified,
    featured: input.featured,
  };
}

/**
 * Pure transform from validated input to a Prisma create payload, for an
 * admin manually adding a listing (as opposed to a bulk import). Starts
 * DRAFT/DISCOVERED like every other new listing — an admin uses the
 * Lifecycle panel on the listing's own page to publish or verify it, same
 * as for an imported one, so there's one honest path to "live" either way.
 */
export function buildPropertyCreateData(input: PropertyUpdateInput): Prisma.PropertyCreateInput {
  return {
    name: input.name,
    slug: input.slug,
    category: { connect: { id: input.categoryId } },
    locality: input.localityId ? { connect: { id: input.localityId } } : undefined,
    shortDescription: input.shortDescription,
    fullDescription: input.fullDescription,
    address: input.address,
    city: input.city,
    state: input.state,
    pincode: input.pincode,
    latitude: input.latitude,
    longitude: input.longitude,
    phone: input.phone,
    whatsapp: input.whatsapp,
    email: input.email,
    website: input.website,
    googleMapsUrl: input.googleMapsUrl,
    generatedIdentityMarkUrl: input.generatedIdentityMarkUrl,
    googleRating: input.googleRating,
    reviewCount: input.reviewCount,
    priceMin: input.priceMin,
    priceMax: input.priceMax,
    priceLabel: input.priceLabel,
    rooms: input.rooms,
    eventCapacityMin: input.eventCapacityMin,
    eventCapacityMax: input.eventCapacityMax,
    claimed: input.claimed,
    ownerVerified: input.ownerVerified,
    featured: input.featured,
    status: "DRAFT",
    verificationStatus: "DISCOVERED",
    commercialTier: "FREE",
    source: "Added manually by admin",
  };
}
