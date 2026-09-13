import { describe, expect, it } from "vitest";
import { propertyImageSchema, resolveImageSortOrder } from "./propertyImage";

describe("propertyImageSchema", () => {
  it("accepts a minimal valid image (URL only)", () => {
    const result = propertyImageSchema.safeParse({ url: "https://example.com/photo.jpg", altText: "", caption: "", sortOrder: "" });
    expect(result.success).toBe(true);
  });

  it("accepts a valid image with full metadata", () => {
    const result = propertyImageSchema.safeParse({
      url: "https://images.example.com/aangan/pool.jpg",
      altText: "Swimming pool at sunset",
      caption: "The main pool",
      sortOrder: "2",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.sortOrder).toBe(2);
  });

  it("rejects a missing URL", () => {
    const result = propertyImageSchema.safeParse({ url: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-URL string", () => {
    const result = propertyImageSchema.safeParse({ url: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("rejects a URL missing a protocol", () => {
    const result = propertyImageSchema.safeParse({ url: "example.com/photo.jpg" });
    expect(result.success).toBe(false);
  });

  it("trims the URL", () => {
    const result = propertyImageSchema.safeParse({ url: "  https://example.com/photo.jpg  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.url).toBe("https://example.com/photo.jpg");
  });

  it("treats blank altText/caption as null", () => {
    const result = propertyImageSchema.safeParse({ url: "https://example.com/a.jpg", altText: "", caption: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.altText).toBeNull();
      expect(result.data.caption).toBeNull();
    }
  });

  it("treats a blank sortOrder as null", () => {
    const result = propertyImageSchema.safeParse({ url: "https://example.com/a.jpg", sortOrder: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.sortOrder).toBeNull();
  });

  it("rejects a non-numeric sortOrder", () => {
    const result = propertyImageSchema.safeParse({ url: "https://example.com/a.jpg", sortOrder: "first" });
    expect(result.success).toBe(false);
  });

  it("defaults kind to PHOTO when blank/missing", () => {
    const blank = propertyImageSchema.safeParse({ url: "https://example.com/a.jpg", kind: "" });
    const missing = propertyImageSchema.safeParse({ url: "https://example.com/a.jpg" });
    expect(blank.success).toBe(true);
    expect(missing.success).toBe(true);
    if (blank.success) expect(blank.data.kind).toBe("PHOTO");
    if (missing.success) expect(missing.data.kind).toBe("PHOTO");
  });

  it("accepts an explicit ILLUSTRATIVE or LOGO kind", () => {
    const illustrative = propertyImageSchema.safeParse({ url: "https://example.com/a.jpg", kind: "ILLUSTRATIVE" });
    const logo = propertyImageSchema.safeParse({ url: "https://example.com/a.jpg", kind: "LOGO" });
    expect(illustrative.success).toBe(true);
    expect(logo.success).toBe(true);
    if (illustrative.success) expect(illustrative.data.kind).toBe("ILLUSTRATIVE");
    if (logo.success) expect(logo.data.kind).toBe("LOGO");
  });

  it("rejects an invalid kind value", () => {
    const result = propertyImageSchema.safeParse({ url: "https://example.com/a.jpg", kind: "SCREENSHOT" });
    expect(result.success).toBe(false);
  });
});

describe("resolveImageSortOrder", () => {
  it("uses the submitted value when provided, even 0", () => {
    expect(resolveImageSortOrder(0, 5)).toBe(0);
    expect(resolveImageSortOrder(3, 5)).toBe(3);
  });

  it("appends to the end (existing count) when nothing was submitted", () => {
    expect(resolveImageSortOrder(null, 0)).toBe(0);
    expect(resolveImageSortOrder(null, 4)).toBe(4);
  });
});
