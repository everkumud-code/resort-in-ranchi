import type { MasterRow } from "./readWorkbook";

export const RECORD_TYPES = {
  PROPERTY: "Property/Business",
  VENUE_SPACE: "Venue Space / Outlet",
  VERIFICATION_QUEUE: "Verification Queue",
} as const;

export type KnownRecordType = (typeof RECORD_TYPES)[keyof typeof RECORD_TYPES];

const KNOWN_RECORD_TYPES: readonly string[] = Object.values(RECORD_TYPES);

export interface ValidationResult {
  valid: boolean;
  reasons: string[];
}

/**
 * Structural validation only — this never fabricates or corrects data,
 * it just decides whether a row has enough to safely become a record at
 * all, and explains why when it doesn't.
 */
export function validateRow(row: MasterRow): ValidationResult {
  const reasons: string[] = [];

  if (row.id === null || row.id === undefined || Number.isNaN(Number(row.id))) {
    reasons.push("missing or non-numeric ID");
  }

  const name = (row.listingName ?? "").toString().trim();
  if (!name) {
    reasons.push("missing Listing Name");
  }

  const recordType = (row.recordType ?? "").toString().trim();
  if (!recordType) {
    reasons.push("missing Record Type");
  } else if (!KNOWN_RECORD_TYPES.includes(recordType)) {
    reasons.push(`unknown Record Type "${recordType}"`);
  }

  const category = (row.category ?? "").toString().trim();
  if (!category) {
    reasons.push("missing Category");
  }

  const locality = (row.locality ?? "").toString().trim();
  if (!locality) {
    reasons.push("missing Locality");
  }

  // Venue Space rows must be able to link to a parent property by name.
  if (recordType === RECORD_TYPES.VENUE_SPACE) {
    const parent = (row.parentProperty ?? "").toString().trim();
    if (!parent) {
      reasons.push("Venue Space row missing Parent Property");
    }
  }

  return { valid: reasons.length === 0, reasons };
}
