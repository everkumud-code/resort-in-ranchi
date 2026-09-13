import { describe, expect, it } from "vitest";
import { findDuplicateCandidates, normalizeNameForComparison } from "./duplicates";

describe("normalizeNameForComparison", () => {
  it("lowercases and trims", () => {
    expect(normalizeNameForComparison("  Shri Gobindam Banquet  ")).toBe("shri gobindam banquet");
  });

  it("collapses internal whitespace", () => {
    expect(normalizeNameForComparison("K7   Hotel  &  Restaurant")).toBe("k7 hotel restaurant");
  });

  it("strips punctuation but keeps letters/numbers/spaces", () => {
    expect(normalizeNameForComparison("Focus Club & Resort!")).toBe("focus club resort");
  });

  it("treats case differences as equal", () => {
    expect(normalizeNameForComparison("Focus Club and Resort")).toBe(
      normalizeNameForComparison("Focus Club And Resort")
    );
  });
});

interface Rec {
  id: string;
  name: string;
  locality: string;
}

describe("findDuplicateCandidates", () => {
  it("finds no duplicates when all names are distinct", () => {
    const records: Rec[] = [
      { id: "1", name: "The Cake Shop Bakery", locality: "Ranchi" },
      { id: "2", name: "Lake Garden Banquet Hall", locality: "Argora" },
    ];
    const result = findDuplicateCandidates(records, (r) => r.name, (r) => r.locality);
    expect(result).toHaveLength(0);
  });

  it("flags exact-name, same-locality matches as high confidence", () => {
    const records: Rec[] = [
      { id: "6", name: "Shri Gobindam Banquet", locality: "Booty" },
      { id: "7", name: "Shri Gobindam Banquet", locality: "Booty" },
    ];
    const result = findDuplicateCandidates(records, (r) => r.name, (r) => r.locality);
    expect(result).toHaveLength(1);
    expect(result[0].confidence).toBe("high");
    expect(result[0].records.map((r) => r.id).sort()).toEqual(["6", "7"]);
  });

  it("flags same-name, different-locality matches as medium confidence", () => {
    const records: Rec[] = [
      { id: "133", name: "Focus Club and Resort", locality: "Daladali" },
      { id: "151", name: "Focus Club And Resort", locality: "Ring Road" },
    ];
    const result = findDuplicateCandidates(records, (r) => r.name, (r) => r.locality);
    expect(result).toHaveLength(1);
    expect(result[0].confidence).toBe("medium");
  });

  it("does not flag a group of one", () => {
    const records: Rec[] = [{ id: "1", name: "Solo Resort", locality: "Ranchi" }];
    const result = findDuplicateCandidates(records, (r) => r.name, (r) => r.locality);
    expect(result).toHaveLength(0);
  });
});
