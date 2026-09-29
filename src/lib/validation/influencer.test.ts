import { describe, expect, it } from "vitest";
import { influencerSchema, criterionNameSchema } from "./influencer";

describe("influencerSchema", () => {
  const base = { name: "Priya Ranchi Vlogs", slug: "priya-ranchi-vlogs" };

  it("defaults to draft, unfeatured, order 0", () => {
    const parsed = influencerSchema.parse(base);
    expect(parsed.status).toBe("DRAFT");
    expect(parsed.featured).toBe(false);
    expect(parsed.order).toBe(0);
  });

  it("requires a name and a valid slug", () => {
    expect(influencerSchema.safeParse({ ...base, name: "" }).success).toBe(false);
    expect(influencerSchema.safeParse({ ...base, slug: "Not A Slug" }).success).toBe(false);
  });

  it("only accepts http(s) URLs for social links and photo", () => {
    expect(influencerSchema.safeParse({ ...base, instagramUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(influencerSchema.safeParse({ ...base, photoUrl: "https://x.test/a.jpg" }).success).toBe(true);
  });

  it("reads the featured checkbox and PUBLISHED status", () => {
    const parsed = influencerSchema.parse({ ...base, featured: "on", status: "PUBLISHED" });
    expect(parsed.featured).toBe(true);
    expect(parsed.status).toBe("PUBLISHED");
  });
});

describe("criterionNameSchema", () => {
  it("requires a non-empty name under 60 characters", () => {
    expect(criterionNameSchema.safeParse("").success).toBe(false);
    expect(criterionNameSchema.safeParse("Content quality").success).toBe(true);
    expect(criterionNameSchema.safeParse("x".repeat(61)).success).toBe(false);
  });
});
