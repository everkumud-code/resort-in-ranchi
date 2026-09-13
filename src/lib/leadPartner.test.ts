import { describe, expect, it } from "vitest";
import {
  evaluatePartnerEligibility,
  findEligiblePartners,
  isPartnerEligible,
  startOfCurrentMonthUtc,
  type EligibilityContext,
  type LeadPartnerLike,
  type LeadTarget,
} from "./leadPartner";

const noUsage: EligibilityContext = { currentMonthLeadCounts: {} };

const basePartner: LeadPartnerLike = {
  id: "partner1",
  propertyId: "aangan-resort-id",
  enabled: true,
  eligibleCategorySlugs: ["wedding-venues", "banquet-halls", "resorts"],
  eligibleLocationSlugs: [],
  priority: 0,
  monthlyLeadCap: null,
  capacityMin: null,
  capacityMax: null,
};

const baseTarget: LeadTarget = {
  propertyId: "other-prop",
  categorySlug: "wedding-venues",
  localitySlug: "morabadi",
};

describe("PHASE 6/8 — category and self-referral matching", () => {
  it("is eligible when enabled and the target's category is in the partner's list", () => {
    expect(isPartnerEligible(basePartner, baseTarget, noUsage)).toBe(true);
  });

  it("is never eligible for an irrelevant category — never distributes irrelevant leads", () => {
    expect(isPartnerEligible(basePartner, { ...baseTarget, categorySlug: "cafes" }, noUsage)).toBe(false);
  });

  it("is never eligible when disabled, even for a matching category", () => {
    expect(isPartnerEligible({ ...basePartner, enabled: false }, baseTarget, noUsage)).toBe(false);
  });

  it("never refers a lead to itself (no self-referral) even if its own category matches", () => {
    expect(isPartnerEligible(basePartner, { ...baseTarget, propertyId: "aangan-resort-id" }, noUsage)).toBe(false);
  });
});

describe("PHASE 8 — location matching", () => {
  it("an empty eligibleLocationSlugs list means no restriction — matches any location, including none", () => {
    expect(isPartnerEligible(basePartner, { ...baseTarget, localitySlug: "morabadi" }, noUsage)).toBe(true);
    expect(isPartnerEligible(basePartner, { ...baseTarget, localitySlug: null }, noUsage)).toBe(true);
  });

  it("matches when the target's locality is in the partner's configured list", () => {
    const partner = { ...basePartner, eligibleLocationSlugs: ["morabadi", "doranda"] };
    expect(isPartnerEligible(partner, { ...baseTarget, localitySlug: "morabadi" }, noUsage)).toBe(true);
  });

  it("excludes a target whose locality isn't in the partner's configured list", () => {
    const partner = { ...basePartner, eligibleLocationSlugs: ["doranda"] };
    expect(isPartnerEligible(partner, { ...baseTarget, localitySlug: "morabadi" }, noUsage)).toBe(false);
  });

  it("excludes a target with no locality at all when the partner restricts by location — never assumes a match", () => {
    const partner = { ...basePartner, eligibleLocationSlugs: ["doranda"] };
    expect(isPartnerEligible(partner, { ...baseTarget, localitySlug: null }, noUsage)).toBe(false);
  });
});

describe("PHASE 8 — capacity matching (reuses the partner's own real Property capacity)", () => {
  it("no constraint when the partner's property has no capacity range set", () => {
    expect(isPartnerEligible(basePartner, { ...baseTarget, guests: 500 }, noUsage)).toBe(true);
  });

  it("skips the capacity check when guests is unknown (page-render time), even if the partner has a range", () => {
    const partner = { ...basePartner, capacityMin: 50, capacityMax: 200 };
    expect(isPartnerEligible(partner, { ...baseTarget, guests: undefined }, noUsage)).toBe(true);
    expect(isPartnerEligible(partner, { ...baseTarget, guests: null }, noUsage)).toBe(true);
  });

  it("excludes a guest count below the partner's minimum", () => {
    const partner = { ...basePartner, capacityMin: 50, capacityMax: 200 };
    expect(isPartnerEligible(partner, { ...baseTarget, guests: 10 }, noUsage)).toBe(false);
  });

  it("excludes a guest count above the partner's maximum", () => {
    const partner = { ...basePartner, capacityMin: 50, capacityMax: 200 };
    expect(isPartnerEligible(partner, { ...baseTarget, guests: 500 }, noUsage)).toBe(false);
  });

  it("matches a guest count within range", () => {
    const partner = { ...basePartner, capacityMin: 50, capacityMax: 200 };
    expect(isPartnerEligible(partner, { ...baseTarget, guests: 120 }, noUsage)).toBe(true);
  });
});

describe("PHASE 8 — monthly lead cap", () => {
  it("unlimited (null cap) is always eligible regardless of usage", () => {
    const context: EligibilityContext = { currentMonthLeadCounts: { partner1: 9999 } };
    expect(isPartnerEligible(basePartner, baseTarget, context)).toBe(true);
  });

  it("excludes a partner already at its monthly cap", () => {
    const partner = { ...basePartner, monthlyLeadCap: 5 };
    const context: EligibilityContext = { currentMonthLeadCounts: { partner1: 5 } };
    expect(isPartnerEligible(partner, baseTarget, context)).toBe(false);
  });

  it("still eligible one short of the cap", () => {
    const partner = { ...basePartner, monthlyLeadCap: 5 };
    const context: EligibilityContext = { currentMonthLeadCounts: { partner1: 4 } };
    expect(isPartnerEligible(partner, baseTarget, context)).toBe(true);
  });

  it("treats a missing usage entry as zero", () => {
    const partner = { ...basePartner, monthlyLeadCap: 5 };
    expect(isPartnerEligible(partner, baseTarget, noUsage)).toBe(true);
  });
});

describe("PHASE 8 — evaluatePartnerEligibility records an auditable reason", () => {
  it("explains a match with category, location, capacity, and cap clauses, and the partner's priority", () => {
    const partner = { ...basePartner, priority: 7, eligibleLocationSlugs: ["morabadi"], capacityMin: 50, capacityMax: 200, monthlyLeadCap: 10 };
    const context: EligibilityContext = { currentMonthLeadCounts: { partner1: 3 } };
    const result = evaluatePartnerEligibility(partner, { ...baseTarget, guests: 100 }, context);
    expect(result.eligible).toBe(true);
    expect(result.reason).toMatch(/category "wedding-venues" matched/);
    expect(result.reason).toMatch(/location "morabadi" matched/);
    expect(result.reason).toMatch(/100 guests fits/);
    expect(result.reason).toMatch(/3\/10 used/);
    expect(result.reason).toMatch(/priority 7/);
  });

  it("explains exactly why a non-match failed", () => {
    const result = evaluatePartnerEligibility(basePartner, { ...baseTarget, categorySlug: "cafes" }, noUsage);
    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/category "cafes" is not in the partner's eligible categories/);
  });
});

describe("PHASE 6/8 — findEligiblePartners", () => {
  const otherPartner: LeadPartnerLike = { ...basePartner, id: "partner2", propertyId: "some-other-property", eligibleCategorySlugs: ["cafes"] };

  it("returns only partners eligible for the given target, never irrelevant ones", () => {
    const result = findEligiblePartners([basePartner, otherPartner], baseTarget, noUsage);
    expect(result.map((r) => r.partner.id)).toEqual(["partner1"]);
    expect(result[0].reason).toBeTruthy();
  });

  it("returns an empty array when nothing is eligible — never fabricates a partner", () => {
    const result = findEligiblePartners([basePartner, otherPartner], { ...baseTarget, categorySlug: "hotels" }, noUsage);
    expect(result).toEqual([]);
  });

  it("ranks eligible partners by priority, highest first", () => {
    const low = { ...basePartner, id: "low", priority: 1 };
    const high = { ...basePartner, id: "high", priority: 10 };
    const mid = { ...basePartner, id: "mid", priority: 5 };
    const result = findEligiblePartners([low, high, mid], baseTarget, noUsage);
    expect(result.map((r) => r.partner.id)).toEqual(["high", "mid", "low"]);
  });

  it("never limits how many eligible partners are returned — priority orders, it doesn't cut off", () => {
    const partners = Array.from({ length: 5 }, (_, i) => ({ ...basePartner, id: `p${i}`, priority: i }));
    const result = findEligiblePartners(partners, baseTarget, noUsage);
    expect(result).toHaveLength(5);
  });
});

describe("PHASE 8 — startOfCurrentMonthUtc", () => {
  it("returns 00:00:00 UTC on the 1st of the month containing the given date", () => {
    const d = new Date("2026-03-17T23:59:59.999Z");
    expect(startOfCurrentMonthUtc(d).toISOString()).toBe("2026-03-01T00:00:00.000Z");
  });

  it("handles a date that's already the 1st", () => {
    const d = new Date("2026-01-01T05:00:00.000Z");
    expect(startOfCurrentMonthUtc(d).toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });
});
