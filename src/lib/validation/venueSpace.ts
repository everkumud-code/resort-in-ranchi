import { z } from "zod";
import { optionalInt, optionalText, requiredText } from "./shared";

/**
 * Fields intentionally match the existing VenueSpace model exactly — no
 * area/sq-ft field, no reparenting (propertyId is set by the caller, never
 * part of this form). `description` has no length cap, consistent with how
 * shortDescription/fullDescription/Facility name are handled elsewhere.
 */
export const venueSpaceSchema = z
  .object({
    name: requiredText("Name"),
    type: optionalText,
    capacityMin: optionalInt,
    capacityMax: optionalInt,
    description: optionalText,
  })
  .refine((v) => v.capacityMin === null || v.capacityMin >= 0, {
    message: "Must be 0 or more",
    path: ["capacityMin"],
  })
  .refine((v) => v.capacityMax === null || v.capacityMax >= 0, {
    message: "Must be 0 or more",
    path: ["capacityMax"],
  })
  .refine((v) => v.capacityMin === null || v.capacityMax === null || v.capacityMax >= v.capacityMin, {
    message: "Max capacity must be greater than or equal to min capacity",
    path: ["capacityMax"],
  });

export type VenueSpaceInput = z.infer<typeof venueSpaceSchema>;

/**
 * Pure transform from validated input to a plain scalar data payload —
 * deliberately untyped as a specific Prisma input variant so the same
 * builder works for both `venueSpace.create` (merged with `propertyId`) and
 * `venueSpace.update`. Never includes propertyId or provenance fields
 * (sourceRecordId, rawParentName) — this form only ever edits the fields an
 * admin can legitimately set by hand; imported provenance is preserved
 * untouched by every caller.
 */
export function buildVenueSpaceData(input: VenueSpaceInput) {
  return {
    name: input.name,
    type: input.type,
    capacityMin: input.capacityMin,
    capacityMax: input.capacityMax,
    description: input.description,
  };
}
