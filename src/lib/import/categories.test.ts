import { describe, expect, it } from "vitest";
import { normalizeCategory } from "./categories";

describe("normalizeCategory", () => {
  it("maps a simple raw category to its core category", () => {
    const result = normalizeCategory("Restaurant");
    expect(result).toMatchObject({ slug: "restaurants", isCore: true });
  });

  it("maps a compound category by its first matching segment", () => {
    const result = normalizeCategory("Hotel/Banquet");
    expect(result).toMatchObject({ slug: "hotels", isCore: true });
  });

  it("falls through to a later segment when the first doesn't match", () => {
    // "Club" has no core mapping; "Wedding Venue" does.
    const result = normalizeCategory("Club/Wedding Venue");
    expect(result).toMatchObject({ slug: "wedding-venues", isCore: true });
  });

  it("auto-creates a category from raw text when nothing matches, rather than guessing", () => {
    const result = normalizeCategory("Lounge/Bar");
    expect(result.isCore).toBe(false);
    expect(result.name).toBe("Lounge");
    expect(result.slug).toBe("lounge");
  });

  it("preserves the original raw segments", () => {
    const result = normalizeCategory("Resort/Banquet");
    expect(result.rawSegments).toEqual(["Resort", "Banquet"]);
  });
});
