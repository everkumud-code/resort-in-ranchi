import { z } from "zod";
import { requiredText, slugField } from "./shared";

/**
 * Deliberately minimal — just name + slug. No parent/description/SEO
 * metadata; a facility is a flat tag (e.g. "Swimming Pool", "Parking"), not
 * a hierarchical taxonomy like Category/Location.
 */
export const facilitySchema = z.object({
  name: requiredText("Name"),
  slug: slugField,
});

export type FacilityInput = z.infer<typeof facilitySchema>;

/**
 * Dedupes the raw list of facility IDs submitted from a property's facility
 * checkboxes, so the server action that rewrites PropertyFacility rows never
 * attempts to create the same (propertyId, facilityId) pair twice.
 */
export function dedupeFacilityIds(ids: string[]): string[] {
  return Array.from(new Set(ids));
}
