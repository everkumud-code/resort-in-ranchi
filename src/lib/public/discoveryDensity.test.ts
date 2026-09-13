import { describe, expect, it } from "vitest";
import {
  MIN_DISCOVERY_LISTINGS,
  buildDiscoveryCountLabel,
  dedupeAgainstShown,
  getAdjacentCategorySlugs,
  meetsDiscoveryDensity,
  remainingForDensity,
} from "./discoveryDensity";

describe("getAdjacentCategorySlugs", () => {
  it("returns the other categories in the same discovery group", () => {
    expect(getAdjacentCategorySlugs("resorts").sort()).toEqual(["homestays-farm-stays", "hotels"]);
    expect(getAdjacentCategorySlugs("wedding-venues").sort()).toEqual(["banquet-halls", "party-halls"]);
  });

  it("never includes the category itself", () => {
    expect(getAdjacentCategorySlugs("resorts")).not.toContain("resorts");
  });

  it("returns an empty array for a category not in any group — never guesses a relationship", () => {
    expect(getAdjacentCategorySlugs("some-future-category")).toEqual([]);
  });
});

describe("meetsDiscoveryDensity / remainingForDensity", () => {
  it("30 exactly meets the density target", () => {
    expect(meetsDiscoveryDensity(30)).toBe(true);
    expect(remainingForDensity(30)).toBe(0);
  });

  it("29 does not meet it and needs exactly 1 more", () => {
    expect(meetsDiscoveryDensity(29)).toBe(false);
    expect(remainingForDensity(29)).toBe(1);
  });

  it("never returns a negative remaining count", () => {
    expect(remainingForDensity(50)).toBe(0);
  });

  it("MIN_DISCOVERY_LISTINGS is 30", () => {
    expect(MIN_DISCOVERY_LISTINGS).toBe(30);
  });
});

describe("dedupeAgainstShown", () => {
  const candidates = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];

  it("filters out anything already shown, preserving order", () => {
    const result = dedupeAgainstShown(candidates, new Set(["b"]), 10);
    expect(result.map((r) => r.id)).toEqual(["a", "c", "d"]);
  });

  it("never returns more than the limit", () => {
    const result = dedupeAgainstShown(candidates, new Set(), 2);
    expect(result.map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("returns an empty array when everything is already shown", () => {
    const result = dedupeAgainstShown(candidates, new Set(["a", "b", "c", "d"]), 10);
    expect(result).toEqual([]);
  });

  it("returns an empty array when the limit is zero or negative", () => {
    expect(dedupeAgainstShown(candidates, new Set(), 0)).toEqual([]);
    expect(dedupeAgainstShown(candidates, new Set(), -5)).toEqual([]);
  });
});

describe("buildDiscoveryCountLabel", () => {
  it("shows a plain honest count when nothing was supplemented", () => {
    const label = buildDiscoveryCountLabel({ exactCount: 43, displayedCount: 43, exactNounPhrase: "43 listings" });
    expect(label).toEqual({ primary: "43 listings" });
  });

  it("never claims a fabricated exact total once supplementation happened — switches to an honest '+' framing", () => {
    const label = buildDiscoveryCountLabel({ exactCount: 5, displayedCount: 30, exactNounPhrase: "5 listings" });
    expect(label.primary).toBe("30+ places to explore");
    expect(label.primary).not.toMatch(/^30 /);
    expect(label.secondary).toContain("5 listings exact match");
  });

  it("pluralizes 'match' correctly for a single exact match", () => {
    const label = buildDiscoveryCountLabel({ exactCount: 1, displayedCount: 30, exactNounPhrase: "1 listing" });
    expect(label.secondary).toContain("1 listing exact match,");
    expect(label.secondary).not.toContain("matches");
  });
});
