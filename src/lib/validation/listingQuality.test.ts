import { describe, expect, it } from "vitest";
import { calculateListingQuality, isEventCategory, isLodgingCategory } from "./listingQuality";

function baseInput() {
  return {
    shortDescription: null,
    fullDescription: null,
    phone: null,
    email: null,
    website: null,
    priceMin: null,
    priceMax: null,
    priceLabel: null,
    rooms: null,
    eventCapacityMin: null,
    eventCapacityMax: null,
    categorySlug: "restaurants",
    photoCount: 0,
    facilityCount: 0,
    venueSpaceCount: 0,
  };
}

describe("calculateListingQuality — category applicability", () => {
  it("a category with no lodging/event relevance only scores the 7 universal fields", () => {
    const result = calculateListingQuality(baseInput());
    expect(result.items.map((i) => i.id).sort()).toEqual(
      ["description", "email", "facilities", "phone", "photos", "pricing", "website"].sort()
    );
    expect(result.totalCount).toBe(7);
  });

  it("a lodging category (hotels/resorts/homestays) adds a 'rooms' item", () => {
    const result = calculateListingQuality({ ...baseInput(), categorySlug: "resorts" });
    expect(result.items.some((i) => i.id === "rooms")).toBe(true);
    expect(result.items.some((i) => i.id === "capacity" || i.id === "venueSpaces")).toBe(false);
    expect(result.totalCount).toBe(8);
  });

  it("an event category (wedding-venues/banquet-halls/party-halls) adds 'capacity' and 'venueSpaces' but not 'rooms'", () => {
    const result = calculateListingQuality({ ...baseInput(), categorySlug: "wedding-venues" });
    expect(result.items.some((i) => i.id === "capacity")).toBe(true);
    expect(result.items.some((i) => i.id === "venueSpaces")).toBe(true);
    expect(result.items.some((i) => i.id === "rooms")).toBe(false);
    expect(result.totalCount).toBe(9);
  });

  it.each(["hotels", "resorts", "homestays-farm-stays"])("%s is treated as a lodging category", (slug) => {
    expect(isLodgingCategory(slug)).toBe(true);
    expect(isEventCategory(slug)).toBe(false);
  });

  it.each(["wedding-venues", "banquet-halls", "party-halls"])("%s is treated as an event category", (slug) => {
    expect(isEventCategory(slug)).toBe(true);
    expect(isLodgingCategory(slug)).toBe(false);
  });

  it.each(["restaurants", "cafes", "lounge-bar", "food-nightlife", "some-future-category"])(
    "%s is neither lodging nor event — never guesses applicability for an unlisted category",
    (slug) => {
      expect(isLodgingCategory(slug)).toBe(false);
      expect(isEventCategory(slug)).toBe(false);
    }
  );
});

describe("calculateListingQuality — never infers or fabricates missing data", () => {
  it("an entirely empty property scores 0% with every applicable item incomplete", () => {
    const result = calculateListingQuality(baseInput());
    expect(result.completedCount).toBe(0);
    expect(result.percent).toBe(0);
    expect(result.isComplete).toBe(false);
    expect(result.items.every((i) => !i.complete)).toBe(true);
  });

  it("a fully-populated non-lodging/non-event property scores 100%", () => {
    const result = calculateListingQuality({
      ...baseInput(),
      shortDescription: "A cozy cafe.",
      phone: "+91 9876543210",
      email: "hello@example.com",
      website: "https://example.com",
      priceLabel: "₹200 for two",
      photoCount: 3,
      facilityCount: 2,
    });
    expect(result.completedCount).toBe(7);
    expect(result.percent).toBe(100);
    expect(result.isComplete).toBe(true);
  });

  it("counts fullDescription alone as satisfying the description item", () => {
    const result = calculateListingQuality({ ...baseInput(), fullDescription: "A longer description." });
    expect(result.items.find((i) => i.id === "description")?.complete).toBe(true);
  });

  it("treats priceMin/priceMax of exactly 0 as present data, not missing — never conflates 0 with null", () => {
    const result = calculateListingQuality({ ...baseInput(), priceMin: 0 });
    expect(result.items.find((i) => i.id === "pricing")?.complete).toBe(true);
  });

  it("a priceLabel alone (no numeric min/max) satisfies pricing", () => {
    const result = calculateListingQuality({ ...baseInput(), priceLabel: "Contact for pricing" });
    expect(result.items.find((i) => i.id === "pricing")?.complete).toBe(true);
  });

  it("treats rooms of exactly 0 as present data for a lodging category", () => {
    const result = calculateListingQuality({ ...baseInput(), categorySlug: "hotels", rooms: 0 });
    expect(result.items.find((i) => i.id === "rooms")?.complete).toBe(true);
  });

  it("does not mark photos complete just because an illustrative/logo image exists elsewhere — the caller must pass a real photo count", () => {
    // photoCount here represents only PHOTO-kind images (the caller's
    // responsibility, per the field's doc comment) — this test locks in
    // that 0 always means incomplete regardless of any other image kind.
    const result = calculateListingQuality({ ...baseInput(), photoCount: 0 });
    expect(result.items.find((i) => i.id === "photos")?.complete).toBe(false);
  });

  it("blank-string fields (empty, not null) are treated as missing, matching how the owner-edit schema stores blanks as null", () => {
    const result = calculateListingQuality({ ...baseInput(), phone: "", email: "" });
    expect(result.items.find((i) => i.id === "phone")?.complete).toBe(false);
    expect(result.items.find((i) => i.id === "email")?.complete).toBe(false);
  });
});

describe("calculateListingQuality — percent and status", () => {
  it("computes a rounded integer percentage", () => {
    // 7 universal items, 2 complete → 2/7 = 28.57% → rounds to 29
    const result = calculateListingQuality({
      ...baseInput(),
      shortDescription: "Something.",
      phone: "+91 9876543210",
    });
    expect(result.percent).toBe(29);
    expect(Number.isInteger(result.percent)).toBe(true);
  });

  it("isComplete is true only when every applicable item is complete, including category-conditional ones", () => {
    const banquetHallInput = {
      ...baseInput(),
      categorySlug: "banquet-halls",
      shortDescription: "A hall.",
      phone: "+91 9876543210",
      email: "a@b.com",
      website: "https://example.com",
      priceLabel: "On request",
      photoCount: 1,
      facilityCount: 1,
      eventCapacityMin: 50,
    };

    const missingVenueSpaces = calculateListingQuality({ ...banquetHallInput, venueSpaceCount: 0 });
    expect(missingVenueSpaces.isComplete).toBe(false);

    const fullyComplete = calculateListingQuality({ ...banquetHallInput, venueSpaceCount: 1 });
    expect(fullyComplete.isComplete).toBe(true);
    expect(fullyComplete.percent).toBe(100);
  });
});
