/**
 * Pure decision logic for the "30+ discovery density" rule: a category/
 * location page should feel populated (aim for at least MIN_DISCOVERY_LISTINGS
 * cards) even when the exact category/location genuinely has few listings,
 * by supplementing with other real, published properties — never fabricated
 * ones — in a fixed, honest priority order. Nothing here touches the
 * database; see discovery.ts for the actual queries that use these helpers.
 */
export const MIN_DISCOVERY_LISTINGS = 30;

/**
 * The same Stay/Eat/Celebrate groupings already shown on the homepage's
 * "Four ways to discover Ranchi" section — reused here, not invented, as the
 * "adjacent categories/use case" tier. Every real Category.slug in the
 * database belongs to exactly one group.
 */
export const CATEGORY_DISCOVERY_GROUPS: Record<string, string[]> = {
  stay: ["resorts", "hotels", "homestays-farm-stays"],
  eat: ["restaurants", "cafes", "food-nightlife", "lounge-bar"],
  celebrate: ["banquet-halls", "wedding-venues", "party-halls"],
};

/** Pure — the other category slugs in the same discovery group as `categorySlug`, excluding itself. Returns [] for a category not in any group (never guesses a relationship). */
export function getAdjacentCategorySlugs(categorySlug: string): string[] {
  for (const group of Object.values(CATEGORY_DISCOVERY_GROUPS)) {
    if (group.includes(categorySlug)) return group.filter((slug) => slug !== categorySlug);
  }
  return [];
}

export function meetsDiscoveryDensity(count: number, min: number = MIN_DISCOVERY_LISTINGS): boolean {
  return count >= min;
}

/** Pure — how many more properties are needed to reach the density target; never negative. */
export function remainingForDensity(count: number, min: number = MIN_DISCOVERY_LISTINGS): number {
  return Math.max(0, min - count);
}

/**
 * Pure — takes the next `limit` candidates that aren't already in
 * `shownIds`, preserving the candidates' own order. Used between every
 * supplementation tier so a property already shown (as an exact match, or by
 * an earlier, higher-priority tier) can never appear twice on one page.
 */
export function dedupeAgainstShown<T extends { id: string }>(candidates: T[], shownIds: ReadonlySet<string>, limit: number): T[] {
  if (limit <= 0) return [];
  const result: T[] = [];
  for (const candidate of candidates) {
    if (shownIds.has(candidate.id)) continue;
    result.push(candidate);
    if (result.length >= limit) break;
  }
  return result;
}

export interface DiscoveryCountLabel {
  /** The large, primary count line. */
  primary: string;
  /** A clarifying second line — only present when the primary line no longer states a pure exact count. */
  secondary?: string;
}

/**
 * Pure — the only place that decides how a discovery page's listing count is
 * worded. Never claims a supplemented total is all exact matches (rule: "Do
 * not show '30 resorts found' unless there are actually 30 exact resort
 * matches"): once anything has been supplemented, the primary line switches
 * to an honest "N+ places to explore" and the real exact count moves to a
 * secondary clarifying line.
 */
export function buildDiscoveryCountLabel(params: {
  exactCount: number;
  displayedCount: number;
  exactNounPhrase: string; // e.g. "43 Banquet Halls listings" / "1 listing"
}): DiscoveryCountLabel {
  const { exactCount, displayedCount, exactNounPhrase } = params;
  if (displayedCount <= exactCount) {
    return { primary: exactNounPhrase };
  }
  return {
    primary: `${displayedCount}+ places to explore`,
    secondary: `${exactNounPhrase} exact match${exactCount === 1 ? "" : "es"}, plus similar places nearby`,
  };
}
