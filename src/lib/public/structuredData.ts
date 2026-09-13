import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "./site";
import type { PublicProperty } from "./properties";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
  };
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export interface ItemListEntry {
  name: string;
  path: string;
}

/**
 * A listing page's ItemList — helps search engines understand a category/
 * location page as a real list of distinct businesses. Only ever built from
 * the page's genuine exact matches (never supplemented "More Places to
 * Explore" recommendations), so it can never imply a property belongs to a
 * category/location it doesn't.
 */
export function itemListJsonLd(items: ItemListEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.path),
    })),
  };
}

/** Maps a category slug to the closest schema.org business type. Falls back
 * to the generic LocalBusiness type for anything not explicitly listed. */
const CATEGORY_SCHEMA_TYPE: Record<string, string> = {
  hotels: "Hotel",
  resorts: "Resort",
  "homestays-farm-stays": "LodgingBusiness",
  restaurants: "Restaurant",
  cafes: "CafeOrCoffeeShop",
  "banquet-halls": "EventVenue",
  "wedding-venues": "EventVenue",
  "party-halls": "EventVenue",
};

/**
 * Only returns a LocalBusiness/appropriate-subtype JSON-LD block when there
 * is enough real data to justify it (name + at least one of address/phone/
 * website) — never fabricated to satisfy a schema requirement.
 */
export function localBusinessJsonLd(property: PublicProperty, path: string): Record<string, unknown> | null {
  const hasEnoughData = Boolean(property.address || property.phone || property.website);
  if (!hasEnoughData) return null;

  const type = CATEGORY_SCHEMA_TYPE[property.category.slug] ?? "LocalBusiness";
  // Only ever a real PHOTO — never an ILLUSTRATIVE (generated, non-property-
  // specific) image, for the same reason the page itself never presents one
  // as a genuine photo of this property.
  const photos = property.images.filter((image) => image.kind === "PHOTO").map((image) => image.url);

  return {
    "@context": "https://schema.org",
    "@type": type,
    name: property.name,
    url: absoluteUrl(path),
    ...(photos.length > 0 ? { image: photos } : {}),
    ...(property.address ? { address: { "@type": "PostalAddress", streetAddress: property.address, addressLocality: property.city, addressRegion: property.state, postalCode: property.pincode ?? undefined, addressCountry: "IN" } } : {}),
    ...(property.latitude !== null && property.longitude !== null
      ? { geo: { "@type": "GeoCoordinates", latitude: property.latitude, longitude: property.longitude } }
      : {}),
    ...(property.phone ? { telephone: property.phone } : {}),
    ...(property.website ? { sameAs: [property.website] } : {}),
    ...(property.googleRating && property.reviewCount
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: property.googleRating,
            reviewCount: property.reviewCount,
          },
        }
      : {}),
  };
}
