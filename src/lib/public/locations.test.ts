import { describe, expect, it } from "vitest";
import { collectLocationIds, rollUpLocationCounts } from "./locations";

describe("collectLocationIds", () => {
  it("includes the location's own id when it has no children", () => {
    expect(collectLocationIds("loc_1", [])).toEqual(["loc_1"]);
  });

  it("includes children ids alongside the parent", () => {
    const result = collectLocationIds("loc_ranchi", ["loc_kanke"]);
    expect(result).toEqual(["loc_ranchi", "loc_kanke"]);
  });

  it("de-duplicates overlapping ids", () => {
    const result = collectLocationIds("loc_1", ["loc_1"]);
    expect(result).toEqual(["loc_1"]);
  });
});

describe("PHASE 5D — rollUpLocationCounts (same honest-count fix as categories)", () => {
  it("a leaf location with no children shows only its own direct count", () => {
    const locations = [{ id: "loc_ranchi", name: "Ranchi", slug: "ranchi", parentId: null }];
    const result = rollUpLocationCounts(locations, new Map([["loc_ranchi", 69]]));
    expect(result).toEqual([{ id: "loc_ranchi", name: "Ranchi", slug: "ranchi", publishedCount: 69 }]);
  });

  it("a parent area's count includes a child locality's real listings, even with zero direct listings of its own", () => {
    const locations = [
      { id: "loc_parent", name: "Parent Area", slug: "parent-area", parentId: null },
      { id: "loc_child", name: "Child Locality", slug: "child-locality", parentId: "loc_parent" },
    ];
    const directCountById = new Map([["loc_child", 3]]); // no entry for the parent — genuinely 0 direct
    const result = rollUpLocationCounts(locations, directCountById);
    expect(result.find((l) => l.slug === "parent-area")!.publishedCount).toBe(3);
    expect(result.find((l) => l.slug === "child-locality")!.publishedCount).toBe(3);
  });

  it("a location with no listings anywhere shows a real, honest 0", () => {
    const locations = [{ id: "loc_empty", name: "Empty", slug: "empty", parentId: null }];
    expect(rollUpLocationCounts(locations, new Map())[0].publishedCount).toBe(0);
  });

  it("does not affect an unrelated location's count", () => {
    const locations = [
      { id: "loc_parent", name: "Parent Area", slug: "parent-area", parentId: null },
      { id: "loc_child", name: "Child Locality", slug: "child-locality", parentId: "loc_parent" },
      { id: "loc_other", name: "Other", slug: "other", parentId: null },
    ];
    const directCountById = new Map([
      ["loc_child", 3],
      ["loc_other", 9],
    ]);
    const result = rollUpLocationCounts(locations, directCountById);
    expect(result.find((l) => l.slug === "other")!.publishedCount).toBe(9);
  });
});
