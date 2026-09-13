import { describe, expect, it } from "vitest";
import { locationSchema, isValidParent } from "./location";

describe("locationSchema", () => {
  it("accepts a minimal valid location", () => {
    const result = locationSchema.safeParse({
      name: "Lalpur",
      slug: "lalpur",
      parentId: "",
      description: "",
      seoTitle: "",
      seoDescription: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing name", () => {
    const result = locationSchema.safeParse({ name: "", slug: "lalpur" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid slug format", () => {
    const result = locationSchema.safeParse({ name: "Lalpur", slug: "Lal Pur!" });
    expect(result.success).toBe(false);
  });

  it("treats an empty parentId as null", () => {
    const result = locationSchema.safeParse({ name: "Lalpur", slug: "lalpur", parentId: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.parentId).toBeNull();
  });
});

describe("isValidParent (location)", () => {
  it("allows no parent", () => {
    expect(isValidParent("loc_1", null)).toBe(true);
  });

  it("rejects a location being its own parent", () => {
    expect(isValidParent("loc_1", "loc_1")).toBe(false);
  });

  it("allows a different location as parent", () => {
    expect(isValidParent("loc_1", "loc_2")).toBe(true);
  });
});
