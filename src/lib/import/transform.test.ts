import { describe, expect, it } from "vitest";
import { buildImportPlan } from "./transform";
import type { MasterRow } from "./readWorkbook";

function row(overrides: Partial<MasterRow>): MasterRow {
  return {
    id: null,
    listingName: null,
    recordType: null,
    category: null,
    locality: null,
    parentProperty: null,
    status: null,
    source: null,
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
    lastChecked: null,
    rowNumber: 2,
    ...overrides,
  };
}

describe("buildImportPlan", () => {
  it("never creates a Property from a Verification Queue row", () => {
    const rows: MasterRow[] = [
      row({
        id: 293,
        listingName: "Verification Queue 070",
        recordType: "Verification Queue",
        category: "Adventure/Camping",
        locality: "Daladali",
        status: "Needs name + contact verification",
      }),
    ];
    const plan = buildImportPlan(rows);
    expect(plan.properties).toHaveLength(0);
    expect(plan.excludedVerificationQueue).toHaveLength(1);
    expect(plan.excludedVerificationQueue[0].sourceRecordId).toBe("293");
  });

  it("imports a Property/Business row as DRAFT + DISCOVERED", () => {
    const rows: MasterRow[] = [
      row({
        id: 1,
        listingName: "The Cake Shop Bakery",
        recordType: "Property/Business",
        category: "Bakery/Cafe",
        locality: "Ranchi",
        status: "Discovered",
        source: "Current web research",
      }),
    ];
    const plan = buildImportPlan(rows);
    expect(plan.properties).toHaveLength(1);
    expect(plan.properties[0]).toMatchObject({
      sourceRecordId: "1",
      name: "The Cake Shop Bakery",
      status: "DRAFT",
      verificationStatus: "DISCOVERED",
    });
  });

  it("resolves a Venue Space to its parent Property by name", () => {
    const rows: MasterRow[] = [
      row({ id: 2, listingName: "Celebration Banquet Hall", recordType: "Property/Business", category: "Banquet Hall", locality: "Ranchi" }),
      row({
        id: 220,
        listingName: "Lawn — Celebration Banquet Hall",
        recordType: "Venue Space / Outlet",
        category: "Venue Space",
        locality: "Ranchi",
        parentProperty: "Celebration Banquet Hall",
      }),
    ];
    const plan = buildImportPlan(rows);
    expect(plan.venueSpacesResolved).toHaveLength(1);
    expect(plan.venueSpacesResolved[0]).toMatchObject({
      name: "Lawn",
      parentSourceRecordId: "2",
    });
    expect(plan.venueSpacesUnresolved).toHaveLength(0);
  });

  it("leaves a Venue Space unresolved (and out of the insertable set) when its parent name isn't found", () => {
    const rows: MasterRow[] = [
      row({
        id: 247,
        listingName: "Astor — Radisson Blu Hotel Ranchi",
        recordType: "Venue Space / Outlet",
        category: "Venue Space",
        locality: "Ranchi",
        parentProperty: "Radisson Blu Hotel Ranchi",
      }),
    ];
    const plan = buildImportPlan(rows);
    expect(plan.venueSpacesResolved).toHaveLength(0);
    expect(plan.venueSpacesUnresolved).toHaveLength(1);
    expect(plan.venueSpacesUnresolved[0].rawParentName).toBe("Radisson Blu Hotel Ranchi");
  });

  it("flags duplicate-name Property rows as NEEDS_REVIEW without dropping either (when not a curated merge)", () => {
    const rows: MasterRow[] = [
      row({ id: 50, listingName: "Some Duplicate Hall", recordType: "Property/Business", category: "Banquet Hall", locality: "Booty" }),
      row({ id: 51, listingName: "Some Duplicate Hall", recordType: "Property/Business", category: "Banquet Hall", locality: "Booty" }),
    ];
    const plan = buildImportPlan(rows);
    expect(plan.properties).toHaveLength(2);
    expect(plan.properties.every((p) => p.verificationStatus === "NEEDS_REVIEW")).toBe(true);
    expect(plan.duplicateGroups).toHaveLength(1);
    expect(plan.duplicateGroups[0].confidence).toBe("high");
  });

  it("rejects invalid rows instead of importing them", () => {
    const rows: MasterRow[] = [row({ id: 1, listingName: null, recordType: "Property/Business", category: "Hotel", locality: "Ranchi" })];
    const plan = buildImportPlan(rows);
    expect(plan.properties).toHaveLength(0);
    expect(plan.rejected).toHaveLength(1);
    expect(plan.rejected[0].reasons).toContain("missing Listing Name");
  });

  it("generates unique slugs even for duplicate names", () => {
    const rows: MasterRow[] = [
      row({ id: 50, listingName: "Some Duplicate Hall", recordType: "Property/Business", category: "Banquet Hall", locality: "Booty" }),
      row({ id: 51, listingName: "Some Duplicate Hall", recordType: "Property/Business", category: "Banquet Hall", locality: "Booty" }),
    ];
    const plan = buildImportPlan(rows);
    const slugs = plan.properties.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(2);
  });

  describe("curated decisions", () => {
    it("merges ID 7 into ID 6 (Shri Gobindam Banquet), keeping a single canonical property", () => {
      const rows: MasterRow[] = [
        row({ id: 6, listingName: "Shri Gobindam Banquet", recordType: "Property/Business", category: "Banquet Hall", locality: "Booty" }),
        row({ id: 7, listingName: "Shri Gobindam Banquet", recordType: "Property/Business", category: "Banquet Hall", locality: "Booty" }),
      ];
      const plan = buildImportPlan(rows);
      expect(plan.properties).toHaveLength(1);
      expect(plan.properties[0].sourceRecordId).toBe("6");
      expect(plan.properties[0].mergedFromSourceRecordIds).toEqual(["7"]);
      expect(plan.duplicateGroups).toHaveLength(0);
      expect(plan.appliedMerges).toHaveLength(1);
      expect(plan.appliedMerges[0]).toMatchObject({ mergeSourceRecordId: "7", intoSourceRecordId: "6" });
    });

    it("merges ID 175 into ID 127 (K7 Hotel & Restaurant), keeping the broader category from ID 127", () => {
      const rows: MasterRow[] = [
        row({ id: 127, listingName: "K7 Hotel & Restaurant", recordType: "Property/Business", category: "Hotel/Restaurant", locality: "Mesra" }),
        row({ id: 175, listingName: "K7 Hotel & Restaurant", recordType: "Property/Business", category: "Restaurant", locality: "Mesra" }),
      ];
      const plan = buildImportPlan(rows);
      expect(plan.properties).toHaveLength(1);
      expect(plan.properties[0].sourceRecordId).toBe("127");
      expect(plan.properties[0].categorySlug).toBe("hotels"); // "Hotel/Restaurant" -> Hotels (first matching segment)
      expect(plan.properties[0].mergedFromSourceRecordIds).toEqual(["175"]);
    });

    it("does NOT merge Focus Club and/And Resort — flags NEEDS_REVIEW instead, per explicit instruction to keep them separate", () => {
      const rows: MasterRow[] = [
        row({ id: 133, listingName: "Focus Club and Resort", recordType: "Property/Business", category: "Resort", locality: "Daladali" }),
        row({ id: 151, listingName: "Focus Club And Resort", recordType: "Property/Business", category: "Resort/Banquet", locality: "Ring Road" }),
      ];
      const plan = buildImportPlan(rows);
      expect(plan.properties).toHaveLength(2);
      expect(plan.properties.every((p) => p.verificationStatus === "NEEDS_REVIEW")).toBe(true);
      expect(plan.duplicateGroups).toHaveLength(1);
      expect(plan.duplicateGroups[0].confidence).toBe("medium");
      expect(plan.appliedMerges).toHaveLength(0);
    });

    it("resolves venue space 223 to 'The Padosan Restaurant' via manual override despite no auto-match", () => {
      const rows: MasterRow[] = [
        row({ id: 500, listingName: "The Padosan Restaurant", recordType: "Property/Business", category: "Restaurant", locality: "Ranchi" }),
        row({
          id: 223,
          listingName: "Lawn — The Padosan",
          recordType: "Venue Space / Outlet",
          category: "Venue Space",
          locality: "Ranchi",
          parentProperty: "The Padosan",
        }),
      ];
      const plan = buildImportPlan(rows);
      expect(plan.venueSpacesUnresolved).toHaveLength(0);
      expect(plan.venueSpacesResolved).toHaveLength(1);
      expect(plan.venueSpacesResolved[0]).toMatchObject({
        parentSourceRecordId: "500",
        resolvedVia: "manual-override",
      });
    });

    it("keeps venue space 261 unresolved (pinned) even if a plausible-looking parent exists", () => {
      const rows: MasterRow[] = [
        row({ id: 501, listingName: "Swarna Bhumi Ranchi", recordType: "Property/Business", category: "Resort", locality: "Ranchi" }),
        row({
          id: 261,
          listingName: "Banquet 1 — Swarna Bhumi Banquets",
          recordType: "Venue Space / Outlet",
          category: "Venue Space",
          locality: "Ranchi",
          parentProperty: "Swarna Bhumi Banquets",
        }),
      ];
      const plan = buildImportPlan(rows);
      expect(plan.venueSpacesResolved).toHaveLength(0);
      expect(plan.venueSpacesUnresolved).toHaveLength(1);
      expect(plan.venueSpacesUnresolved[0].unresolvedReason).toMatch(/not sufficiently confirmed/);
    });

    it("keeps venue space 286 unresolved (pinned) and does not invent a parent for it", () => {
      const rows: MasterRow[] = [
        row({
          id: 286,
          listingName: "Restaurant — Arpan Restaurant",
          recordType: "Venue Space / Outlet",
          category: "Venue Space",
          locality: "Ranchi",
          parentProperty: "Arpan Restaurant",
        }),
      ];
      const plan = buildImportPlan(rows);
      expect(plan.venueSpacesResolved).toHaveLength(0);
      expect(plan.venueSpacesUnresolved).toHaveLength(1);
      expect(plan.venueSpacesUnresolved[0].unresolvedReason).toMatch(/No Property\/Business record exists/);
    });

    it("assigns Madeera Lounge & Bar (ID 128) to a curated 'Lounge & Bar' category under 'Food & Nightlife'", () => {
      const rows: MasterRow[] = [
        row({ id: 128, listingName: "Madeera Lounge & Bar", recordType: "Property/Business", category: "Lounge/Bar", locality: "Ranchi" }),
      ];
      const plan = buildImportPlan(rows);
      expect(plan.properties).toHaveLength(1);
      expect(plan.properties[0].categorySlug).toBe("lounge-bar");
      expect(plan.properties[0].categoryName).toBe("Lounge & Bar");
      expect(plan.properties[0].categoryParentSlug).toBe("food-nightlife");
      expect(plan.categoriesUsed.get("food-nightlife")).toBeDefined();
      expect(plan.categoriesUsed.get("food-nightlife")?.name).toBe("Food & Nightlife");
    });
  });
});
