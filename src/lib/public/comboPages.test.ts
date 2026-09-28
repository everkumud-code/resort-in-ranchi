import { describe, expect, it } from "vitest";
import { buildComboIndex, comboDescription, comboPath, comboTitle } from "./comboPages";

const categories = [
  { id: "c-resort", slug: "resorts", name: "Resorts" },
  { id: "c-banquet", slug: "banquet-halls", name: "Banquet Halls" },
];
const locations = [
  { id: "l-ranchi", slug: "ranchi", name: "Ranchi", parentId: null },
  { id: "l-kanke", slug: "kanke", name: "Kanke", parentId: "l-ranchi" },
];

describe("buildComboIndex", () => {
  const index = buildComboIndex(
    [
      { categoryId: "c-resort", extraCategoryIds: [], localityId: "l-kanke" },
      { categoryId: "c-resort", extraCategoryIds: ["c-banquet"], localityId: "l-kanke" },
      { categoryId: "c-banquet", extraCategoryIds: [], localityId: null },
    ],
    categories,
    locations
  );
  const find = (cat: string, loc: string) => index.find((e) => e.categorySlug === cat && e.locationSlug === loc);

  it("counts a listing in its primary category and any paid extra category", () => {
    expect(find("resorts", "kanke")?.count).toBe(2);
    expect(find("banquet-halls", "kanke")?.count).toBe(1);
  });

  it("also counts it under the parent area, like a location page does", () => {
    expect(find("resorts", "ranchi")?.count).toBe(2);
  });

  it("skips listings with no area, and never offers a combination with no listing", () => {
    expect(find("banquet-halls", "ranchi")?.count).toBe(1);
    expect(index.every((e) => e.count >= 1)).toBe(true);
  });

  it("orders the biggest combinations first", () => {
    expect(index[0].count).toBeGreaterThanOrEqual(index[index.length - 1].count);
  });
});

describe("combo text", () => {
  it("builds the path, title and a factual description", () => {
    expect(comboPath("resorts", "kanke")).toBe("/resorts/kanke");
    expect(comboTitle("Resorts", "Kanke")).toBe("Resorts in Kanke, Ranchi");
    expect(comboDescription("Resorts", "Kanke", 2, ["A", "B", "C", "D"])).toBe(
      "Browse 2 resorts listings in Kanke, Ranchi on ResortInRanchi, including A, B, C. Compare details, photos and contact information."
    );
    expect(comboDescription("Resorts", "Kanke", 1, [])).toContain("1 resorts listing in Kanke");
  });
});
