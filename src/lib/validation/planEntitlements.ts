import type { CommercialTierValue } from "./commercial";

/**
 * What each commercial plan unlocks. Payment is taken offline; an admin sets
 * the plan on the listing, and everything below follows from it:
 *
 *   FREE          1 category (the primary), no sponsored placement
 *   PREMIUM       up to 3 categories in total, sponsored placement in the
 *                 categories the listing belongs to
 *   LEAD_PARTNER  every category, sponsored placement in any or all categories
 */
export const PREMIUM_MAX_CATEGORIES = 3;

/** Total categories a listing may appear under, primary included. Infinity = every category. */
export function maxListingCategories(tier: CommercialTierValue): number {
  switch (tier) {
    case "FREE":
      return 1;
    case "PREMIUM":
      return PREMIUM_MAX_CATEGORIES;
    case "LEAD_PARTNER":
      return Number.POSITIVE_INFINITY;
  }
}

/** How many EXTRA categories (beyond the primary) the plan allows, or Infinity. */
export function maxExtraCategories(tier: CommercialTierValue): number {
  return maxListingCategories(tier) - 1;
}

export function canHaveSponsoredPlacement(tier: CommercialTierValue): boolean {
  return tier === "PREMIUM" || tier === "LEAD_PARTNER";
}

/** Only the top plan may be sponsored in every category. */
export function canSponsorAllCategories(tier: CommercialTierValue): boolean {
  return tier === "LEAD_PARTNER";
}

export interface ExtraCategoryCheck {
  ok: boolean;
  /** Extra category ids to store: unique, never the primary, in the given order. */
  categoryIds: string[];
  error?: string;
}

/** Pure — validates a requested set of extra categories against the plan. */
export function checkExtraCategories(
  tier: CommercialTierValue,
  primaryCategoryId: string,
  requestedIds: string[],
  knownCategoryIds: ReadonlySet<string>
): ExtraCategoryCheck {
  const categoryIds = [...new Set(requestedIds)].filter((id) => id !== primaryCategoryId);
  if (categoryIds.some((id) => !knownCategoryIds.has(id))) {
    return { ok: false, categoryIds: [], error: "One of the chosen categories does not exist." };
  }
  const limit = maxExtraCategories(tier);
  if (categoryIds.length > limit) {
    return {
      ok: false,
      categoryIds: [],
      error:
        limit === 0
          ? "The Free plan lists a business in one category. Upgrade to add more."
          : `This plan allows ${limit} extra ${limit === 1 ? "category" : "categories"}. Upgrade to add more.`,
    };
  }
  return { ok: true, categoryIds };
}

export interface PlacementScopeCheck {
  ok: boolean;
  error?: string;
}

/** Pure — validates a sponsored placement's scope against the plan and the categories the listing belongs to. */
export function checkPlacementScope(
  tier: CommercialTierValue,
  allCategories: boolean,
  categorySlugs: string[],
  listingCategorySlugs: string[]
): PlacementScopeCheck {
  if (!canHaveSponsoredPlacement(tier)) {
    return { ok: false, error: "Sponsored placement needs a Premium or Lead Partner plan." };
  }
  if (allCategories) {
    return canSponsorAllCategories(tier)
      ? { ok: true }
      : { ok: false, error: "Sponsoring every category needs the Lead Partner plan." };
  }
  if (categorySlugs.length === 0) return { ok: false, error: "Choose at least one category, or all categories." };
  if (tier === "PREMIUM" && categorySlugs.some((slug) => !listingCategorySlugs.includes(slug))) {
    return { ok: false, error: "A Premium placement can only be in categories the listing belongs to." };
  }
  return { ok: true };
}

export interface PlacementLike {
  enabled: boolean;
  allCategories: boolean;
  categorySlugs: string[];
  startsAt: Date | null;
  endsAt: Date | null;
}

/** A placement counts only while enabled and inside its paid period (open-ended when a date is missing). */
export function isPlacementActive(placement: PlacementLike, now: Date = new Date()): boolean {
  if (!placement.enabled) return false;
  if (placement.startsAt && placement.startsAt.getTime() > now.getTime()) return false;
  if (placement.endsAt && placement.endsAt.getTime() <= now.getTime()) return false;
  return true;
}

/**
 * Pure — does a placement apply to a browse list? `contextSlugs` are the
 * category slugs the list is about; null means a list that isn't tied to one
 * category (e.g. a location page), where only "all categories" placements apply.
 */
export function placementAppliesTo(placement: PlacementLike, contextSlugs: string[] | null): boolean {
  if (placement.allCategories) return true;
  if (!contextSlugs) return false;
  return placement.categorySlugs.some((slug) => contextSlugs.includes(slug));
}
