/**
 * A real, functional Google Maps directions link built from a listing's own
 * address/name — used when no admin-curated `googleMapsUrl` exists yet.
 * Google geocodes the query live; nothing about the destination is invented
 * here, it's the same text already shown on the page.
 */
export function buildMapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Picks the best available real text to search for — address first, falling back to name + city. */
export function buildDirectionsUrl(property: { googleMapsUrl: string | null; address: string | null; name: string; city: string }): string {
  if (property.googleMapsUrl) return property.googleMapsUrl;
  const query = property.address ? `${property.name}, ${property.address}` : `${property.name}, ${property.city}`;
  return buildMapsSearchUrl(query);
}
