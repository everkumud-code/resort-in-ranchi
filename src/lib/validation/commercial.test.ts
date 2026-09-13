import { describe, expect, it } from "vitest";
import {
  COMMERCIAL_TIER_BADGE_CLASS,
  COMMERCIAL_TIER_LABELS,
  COMMERCIAL_TIER_VALUES,
  isValidCommercialTier,
} from "./commercial";

describe("PHASE 9 — CommercialTier constants", () => {
  it("supports exactly FREE, PREMIUM, LEAD_PARTNER", () => {
    expect(COMMERCIAL_TIER_VALUES).toEqual(["FREE", "PREMIUM", "LEAD_PARTNER"]);
  });

  it("every value has a label and a badge class", () => {
    for (const value of COMMERCIAL_TIER_VALUES) {
      expect(COMMERCIAL_TIER_LABELS[value]).toBeTruthy();
      expect(COMMERCIAL_TIER_BADGE_CLASS[value]).toBeTruthy();
    }
  });
});

describe("PHASE 9 — isValidCommercialTier", () => {
  it("accepts every real value", () => {
    for (const value of COMMERCIAL_TIER_VALUES) {
      expect(isValidCommercialTier(value)).toBe(true);
    }
  });

  it("rejects an arbitrary/invented tier — never trusts unchecked form input", () => {
    expect(isValidCommercialTier("ENTERPRISE")).toBe(false);
    expect(isValidCommercialTier("")).toBe(false);
    expect(isValidCommercialTier("free")).toBe(false);
  });
});
