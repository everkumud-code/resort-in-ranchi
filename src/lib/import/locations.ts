import { slugify } from "./slugify";

export interface NormalizedLocation {
  name: string;
  slug: string;
  rawSegments: string[];
}

/**
 * Normalize a raw spreadsheet Locality value (e.g. "Chutia/Namkum",
 * "Ring Road/Hochar") into a single primary Location. The Location
 * taxonomy is open-ended (unlike Category, it has no fixed core list in
 * the spec), so every distinct primary locality becomes its own Location
 * record — nothing is forced into an existing bucket.
 */
export function normalizeLocation(raw: string): NormalizedLocation {
  const segments = raw
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean);
  const primary = segments[0] ?? raw.trim();
  return {
    name: primary,
    slug: slugify(primary),
    rawSegments: segments,
  };
}
