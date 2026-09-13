import { normalizeNameForComparison } from "@/lib/import/duplicates";

export interface NeedsReviewProperty {
  id: string;
  name: string;
  localityName: string | null;
}

export interface NeedsReviewGroup {
  normalizedName: string;
  properties: NeedsReviewProperty[];
}

/**
 * Groups NEEDS_REVIEW properties by normalized name so the admin UI can
 * show *why* a pair was flagged (same-name duplicate candidates) without
 * needing a separate persisted "duplicate of" relation. A group of size 1
 * just means "flagged for review for some other reason" (e.g. was
 * previously merged-into, or flagged by a future rule).
 */
export function groupNeedsReviewByName(properties: NeedsReviewProperty[]): NeedsReviewGroup[] {
  const groups = new Map<string, NeedsReviewProperty[]>();
  for (const p of properties) {
    const key = normalizeNameForComparison(p.name);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }
  return [...groups.entries()]
    .map(([normalizedName, props]) => ({ normalizedName, properties: props }))
    .sort((a, b) => b.properties.length - a.properties.length);
}

export interface MissingFieldCounts {
  phone: number;
  website: number;
  address: number;
  email: number;
}

export interface MissingFieldSummaryRow {
  field: keyof MissingFieldCounts;
  label: string;
  missingCount: number;
  totalCount: number;
  missingPercent: number;
}

const FIELD_LABELS: Record<keyof MissingFieldCounts, string> = {
  phone: "Phone",
  website: "Website",
  address: "Address",
  email: "Email",
};

/** Pure — turns raw missing-field counts into a display-ready summary. */
export function formatMissingFieldsSummary(counts: MissingFieldCounts, totalCount: number): MissingFieldSummaryRow[] {
  return (Object.keys(counts) as (keyof MissingFieldCounts)[]).map((field) => ({
    field,
    label: FIELD_LABELS[field],
    missingCount: counts[field],
    totalCount,
    missingPercent: totalCount === 0 ? 0 : Math.round((counts[field] / totalCount) * 100),
  }));
}
