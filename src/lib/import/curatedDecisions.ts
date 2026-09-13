/**
 * Human-reviewed data-quality decisions for the 400-record research
 * spreadsheet, applied deterministically by the importer.
 *
 * These are NOT algorithmic guesses — each entry here was a specific call
 * made by a human after reviewing the dry-run report, and is recorded here
 * (with a reason) so the import stays repeatable and auditable instead of
 * requiring manual database edits. See RESORTINRANCHI_PRODUCT_SPEC_v1.md's
 * import rules: never invent information, always preserve provenance.
 */

export interface PropertyMergeRule {
  /** sourceRecordId of the row that gets merged away (not imported as its own Property). */
  mergeSourceRecordId: string;
  /** sourceRecordId of the row that becomes the canonical Property. */
  intoSourceRecordId: string;
  reason: string;
}

export const PROPERTY_MERGES: PropertyMergeRule[] = [
  {
    mergeSourceRecordId: "7",
    intoSourceRecordId: "6",
    reason:
      'Exact duplicate: identical name "Shri Gobindam Banquet" and identical locality "Booty".',
  },
  {
    mergeSourceRecordId: "175",
    intoSourceRecordId: "127",
    reason:
      'Exact duplicate: identical name "K7 Hotel & Restaurant" and identical locality "Mesra". ' +
      'Canonical record (ID 127) keeps the broader "Hotel/Restaurant" category rather than the ' +
      'narrower "Restaurant" category from ID 175.',
  },
];

export interface VenueSpaceParentOverride {
  venueSpaceSourceRecordId: string;
  /** Exact Property/Business listing name to link to (matched via normalized-name comparison). */
  parentPropertyName: string;
  reason: string;
}

export const VENUE_SPACE_PARENT_OVERRIDES: VenueSpaceParentOverride[] = [
  {
    venueSpaceSourceRecordId: "223",
    parentPropertyName: "The Padosan Restaurant",
    reason:
      'Raw Parent Property "The Padosan" has no exact match, but "The Padosan Restaurant" is ' +
      "confirmed as the same business (spreadsheet omitted \"Restaurant\" on the venue-space row).",
  },
  {
    venueSpaceSourceRecordId: "267",
    parentPropertyName: "Destination Banquet Hall",
    reason:
      'Raw Parent Property "Destination Banquet" has no exact match, but "Destination Banquet Hall" ' +
      "is confirmed as the same business (spreadsheet omitted \"Hall\" on the venue-space row).",
  },
  {
    venueSpaceSourceRecordId: "275",
    parentPropertyName: "Destination Banquet Hall",
    reason:
      'Raw Parent Property "Destination Banquet" has no exact match, but "Destination Banquet Hall" ' +
      "is confirmed as the same business (spreadsheet omitted \"Hall\" on the venue-space row).",
  },
];

export interface VenueSpacePinnedUnresolved {
  venueSpaceSourceRecordId: string;
  reason: string;
}

/**
 * Venue spaces explicitly kept unresolved by human review, even though a
 * plausible-looking candidate parent exists. Listed here so future changes
 * to the matching heuristics can't silently auto-link them without a new
 * human decision.
 */
export const VENUE_SPACE_PINNED_UNRESOLVED: VenueSpacePinnedUnresolved[] = [
  {
    venueSpaceSourceRecordId: "261",
    reason:
      'Parent Property "Swarna Bhumi Banquets" is not sufficiently confirmed to match the only ' +
      'candidate, "Swarna Bhumi Ranchi" — could be a different property. Needs human verification, ' +
      "not auto-linked.",
  },
  {
    venueSpaceSourceRecordId: "286",
    reason:
      'No Property/Business record exists for "Arpan Restaurant" in this dataset. Not creating one ' +
      "— that would fabricate a business record.",
  },
];

export interface PropertyMedium {
  /** sourceRecordId of the property this override applies to. */
  sourceRecordId: string;
  categoryName: string;
  categorySlug: string;
  parentCategoryName?: string;
  parentCategorySlug?: string;
  reason: string;
}

/**
 * Category assignments overridden by human review, keyed by the property's
 * sourceRecordId (more precise than matching on raw category text, which
 * could coincidentally match an unrelated future row).
 */
export const PROPERTY_CATEGORY_OVERRIDES: PropertyMedium[] = [
  {
    sourceRecordId: "128", // Madeera Lounge & Bar
    categoryName: "Lounge & Bar",
    categorySlug: "lounge-bar",
    parentCategoryName: "Food & Nightlife",
    parentCategorySlug: "food-nightlife",
    reason: 'Raw category "Lounge/Bar" does not fit Restaurants or Cafés; given its own category ' +
      "under a Food & Nightlife parent rather than being forced into an ill-fitting bucket.",
  },
];
