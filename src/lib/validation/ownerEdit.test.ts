import { describe, expect, it } from "vitest";
import {
  buildOwnerPropertyUpdateData,
  ownerPropertyUpdateSchema,
  ownerPropertyUpdateShape,
  OWNER_FORBIDDEN_FIELDS,
} from "./ownerEdit";

describe("ownerPropertyUpdateSchema", () => {
  it("has no key for any forbidden field, so one can never be smuggled through validation", () => {
    const schemaKeys = Object.keys(ownerPropertyUpdateShape.shape);
    for (const forbidden of OWNER_FORBIDDEN_FIELDS) {
      expect(schemaKeys).not.toContain(forbidden);
    }
  });

  it("accepts a minimal valid submission of blank fields", () => {
    const result = ownerPropertyUpdateSchema.safeParse({
      shortDescription: "",
      fullDescription: "",
      address: "",
      pincode: "",
      phone: "",
      whatsapp: "",
      email: "",
      website: "",
      googleMapsUrl: "",
      priceMin: "",
      priceMax: "",
      priceLabel: "",
      rooms: "",
      eventCapacityMin: "",
      eventCapacityMax: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a fully populated submission", () => {
    const result = ownerPropertyUpdateSchema.safeParse({
      shortDescription: "A lovely venue.",
      fullDescription: "A longer description.",
      address: "123 Main Road",
      pincode: "834001",
      phone: "+91 9876543210",
      whatsapp: "+91 9876543210",
      email: "owner@example.com",
      website: "https://example.com",
      googleMapsUrl: "https://maps.google.com/?q=x",
      priceMin: "1000",
      priceMax: "5000",
      priceLabel: "Starting at ₹1000/plate",
      rooms: "10",
      eventCapacityMin: "50",
      eventCapacityMax: "500",
    });
    expect(result.success).toBe(true);
  });
});

function fullyValidSubmission(overrides: Record<string, string> = {}) {
  return {
    shortDescription: "A lovely venue.",
    fullDescription: "A longer description.",
    address: "123 Main Road",
    pincode: "834001",
    phone: "+91 9876543210",
    whatsapp: "+91 9876543210",
    email: "owner@example.com",
    website: "https://example.com",
    googleMapsUrl: "https://maps.google.com/?q=x",
    priceMin: "1000",
    priceMax: "5000",
    priceLabel: "Starting at ₹1000/plate",
    rooms: "10",
    eventCapacityMin: "50",
    eventCapacityMax: "500",
    ...overrides,
  };
}

describe("ownerPropertyUpdateSchema — range validation", () => {
  it("rejects a negative priceMin", () => {
    const result = ownerPropertyUpdateSchema.safeParse(fullyValidSubmission({ priceMin: "-100" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((i) => i.path.join(".") === "priceMin")).toBe(true);
  });

  it("rejects a negative priceMax", () => {
    const result = ownerPropertyUpdateSchema.safeParse(fullyValidSubmission({ priceMax: "-1" }));
    expect(result.success).toBe(false);
  });

  it("rejects priceMax less than priceMin", () => {
    const result = ownerPropertyUpdateSchema.safeParse(fullyValidSubmission({ priceMin: "5000", priceMax: "1000" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((i) => i.path.join(".") === "priceMax")).toBe(true);
  });

  it("accepts priceMax exactly equal to priceMin", () => {
    const result = ownerPropertyUpdateSchema.safeParse(fullyValidSubmission({ priceMin: "1000", priceMax: "1000" }));
    expect(result.success).toBe(true);
  });

  it("accepts a price of exactly 0", () => {
    const result = ownerPropertyUpdateSchema.safeParse(fullyValidSubmission({ priceMin: "0", priceMax: "0" }));
    expect(result.success).toBe(true);
  });

  it("does not require both price bounds — one alone with the other blank is valid", () => {
    const result = ownerPropertyUpdateSchema.safeParse(fullyValidSubmission({ priceMin: "1000", priceMax: "" }));
    expect(result.success).toBe(true);
  });

  it("rejects a negative rooms count", () => {
    const result = ownerPropertyUpdateSchema.safeParse(fullyValidSubmission({ rooms: "-1" }));
    expect(result.success).toBe(false);
  });

  it("accepts rooms of exactly 0", () => {
    const result = ownerPropertyUpdateSchema.safeParse(fullyValidSubmission({ rooms: "0" }));
    expect(result.success).toBe(true);
  });

  it("rejects negative event capacity bounds", () => {
    expect(ownerPropertyUpdateSchema.safeParse(fullyValidSubmission({ eventCapacityMin: "-5" })).success).toBe(false);
    expect(ownerPropertyUpdateSchema.safeParse(fullyValidSubmission({ eventCapacityMax: "-5" })).success).toBe(false);
  });

  it("rejects eventCapacityMax less than eventCapacityMin", () => {
    const result = ownerPropertyUpdateSchema.safeParse(
      fullyValidSubmission({ eventCapacityMin: "500", eventCapacityMax: "50" })
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((i) => i.path.join(".") === "eventCapacityMax")).toBe(true);
  });

  it("accepts eventCapacityMax exactly equal to eventCapacityMin", () => {
    const result = ownerPropertyUpdateSchema.safeParse(
      fullyValidSubmission({ eventCapacityMin: "50", eventCapacityMax: "50" })
    );
    expect(result.success).toBe(true);
  });

  it("a fully blank submission never triggers a range error (nothing to compare)", () => {
    const result = ownerPropertyUpdateSchema.safeParse({
      shortDescription: "",
      fullDescription: "",
      address: "",
      pincode: "",
      phone: "",
      whatsapp: "",
      email: "",
      website: "",
      googleMapsUrl: "",
      priceMin: "",
      priceMax: "",
      priceLabel: "",
      rooms: "",
      eventCapacityMin: "",
      eventCapacityMax: "",
    });
    expect(result.success).toBe(true);
  });
});

describe("buildOwnerPropertyUpdateData", () => {
  const blankInput = {
    shortDescription: null,
    fullDescription: null,
    address: null,
    pincode: null,
    phone: null,
    whatsapp: null,
    email: null,
    website: null,
    googleMapsUrl: null,
    priceMin: null,
    priceMax: null,
    priceLabel: null,
    rooms: null,
    eventCapacityMin: null,
    eventCapacityMax: null,
  };

  it("never includes any forbidden field in its output", () => {
    const data = buildOwnerPropertyUpdateData(blankInput);
    for (const forbidden of OWNER_FORBIDDEN_FIELDS) {
      expect(Object.keys(data)).not.toContain(forbidden);
    }
  });

  it("carries through every owner-editable field it was given", () => {
    const input = { ...blankInput, shortDescription: "Updated description", phone: "+91 9000000000" };
    const data = buildOwnerPropertyUpdateData(input);
    expect(data.shortDescription).toBe("Updated description");
    expect(data.phone).toBe("+91 9000000000");
  });

  it("even a maliciously-shaped input object can't leak a forbidden key, since the builder only ever reads named fields", () => {
    const maliciousInput = {
      ...blankInput,
      status: "PUBLISHED",
      verificationStatus: "VERIFIED",
    };
    const data = buildOwnerPropertyUpdateData(maliciousInput);
    expect(data).not.toHaveProperty("status");
    expect(data).not.toHaveProperty("verificationStatus");
  });
});
