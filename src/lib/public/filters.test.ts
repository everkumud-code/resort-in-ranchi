import { describe, expect, it } from "vitest";
import {
  buildFacilityTrustWhere,
  buildQueryString,
  hasActiveFacilityOrTrustFilter,
  hasAnyFilterOrSort,
  sanitizeFacilitySlugs,
  sanitizeTrustParam,
  toggleFacilitySlug,
  TRUST_FILTER_VALUES,
} from "./filters";

describe("1. facility filter — buildFacilityTrustWhere", () => {
  it("filters on a single facility via a `some` clause on the real PropertyFacility relation", () => {
    const where = buildFacilityTrustWhere({ facilitySlugs: ["parking"] });
    expect(where.AND).toEqual([{ facilities: { some: { facility: { slug: "parking" } } } }]);
  });

  it("applies no facility condition at all when none are requested — never a false filter", () => {
    const where = buildFacilityTrustWhere({ facilitySlugs: [] });
    expect(where.AND).toBeUndefined();
  });
});

describe("2. multiple facility filters — AND semantics, not OR", () => {
  it("requires every requested facility (one `some` clause per slug, ANDed)", () => {
    const where = buildFacilityTrustWhere({ facilitySlugs: ["parking", "wifi"] });
    expect(where.AND).toEqual([
      { facilities: { some: { facility: { slug: "parking" } } } },
      { facilities: { some: { facility: { slug: "wifi" } } } },
    ]);
  });
});

describe("3. category + facility combination", () => {
  it("merges cleanly with a category page's existing where clause — both conditions survive", () => {
    const categoryWhere = { categoryId: { in: ["cat-1", "cat-2"] } };
    const merged = { ...categoryWhere, ...buildFacilityTrustWhere({ facilitySlugs: ["parking"] }) };
    expect(merged.categoryId).toEqual({ in: ["cat-1", "cat-2"] });
    expect(merged.AND).toEqual([{ facilities: { some: { facility: { slug: "parking" } } } }]);
  });
});

describe("4. location + facility combination", () => {
  it("merges cleanly with a location page's existing where clause — both conditions survive", () => {
    const locationWhere = { localityId: { in: ["loc-1"] } };
    const merged = { ...locationWhere, ...buildFacilityTrustWhere({ facilitySlugs: ["swimming-pool"] }) };
    expect(merged.localityId).toEqual({ in: ["loc-1"] });
    expect(merged.AND).toEqual([{ facilities: { some: { facility: { slug: "swimming-pool" } } } }]);
  });
});

describe("5. trust filter — buildFacilityTrustWhere", () => {
  it('"verified" bundles VERIFIED and OWNER_VERIFIED, exactly matching getPublicTrustTier\'s collapse — no new state invented', () => {
    const where = buildFacilityTrustWhere({ facilitySlugs: [], trust: "verified" });
    expect(where.verificationStatus).toEqual({ in: ["VERIFIED", "OWNER_VERIFIED"] });
  });

  it('"discovery" means everything NOT in the verified tier', () => {
    const where = buildFacilityTrustWhere({ facilitySlugs: [], trust: "discovery" });
    expect(where.verificationStatus).toEqual({ notIn: ["VERIFIED", "OWNER_VERIFIED"] });
  });

  it("applies no verificationStatus condition at all for 'All listings'", () => {
    const where = buildFacilityTrustWhere({ facilitySlugs: [] });
    expect(where.verificationStatus).toBeUndefined();
  });

  it("combines with facility filters in the same where clause", () => {
    const where = buildFacilityTrustWhere({ facilitySlugs: ["parking"], trust: "verified" });
    expect(where.AND).toEqual([{ facilities: { some: { facility: { slug: "parking" } } } }]);
    expect(where.verificationStatus).toEqual({ in: ["VERIFIED", "OWNER_VERIFIED"] });
  });
});

describe("6. invalid facility parameter", () => {
  const validSlugs = ["parking", "wifi", "swimming-pool"];

  it("drops a facility slug that doesn't match any real Facility row", () => {
    expect(sanitizeFacilitySlugs("bogus-facility", validSlugs)).toEqual([]);
  });

  it("keeps valid slugs while dropping invalid ones mixed in the same request", () => {
    expect(sanitizeFacilitySlugs(["parking", "not-real", "wifi"], validSlugs)).toEqual(["parking", "wifi"]);
  });

  it("de-dupes repeated valid slugs", () => {
    expect(sanitizeFacilitySlugs(["parking", "parking"], validSlugs)).toEqual(["parking"]);
  });

  it("handles a missing param as no facilities requested", () => {
    expect(sanitizeFacilitySlugs(undefined, validSlugs)).toEqual([]);
  });
});

describe("7. invalid trust parameter", () => {
  it("returns undefined (= All listings) for a garbage value, never an error", () => {
    expect(sanitizeTrustParam("not-a-real-status")).toBeUndefined();
  });

  it("returns undefined for a missing param", () => {
    expect(sanitizeTrustParam(undefined)).toBeUndefined();
  });

  it("accepts every real trust value", () => {
    for (const value of TRUST_FILTER_VALUES) {
      expect(sanitizeTrustParam(value)).toBe(value);
    }
  });

  it("takes only the first value if somehow given an array", () => {
    expect(sanitizeTrustParam(["verified", "discovery"])).toBe("verified");
  });
});

describe("8. zero-result state — hasActiveFacilityOrTrustFilter drives the empty-state message/clear-filters link", () => {
  it("is true when a facility filter is active", () => {
    expect(hasActiveFacilityOrTrustFilter({ facilitySlugs: ["parking"] })).toBe(true);
  });

  it("is true when a trust filter is active", () => {
    expect(hasActiveFacilityOrTrustFilter({ facilitySlugs: [], trust: "verified" })).toBe(true);
  });

  it("is false when nothing is active — the page falls back to its ordinary 'nothing published yet' empty state", () => {
    expect(hasActiveFacilityOrTrustFilter({ facilitySlugs: [] })).toBe(false);
  });
});

describe("9. URL parameter preservation", () => {
  it("buildQueryString preserves multiple params together, including a repeated array param", () => {
    const qs = buildQueryString({ location: "ormanjhi", sort: "newest", facility: ["parking", "wifi"], trust: "verified" });
    const parsed = new URLSearchParams(qs.slice(1));
    expect(parsed.get("location")).toBe("ormanjhi");
    expect(parsed.get("sort")).toBe("newest");
    expect(parsed.getAll("facility")).toEqual(["parking", "wifi"]);
    expect(parsed.get("trust")).toBe("verified");
  });

  it("omits falsy/undefined/empty-array values entirely rather than emitting empty params", () => {
    const qs = buildQueryString({ location: undefined, sort: "", facility: [], trust: undefined });
    expect(qs).toBe("");
  });

  it("toggleFacilitySlug adds an absent slug and removes a present one", () => {
    expect(toggleFacilitySlug(["parking"], "wifi")).toEqual(["parking", "wifi"]);
    expect(toggleFacilitySlug(["parking", "wifi"], "parking")).toEqual(["wifi"]);
  });

  it("matches the exact behavior of the old per-page qs() helper for plain string params (regression safety for existing sort/location pills)", () => {
    // The old helper: for (const [k,v] of Object.entries(params)) if (v) usp.set(k, v);
    const qs = buildQueryString({ location: "ormanjhi", sort: undefined });
    expect(qs).toBe("?location=ormanjhi");
  });
});

describe("10. noindex behavior for filtered variants — hasAnyFilterOrSort", () => {
  it("is false for the bare category/location URL (no query params at all)", () => {
    expect(hasAnyFilterOrSort({})).toBe(false);
  });

  it("is true when the page's own scoping param is set (e.g. location on a category page, or category on a location page)", () => {
    expect(hasAnyFilterOrSort({ scoping: "ormanjhi" })).toBe(true);
  });

  it("is true when sort is set", () => {
    expect(hasAnyFilterOrSort({ sort: "newest" })).toBe(true);
  });

  it("is true when a facility filter is set", () => {
    expect(hasAnyFilterOrSort({ facility: "parking" })).toBe(true);
  });

  it("is true when a facility filter is set as an array", () => {
    expect(hasAnyFilterOrSort({ facility: ["parking", "wifi"] })).toBe(true);
  });

  it("is false when the facility array is present but empty", () => {
    expect(hasAnyFilterOrSort({ facility: [] })).toBe(false);
  });

  it("is true when a trust filter is set", () => {
    expect(hasAnyFilterOrSort({ trust: "verified" })).toBe(true);
  });
});
