import { describe, expect, it } from "vitest";
import { dedupeFacilityIds, facilitySchema } from "./facility";

describe("facilitySchema", () => {
  it("accepts a minimal valid facility", () => {
    const result = facilitySchema.safeParse({ name: "Swimming Pool", slug: "swimming-pool" });
    expect(result.success).toBe(true);
  });

  it("rejects a missing name", () => {
    const result = facilitySchema.safeParse({ name: "", slug: "parking" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty slug", () => {
    const result = facilitySchema.safeParse({ name: "Parking", slug: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a slug with uppercase letters", () => {
    const result = facilitySchema.safeParse({ name: "Parking", slug: "Parking" });
    expect(result.success).toBe(false);
  });

  it("rejects a slug with spaces", () => {
    const result = facilitySchema.safeParse({ name: "Parking", slug: "car parking" });
    expect(result.success).toBe(false);
  });

  it("rejects a slug with consecutive/leading/trailing hyphens", () => {
    expect(facilitySchema.safeParse({ name: "x", slug: "-parking" }).success).toBe(false);
    expect(facilitySchema.safeParse({ name: "x", slug: "parking-" }).success).toBe(false);
    expect(facilitySchema.safeParse({ name: "x", slug: "par--king" }).success).toBe(false);
  });

  it("accepts a valid multi-word slug", () => {
    const result = facilitySchema.safeParse({ name: "Kids Area", slug: "kids-area" });
    expect(result.success).toBe(true);
  });

  it("trims the name", () => {
    const result = facilitySchema.safeParse({ name: "  Wi-Fi  ", slug: "wifi" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("Wi-Fi");
  });
});

describe("dedupeFacilityIds", () => {
  it("removes duplicate IDs while preserving order", () => {
    expect(dedupeFacilityIds(["a", "b", "a", "c", "b"])).toEqual(["a", "b", "c"]);
  });

  it("returns an empty array for no input", () => {
    expect(dedupeFacilityIds([])).toEqual([]);
  });

  it("leaves an already-unique list unchanged", () => {
    expect(dedupeFacilityIds(["a", "b", "c"])).toEqual(["a", "b", "c"]);
  });
});
