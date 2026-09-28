import { describe, expect, it } from "vitest";
import {
  canHaveSponsoredPlacement,
  canSponsorAllCategories,
  checkExtraCategories,
  checkPlacementScope,
  isPlacementActive,
  maxExtraCategories,
  maxListingCategories,
  placementAppliesTo,
} from "./planEntitlements";

const known = new Set(["cat-a", "cat-b", "cat-c", "cat-d", "cat-e"]);

describe("plan limits", () => {
  it("Free = 1 category, Premium = 3, Lead Partner = every category", () => {
    expect(maxListingCategories("FREE")).toBe(1);
    expect(maxListingCategories("PREMIUM")).toBe(3);
    expect(maxListingCategories("LEAD_PARTNER")).toBe(Infinity);
    expect(maxExtraCategories("FREE")).toBe(0);
    expect(maxExtraCategories("PREMIUM")).toBe(2);
  });

  it("sponsored placement needs a paid plan; all-category sponsorship needs Lead Partner", () => {
    expect(canHaveSponsoredPlacement("FREE")).toBe(false);
    expect(canHaveSponsoredPlacement("PREMIUM")).toBe(true);
    expect(canHaveSponsoredPlacement("LEAD_PARTNER")).toBe(true);
    expect(canSponsorAllCategories("PREMIUM")).toBe(false);
    expect(canSponsorAllCategories("LEAD_PARTNER")).toBe(true);
  });
});

describe("checkExtraCategories", () => {
  it("Free plan cannot add any extra category", () => {
    const r = checkExtraCategories("FREE", "cat-a", ["cat-b"], known);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/Free plan/);
  });

  it("Premium allows two extras, not three", () => {
    expect(checkExtraCategories("PREMIUM", "cat-a", ["cat-b", "cat-c"], known).ok).toBe(true);
    expect(checkExtraCategories("PREMIUM", "cat-a", ["cat-b", "cat-c", "cat-d"], known).ok).toBe(false);
  });

  it("Lead Partner may take every category", () => {
    expect(checkExtraCategories("LEAD_PARTNER", "cat-a", ["cat-b", "cat-c", "cat-d", "cat-e"], known).ok).toBe(true);
  });

  it("drops the primary and duplicates, and rejects unknown categories", () => {
    expect(checkExtraCategories("PREMIUM", "cat-a", ["cat-a", "cat-b", "cat-b"], known).categoryIds).toEqual(["cat-b"]);
    expect(checkExtraCategories("LEAD_PARTNER", "cat-a", ["nope"], known).ok).toBe(false);
  });

  it("an empty selection is always fine, even on the Free plan", () => {
    expect(checkExtraCategories("FREE", "cat-a", [], known)).toEqual({ ok: true, categoryIds: [] });
  });
});

describe("checkPlacementScope", () => {
  it("Free has no sponsored placement", () => {
    expect(checkPlacementScope("FREE", false, ["resorts"], ["resorts"]).ok).toBe(false);
  });

  it("Premium may sponsor only categories the listing belongs to, never all", () => {
    expect(checkPlacementScope("PREMIUM", false, ["resorts"], ["resorts", "hotels"]).ok).toBe(true);
    expect(checkPlacementScope("PREMIUM", false, ["cafes"], ["resorts"]).ok).toBe(false);
    expect(checkPlacementScope("PREMIUM", true, [], ["resorts"]).ok).toBe(false);
  });

  it("Lead Partner may sponsor all categories or any chosen ones", () => {
    expect(checkPlacementScope("LEAD_PARTNER", true, [], []).ok).toBe(true);
    expect(checkPlacementScope("LEAD_PARTNER", false, ["cafes"], ["resorts"]).ok).toBe(true);
  });

  it("requires at least one category when not sponsoring all", () => {
    expect(checkPlacementScope("LEAD_PARTNER", false, [], []).ok).toBe(false);
  });
});

describe("placement activity and scope", () => {
  const now = new Date("2026-09-28T12:00:00Z");
  const base = { enabled: true, allCategories: false, categorySlugs: ["resorts"], startsAt: null, endsAt: null };

  it("is active only while enabled and inside its paid period", () => {
    expect(isPlacementActive(base, now)).toBe(true);
    expect(isPlacementActive({ ...base, enabled: false }, now)).toBe(false);
    expect(isPlacementActive({ ...base, startsAt: new Date("2026-10-01T00:00:00Z") }, now)).toBe(false);
    expect(isPlacementActive({ ...base, endsAt: new Date("2026-09-01T00:00:00Z") }, now)).toBe(false);
    expect(isPlacementActive({ ...base, endsAt: new Date("2026-12-01T00:00:00Z") }, now)).toBe(true);
  });

  it("applies to matching category lists; all-category placements apply everywhere, including location pages", () => {
    expect(placementAppliesTo(base, ["resorts", "hotels"])).toBe(true);
    expect(placementAppliesTo(base, ["cafes"])).toBe(false);
    expect(placementAppliesTo(base, null)).toBe(false);
    expect(placementAppliesTo({ ...base, allCategories: true }, ["cafes"])).toBe(true);
    expect(placementAppliesTo({ ...base, allCategories: true }, null)).toBe(true);
  });
});
