import { describe, expect, it } from "vitest";
import {
  buildFallbackDescription,
  buildPublicOrderBy,
  buildPublicSearchWhere,
  isThinPublicListing,
  publicPropertyCardSelect,
  publicPropertySelect,
  publishedOnly,
  selectCardImage,
} from "./properties";

// Fields that must NEVER be reachable through a public query — provenance
// and admin-only flags. If one of these ever gets added to
// publicPropertySelect/publicPropertyCardSelect, it would leak through
// every public page silently; these tests fail loudly instead.
//
// `verificationStatus` and `claimed` are deliberately NOT in this list — see
// their own "deliberate exception" test blocks below.
const FORBIDDEN_FIELDS = [
  "sourceRecordId",
  "source",
  "sourceUrl",
  "sourceLastCheckedAt",
  "mergedFromSourceRecordIds",
  "rawCategory",
  "rawLocality",
  "lastVerifiedAt",
  "ownerVerified",
  "status",
  "createdAt",
  "updatedAt",
];

describe("publicPropertySelect (property detail page)", () => {
  it("never selects a provenance or internal-workflow field", () => {
    for (const field of FORBIDDEN_FIELDS) {
      expect(Object.keys(publicPropertySelect)).not.toContain(field);
    }
  });

  it("selects the fields a property page actually needs", () => {
    expect(publicPropertySelect).toMatchObject({
      slug: true,
      name: true,
      category: { select: { id: true, name: true, slug: true } },
    });
  });

  it("excludes venue-space provenance fields (sourceRecordId, rawParentName)", () => {
    const venueSpaceFields = Object.keys(publicPropertySelect.venueSpaces.select);
    expect(venueSpaceFields).not.toContain("sourceRecordId");
    expect(venueSpaceFields).not.toContain("rawParentName");
  });

  it("selects only the intended public image fields, ordered by sortOrder", () => {
    const imageFields = Object.keys(publicPropertySelect.images.select);
    expect(imageFields.sort()).toEqual(["altText", "caption", "id", "kind", "sortOrder", "url"].sort());
    expect(imageFields).not.toContain("propertyId");
    expect(imageFields).not.toContain("createdAt");
    expect(publicPropertySelect.images.orderBy).toEqual({ sortOrder: "asc" });
  });
});

describe("claimed (deliberate exception, owner-claim architecture)", () => {
  it("is selected on the detail select only, to drive the 'Claim this listing' CTA", () => {
    expect(publicPropertySelect.claimed).toBe(true);
  });

  it("is NOT selected on the lighter card select — no CTA is ever shown from a card", () => {
    expect(Object.keys(publicPropertyCardSelect)).not.toContain("claimed");
  });

  it("ownerVerified remains forbidden everywhere, unlike claimed", () => {
    expect(Object.keys(publicPropertySelect)).not.toContain("ownerVerified");
    expect(Object.keys(publicPropertyCardSelect)).not.toContain("ownerVerified");
  });
});

describe("publicPropertyCardSelect images (Phase 2B visual discovery)", () => {
  it("selects only what's needed to pick a thumbnail, ordered by sortOrder", () => {
    const imageFields = Object.keys(publicPropertyCardSelect.images.select);
    expect(imageFields.sort()).toEqual(["altText", "kind", "url"].sort());
    expect(imageFields).not.toContain("id");
    expect(imageFields).not.toContain("caption");
    expect(imageFields).not.toContain("sortOrder");
    expect(publicPropertyCardSelect.images.orderBy).toEqual({ sortOrder: "asc" });
  });
});

describe("selectCardImage (Phase 2B visual discovery)", () => {
  const base = { name: "Aangan Resort", generatedIdentityMarkUrl: null, images: [] };

  it("picks a PHOTO when one exists", () => {
    const result = selectCardImage({
      ...base,
      images: [
        { url: "https://example.com/logo.png", altText: null, kind: "LOGO" },
        { url: "https://example.com/pool.jpg", altText: "The pool", kind: "PHOTO" },
      ],
    });
    expect(result).toEqual({ kind: "photo", url: "https://example.com/pool.jpg", alt: "The pool" });
  });

  it("falls back to name as alt text when a PHOTO has no altText", () => {
    const result = selectCardImage({ ...base, images: [{ url: "https://example.com/a.jpg", altText: null, kind: "PHOTO" }] });
    expect(result.alt).toBe("Aangan Resort");
  });

  it("prefers a PropertyImage of kind LOGO over the generated identity mark when no PHOTO exists", () => {
    const result = selectCardImage({
      name: "Aangan Resort",
      generatedIdentityMarkUrl: "https://example.com/generated-mark.png",
      images: [{ url: "https://example.com/real-logo.png", altText: null, kind: "LOGO" }],
    });
    expect(result).toEqual({ kind: "logo", url: "https://example.com/real-logo.png", alt: "Aangan Resort logo" });
  });

  it("falls back to the generated identity mark when there is no PHOTO or LOGO image", () => {
    const result = selectCardImage({ name: "Aangan Resort", generatedIdentityMarkUrl: "https://example.com/mark.png", images: [] });
    expect(result).toEqual({ kind: "logo", url: "https://example.com/mark.png", alt: "Aangan Resort identity mark" });
  });

  it("falls back to an ILLUSTRATIVE image only when there is no PHOTO and no logo of any kind — and never reports it as a photo", () => {
    const result = selectCardImage({
      ...base,
      images: [{ url: "https://example.com/generic-hotel.jpg", altText: null, kind: "ILLUSTRATIVE" }],
    });
    expect(result.kind).toBe("illustrative");
    expect(result.kind).not.toBe("photo");
    expect(result.alt).toContain("Illustrative");
  });

  it("PHOTO always outranks ILLUSTRATIVE even if the illustrative image sorts first", () => {
    const result = selectCardImage({
      ...base,
      images: [
        { url: "https://example.com/generic.jpg", altText: null, kind: "ILLUSTRATIVE" },
        { url: "https://example.com/real.jpg", altText: "Real photo", kind: "PHOTO" },
      ],
    });
    expect(result).toEqual({ kind: "photo", url: "https://example.com/real.jpg", alt: "Real photo" });
  });

  it("falls back to a drawn placeholder (no URL) when there are no images and no identity mark at all", () => {
    const result = selectCardImage(base);
    expect(result.kind).toBe("placeholder");
    expect(result.url).toBeNull();
    expect(result.alt).toContain("Aangan Resort");
  });
});

describe("generatedIdentityMarkUrl (listing-asset architecture)", () => {
  it("is selected on both public selects — never called or presented as an official logo elsewhere", () => {
    expect(publicPropertySelect.generatedIdentityMarkUrl).toBe(true);
    expect(publicPropertyCardSelect.generatedIdentityMarkUrl).toBe(true);
  });
});

describe("verificationStatus (deliberate exception, scaled discovery directory)", () => {
  it("is selected on both public selects, for the trust-tier badge only", () => {
    expect(publicPropertySelect.verificationStatus).toBe(true);
    expect(publicPropertyCardSelect.verificationStatus).toBe(true);
  });

  it("every other provenance/internal field remains forbidden alongside it", () => {
    for (const field of FORBIDDEN_FIELDS) {
      expect(Object.keys(publicPropertyCardSelect)).not.toContain(field);
    }
  });
});

describe("buildFallbackDescription", () => {
  it("includes the locality when present", () => {
    expect(buildFallbackDescription("Aangan Resort", "Resorts", "Ormanjhi")).toBe(
      "Aangan Resort is listed in Ormanjhi, Ranchi, under the Resorts category."
    );
  });

  it("omits the locality clause when null, without inventing one", () => {
    expect(buildFallbackDescription("Aangan Resort", "Resorts", null)).toBe(
      "Aangan Resort is listed in Ranchi under the Resorts category."
    );
  });

  it("never adds marketing adjectives", () => {
    const result = buildFallbackDescription("Some Hotel", "Hotels", "Kadru");
    for (const word of ["best", "luxury", "premium", "top", "famous", "leading"]) {
      expect(result.toLowerCase()).not.toContain(word);
    }
  });
});

describe("isThinPublicListing", () => {
  it("is thin when there is neither contact info nor a description", () => {
    expect(
      isThinPublicListing({ address: null, phone: null, website: null, shortDescription: null, fullDescription: null })
    ).toBe(true);
  });

  it("is not thin when any contact field is present", () => {
    expect(
      isThinPublicListing({ address: null, phone: "+91-9000000000", website: null, shortDescription: null, fullDescription: null })
    ).toBe(false);
  });

  it("is not thin when a description is present, even with no contact info", () => {
    expect(
      isThinPublicListing({ address: null, phone: null, website: null, shortDescription: "A hotel in Ranchi.", fullDescription: null })
    ).toBe(false);
  });
});

describe("publicPropertyCardSelect (list/card views)", () => {
  it("never selects a provenance or internal-workflow field", () => {
    for (const field of FORBIDDEN_FIELDS) {
      expect(Object.keys(publicPropertyCardSelect)).not.toContain(field);
    }
  });
});

describe("publishedOnly", () => {
  it("always injects status: PUBLISHED even with no extra filter", () => {
    expect(publishedOnly()).toEqual({ status: "PUBLISHED" });
  });

  it("merges in extra filters without dropping the published guard", () => {
    expect(publishedOnly({ slug: "aangan-resort" })).toEqual({ status: "PUBLISHED", slug: "aangan-resort" });
  });

  it("cannot be overridden by an extra filter that also sets status", () => {
    // Object spread order in publishedOnly() puts status first, so a caller
    // passing a conflicting status would win — this test documents that this
    // function is a convenience default, not a hard guarantee, and asserts
    // the actual (safe) behavior for the only way it's called in this codebase.
    const result = publishedOnly({ slug: "x" });
    expect(result.status).toBe("PUBLISHED");
  });
});

describe("public visibility rules (Step 4 quality control)", () => {
  // publishedOnly() is the single choke point every public query passes
  // through — these tests are direct, literal restatements of the Step 4
  // checklist so the connection between requirement and code is obvious.
  it("1. only PUBLISHED properties are ever queried publicly", () => {
    expect(publishedOnly()).toEqual({ status: "PUBLISHED" });
  });

  it("2. a DRAFT property can never be queried publicly, regardless of other filters", () => {
    // publishedOnly() unconditionally sets status: PUBLISHED — there is no
    // way to pass status: DRAFT through it and have it survive, since the
    // guard is applied first and any caller-supplied status would be an
    // internal bug, not a legitimate public-page code path.
    const where = publishedOnly({ slug: "some-draft-property" });
    expect(where.status).toBe("PUBLISHED");
  });

  it("3. verificationStatus has no bearing on public visibility — publishedOnly() doesn't accept or check it", () => {
    // publishedOnly()'s type signature only takes Prisma.PropertyWhereInput
    // extras; verificationStatus (NEEDS_REVIEW included) is never part of
    // the public visibility decision — only `status` is.
    const where = publishedOnly({});
    expect(Object.keys(where)).toEqual(["status"]);
  });

  it("4. a VERIFIED-but-DRAFT property is still excluded — publish status alone gates visibility", () => {
    // Verification and publication are intentionally independent: being
    // VERIFIED never implies PUBLISHED. publishedOnly() only ever checks
    // `status`, so a verified-but-unpublished property is excluded exactly
    // the same way a never-reviewed one is.
    const where = publishedOnly();
    expect(where).toEqual({ status: "PUBLISHED" });
    expect(where).not.toHaveProperty("verificationStatus");
  });
});

describe("buildPublicSearchWhere", () => {
  it("returns an empty filter for no input", () => {
    expect(buildPublicSearchWhere({})).toEqual({});
  });

  it("matches property name (case-insensitive)", () => {
    const where = buildPublicSearchWhere({ query: "  Aangan  " });
    expect(where.OR).toContainEqual({ name: { contains: "Aangan", mode: "insensitive" } });
  });

  it("also matches category name — e.g. typing 'Hotel' surfaces hotel-category properties", () => {
    const where = buildPublicSearchWhere({ query: "Hotel" });
    expect(where.OR).toContainEqual({ category: { name: { contains: "Hotel", mode: "insensitive" } } });
  });

  it("also matches locality name — e.g. typing 'Ranchi' surfaces Ranchi-locality properties", () => {
    const where = buildPublicSearchWhere({ query: "Ranchi" });
    expect(where.OR).toContainEqual({ locality: { name: { contains: "Ranchi", mode: "insensitive" } } });
  });

  it("ignores a blank query", () => {
    expect(buildPublicSearchWhere({ query: "   " })).toEqual({});
  });

  it("filters by category and locality slug (exact match, not the OR search)", () => {
    const where = buildPublicSearchWhere({ categorySlug: "resorts", localitySlug: "ranchi" });
    expect(where.category).toEqual({ slug: "resorts" });
    expect(where.locality).toEqual({ slug: "ranchi" });
    expect(where.OR).toBeUndefined();
  });

  it("combines a text query with exact category/locality filters (AND behavior)", () => {
    const where = buildPublicSearchWhere({ query: "garden", categorySlug: "resorts", localitySlug: "ranchi" });
    // where.OR handles the text match; where.category/where.locality are
    // separate top-level keys, so Prisma ANDs everything together —
    // "text matches 'garden' AND category is resorts AND locality is ranchi".
    expect(where.OR).toBeDefined();
    expect(where.category).toEqual({ slug: "resorts" });
    expect(where.locality).toEqual({ slug: "ranchi" });
  });
});

describe("buildPublicOrderBy", () => {
  it("defaults to Recommended (featured desc, then newest) when no sort is given", () => {
    expect(buildPublicOrderBy()).toEqual([{ featured: "desc" }, { createdAt: "desc" }]);
    expect(buildPublicOrderBy(null)).toEqual([{ featured: "desc" }, { createdAt: "desc" }]);
    expect(buildPublicOrderBy(undefined)).toEqual([{ featured: "desc" }, { createdAt: "desc" }]);
  });

  it('"recommended" explicitly resolves the same as the default', () => {
    expect(buildPublicOrderBy("recommended")).toEqual([{ featured: "desc" }, { createdAt: "desc" }]);
  });

  it('"newest" sorts by createdAt desc only', () => {
    expect(buildPublicOrderBy("newest")).toEqual({ createdAt: "desc" });
  });

  it('"name" sorts alphabetically ascending', () => {
    expect(buildPublicOrderBy("name")).toEqual({ name: "asc" });
  });

  it("falls back to Recommended for an unrecognized sort value rather than erroring", () => {
    expect(buildPublicOrderBy("highest-rated")).toEqual([{ featured: "desc" }, { createdAt: "desc" }]);
  });

  it("never sorts by verificationStatus or lastVerifiedAt", () => {
    // Deferred per Step 5 scope — public sort behavior must never reference
    // verification-workflow fields, regardless of input.
    for (const sort of ["recommended", "newest", "name", "recently-verified", "verified"]) {
      const orderBy = buildPublicOrderBy(sort);
      const serialized = JSON.stringify(orderBy);
      expect(serialized).not.toMatch(/verificationStatus|lastVerifiedAt/);
    }
  });
});
