import { describe, expect, it } from "vitest";
import { venueSpaceSchema } from "./venueSpace";

describe("venueSpaceSchema", () => {
  it("accepts a minimal valid venue space (name only)", () => {
    const result = venueSpaceSchema.safeParse({ name: "Raj Darbar Lawn", type: "", capacityMin: "", capacityMax: "", description: "" });
    expect(result.success).toBe(true);
  });

  it("accepts a fully populated valid venue space", () => {
    const result = venueSpaceSchema.safeParse({
      name: "Virasat Lawn",
      type: "Outdoor Lawn",
      capacityMin: "200",
      capacityMax: "1000",
      description: "An open-air lawn used for receptions and ceremonies.",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.capacityMin).toBe(200);
      expect(result.data.capacityMax).toBe(1000);
    }
  });

  it("rejects a missing name", () => {
    const result = venueSpaceSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a name that is only whitespace", () => {
    const result = venueSpaceSchema.safeParse({ name: "   " });
    expect(result.success).toBe(false);
  });

  it("accepts any free-text type, or none", () => {
    expect(venueSpaceSchema.safeParse({ name: "Hall A", type: "Banquet Hall" }).success).toBe(true);
    expect(venueSpaceSchema.safeParse({ name: "Hall A", type: "" }).success).toBe(true);
    const result = venueSpaceSchema.safeParse({ name: "Hall A", type: "" });
    if (result.success) expect(result.data.type).toBeNull();
  });

  it("treats blank capacity fields as null", () => {
    const result = venueSpaceSchema.safeParse({ name: "Hall A", capacityMin: "", capacityMax: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.capacityMin).toBeNull();
      expect(result.data.capacityMax).toBeNull();
    }
  });

  it("rejects a negative capacityMin", () => {
    const result = venueSpaceSchema.safeParse({ name: "Hall A", capacityMin: "-5" });
    expect(result.success).toBe(false);
  });

  it("rejects a negative capacityMax", () => {
    const result = venueSpaceSchema.safeParse({ name: "Hall A", capacityMax: "-1" });
    expect(result.success).toBe(false);
  });

  it("rejects capacityMin greater than capacityMax", () => {
    const result = venueSpaceSchema.safeParse({ name: "Hall A", capacityMin: "500", capacityMax: "100" });
    expect(result.success).toBe(false);
  });

  it("accepts capacityMin equal to capacityMax", () => {
    const result = venueSpaceSchema.safeParse({ name: "Hall A", capacityMin: "300", capacityMax: "300" });
    expect(result.success).toBe(true);
  });

  it("accepts capacityMax alone, with no capacityMin", () => {
    const result = venueSpaceSchema.safeParse({ name: "Hall A", capacityMax: "20000" });
    expect(result.success).toBe(true);
  });

  it("rejects a non-numeric capacity value", () => {
    const result = venueSpaceSchema.safeParse({ name: "Hall A", capacityMin: "many" });
    expect(result.success).toBe(false);
  });

  it("treats a blank description as null, with no length cap", () => {
    const blank = venueSpaceSchema.safeParse({ name: "Hall A", description: "" });
    expect(blank.success).toBe(true);
    if (blank.success) expect(blank.data.description).toBeNull();

    const long = venueSpaceSchema.safeParse({ name: "Hall A", description: "x".repeat(2000) });
    expect(long.success).toBe(true);
  });

  it("trims the name", () => {
    const result = venueSpaceSchema.safeParse({ name: "  Raj Darbar Lawn  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("Raj Darbar Lawn");
  });
});
