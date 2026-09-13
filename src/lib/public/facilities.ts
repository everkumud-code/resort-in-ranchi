import { prisma } from "@/lib/prisma";

export interface FacilityWithCount {
  id: string;
  name: string;
  slug: string;
  publishedCount: number;
}

/**
 * Only PUBLISHED properties are counted, mirroring
 * getCategoriesWithPublishedCounts/getLocationsWithPublishedCounts — a
 * facility with zero published usages isn't offered as a filter chip, so a
 * visitor is never shown an option that couldn't possibly match anything.
 */
export async function getFacilitiesWithPublishedCounts(): Promise<FacilityWithCount[]> {
  const facilities = await prisma.facility.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      _count: { select: { properties: { where: { property: { status: "PUBLISHED" } } } } },
    },
    orderBy: { name: "asc" },
  });
  return facilities.map((f) => ({ id: f.id, name: f.name, slug: f.slug, publishedCount: f._count.properties }));
}
