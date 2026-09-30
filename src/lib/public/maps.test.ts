import { describe, expect, it } from "vitest";
import { buildDirectionsUrl, buildMapsSearchUrl } from "./maps";

describe("buildMapsSearchUrl", () => {
  it("URL-encodes the query into a real Google Maps search link", () => {
    expect(buildMapsSearchUrl("Hundru Falls, Angara block, Ranchi")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Hundru%20Falls%2C%20Angara%20block%2C%20Ranchi"
    );
  });
});

describe("buildDirectionsUrl", () => {
  it("prefers an explicit admin-set googleMapsUrl when present", () => {
    const url = buildDirectionsUrl({
      googleMapsUrl: "https://maps.app.goo.gl/abc123",
      address: "Some address",
      name: "Aangan Resort",
      city: "Ranchi",
    });
    expect(url).toBe("https://maps.app.goo.gl/abc123");
  });

  it("falls back to a search built from name + address when no explicit link exists", () => {
    const url = buildDirectionsUrl({
      googleMapsUrl: null,
      address: "Angara block, ~45 km from Ranchi",
      name: "Hundru Falls",
      city: "Ranchi",
    });
    expect(url).toBe(buildMapsSearchUrl("Hundru Falls, Angara block, ~45 km from Ranchi"));
  });

  it("falls back to name + city when even the address is missing", () => {
    const url = buildDirectionsUrl({ googleMapsUrl: null, address: null, name: "Some Place", city: "Ranchi" });
    expect(url).toBe(buildMapsSearchUrl("Some Place, Ranchi"));
  });
});
