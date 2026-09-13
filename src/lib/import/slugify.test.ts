import { describe, expect, it } from "vitest";
import { slugify, uniqueSlug } from "./slugify";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Aangan Resort")).toBe("aangan-resort");
  });

  it("converts & to and", () => {
    expect(slugify("Bed & Breakfast")).toBe("bed-and-breakfast");
  });

  it("strips punctuation", () => {
    expect(slugify("K7 Hotel & Restaurant")).toBe("k7-hotel-and-restaurant");
  });

  it("collapses repeated separators", () => {
    expect(slugify("Lake   Garden -- Banquet")).toBe("lake-garden-banquet");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("  -Focus Club-  ")).toBe("focus-club");
  });
});

describe("uniqueSlug", () => {
  it("returns the plain slug when unused", () => {
    const taken = new Set<string>();
    expect(uniqueSlug("Lake Garden Banquet Hall", taken)).toBe("lake-garden-banquet-hall");
  });

  it("appends -2, -3 on collision", () => {
    const taken = new Set<string>();
    expect(uniqueSlug("Shri Gobindam Banquet", taken)).toBe("shri-gobindam-banquet");
    expect(uniqueSlug("Shri Gobindam Banquet", taken)).toBe("shri-gobindam-banquet-2");
    expect(uniqueSlug("Shri Gobindam Banquet", taken)).toBe("shri-gobindam-banquet-3");
  });

  it("registers the winning slug in the taken set", () => {
    const taken = new Set<string>();
    const slug = uniqueSlug("The Cake Shop Bakery", taken);
    expect(taken.has(slug)).toBe(true);
  });
});
