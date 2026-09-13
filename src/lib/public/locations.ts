import { prisma } from "@/lib/prisma";

/**
 * Real localities from RESORTINRANCHI_PRODUCT_SPEC_v1.md's priority-locations
 * list — the same set the homepage's "Explore by area" section shows.
 * Reused as the discovery-supplement "other notable Ranchi areas" tier (see
 * discovery.ts): not a claim of geographic proximity (no lat/long exists to
 * measure that), just the same already-curated set of areas worth surfacing.
 */
export const PRIORITY_LOCATION_SLUGS = ["ranchi", "ormanjhi", "kanke", "morabadi", "lalpur", "bariatu", "hatia", "doranda"];

export interface PublicLocation {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
}

export async function getLocationBySlug(slug: string): Promise<PublicLocation | null> {
  return prisma.location.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, description: true, parentId: true },
  });
}

/** Pure — combines a location's own id with its children's ids, de-duplicated. */
export function collectLocationIds(locationId: string, childIds: string[]): string[] {
  return [...new Set([locationId, ...childIds])];
}

export async function getLocationIdsForPage(location: PublicLocation): Promise<string[]> {
  const children = await prisma.location.findMany({
    where: { parentId: location.id },
    select: { id: true },
  });
  return collectLocationIds(
    location.id,
    children.map((l) => l.id)
  );
}

export interface LocationWithCount {
  id: string;
  name: string;
  slug: string;
  publishedCount: number;
}

export interface LocationCountRow {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

/**
 * Pure — same fix as categories.ts's rollUpCategoryCounts, for the same
 * reason: a parent location's displayed count must include its children's
 * published properties too, matching exactly what visiting that location's
 * own page shows (getLocationIdsForPage queries the same parent+children id
 * set). Without this, a parent area with zero *direct* listings could show
 * "0 listings" on the homepage while its own page shows real ones from a
 * child locality — the same honest-count mismatch fixed for categories.
 */
export function rollUpLocationCounts(
  locations: LocationCountRow[],
  directCountById: Map<string, number>
): LocationWithCount[] {
  return locations.map((l) => {
    const childIds = locations.filter((child) => child.parentId === l.id).map((child) => child.id);
    const ids = collectLocationIds(l.id, childIds);
    const publishedCount = ids.reduce((sum, id) => sum + (directCountById.get(id) ?? 0), 0);
    return { id: l.id, name: l.name, slug: l.slug, publishedCount };
  });
}

export async function getLocationsWithPublishedCounts(): Promise<LocationWithCount[]> {
  const [locations, rawCounts] = await Promise.all([
    prisma.location.findMany({
      select: { id: true, name: true, slug: true, parentId: true },
      orderBy: { name: "asc" },
    }),
    prisma.property.groupBy({
      by: ["localityId"],
      where: { status: "PUBLISHED", localityId: { not: null } },
      _count: { _all: true },
    }),
  ]);
  const directCountById = new Map(rawCounts.filter((r) => r.localityId).map((r) => [r.localityId as string, r._count._all]));
  return rollUpLocationCounts(locations, directCountById);
}

/** Category breakdown of PUBLISHED properties within a set of location ids. */
export async function getCategoryBreakdownForLocations(
  locationIds: string[]
): Promise<{ categoryId: string; name: string; slug: string; count: number }[]> {
  if (locationIds.length === 0) return [];
  const grouped = await prisma.property.groupBy({
    by: ["categoryId"],
    where: { status: "PUBLISHED", localityId: { in: locationIds } },
    _count: { _all: true },
  });
  if (grouped.length === 0) return [];
  const categories = await prisma.category.findMany({
    where: { id: { in: grouped.map((g) => g.categoryId) } },
    select: { id: true, name: true, slug: true },
  });
  const nameById = new Map(categories.map((c) => [c.id, c] as const));
  return grouped
    .map((g) => {
      const cat = nameById.get(g.categoryId);
      return cat ? { categoryId: cat.id, name: cat.name, slug: cat.slug, count: g._count._all } : null;
    })
    .filter((x): x is { categoryId: string; name: string; slug: string; count: number } => x !== null)
    .sort((a, b) => b.count - a.count);
}
