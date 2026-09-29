import { describe, expect, it } from "vitest";
import { creatorProfileSchema } from "./creatorProfile";

describe("creatorProfileSchema", () => {
  const base = { name: "Priya", slug: "priya-ranchi" };

  it("accepts a minimal valid profile", () => {
    expect(creatorProfileSchema.safeParse(base).success).toBe(true);
  });

  it("requires a name and a valid slug", () => {
    expect(creatorProfileSchema.safeParse({ ...base, name: "" }).success).toBe(false);
    expect(creatorProfileSchema.safeParse({ ...base, slug: "Not A Slug" }).success).toBe(false);
  });

  it("never exposes a way to set featured/status/order — a creator cannot escalate their own visibility", () => {
    const shape = creatorProfileSchema.shape;
    expect(shape).not.toHaveProperty("featured");
    expect(shape).not.toHaveProperty("status");
    expect(shape).not.toHaveProperty("order");
    expect(shape).not.toHaveProperty("claimed");
  });

  it("only accepts http(s) URLs for photo/video/social links", () => {
    expect(creatorProfileSchema.safeParse({ ...base, photoUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(creatorProfileSchema.safeParse({ ...base, videoUrl: "https://youtube.com/x" }).success).toBe(true);
  });
});
