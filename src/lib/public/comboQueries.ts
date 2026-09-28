import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { buildComboIndex, type ComboEntry } from "./comboPages";

/** Every real category × area combination that has at least one published listing (cached per request). */
export const getComboIndex = cache(async (): Promise<ComboEntry[]> => {
  const [properties, categories, locations] = await Promise.all([
    prisma.property.findMany({
      where: { status: "PUBLISHED" },
      select: { categoryId: true, localityId: true, extraCategories: { select: { categoryId: true } } },
    }),
    prisma.category.findMany({ select: { id: true, slug: true, name: true } }),
    prisma.location.findMany({ select: { id: true, slug: true, name: true, parentId: true } }),
  ]);
  return buildComboIndex(
    properties.map((p) => ({ categoryId: p.categoryId, localityId: p.localityId, extraCategoryIds: p.extraCategories.map((e) => e.categoryId) })),
    categories,
    locations
  );
});
