import { prisma } from "@/lib/prisma";

export interface PublicCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
}

export async function getCategoryBySlug(slug: string): Promise<PublicCategory | null> {
  return prisma.category.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, description: true, parentId: true },
  });
}

/** Pure — combines a category's own id with its children's ids, de-duplicated. */
export function collectCategoryIds(categoryId: string, childIds: string[]): string[] {
  return [...new Set([categoryId, ...childIds])];
}

/** A category page shows its own listings plus its children's (e.g. a
 * parent umbrella category like "Food & Nightlife" surfaces "Lounge & Bar"
 * properties too). Returns every category id the page's query should match. */
export async function getCategoryIdsForPage(category: PublicCategory): Promise<string[]> {
  const children = await prisma.category.findMany({
    where: { parentId: category.id },
    select: { id: true },
  });
  return collectCategoryIds(
    category.id,
    children.map((c) => c.id)
  );
}

export interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  publishedCount: number;
}

export interface CategoryCountRow {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

/**
 * Pure — each category's displayed count includes its children's published
 * properties too, matching exactly what visiting that category's own page
 * shows (getCategoryIdsForPage queries the same parent+children id set).
 * Without this, a parent umbrella category (e.g. "Food & Nightlife") with
 * zero *direct* listings would show "0 listings" on the homepage even when
 * its child category ("Lounge & Bar") has real, published ones — an honest
 * visitor-facing mismatch between the count shown and what clicking through
 * actually reveals. A parent and child legitimately share the same
 * underlying listings in their own counts; that isn't double-counting,
 * since each count independently describes what that one category's own
 * URL will show.
 */
export function rollUpCategoryCounts(
  categories: CategoryCountRow[],
  directCountById: Map<string, number>
): CategoryWithCount[] {
  return categories.map((c) => {
    const childIds = categories.filter((child) => child.parentId === c.id).map((child) => child.id);
    const ids = collectCategoryIds(c.id, childIds);
    const publishedCount = ids.reduce((sum, id) => sum + (directCountById.get(id) ?? 0), 0);
    return { id: c.id, name: c.name, slug: c.slug, publishedCount };
  });
}

/** Only PUBLISHED properties are counted — a category with zero published
 * listings (including via children) still exists but won't be promoted on
 * the homepage. */
export async function getCategoriesWithPublishedCounts(): Promise<CategoryWithCount[]> {
  const [categories, rawCounts] = await Promise.all([
    prisma.category.findMany({
      select: { id: true, name: true, slug: true, parentId: true },
      orderBy: { name: "asc" },
    }),
    prisma.property.groupBy({ by: ["categoryId"], where: { status: "PUBLISHED" }, _count: { _all: true } }),
  ]);
  const directCountById = new Map(rawCounts.map((r) => [r.categoryId, r._count._all]));
  return rollUpCategoryCounts(categories, directCountById);
}

export async function getCategoriesBySlugs(slugs: string[]): Promise<PublicCategory[]> {
  if (slugs.length === 0) return [];
  return prisma.category.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, name: true, slug: true, description: true, parentId: true },
  });
}
