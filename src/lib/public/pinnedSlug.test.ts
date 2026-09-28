import { describe, expect, it } from "vitest";
import { PINNED_LISTING_SLUG } from "./pinnedListing";
import { PHOTO_IMPORT_PROTECTED_SLUGS } from "@/lib/import/photoImport";

describe("Aangan Resort slug", () => {
  it("pins the real production slug — a wrong slug silently pins nothing", () => {
    expect(PINNED_LISTING_SLUG).toBe("aangan-resort-ranchi");
  });

  it("is protected from bulk photo imports, along with Aangan Palace", () => {
    expect(PHOTO_IMPORT_PROTECTED_SLUGS).toContain(PINNED_LISTING_SLUG);
    expect(PHOTO_IMPORT_PROTECTED_SLUGS).toContain("aangan-palace");
  });
});
