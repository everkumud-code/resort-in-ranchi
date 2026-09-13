import { describe, expect, it } from "vitest";
import { validateRow } from "./validate";
import type { MasterRow } from "./readWorkbook";

function row(overrides: Partial<MasterRow> = {}): MasterRow {
  return {
    id: 1,
    listingName: "The Cake Shop Bakery",
    recordType: "Property/Business",
    category: "Bakery/Cafe",
    locality: "Ranchi",
    parentProperty: null,
    status: "Discovered",
    source: "Current web research",
    address: null,
    phone: null,
    website: null,
    googleMapsUrl: null,
    googleRating: null,
    reviewCount: null,
    priceRange: null,
    rooms: null,
    capacity: null,
    swimmingPool: null,
    restaurant: null,
    banquet: null,
    lawn: null,
    wedding: null,
    corporateEvents: null,
    dayOuting: null,
    parking: null,
    whatsapp: null,
    email: null,
    description: null,
    claimed: null,
    verified: null,
    sourceUrl: null,
    lastChecked: "2026-09-08",
    rowNumber: 2,
    ...overrides,
  };
}

describe("validateRow", () => {
  it("accepts a well-formed Property/Business row", () => {
    const result = validateRow(row());
    expect(result.valid).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it("accepts a Verification Queue row with a placeholder name", () => {
    const result = validateRow(
      row({ id: 293, listingName: "Verification Queue 070", recordType: "Verification Queue", status: "Needs name + contact verification" })
    );
    expect(result.valid).toBe(true);
  });

  it("rejects a row with no ID", () => {
    const result = validateRow(row({ id: null }));
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain("missing or non-numeric ID");
  });

  it("rejects a row with no Listing Name", () => {
    const result = validateRow(row({ listingName: null }));
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain("missing Listing Name");
  });

  it("rejects a row with no Record Type", () => {
    const result = validateRow(row({ recordType: null }));
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain("missing Record Type");
  });

  it("rejects a row with an unrecognized Record Type", () => {
    const result = validateRow(row({ recordType: "Something Else" }));
    expect(result.valid).toBe(false);
    expect(result.reasons.some((r) => r.includes("unknown Record Type"))).toBe(true);
  });

  it("rejects a row with no Category", () => {
    const result = validateRow(row({ category: null }));
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain("missing Category");
  });

  it("rejects a row with no Locality", () => {
    const result = validateRow(row({ locality: null }));
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain("missing Locality");
  });

  it("rejects a Venue Space row with no Parent Property", () => {
    const result = validateRow(
      row({ recordType: "Venue Space / Outlet", listingName: "Lawn — Somewhere", parentProperty: null })
    );
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain("Venue Space row missing Parent Property");
  });

  it("accepts a Venue Space row with a Parent Property", () => {
    const result = validateRow(
      row({ recordType: "Venue Space / Outlet", listingName: "Lawn — Aangan Palace", parentProperty: "Aangan Palace" })
    );
    expect(result.valid).toBe(true);
  });

  it("collects multiple reasons at once", () => {
    const result = validateRow(row({ id: null, listingName: null, category: null }));
    expect(result.reasons.length).toBeGreaterThanOrEqual(3);
  });
});
