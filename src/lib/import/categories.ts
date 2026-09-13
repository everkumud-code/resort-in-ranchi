import { slugify } from "./slugify";

/** The 15 core categories defined in RESORTINRANCHI_PRODUCT_SPEC_v1.md. */
export const CORE_CATEGORIES: { name: string; slug: string }[] = [
  { name: "Resorts", slug: "resorts" },
  { name: "Hotels", slug: "hotels" },
  { name: "Restaurants", slug: "restaurants" },
  { name: "Cafés", slug: "cafes" },
  { name: "Banquet Halls", slug: "banquet-halls" },
  { name: "Wedding Venues", slug: "wedding-venues" },
  { name: "Marriage Halls", slug: "marriage-halls" },
  { name: "Wedding Lawns", slug: "wedding-lawns" },
  { name: "Farmhouses", slug: "farmhouses" },
  { name: "Party Halls", slug: "party-halls" },
  { name: "Corporate/Conference Venues", slug: "corporate-conference-venues" },
  { name: "Picnic & Day Outing", slug: "picnic-day-outing" },
  { name: "Adventure & Camping", slug: "adventure-camping" },
  { name: "Weekend Getaways", slug: "weekend-getaways" },
  { name: "Homestays/Farm Stays", slug: "homestays-farm-stays" },
];

/**
 * Maps a single, lowercased raw-category *segment* (the spreadsheet's
 * Category column, split on "/") to a core category slug. Only confident,
 * unambiguous matches belong here. Everything else is left unmapped on
 * purpose — normalizeCategory() falls back to auto-creating a category
 * from the raw text rather than guessing.
 */
const SEGMENT_TO_CORE_SLUG: Record<string, string> = {
  resort: "resorts",
  "eco resort": "resorts",
  hotel: "hotels",
  "serviced apartment": "hotels",
  restaurant: "restaurants",
  dhaba: "restaurants",
  "fast food": "restaurants",
  "food court": "restaurants",
  "food outlet": "restaurants",
  "food truck": "restaurants",
  "vegetarian restaurant": "restaurants",
  cafe: "cafes",
  bakery: "cafes",
  "sweet shop": "cafes",
  "banquet hall": "banquet-halls",
  banquet: "banquet-halls",
  "wedding venue": "wedding-venues",
  "event venue": "wedding-venues",
  estate: "wedding-venues",
  "party lawn": "wedding-lawns",
  farmhouse: "farmhouses",
  party: "party-halls",
  adventure: "adventure-camping",
  "day outing": "picnic-day-outing",
  homestay: "homestays-farm-stays",
};

export interface NormalizedCategory {
  /** Display name to use for the Category record. */
  name: string;
  slug: string;
  /** True if this matched one of the 15 spec-defined core categories. */
  isCore: boolean;
  /** The raw category string split on "/", trimmed. */
  rawSegments: string[];
  /** Which segment produced the match (or the fallback segment used). */
  matchedSegment: string;
}

/**
 * Normalize a raw spreadsheet Category value (e.g. "Hotel/Banquet",
 * "Club/Wedding Venue") into a Category to use on the Property record.
 *
 * Strategy: try each "/"-separated segment against the core-category
 * synonym table, in order, and use the first confident match. If none
 * match, fall back to auto-creating a category from the first segment
 * (isCore: false) rather than forcing a wrong classification.
 */
export function normalizeCategory(raw: string): NormalizedCategory {
  const segments = raw
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean);
  const searchSegments = segments.length > 0 ? segments : [raw.trim()];

  for (const segment of searchSegments) {
    const coreSlug = SEGMENT_TO_CORE_SLUG[segment.toLowerCase()];
    if (coreSlug) {
      const core = CORE_CATEGORIES.find((c) => c.slug === coreSlug)!;
      return {
        name: core.name,
        slug: core.slug,
        isCore: true,
        rawSegments: segments,
        matchedSegment: segment,
      };
    }
  }

  const fallbackSegment = searchSegments[0];
  return {
    name: fallbackSegment,
    slug: slugify(fallbackSegment),
    isCore: false,
    rawSegments: segments,
    matchedSegment: fallbackSegment,
  };
}
