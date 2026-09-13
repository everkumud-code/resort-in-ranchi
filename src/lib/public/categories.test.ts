import { describe, expect, it } from "vitest";
import { collectCategoryIds, rollUpCategoryCounts } from "./categories";

describe("collectCategoryIds", () => {
  it("includes the category's own id when it has no children", () => {
    expect(collectCategoryIds("cat_1", [])).toEqual(["cat_1"]);
  });

  it("includes children ids alongside the parent", () => {
    const result = collectCategoryIds("cat_food-nightlife", ["cat_lounge-bar"]);
    expect(result).toEqual(["cat_food-nightlife", "cat_lounge-bar"]);
  });

  it("de-duplicates if a child id somehow equals the parent id", () => {
    const result = collectCategoryIds("cat_1", ["cat_1", "cat_2"]);
    expect(result).toEqual(["cat_1", "cat_2"]);
  });

  it("preserves multiple distinct children", () => {
    const result = collectCategoryIds("cat_1", ["cat_2", "cat_3"]);
    expect(result).toHaveLength(3);
  });
});

describe("PHASE 5D — rollUpCategoryCounts (fixes the homepage-vs-category-page count mismatch)", () => {
  it("a leaf category with no children shows only its own direct count", () => {
    const categories = [{ id: "cat_resorts", name: "Resorts", slug: "resorts", parentId: null }];
    const result = rollUpCategoryCounts(categories, new Map([["cat_resorts", 20]]));
    expect(result).toEqual([{ id: "cat_resorts", name: "Resorts", slug: "resorts", publishedCount: 20 }]);
  });

  it("a parent umbrella category's count includes its child's real listings, even with zero direct listings of its own", () => {
    // Reproduces the real bug found in the Phase 5D audit: Food & Nightlife
    // had 0 direct published properties but its child Lounge & Bar had 1 —
    // the homepage showed "0 listings" while the category's own page
    // (which does roll up children) showed 1, a genuine visitor-facing
    // mismatch between the promised count and the real content.
    const categories = [
      { id: "cat_food-nightlife", name: "Food & Nightlife", slug: "food-nightlife", parentId: null },
      { id: "cat_lounge-bar", name: "Lounge & Bar", slug: "lounge-bar", parentId: "cat_food-nightlife" },
    ];
    const directCountById = new Map([["cat_lounge-bar", 1]]); // no entry at all for the parent — genuinely 0 direct
    const result = rollUpCategoryCounts(categories, directCountById);
    const foodNightlife = result.find((c) => c.slug === "food-nightlife")!;
    const loungeBar = result.find((c) => c.slug === "lounge-bar")!;
    expect(foodNightlife.publishedCount).toBe(1);
    expect(loungeBar.publishedCount).toBe(1);
  });

  it("a parent's count is its own direct listings plus every child's, when it has both", () => {
    const categories = [
      { id: "parent", name: "Parent", slug: "parent", parentId: null },
      { id: "child-a", name: "Child A", slug: "child-a", parentId: "parent" },
      { id: "child-b", name: "Child B", slug: "child-b", parentId: "parent" },
    ];
    const directCountById = new Map([
      ["parent", 2],
      ["child-a", 3],
      ["child-b", 5],
    ]);
    const result = rollUpCategoryCounts(categories, directCountById);
    expect(result.find((c) => c.slug === "parent")!.publishedCount).toBe(10);
  });

  it("a category with no listings anywhere (itself or children) shows a real, honest 0 — never a fabricated non-zero count", () => {
    const categories = [{ id: "empty", name: "Empty", slug: "empty", parentId: null }];
    const result = rollUpCategoryCounts(categories, new Map());
    expect(result[0].publishedCount).toBe(0);
  });

  it("does not affect an unrelated sibling category's count", () => {
    const categories = [
      { id: "cat_food-nightlife", name: "Food & Nightlife", slug: "food-nightlife", parentId: null },
      { id: "cat_lounge-bar", name: "Lounge & Bar", slug: "lounge-bar", parentId: "cat_food-nightlife" },
      { id: "cat_resorts", name: "Resorts", slug: "resorts", parentId: null },
    ];
    const directCountById = new Map([
      ["cat_lounge-bar", 1],
      ["cat_resorts", 20],
    ]);
    const result = rollUpCategoryCounts(categories, directCountById);
    expect(result.find((c) => c.slug === "resorts")!.publishedCount).toBe(20);
  });
});
