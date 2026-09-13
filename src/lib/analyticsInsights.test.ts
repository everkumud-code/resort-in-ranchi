import { describe, expect, it } from "vitest";
import {
  resolveAnalyticsPeriod,
  periodStartDate,
  computeConversionRate,
  formatConversionRate,
  aggregateSearchPaths,
  buildTrackedSearchPath,
  ANALYTICS_PERIODS,
  ANALYTICS_PERIOD_LABELS,
} from "./analyticsInsights";

describe("resolveAnalyticsPeriod", () => {
  it("accepts the two real period keys", () => {
    expect(resolveAnalyticsPeriod("7d")).toBe("7d");
    expect(resolveAnalyticsPeriod("30d")).toBe("30d");
  });

  it("never trusts an arbitrary/invalid value — falls back to 'all'", () => {
    expect(resolveAnalyticsPeriod(undefined)).toBe("all");
    expect(resolveAnalyticsPeriod("90d")).toBe("all");
    expect(resolveAnalyticsPeriod("'; DROP TABLE")).toBe("all");
    expect(resolveAnalyticsPeriod(["7d"])).toBe("all");
  });

  it("every period has a label", () => {
    for (const period of ANALYTICS_PERIODS) {
      expect(ANALYTICS_PERIOD_LABELS[period]).toBeTruthy();
    }
  });
});

describe("periodStartDate", () => {
  const now = new Date("2026-02-01T00:00:00Z");

  it("7d is exactly 7 days before now", () => {
    expect(periodStartDate("7d", now)).toEqual(new Date("2026-01-25T00:00:00Z"));
  });

  it("30d is exactly 30 days before now", () => {
    expect(periodStartDate("30d", now)).toEqual(new Date("2026-01-02T00:00:00Z"));
  });

  it("'all' has no lower bound at all — never a fabricated distant-past date", () => {
    expect(periodStartDate("all", now)).toBeNull();
  });
});

describe("computeConversionRate — never divides by zero, never fabricates a rate", () => {
  it("returns null when there is nothing to divide by (0/0 is 'not enough data', not 0%)", () => {
    expect(computeConversionRate(0, 0)).toBeNull();
  });

  it("returns a real 0% when there were views but genuinely zero conversions — an honest number, not hidden", () => {
    expect(computeConversionRate(0, 10)).toBe(0);
  });

  it("computes a correct percentage rounded to one decimal place", () => {
    expect(computeConversionRate(1, 3)).toBe(33.3);
    expect(computeConversionRate(1, 4)).toBe(25);
    expect(computeConversionRate(10, 10)).toBe(100);
  });

  it("never returns a rate above 100 or below 0 for sane inputs", () => {
    expect(computeConversionRate(5, 5)).toBe(100);
    expect(computeConversionRate(0, 5)).toBe(0);
  });
});

describe("formatConversionRate", () => {
  it("formats null as an honest 'not enough data' message, never a fabricated 0%", () => {
    expect(formatConversionRate(null)).toBe("Not enough data");
  });

  it("formats a real rate with a percent sign", () => {
    expect(formatConversionRate(33.3)).toBe("33.3%");
    expect(formatConversionRate(0)).toBe("0%");
  });
});

describe("buildTrackedSearchPath — never includes the visitor's free-text query", () => {
  it("builds a bare /search path when no structured filter is active", () => {
    expect(buildTrackedSearchPath({})).toBe("/search");
  });

  it("includes only the category filter when that's the only one active", () => {
    expect(buildTrackedSearchPath({ category: "resorts" })).toBe("/search?category=resorts");
  });

  it("includes only the location filter when that's the only one active", () => {
    expect(buildTrackedSearchPath({ location: "ranchi" })).toBe("/search?location=ranchi");
  });

  it("includes both when both are active", () => {
    const path = buildTrackedSearchPath({ category: "hotels", location: "ranchi" });
    const params = new URLSearchParams(path.split("?")[1]);
    expect(params.get("category")).toBe("hotels");
    expect(params.get("location")).toBe("ranchi");
  });

  it("has no field for a free-text query at all — the function's own input type carries no such field", () => {
    // TypeScript-level guarantee: buildTrackedSearchPath's parameter type only
    // ever accepts { category, location }. There is no `q` field to pass.
    const path = buildTrackedSearchPath({ category: "resorts" });
    expect(path).not.toContain("q=");
  });
});

describe("aggregateSearchPaths — real counts only, never invents an unsearched category/location", () => {
  it("returns empty arrays for no data", () => {
    expect(aggregateSearchPaths([])).toEqual({ categories: [], locations: [] });
  });

  it("ignores a bare '/search' path with no filter", () => {
    expect(aggregateSearchPaths(["/search", null])).toEqual({ categories: [], locations: [] });
  });

  it("counts a category filter", () => {
    const result = aggregateSearchPaths(["/search?category=resorts", "/search?category=resorts", "/search?category=hotels"]);
    expect(result.categories).toEqual([
      { slug: "resorts", count: 2 },
      { slug: "hotels", count: 1 },
    ]);
  });

  it("counts a location filter independently of category", () => {
    const result = aggregateSearchPaths(["/search?location=ranchi", "/search?category=hotels&location=ranchi"]);
    expect(result.locations).toEqual([{ slug: "ranchi", count: 2 }]);
    expect(result.categories).toEqual([{ slug: "hotels", count: 1 }]);
  });

  it("ranks by count descending", () => {
    const paths = [
      "/search?category=cafes",
      "/search?category=resorts",
      "/search?category=resorts",
      "/search?category=resorts",
    ];
    const result = aggregateSearchPaths(paths);
    expect(result.categories[0]).toEqual({ slug: "resorts", count: 3 });
    expect(result.categories[1]).toEqual({ slug: "cafes", count: 1 });
  });
});
