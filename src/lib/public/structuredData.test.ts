import { describe, expect, it } from "vitest";
import { breadcrumbJsonLd, itemListJsonLd, localBusinessJsonLd, organizationJsonLd, websiteJsonLd } from "./structuredData";
import type { PublicProperty } from "./properties";

function mockProperty(overrides: Partial<PublicProperty> = {}): PublicProperty {
  return {
    id: "prop_1",
    slug: "aangan-resort",
    name: "Aangan Resort",
    shortDescription: null,
    fullDescription: null,
    address: null,
    city: "Ranchi",
    state: "Jharkhand",
    pincode: null,
    latitude: null,
    longitude: null,
    phone: null,
    whatsapp: null,
    email: null,
    website: null,
    googleMapsUrl: null,
    googleRating: null,
    reviewCount: null,
    priceMin: null,
    priceMax: null,
    priceLabel: null,
    rooms: null,
    eventCapacityMin: null,
    eventCapacityMax: null,
    featured: false,
    verificationStatus: "DISCOVERED",
    claimed: false,
    generatedIdentityMarkUrl: null,
    commercialTier: "FREE",
    category: { id: "cat_1", name: "Resorts", slug: "resorts" },
    locality: { id: "loc_1", name: "Ranchi", slug: "ranchi" },
    facilities: [],
    venueSpaces: [],
    images: [],
    badges: [],
    ...overrides,
  };
}

describe("organizationJsonLd / websiteJsonLd", () => {
  it("produces a valid Organization block", () => {
    const data = organizationJsonLd();
    expect(data["@type"]).toBe("Organization");
    expect(data["@context"]).toBe("https://schema.org");
  });

  it("produces a valid WebSite block", () => {
    const data = websiteJsonLd();
    expect(data["@type"]).toBe("WebSite");
  });
});

describe("breadcrumbJsonLd", () => {
  it("numbers items starting at 1", () => {
    const data = breadcrumbJsonLd([
      { name: "Resorts", path: "/resorts" },
      { name: "Aangan Resort", path: "/property/aangan-resort" },
    ]);
    expect(data.itemListElement[0]).toMatchObject({ position: 1, name: "Resorts" });
    expect(data.itemListElement[1]).toMatchObject({ position: 2, name: "Aangan Resort" });
  });

  it("builds absolute URLs for each item", () => {
    const data = breadcrumbJsonLd([{ name: "Resorts", path: "/resorts" }]);
    expect(data.itemListElement[0].item).toMatch(/^https?:\/\/.*\/resorts$/);
  });
});

describe("itemListJsonLd", () => {
  it("numbers items starting at 1, in the given order", () => {
    const data = itemListJsonLd([
      { name: "Aangan Resort", path: "/property/aangan-resort" },
      { name: "Ranchi Club", path: "/property/ranchi-club" },
    ]);
    expect(data.itemListElement[0]).toMatchObject({ position: 1, name: "Aangan Resort" });
    expect(data.itemListElement[1]).toMatchObject({ position: 2, name: "Ranchi Club" });
  });

  it("builds absolute URLs for each item", () => {
    const data = itemListJsonLd([{ name: "Aangan Resort", path: "/property/aangan-resort" }]);
    expect(data.itemListElement[0].url).toMatch(/^https?:\/\/.*\/property\/aangan-resort$/);
  });

  it("returns an empty list for no items — never fabricates an entry", () => {
    expect(itemListJsonLd([]).itemListElement).toEqual([]);
  });
});

describe("localBusinessJsonLd", () => {
  it("returns null when there is no address, phone, or website (insufficient data)", () => {
    const property = mockProperty();
    expect(localBusinessJsonLd(property, "/property/aangan-resort")).toBeNull();
  });

  it("returns a block when a phone number is present", () => {
    const property = mockProperty({ phone: "+91-9000000000" });
    const data = localBusinessJsonLd(property, "/property/aangan-resort");
    expect(data).not.toBeNull();
    expect(data?.telephone).toBe("+91-9000000000");
  });

  it("maps category slug to the closest schema.org type", () => {
    const property = mockProperty({ phone: "123", category: { id: "c", name: "Hotels", slug: "hotels" } });
    const data = localBusinessJsonLd(property, "/property/x");
    expect(data?.["@type"]).toBe("Hotel");
  });

  it("falls back to LocalBusiness for an unmapped category", () => {
    const property = mockProperty({ phone: "123", category: { id: "c", name: "Lounge & Bar", slug: "lounge-bar" } });
    const data = localBusinessJsonLd(property, "/property/x");
    expect(data?.["@type"]).toBe("LocalBusiness");
  });

  it("never includes provenance fields even though they aren't on the type", () => {
    const property = mockProperty({ phone: "123" });
    const data = localBusinessJsonLd(property, "/property/x");
    expect(JSON.stringify(data)).not.toMatch(/sourceRecordId|rawCategory|rawLocality/);
  });

  it("only includes aggregateRating when both rating and review count are present", () => {
    const withBoth = mockProperty({ phone: "123", googleRating: 4.5, reviewCount: 100 });
    const withOnlyRating = mockProperty({ phone: "123", googleRating: 4.5, reviewCount: null });
    expect(localBusinessJsonLd(withBoth, "/x")?.aggregateRating).toBeDefined();
    expect(localBusinessJsonLd(withOnlyRating, "/x")?.aggregateRating).toBeUndefined();
  });

  it("includes real PHOTO image URLs, in order, when present", () => {
    const property = mockProperty({
      phone: "123",
      images: [
        { id: "i1", url: "https://x/a.jpg", altText: null, caption: null, sortOrder: 1, kind: "PHOTO", tag: null, isHero: false },
        { id: "i2", url: "https://x/b.jpg", altText: null, caption: null, sortOrder: 2, kind: "PHOTO", tag: null, isHero: false },
      ],
    });
    expect(localBusinessJsonLd(property, "/x")?.image).toEqual(["https://x/a.jpg", "https://x/b.jpg"]);
  });

  it("never includes a generated ILLUSTRATIVE image as if it were a real photo of the business", () => {
    const property = mockProperty({
      phone: "123",
      images: [{ id: "i1", url: "https://x/illustrative.jpg", altText: null, caption: null, sortOrder: 1, kind: "ILLUSTRATIVE", tag: null, isHero: false }],
    });
    expect(localBusinessJsonLd(property, "/x")?.image).toBeUndefined();
  });

  it("omits image entirely when there are no real photos — never fabricates one", () => {
    const property = mockProperty({ phone: "123" });
    expect(localBusinessJsonLd(property, "/x")?.image).toBeUndefined();
  });

  it("includes real geo coordinates when both latitude and longitude are present", () => {
    const property = mockProperty({ phone: "123", latitude: 23.4, longitude: 85.3 });
    expect(localBusinessJsonLd(property, "/x")?.geo).toEqual({ "@type": "GeoCoordinates", latitude: 23.4, longitude: 85.3 });
  });

  it("omits geo when either coordinate is missing — never guesses one", () => {
    const property = mockProperty({ phone: "123", latitude: 23.4, longitude: null });
    expect(localBusinessJsonLd(property, "/x")?.geo).toBeUndefined();
  });
});

describe("localBusinessJsonLd — richer details, only when the listing really has them", () => {
  it("adds price range, map link, rooms, amenities and area from real fields", () => {
    const data = localBusinessJsonLd(
      mockProperty({
        phone: "123",
        priceLabel: "₹3,000–6,000 per night",
        googleMapsUrl: "https://maps.example/x",
        rooms: 24,
        facilities: [{ facility: { name: "Parking", slug: "parking" } }, { facility: { name: "Lawn", slug: "lawn" } }],
      }),
      "/x"
    );
    expect(data?.priceRange).toBe("₹3,000–6,000 per night");
    expect(data?.hasMap).toBe("https://maps.example/x");
    expect(data?.numberOfRooms).toBe(24);
    expect(data?.amenityFeature).toEqual([
      { "@type": "LocationFeatureSpecification", name: "Parking", value: true },
      { "@type": "LocationFeatureSpecification", name: "Lawn", value: true },
    ]);
    expect(data?.containedInPlace).toEqual({ "@type": "Place", name: "Ranchi, Ranchi" });
  });

  it("uses venue capacity only for event venues, and rooms only for lodging", () => {
    const venue = localBusinessJsonLd(
      mockProperty({ phone: "1", rooms: 10, eventCapacityMax: 500, category: { id: "c", name: "Banquet Halls", slug: "banquet-halls" } }),
      "/x"
    );
    expect(venue?.maximumAttendeeCapacity).toBe(500);
    expect(venue?.numberOfRooms).toBeUndefined();
    const resort = localBusinessJsonLd(mockProperty({ phone: "1", rooms: 10, eventCapacityMax: 500 }), "/x");
    expect(resort?.numberOfRooms).toBe(10);
    expect(resort?.maximumAttendeeCapacity).toBeUndefined();
  });

  it("omits every optional detail when the listing has none", () => {
    const data = localBusinessJsonLd(mockProperty({ phone: "1", locality: null }), "/x");
    for (const key of ["priceRange", "hasMap", "numberOfRooms", "maximumAttendeeCapacity", "amenityFeature", "containedInPlace"]) {
      expect(data).not.toHaveProperty(key);
    }
  });
});
