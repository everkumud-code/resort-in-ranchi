import { describe, expect, it } from "vitest";
import { buildPropertyUpdateData, propertyUpdateSchema } from "./property";

function validForm(overrides: Record<string, string> = {}) {
  return {
    name: "Aangan Resort",
    slug: "aangan-resort",
    categoryId: "cat_123",
    localityId: "loc_123",
    shortDescription: "",
    fullDescription: "",
    address: "",
    city: "Ranchi",
    state: "Jharkhand",
    pincode: "",
    latitude: "",
    longitude: "",
    phone: "",
    whatsapp: "",
    email: "",
    website: "",
    googleMapsUrl: "",
    googleRating: "",
    reviewCount: "",
    priceMin: "",
    priceMax: "",
    priceLabel: "",
    rooms: "",
    eventCapacityMin: "",
    eventCapacityMax: "",
    claimed: "",
    ownerVerified: "",
    featured: "",
    ...overrides,
  };
}

describe("propertyUpdateSchema", () => {
  it("accepts a minimal valid form", () => {
    const result = propertyUpdateSchema.safeParse(validForm());
    expect(result.success).toBe(true);
  });

  it("rejects a missing name", () => {
    const result = propertyUpdateSchema.safeParse(validForm({ name: "" }));
    expect(result.success).toBe(false);
  });

  it("rejects an invalid slug", () => {
    const result = propertyUpdateSchema.safeParse(validForm({ slug: "Not A Slug!" }));
    expect(result.success).toBe(false);
  });

  it("rejects a missing category", () => {
    const result = propertyUpdateSchema.safeParse(validForm({ categoryId: "" }));
    expect(result.success).toBe(false);
  });

  it("treats an empty localityId as null (locality is optional)", () => {
    const result = propertyUpdateSchema.safeParse(validForm({ localityId: "" }));
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.localityId).toBeNull();
  });

  it("rejects an out-of-range Google rating", () => {
    const result = propertyUpdateSchema.safeParse(validForm({ googleRating: "7.5" }));
    expect(result.success).toBe(false);
  });

  it("accepts a Google rating within range", () => {
    const result = propertyUpdateSchema.safeParse(validForm({ googleRating: "4.5" }));
    expect(result.success).toBe(true);
  });

  it("rejects priceMax below priceMin", () => {
    const result = propertyUpdateSchema.safeParse(validForm({ priceMin: "5000", priceMax: "1000" }));
    expect(result.success).toBe(false);
  });

  it("accepts priceMax equal to priceMin", () => {
    const result = propertyUpdateSchema.safeParse(validForm({ priceMin: "5000", priceMax: "5000" }));
    expect(result.success).toBe(true);
  });

  it("rejects a negative rooms count", () => {
    const result = propertyUpdateSchema.safeParse(validForm({ rooms: "-2" }));
    expect(result.success).toBe(false);
  });

  it("rejects eventCapacityMax below eventCapacityMin", () => {
    const result = propertyUpdateSchema.safeParse(validForm({ eventCapacityMin: "200", eventCapacityMax: "50" }));
    expect(result.success).toBe(false);
  });

  it('treats checkbox "on" as true and absence as false', () => {
    const checked = propertyUpdateSchema.safeParse(validForm({ featured: "on" }));
    const unchecked = propertyUpdateSchema.safeParse(validForm({ featured: "" }));
    expect(checked.success && checked.data.featured).toBe(true);
    expect(unchecked.success && unchecked.data.featured).toBe(false);
  });

  it("does not accept status or verificationStatus as fields at all", () => {
    // Lifecycle state is intentionally not part of this schema — even if a
    // caller tries to sneak them in, the parsed output never carries them.
    const result = propertyUpdateSchema.safeParse(
      validForm({ status: "PUBLISHED", verificationStatus: "VERIFIED" } as unknown as Record<string, string>)
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("status");
      expect(result.data).not.toHaveProperty("verificationStatus");
    }
  });
});

describe("buildPropertyUpdateData", () => {
  const base = () => {
    const parsed = propertyUpdateSchema.parse(validForm());
    return parsed;
  };

  it("connects category and locality by id", () => {
    const data = buildPropertyUpdateData(base());
    expect(data.category).toEqual({ connect: { id: "cat_123" } });
    expect(data.locality).toEqual({ connect: { id: "loc_123" } });
  });

  it("disconnects locality when none is set", () => {
    const input = propertyUpdateSchema.parse(validForm({ localityId: "" }));
    const data = buildPropertyUpdateData(input);
    expect(data.locality).toEqual({ disconnect: true });
  });

  it("never includes status, verificationStatus, or lastVerifiedAt in its output", () => {
    // A generic details save must never be able to change lifecycle state —
    // those fields simply don't exist on this function's output.
    const data = buildPropertyUpdateData(base());
    expect(data).not.toHaveProperty("status");
    expect(data).not.toHaveProperty("verificationStatus");
    expect(data).not.toHaveProperty("lastVerifiedAt");
  });

  it("never derives provenance fields from client input", () => {
    const data = buildPropertyUpdateData(base());
    expect(Object.keys(data)).not.toContain("sourceRecordId");
  });

  it("7. never stamps lastVerifiedAt as a side effect of an ordinary edit, no matter which fields change", () => {
    // Regression check for the Step 2 bug this phase fixed: saving a
    // generic edit (e.g. just updating a phone number) must never touch
    // lastVerifiedAt — that field is only ever written by the dedicated
    // "Mark Verified" action in lifecycleActions.ts.
    const input = propertyUpdateSchema.parse(validForm({ phone: "+91-9000000000", featured: "on" }));
    const data = buildPropertyUpdateData(input);
    expect(data).not.toHaveProperty("lastVerifiedAt");
  });
});
