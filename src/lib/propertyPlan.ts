import { prisma } from "./prisma";
import { checkExtraCategories, checkPlacementScope } from "./validation/planEntitlements";
import { isValidCommercialTier, type CommercialTierValue } from "./validation/commercial";
import { PINNED_POSITIONS } from "./public/pinnedListing";

export interface PlanWriteResult {
  ok: boolean;
  error?: string;
}

/**
 * Replaces a listing's extra categories after checking them against its plan.
 * Shared by the admin panel and the vendor dashboard so both enforce the very
 * same limit. The primary category is never changed here.
 */
export async function saveExtraCategoriesForProperty(propertyId: string, requestedIds: string[]): Promise<PlanWriteResult> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { categoryId: true, commercialTier: true },
  });
  if (!property) return { ok: false, error: "Listing not found." };

  const categories = await prisma.category.findMany({ select: { id: true } });
  const check = checkExtraCategories(
    isValidCommercialTier(property.commercialTier) ? (property.commercialTier as CommercialTierValue) : "FREE",
    property.categoryId,
    requestedIds,
    new Set(categories.map((c) => c.id))
  );
  if (!check.ok) return { ok: false, error: check.error };

  await prisma.$transaction([
    prisma.propertyCategory.deleteMany({ where: { propertyId } }),
    prisma.propertyCategory.createMany({ data: check.categoryIds.map((categoryId) => ({ propertyId, categoryId })) }),
  ]);
  return { ok: true };
}

export interface PlacementInput {
  enabled: boolean;
  allCategories: boolean;
  categorySlugs: string[];
  positions: number[];
  startsAt: Date | null;
  endsAt: Date | null;
}

/** Creates or updates a listing's sponsored placement after checking its scope against its plan. Admin-only callers. */
export async function saveSponsoredPlacementForProperty(propertyId: string, input: PlacementInput): Promise<PlanWriteResult> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { commercialTier: true, category: { select: { slug: true } }, extraCategories: { select: { category: { select: { slug: true } } } } },
  });
  if (!property) return { ok: false, error: "Listing not found." };

  if (input.startsAt && input.endsAt && input.endsAt.getTime() <= input.startsAt.getTime()) {
    return { ok: false, error: "The end date must be after the start date." };
  }

  const tier = (isValidCommercialTier(property.commercialTier) ? property.commercialTier : "FREE") as CommercialTierValue;
  const knownSlugs = new Set((await prisma.category.findMany({ select: { slug: true } })).map((c) => c.slug));
  const categorySlugs = input.allCategories ? [] : [...new Set(input.categorySlugs)].filter((s) => knownSlugs.has(s));
  const listingSlugs = [property.category.slug, ...property.extraCategories.map((e) => e.category.slug)];

  const check = checkPlacementScope(tier, input.allCategories, categorySlugs, listingSlugs);
  if (!check.ok) return { ok: false, error: check.error };

  const positions = [...new Set(input.positions)].filter((p) => PINNED_POSITIONS.includes(p));

  const data = { enabled: input.enabled, allCategories: input.allCategories, categorySlugs, positions, startsAt: input.startsAt, endsAt: input.endsAt };
  await prisma.sponsoredPlacement.upsert({ where: { propertyId }, create: { propertyId, ...data }, update: data });
  return { ok: true };
}
