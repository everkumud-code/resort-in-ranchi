/**
 * "Category in area" landing pages (e.g. /resorts/kanke) — the pages people
 * actually search for ("resorts in Kanke Ranchi"). Which combinations exist is
 * derived only from real published listings: a combination is offered only
 * when at least one listing genuinely belongs to both. Nothing is invented.
 */
export interface ComboProperty {
  categoryId: string;
  extraCategoryIds: string[];
  localityId: string | null;
}

export interface ComboCategory {
  id: string;
  slug: string;
  name: string;
}

export interface ComboLocation {
  id: string;
  slug: string;
  name: string;
  parentId: string | null;
}

export interface ComboEntry {
  categorySlug: string;
  categoryName: string;
  locationSlug: string;
  locationName: string;
  count: number;
}

export function comboPath(categorySlug: string, locationSlug: string): string {
  return `/${categorySlug}/${locationSlug}`;
}

/**
 * Pure. A listing counts for each category it is filed under (primary or a
 * paid extra) and for its own area AND that area's parent area, matching how
 * a location page already includes its child areas.
 */
export function buildComboIndex(properties: ComboProperty[], categories: ComboCategory[], locations: ComboLocation[]): ComboEntry[] {
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const locationById = new Map(locations.map((l) => [l.id, l]));
  const counts = new Map<string, ComboEntry>();

  for (const property of properties) {
    if (!property.localityId) continue;
    const locality = locationById.get(property.localityId);
    if (!locality) continue;
    const areas = [locality, ...(locality.parentId && locationById.get(locality.parentId) ? [locationById.get(locality.parentId)!] : [])];
    const cats = [property.categoryId, ...property.extraCategoryIds]
      .map((id) => categoryById.get(id))
      .filter((c): c is ComboCategory => Boolean(c));

    for (const category of new Set(cats)) {
      for (const area of new Set(areas)) {
        const key = `${category.slug}|${area.slug}`;
        const existing = counts.get(key);
        if (existing) existing.count += 1;
        else counts.set(key, { categorySlug: category.slug, categoryName: category.name, locationSlug: area.slug, locationName: area.name, count: 1 });
      }
    }
  }

  return [...counts.values()].sort((a, b) => b.count - a.count || a.categorySlug.localeCompare(b.categorySlug) || a.locationSlug.localeCompare(b.locationSlug));
}

export function comboTitle(categoryName: string, locationName: string): string {
  return `${categoryName} in ${locationName}, Ranchi`;
}

/** A factual description from the real count and listing names — no invented claims. */
export function comboDescription(categoryName: string, locationName: string, count: number, sampleNames: string[]): string {
  const noun = categoryName.toLowerCase();
  const head = `Browse ${count} ${noun} listing${count === 1 ? "" : "s"} in ${locationName}, Ranchi on ResortInRanchi`;
  const names = sampleNames.slice(0, 3);
  return names.length > 0 ? `${head}, including ${names.join(", ")}. Compare details, photos and contact information.` : `${head}. Compare details, photos and contact information.`;
}
