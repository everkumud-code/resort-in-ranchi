import { describe, expect, it } from "vitest";
import {
  canBeHero,
  getImageTagLabel,
  PROPERTY_IMAGE_TAG_LABELS,
  PROPERTY_IMAGE_TAG_VALUES,
  propertyImageSchema,
} from "./propertyImage";
import { selectCardImage } from "@/lib/public/properties";

const base = { url: "https://x.test/a.jpg" };

describe("image tags", () => {
  it("offers the hospitality tags owners asked for", () => {
    for (const tag of ["lawn", "rooms", "hall", "parking", "bathroom"]) {
      expect(PROPERTY_IMAGE_TAG_VALUES).toContain(tag);
    }
    expect(PROPERTY_IMAGE_TAG_VALUES.length).toBe(Object.keys(PROPERTY_IMAGE_TAG_LABELS).length);
  });

  it("accepts a known tag, treats blank as untagged, rejects an unknown tag", () => {
    expect(propertyImageSchema.parse({ ...base, tag: "lawn" }).tag).toBe("lawn");
    expect(propertyImageSchema.parse({ ...base, tag: "" }).tag).toBeNull();
    expect(propertyImageSchema.parse({ ...base }).tag).toBeNull();
    expect(propertyImageSchema.safeParse({ ...base, tag: "not-a-tag" }).success).toBe(false);
  });

  it("looks up a label only for a known tag", () => {
    expect(getImageTagLabel("parking")).toBe("Parking");
    expect(getImageTagLabel(null)).toBeNull();
    expect(getImageTagLabel("constructor")).toBeNull();
  });
});

describe("hero image", () => {
  it("reads the isHero checkbox, defaulting to false", () => {
    expect(propertyImageSchema.parse({ ...base, isHero: "on" }).isHero).toBe(true);
    expect(propertyImageSchema.parse({ ...base }).isHero).toBe(false);
  });

  it("only a real photo can be the hero", () => {
    expect(canBeHero("PHOTO")).toBe(true);
    expect(canBeHero("LOGO")).toBe(false);
    expect(canBeHero("ILLUSTRATIVE")).toBe(false);
  });

  it("the card thumbnail is the first PHOTO — and the queries order the hero first", () => {
    const images = [
      { url: "https://x.test/hero.jpg", altText: null, kind: "PHOTO" },
      { url: "https://x.test/lawn.jpg", altText: null, kind: "PHOTO" },
    ];
    expect(selectCardImage({ name: "X", generatedIdentityMarkUrl: null, images }).url).toBe("https://x.test/hero.jpg");
  });
});
