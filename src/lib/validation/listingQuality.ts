/**
 * Owner-facing "Listing Quality" completeness score. Reads only fields
 * already stored on Property (plus real counts of related rows) — never
 * infers, guesses, or fabricates a value. A field is either present in the
 * database or it counts as missing; there is no partial credit and no
 * default substituted for a blank field.
 */

export type ListingQualityFieldId =
  | "description"
  | "phone"
  | "email"
  | "website"
  | "pricing"
  | "photos"
  | "facilities"
  | "rooms"
  | "capacity"
  | "venueSpaces";

export interface ListingQualityItem {
  id: ListingQualityFieldId;
  label: string;
  complete: boolean;
}

export interface ListingQualityResult {
  items: ListingQualityItem[];
  completedCount: number;
  totalCount: number;
  percent: number;
  isComplete: boolean;
}

export interface ListingQualityInput {
  shortDescription: string | null;
  fullDescription: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  priceMin: number | null;
  priceMax: number | null;
  priceLabel: string | null;
  rooms: number | null;
  eventCapacityMin: number | null;
  eventCapacityMax: number | null;
  categorySlug: string;
  photoCount: number;
  facilityCount: number;
  venueSpaceCount: number;
}

/**
 * Categories where "number of rooms" is a meaningful field — mirrors the
 * existing category slugs used elsewhere (e.g. getEnquiryCtaCopy), not an
 * invented taxonomy. A category outside this set simply never gets a
 * "rooms" checklist item, rather than being scored against a field that
 * doesn't apply to it.
 */
const LODGING_CATEGORY_SLUGS = new Set(["hotels", "resorts", "homestays-farm-stays"]);

/**
 * Categories where event capacity / venue spaces are meaningful — the same
 * category grouping used for the "Plan Your Event" enquiry CTA copy.
 */
const EVENT_CATEGORY_SLUGS = new Set(["wedding-venues", "banquet-halls", "party-halls"]);

export function isLodgingCategory(categorySlug: string): boolean {
  return LODGING_CATEGORY_SLUGS.has(categorySlug);
}

export function isEventCategory(categorySlug: string): boolean {
  return EVENT_CATEGORY_SLUGS.has(categorySlug);
}

const LABELS: Record<ListingQualityFieldId, string> = {
  description: "Description",
  phone: "Phone number",
  email: "Email address",
  website: "Website",
  pricing: "Pricing",
  photos: "Photos",
  facilities: "Facilities",
  rooms: "Number of rooms",
  capacity: "Event capacity",
  venueSpaces: "Venue spaces",
};

export function calculateListingQuality(input: ListingQualityInput): ListingQualityResult {
  const items: ListingQualityItem[] = [
    { id: "description", label: LABELS.description, complete: Boolean(input.shortDescription || input.fullDescription) },
    { id: "phone", label: LABELS.phone, complete: Boolean(input.phone) },
    { id: "email", label: LABELS.email, complete: Boolean(input.email) },
    { id: "website", label: LABELS.website, complete: Boolean(input.website) },
    {
      id: "pricing",
      label: LABELS.pricing,
      complete: input.priceMin != null || input.priceMax != null || Boolean(input.priceLabel),
    },
    { id: "photos", label: LABELS.photos, complete: input.photoCount > 0 },
    { id: "facilities", label: LABELS.facilities, complete: input.facilityCount > 0 },
  ];

  if (isLodgingCategory(input.categorySlug)) {
    items.push({ id: "rooms", label: LABELS.rooms, complete: input.rooms != null });
  }

  if (isEventCategory(input.categorySlug)) {
    items.push({
      id: "capacity",
      label: LABELS.capacity,
      complete: input.eventCapacityMin != null || input.eventCapacityMax != null,
    });
    items.push({ id: "venueSpaces", label: LABELS.venueSpaces, complete: input.venueSpaceCount > 0 });
  }

  const completedCount = items.filter((item) => item.complete).length;
  const totalCount = items.length;
  const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return { items, completedCount, totalCount, percent, isComplete: completedCount === totalCount };
}
