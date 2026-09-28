import { prisma } from "@/lib/prisma";
import { categoryMembershipWhere, publicPropertyCardSelect, publishedOnly, type PublicPropertyCard } from "./properties";
import type { PublicCategory } from "./categories";
import type { PublicLocation } from "./locations";
import { PRIORITY_LOCATION_SLUGS } from "./locations";
import { dedupeAgainstShown, getAdjacentCategorySlugs } from "./discoveryDensity";

/** Same "recommended" ordering used everywhere else on the public site — featured listings first, then newest. */
const SUPPLEMENT_ORDER_BY = [{ featured: "desc" as const }, { createdAt: "desc" as const }];

/**
 * Supplements a category page's exact-match results with other real,
 * published properties, in a fixed priority order, stopping as soon as
 * `need` is reached or the database runs out — never fabricates a property,
 * never duplicates one already shown, and never touches Property.categoryId
 * on any row. Only ever *reads* existing properties for display under a
 * clearly distinct "More Places to Explore" heading (see
 * [categorySlug]/page.tsx) — canonical category data is never altered.
 *
 * Priority order: (1) closely related parent/sibling categories, (2)
 * adjacent categories in the same Stay/Eat/Celebrate discovery group, (3)
 * any other published property (broader Ranchi fallback), featured listings
 * naturally surfacing first in every tier via SUPPLEMENT_ORDER_BY.
 */
export async function getCategoryDiscoverySupplement(params: {
  category: PublicCategory;
  exactCategoryIds: string[];
  shownIds: ReadonlySet<string>;
  need: number;
}): Promise<PublicPropertyCard[]> {
  const { category, exactCategoryIds, need } = params;
  if (need <= 0) return [];

  const shown = new Set(params.shownIds);
  const collected: PublicPropertyCard[] = [];
  const stillNeeded = () => need - collected.length;

  const pull = async (categoryIds: string[]) => {
    if (categoryIds.length === 0 || stillNeeded() <= 0) return;
    const candidates = await prisma.property.findMany({
      where: publishedOnly({ ...categoryMembershipWhere(categoryIds), id: { notIn: [...shown] } }),
      select: publicPropertyCardSelect,
      orderBy: SUPPLEMENT_ORDER_BY,
      take: stillNeeded(),
    });
    const deduped = dedupeAgainstShown(candidates, shown, stillNeeded());
    for (const item of deduped) shown.add(item.id);
    collected.push(...deduped);
  };

  if (category.parentId) {
    const siblings = await prisma.category.findMany({ where: { parentId: category.parentId }, select: { id: true } });
    const relatedIds = [category.parentId, ...siblings.map((s) => s.id)].filter((id) => !exactCategoryIds.includes(id));
    await pull(relatedIds);
  }

  if (stillNeeded() > 0) {
    const adjacentSlugs = getAdjacentCategorySlugs(category.slug);
    if (adjacentSlugs.length > 0) {
      const adjacentCategories = await prisma.category.findMany({ where: { slug: { in: adjacentSlugs } }, select: { id: true } });
      await pull(adjacentCategories.map((c) => c.id));
    }
  }

  if (stillNeeded() > 0) {
    const broader = await prisma.property.findMany({
      where: publishedOnly({ id: { notIn: [...shown] } }),
      select: publicPropertyCardSelect,
      orderBy: SUPPLEMENT_ORDER_BY,
      take: stillNeeded(),
    });
    collected.push(...dedupeAgainstShown(broader, shown, stillNeeded()));
  }

  return collected;
}

/**
 * Same approach as getCategoryDiscoverySupplement, for a location page.
 * Priority order: (1) related parent/sibling localities, (2) other notable
 * Ranchi areas from the same curated priority-locations list shown on the
 * homepage's "Explore by area" (not a claim of real geographic proximity —
 * there is no distance data to fabricate one from), (3) broader Ranchi
 * fallback. Never touches Property.localityId on any row.
 */
export async function getLocationDiscoverySupplement(params: {
  location: PublicLocation;
  exactLocationIds: string[];
  shownIds: ReadonlySet<string>;
  need: number;
}): Promise<PublicPropertyCard[]> {
  const { location, exactLocationIds, need } = params;
  if (need <= 0) return [];

  const shown = new Set(params.shownIds);
  const collected: PublicPropertyCard[] = [];
  const stillNeeded = () => need - collected.length;

  const pull = async (localityIds: string[]) => {
    if (localityIds.length === 0 || stillNeeded() <= 0) return;
    const candidates = await prisma.property.findMany({
      where: publishedOnly({ localityId: { in: localityIds }, id: { notIn: [...shown] } }),
      select: publicPropertyCardSelect,
      orderBy: SUPPLEMENT_ORDER_BY,
      take: stillNeeded(),
    });
    const deduped = dedupeAgainstShown(candidates, shown, stillNeeded());
    for (const item of deduped) shown.add(item.id);
    collected.push(...deduped);
  };

  if (location.parentId) {
    const siblings = await prisma.location.findMany({ where: { parentId: location.parentId }, select: { id: true } });
    const relatedIds = [location.parentId, ...siblings.map((s) => s.id)].filter((id) => !exactLocationIds.includes(id));
    await pull(relatedIds);
  }

  if (stillNeeded() > 0) {
    const otherPriorityLocations = await prisma.location.findMany({
      where: { slug: { in: PRIORITY_LOCATION_SLUGS }, id: { notIn: exactLocationIds } },
      select: { id: true },
    });
    await pull(otherPriorityLocations.map((l) => l.id));
  }

  if (stillNeeded() > 0) {
    const broader = await prisma.property.findMany({
      where: publishedOnly({ id: { notIn: [...shown] } }),
      select: publicPropertyCardSelect,
      orderBy: SUPPLEMENT_ORDER_BY,
      take: stillNeeded(),
    });
    collected.push(...dedupeAgainstShown(broader, shown, stillNeeded()));
  }

  return collected;
}
