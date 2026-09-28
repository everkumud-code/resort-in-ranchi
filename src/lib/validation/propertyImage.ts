import { z } from "zod";
import { checkbox, optionalInt, optionalText } from "./shared";

/** Mirrors the Prisma PropertyImageKind enum exactly. */
export const PROPERTY_IMAGE_KIND_VALUES = ["PHOTO", "ILLUSTRATIVE", "LOGO"] as const;

/** Admin-facing labels — deliberately spell out what each kind actually is, so an admin never picks the wrong one by accident. */
export const PROPERTY_IMAGE_KIND_LABELS: Record<(typeof PROPERTY_IMAGE_KIND_VALUES)[number], string> = {
  PHOTO: "Photo (real, first-party)",
  ILLUSTRATIVE: "Illustrative (generated placeholder)",
  LOGO: "Generated identity mark (not an official logo)",
};

/**
 * What a photo shows — the choices offered when adding a picture, shown as a
 * label on the listing page. Kept as code (not an enum) so new tags need no
 * database migration.
 */
export const PROPERTY_IMAGE_TAG_LABELS = {
  exterior: "Exterior / building",
  lawn: "Lawn / garden",
  rooms: "Rooms / bedrooms",
  bathroom: "Bathroom",
  hall: "Banquet / event hall",
  stage: "Stage / décor",
  dining: "Dining / restaurant",
  food: "Food / dishes",
  kitchen: "Kitchen",
  bar: "Bar / lounge",
  reception: "Reception / lobby",
  parking: "Parking",
  pool: "Swimming pool",
  play: "Play area / kids",
  spa: "Spa / gym",
  view: "View / surroundings",
  other: "Other",
} as const;

export type PropertyImageTag = keyof typeof PROPERTY_IMAGE_TAG_LABELS;
export const PROPERTY_IMAGE_TAG_VALUES = Object.keys(PROPERTY_IMAGE_TAG_LABELS) as PropertyImageTag[];

/** Human label for a stored tag, or null for untagged / an unknown value. */
export function getImageTagLabel(tag: string | null | undefined): string | null {
  return tag && Object.hasOwn(PROPERTY_IMAGE_TAG_LABELS, tag) ? PROPERTY_IMAGE_TAG_LABELS[tag as PropertyImageTag] : null;
}

/** Only a real photo can be the hero/thumbnail — never a logo or a generated illustration. */
export function canBeHero(kind: string): boolean {
  return kind === "PHOTO";
}

/**
 * URL-only for this milestone — no file upload, no storage/CDN dependency.
 * An admin pastes a link to an already-hosted image (matching how
 * website/googleMapsUrl are handled elsewhere in the property form).
 *
 * `kind` defaults to PHOTO when left blank/missing — the overwhelmingly
 * common case (a genuine first-party photo) — never silently defaulting to
 * ILLUSTRATIVE or LOGO, which an admin must select explicitly.
 */
export const propertyImageSchema = z.object({
  url: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z.string().min(1, "Image URL is required").url("Must be a valid URL (including https://)")
  ),
  altText: optionalText,
  caption: optionalText,
  sortOrder: optionalInt,
  kind: z.preprocess(
    (v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : "PHOTO"),
    z.enum(PROPERTY_IMAGE_KIND_VALUES)
  ),
  // "" / missing = untagged; anything that isn't a known tag is rejected.
  tag: z.preprocess(
    (v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null),
    z.enum(PROPERTY_IMAGE_TAG_VALUES as [PropertyImageTag, ...PropertyImageTag[]]).nullable()
  ),
  isHero: checkbox,
});

export type PropertyImageInput = z.infer<typeof propertyImageSchema>;

/**
 * An explicit sortOrder always wins. When the admin leaves it blank: adding a
 * new image appends it after the property's existing images (pass the
 * current image count as `fallback`) rather than defaulting to 0, which
 * would keep bumping every new image to the front; editing an image keeps
 * its current position (pass its existing sortOrder as `fallback`).
 */
export function resolveImageSortOrder(submitted: number | null, fallback: number): number {
  return submitted ?? fallback;
}
