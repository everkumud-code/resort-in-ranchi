/**
 * Pure helpers for turning raw AnalyticsEvent/Enquiry counts into honest
 * funnel and conversion numbers. Nothing here touches the database — see
 * the admin/owner dashboard pages for the actual queries. Every function is
 * deliberately conservative: a rate is only ever computed when the
 * denominator is a real, positive count; otherwise it reports "not enough
 * data" rather than showing a misleading 0%.
 */

export type AnalyticsPeriod = "7d" | "30d" | "all";

export const ANALYTICS_PERIODS: AnalyticsPeriod[] = ["7d", "30d", "all"];

export const ANALYTICS_PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  all: "All time",
};

/** Never trusts an arbitrary query value — anything other than the two real period keys falls back to "all". */
export function resolveAnalyticsPeriod(raw: string | string[] | undefined): AnalyticsPeriod {
  return raw === "7d" || raw === "30d" ? raw : "all";
}

/** Returns the cutoff Date for a period, or null for "all" (meaning: no lower bound at all — never a fabricated distant-past date standing in for "forever"). */
export function periodStartDate(period: AnalyticsPeriod, now: Date = new Date()): Date | null {
  if (period === "7d") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (period === "30d") return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return null;
}

/**
 * A percentage, rounded to one decimal place, or null when there is nothing
 * real to divide by — 0/0 is "not enough data", never a fabricated 0%. A
 * genuine 0% (some views, zero submits) is still reported as 0, since that
 * is a real, honest number.
 */
export function computeConversionRate(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}

export function formatConversionRate(rate: number | null): string {
  return rate === null ? "Not enough data" : `${rate}%`;
}

export interface SearchPathBreakdown {
  categories: Array<{ slug: string; count: number }>;
  locations: Array<{ slug: string; count: number }>;
}

/**
 * SEARCH events reuse the existing AnalyticsEvent.path column to carry the
 * structured category/location filter that was active (e.g.
 * "/search?category=resorts") — never the visitor's own free-text query,
 * which could incidentally contain something identifying. This parses that
 * back out and ranks each real slug by how often it appears. Never invents
 * a category/location that wasn't actually searched.
 */
export function aggregateSearchPaths(paths: (string | null)[]): SearchPathBreakdown {
  const categoryCounts = new Map<string, number>();
  const locationCounts = new Map<string, number>();

  for (const path of paths) {
    if (!path) continue;
    const queryIndex = path.indexOf("?");
    if (queryIndex === -1) continue;
    const params = new URLSearchParams(path.slice(queryIndex + 1));
    const category = params.get("category");
    const location = params.get("location");
    if (category) categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    if (location) locationCounts.set(location, (locationCounts.get(location) ?? 0) + 1);
  }

  const toSortedArray = (map: Map<string, number>) =>
    [...map.entries()].map(([slug, count]) => ({ slug, count })).sort((a, b) => b.count - a.count);

  return { categories: toSortedArray(categoryCounts), locations: toSortedArray(locationCounts) };
}

/** Builds the tracked SEARCH path from only the structured, non-free-text filters — the visitor's typed query string is deliberately never included. */
export function buildTrackedSearchPath(filters: { category?: string | null; location?: string | null }): string {
  const params = new URLSearchParams();
  if (filters.category) params.set("category", filters.category);
  if (filters.location) params.set("location", filters.location);
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}
