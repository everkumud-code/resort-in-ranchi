import { getCategoriesBySlugs } from "./categories";
import { listPublicProperties, type PublicPropertyCard } from "./properties";
import { computePagination, parsePage } from "@/lib/queries/properties";
import type { UmbrellaCategoryRoute } from "./categoryRoutes";

export interface UmbrellaCategoryData {
  items: PublicPropertyCard[];
  totalCount: number;
  page: number;
  totalPages: number;
}

export async function loadUmbrellaCategoryData(
  route: UmbrellaCategoryRoute,
  rawPage: string | undefined
): Promise<UmbrellaCategoryData> {
  const categories = await getCategoriesBySlugs(route.categorySlugs);
  const categoryIds = categories.map((c) => c.id);

  if (categoryIds.length === 0) {
    return { items: [], totalCount: 0, page: 1, totalPages: 1 };
  }

  const where = { categoryId: { in: categoryIds } };
  const page = parsePage(rawPage);
  const { totalCount } = await listPublicProperties({ where });
  const { skip, take, page: safePage, totalPages } = computePagination(page, totalCount);
  const { items } = await listPublicProperties({ where, skip, take });

  return { items, totalCount, page: safePage, totalPages };
}
