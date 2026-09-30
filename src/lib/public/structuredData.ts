import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "./site";
import type { PublicProperty } from "./properties";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    areaServed: {
      "@type": "City",
      name: "Ranchi",
      containedInPlace: {
        "@type": "State",
        name: "Jharkhand",
      },
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: "en-IN",
    publisher: { "@id": `${SITE_URL}/#organization` },
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

/** A listing page's ItemList built only from its genuine exact matches. */
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

/** Maps a category slug to the closest schema.org business type. */
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

const LODGING_TYPES = new Set(["Hotel", "Resort", "LodgingBusiness"]);

/**
 * Only returns business structured data when there is enough real data to
 * justify it. Every optional field below is sourced directly from the public
 * listing record; nothing is generated merely to satisfy a schema field.
 */
export function localBusinessJsonLd(property: PublicProperty, path: string): Record<string, unknown> | null {
  const hasEnoughData = Boolean(property.address || property.phone || property.website || property.city);
  if (!hasEnoughData) return null;

  const type = CATEGORY_SCHEMA_TYPE[property.category.slug] ?? "LocalBusiness";
  const photos = property.images.filter((image) => image.kind === "PHOTO").map((image) => image.url);
  const description =
    property.shortDescription ||
    property.fullDescription ||
    `${property.name} is listed in ${property.locality?.name ?? property.city ?? "Ranchi"}, Ranchi, under the ${property.category.name} category.`;
  const businessUrl = absoluteUrl(path);
  const amenities = property.facilities.map((f) => f.facility.name);

  return {
    "@context": "https://schema.org",
    "@type": type,
    "@id": `${businessUrl}#business`,
    name: property.name,
    url: businessUrl,
    description,
    ...(photos.length > 0 ? { image: photos } : {}),
    ...(property.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: property.address,
            addressLocality: property.city,
            addressRegion: property.state,
            postalCode: property.pincode ?? undefined,
            addressCountry: "IN",
          },
        }
      : property.city
        ? {
            // No verified street address yet — a coarser, still-honest address
            // (city/state only) is better than none, and matches what the
            // page already shows publicly.
            address: {
              "@type": "PostalAddress",
              addressLocality: property.city,
              addressRegion: property.state,
              addressCountry: "IN",
            },
          }
        : {}),
    ...(property.latitude !== null && property.longitude !== null
      ? { geo: { "@type": "GeoCoordinates", latitude: property.latitude, longitude: property.longitude } }
      : {}),
    ...(property.phone ? { telephone: property.phone } : {}),
    ...(property.website ? { sameAs: [property.website] } : {}),
    // Richer, still fully factual details — each only when the listing really has it.
    ...(property.priceLabel ? { priceRange: property.priceLabel } : {}),
    ...(property.googleMapsUrl ? { hasMap: property.googleMapsUrl } : {}),
    ...(LODGING_TYPES.has(type) && property.rooms ? { numberOfRooms: property.rooms } : {}),
    ...(type === "EventVenue" && property.eventCapacityMax ? { maximumAttendeeCapacity: property.eventCapacityMax } : {}),
    ...(amenities.length > 0
      ? { amenityFeature: amenities.map((name) => ({ "@type": "LocationFeatureSpecification", name, value: true })) }
      : {}),
    ...(property.locality
      ? { containedInPlace: { "@type": "Place", name: `${property.locality.name}, ${property.city}` } }
      : {}),
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
