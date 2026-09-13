import { z } from "zod";
import { optionalInt, optionalText } from "./shared";

/** Mirrors the Prisma PropertyImageKind enum exactly. */
export const PROPERTY_IMAGE_KIND_VALUES = ["PHOTO", "ILLUSTRATIVE", "LOGO"] as const;

/** Admin-facing labels — deliberately spell out what each kind actually is, so an admin never picks the wrong one by accident. */
export const PROPERTY_IMAGE_KIND_LABELS: Record<(typeof PROPERTY_IMAGE_KIND_VALUES)[number], string> = {
  PHOTO: "Photo (real, first-party)",
  ILLUSTRATIVE: "Illustrative (generated placeholder)",
  LOGO: "Generated identity mark (not an official logo)",
};

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
