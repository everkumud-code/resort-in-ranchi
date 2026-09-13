import { describe, expect, it } from "vitest";
import { categorySchema, isValidParent } from "./category";

describe("categorySchema", () => {
  it("accepts a minimal valid category", () => {
    const result = categorySchema.safeParse({
      name: "Resorts",
      slug: "resorts",
      parentId: "",
      description: "",
      seoTitle: "",
      seoDescription: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing name", () => {
    const result = categorySchema.safeParse({ name: "", slug: "resorts" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty slug", () => {
    const result = categorySchema.safeParse({ name: "Resorts", slug: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a slug with uppercase letters", () => {
    const result = categorySchema.safeParse({ name: "Resorts", slug: "Resorts" });
    expect(result.success).toBe(false);
  });

  it("rejects a slug with spaces", () => {
    const result = categorySchema.safeParse({ name: "Resorts", slug: "resort spaces" });
    expect(result.success).toBe(false);
  });

  it("rejects a slug with consecutive/leading/trailing hyphens", () => {
    expect(categorySchema.safeParse({ name: "x", slug: "-resorts" }).success).toBe(false);
    expect(categorySchema.safeParse({ name: "x", slug: "resorts-" }).success).toBe(false);
    expect(categorySchema.safeParse({ name: "x", slug: "re--sorts" }).success).toBe(false);
  });

  it("accepts a valid multi-word slug", () => {
    const result = categorySchema.safeParse({ name: "Wedding Venues", slug: "wedding-venues" });
    expect(result.success).toBe(true);
  });

  it("treats an empty parentId as null", () => {
    const result = categorySchema.safeParse({ name: "x", slug: "x", parentId: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.parentId).toBeNull();
  });
});

describe("isValidParent (category)", () => {
  it("allows no parent", () => {
    expect(isValidParent("cat_1", null)).toBe(true);
  });

  it("allows a different category as parent", () => {
    expect(isValidParent("cat_1", "cat_2")).toBe(true);
  });

  it("rejects a category being its own parent", () => {
    expect(isValidParent("cat_1", "cat_1")).toBe(false);
  });

  it("allows any parent when creating a brand-new category (no id yet)", () => {
    expect(isValidParent(null, "cat_2")).toBe(true);
  });
});
