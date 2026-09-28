import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  sanitizeCompareSlugs,
  mapSlugsToProperties,
  formatCompareValue,
  compareSuggestionEligible,
  buildAddToCompareHref,
  MAX_COMPARE_PROPERTIES,
  MIN_COMPARE_PROPERTIES,
} from "./compare";

describe("1. empty selection", () => {
  it("sanitizeCompareSlugs(undefined) returns an empty array", () => {
    expect(sanitizeCompareSlugs(undefined)).toEqual([]);
  });

  it("mapSlugsToProperties returns nothing for an empty slug list", () => {
    expect(mapSlugsToProperties([], [{ slug: "a" }])).toEqual([]);
  });
});

describe("2/3/4. one, two, and four properties", () => {
  it("resolves a single slug", () => {
    expect(sanitizeCompareSlugs("aangan-resort")).toEqual(["aangan-resort"]);
  });

  it("resolves two slugs in the order given", () => {
    expect(sanitizeCompareSlugs(["a-resort", "b-hotel"])).toEqual(["a-resort", "b-hotel"]);
  });

  it("resolves exactly four slugs without truncating a valid full set", () => {
    expect(sanitizeCompareSlugs(["a", "b", "c", "d"])).toEqual(["a", "b", "c", "d"]);
  });
});

describe("5. more than four capped", () => {
  it("stops accepting slugs once MAX_COMPARE_PROPERTIES is reached, regardless of how many were requested", () => {
    const requested = ["a", "b", "c", "d", "e", "f", "g"];
    const result = sanitizeCompareSlugs(requested);
    expect(result).toHaveLength(MAX_COMPARE_PROPERTIES);
    expect(result).toEqual(["a", "b", "c", "d"]);
  });

  it("never trusts a client-claimed count — 20 slugs still caps at 4", () => {
    const requested = Array.from({ length: 20 }, (_, i) => `slug-${i}`);
    expect(sanitizeCompareSlugs(requested)).toHaveLength(4);
  });
});

describe("6. duplicate slugs removed", () => {
  it("de-dupes while preserving first-seen order", () => {
    expect(sanitizeCompareSlugs(["a", "b", "a", "c", "b"])).toEqual(["a", "b", "c"]);
  });
});

describe("7. invalid slugs rejected", () => {
  it("drops values that don't match the real slug format", () => {
    expect(sanitizeCompareSlugs(["Not A Slug!", "UPPERCASE", "trailing-", "has_underscore"])).toEqual([]);
  });

  it("drops blank/whitespace-only values", () => {
    expect(sanitizeCompareSlugs(["", "   ", "valid-slug"])).toEqual(["valid-slug"]);
  });

  it("keeps valid slugs while dropping invalid ones mixed in the same request", () => {
    expect(sanitizeCompareSlugs(["valid-one", "Invalid One!", "valid-two"])).toEqual(["valid-one", "valid-two"]);
  });
});

describe("8. unpublished property excluded / 9. protected property excluded", () => {
  // mapSlugsToProperties only ever sees rows the DB already filtered to
  // status=PUBLISHED (see getComparableProperties) — an unpublished OR
  // protected/identity-conflict/NEEDS_REVIEW property (all structurally
  // never PUBLISHED, per bulkPublish.ts) simply never appears in `rows`.
  // Both cases are exercised identically here: a requested slug with no
  // matching row is silently omitted, never substituted or guessed at.
  it("omits a requested slug that has no matching published row (simulating an unpublished property)", () => {
    const result = mapSlugsToProperties(["published-a", "unpublished-b"], [{ slug: "published-a", name: "A" }]);
    expect(result).toEqual([{ slug: "published-a", name: "A" }]);
  });

  it("omits a requested slug for a protected/identity-conflict property the same way — no special-case ID list exists or is needed", () => {
    const result = mapSlugsToProperties(["aangan-palace", "some-hotel"], [{ slug: "some-hotel", name: "Some Hotel" }]);
    expect(result).toEqual([{ slug: "some-hotel", name: "Some Hotel" }]);
  });

  it("returns nothing at all if every requested slug fails to resolve", () => {
    expect(mapSlugsToProperties(["a", "b"], [])).toEqual([]);
  });
});

describe("10. missing values → 'Not provided' / 11. existing values preserved", () => {
  it("formats null as 'Not provided'", () => {
    expect(formatCompareValue(null)).toBe("Not provided");
  });

  it("formats undefined as 'Not provided'", () => {
    expect(formatCompareValue(undefined)).toBe("Not provided");
  });

  it("formats a blank/whitespace-only string as 'Not provided'", () => {
    expect(formatCompareValue("   ")).toBe("Not provided");
    expect(formatCompareValue("")).toBe("Not provided");
  });

  it("never fabricates a value — there is no code path that returns anything invented", () => {
    // formatCompareValue only ever returns "Not provided" or String(value) —
    // no default/fallback string, no inferred text.
    expect(formatCompareValue("A real description.")).toBe("A real description.");
  });

  it("preserves a real string value exactly", () => {
    expect(formatCompareValue("Parking, Wi-Fi")).toBe("Parking, Wi-Fi");
  });

  it("preserves a real numeric value, including a real 0, rather than treating it as missing", () => {
    expect(formatCompareValue(0)).toBe("0");
    expect(formatCompareValue(42)).toBe("42");
  });
});

describe("12. repeated URL parameters", () => {
  it("Next.js parses repeated ?property= params into an array — sanitizeCompareSlugs handles that array form directly", () => {
    const result = sanitizeCompareSlugs(["aangan-resort", "hotel-the-raso", "shri-gobindam-banquet"]);
    expect(result).toEqual(["aangan-resort", "hotel-the-raso", "shri-gobindam-banquet"]);
  });

  it("still handles the single-value (non-array) form Next.js gives for exactly one occurrence", () => {
    expect(sanitizeCompareSlugs("aangan-resort")).toEqual(["aangan-resort"]);
  });
});

describe("MIN/MAX constants", () => {
  it("requires at least 2 and allows at most 4, matching the product requirement", () => {
    expect(MIN_COMPARE_PROPERTIES).toBe(2);
    expect(MAX_COMPARE_PROPERTIES).toBe(4);
  });
});

describe("13. comparison is read-only", () => {
  it("the compare page's source contains no database write call", () => {
    const src = readFileSync(resolve(process.cwd(), "src/app/(site)/compare/page.tsx"), "utf8");
    expect(src).not.toMatch(/\.(create|update|updateMany|upsert|delete|deleteMany)\s*\(/);
  });

  it("compare.ts (the data layer) contains no database write call either", () => {
    const src = readFileSync(resolve(process.cwd(), "src/lib/public/compare.ts"), "utf8");
    expect(src).not.toMatch(/\.(create|update|updateMany|upsert|delete|deleteMany)\s*\(/);
  });
});

describe("14. noindex behavior", () => {
  it("the compare page's metadata is built with noindex: true, the same helper every other filter/utility page uses", () => {
    const src = readFileSync(resolve(process.cwd(), "src/app/(site)/compare/page.tsx"), "utf8");
    // Matches buildPageMetadata({ ..., noindex: true, ... }) regardless of key order/whitespace.
    const buildCallMatch = src.match(/buildPageMetadata\(\{[\s\S]*?\}\)/);
    expect(buildCallMatch).not.toBeNull();
    expect(buildCallMatch![0]).toMatch(/noindex:\s*true/);
  });
});

describe("15. enquiry links use the existing enquiry route", () => {
  it("the compare page links to /property/[slug]/enquire — the same route the property page uses, not a new mechanism", () => {
    const src = readFileSync(resolve(process.cwd(), "src/app/(site)/compare/page.tsx"), "utf8");
    expect(src).toMatch(/\/property\/\$\{p\.slug\}\/enquire/);
  });
});

describe("PHASE 3D — compareSuggestionEligible (prominent-but-additive suggestion)", () => {
  it("is not eligible when there is no suggestion at all", () => {
    expect(compareSuggestionEligible({ suggestionSlug: null, selectedSlugs: [] })).toBe(false);
  });

  it("is eligible for a fresh, empty selection", () => {
    expect(compareSuggestionEligible({ suggestionSlug: "aangan-resort", selectedSlugs: [] })).toBe(true);
  });

  it("is eligible when only one property is already selected (still below MIN)", () => {
    expect(compareSuggestionEligible({ suggestionSlug: "aangan-resort", selectedSlugs: ["hotel-the-raso"] })).toBe(true);
  });

  it("is never eligible once the suggestion is already part of the visitor's own selection — never suggests what's already chosen", () => {
    expect(compareSuggestionEligible({ suggestionSlug: "aangan-resort", selectedSlugs: ["aangan-resort", "hotel-the-raso"] })).toBe(
      false
    );
  });

  it("is not eligible once the visitor's selection is already at MAX_COMPARE_PROPERTIES — never silently exceeds the cap", () => {
    const selectedSlugs = Array.from({ length: MAX_COMPARE_PROPERTIES }, (_, i) => `slug-${i}`);
    expect(compareSuggestionEligible({ suggestionSlug: "aangan-resort", selectedSlugs })).toBe(false);
  });

  it("is eligible with room for exactly one more (MAX - 1 already selected)", () => {
    const selectedSlugs = Array.from({ length: MAX_COMPARE_PROPERTIES - 1 }, (_, i) => `slug-${i}`);
    expect(compareSuggestionEligible({ suggestionSlug: "aangan-resort", selectedSlugs })).toBe(true);
  });
});

describe("PHASE 3D — buildAddToCompareHref (strictly additive)", () => {
  it("builds a compare URL with only the suggestion when nothing was previously selected", () => {
    expect(buildAddToCompareHref([], "aangan-resort")).toBe("/compare?property=aangan-resort");
  });

  it("carries forward every already-selected slug before appending the suggestion — never drops or reorders the visitor's own picks", () => {
    const href = buildAddToCompareHref(["hotel-the-raso", "shri-gobindam-banquet"], "aangan-resort");
    expect(href).toBe("/compare?property=hotel-the-raso&property=shri-gobindam-banquet&property=aangan-resort");
  });

  it("never replaces the existing selection — the suggestion is always the last param, appended not substituted", () => {
    const href = buildAddToCompareHref(["hotel-the-raso"], "aangan-resort");
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.getAll("property")).toEqual(["hotel-the-raso", "aangan-resort"]);
  });
});

describe("PHASE 3D — getCompareSuggestion reuses existing public-property architecture", () => {
  it("is built from publishedOnly()/featured — the same merchandising flag that drives the homepage's Featured section, not a new mechanism or a hardcoded property id/name", () => {
    const src = readFileSync(resolve(process.cwd(), "src/lib/public/compare.ts"), "utf8");
    const fn = src.slice(
      src.indexOf("export async function getCompareSuggestion"),
      src.indexOf("export function compareSuggestionEligible")
    );
    expect(fn).toMatch(/publishedOnly\(\{ featured: true, slug: \{ notIn: excludeSlugs \} \}\)/);
    expect(fn).not.toMatch(/cmts[a-z0-9]+/i); // no hardcoded property id
    expect(fn).not.toMatch(/Aangan/i); // no hardcoded property name
  });

  it("getCompareSuggestion is read-only (findFirst, not a write)", () => {
    const src = readFileSync(resolve(process.cwd(), "src/lib/public/compare.ts"), "utf8");
    const fn = src.slice(
      src.indexOf("export async function getCompareSuggestion"),
      src.indexOf("export function compareSuggestionEligible")
    );
    expect(fn).toMatch(/prisma\.property\.findFirst/);
    expect(fn).not.toMatch(/\.(create|update|updateMany|upsert|delete|deleteMany)\s*\(/);
  });
});

describe("PHASE 3D — compare page suggestion banner is honest and never fabricates ranking", () => {
  it("shows the real TrustBadge for the suggestion, never a raw/fabricated trust claim", () => {
    const src = readFileSync(resolve(process.cwd(), "src/app/(site)/compare/page.tsx"), "utf8");
    expect(src).toMatch(/<TrustBadge verificationStatus=\{suggestion\.verificationStatus\}/);
  });

  it("never uses a fabricated ranking claim like #1 or Best anywhere on the page", () => {
    const src = readFileSync(resolve(process.cwd(), "src/app/(site)/compare/page.tsx"), "utf8");
    expect(src).not.toMatch(/#1/);
    expect(src).not.toMatch(/\bBest\b/);
  });

  it("the suggestion link is built via buildAddToCompareHref (additive), never a hardcoded href that could drop the visitor's selection", () => {
    const src = readFileSync(resolve(process.cwd(), "src/app/(site)/compare/page.tsx"), "utf8");
    expect(src).toMatch(/href=\{buildAddToCompareHref\(selectedSlugs, suggestion\.slug\)\}/);
  });

  it("the suggestion banner is rendered in both the underfull (<MIN) and active-comparison views, not just one", () => {
    const src = readFileSync(resolve(process.cwd(), "src/app/(site)/compare/page.tsx"), "utf8");
    const occurrences = src.match(/\{suggestionEligible && suggestion && <CompareSuggestionBanner/g) ?? [];
    expect(occurrences.length).toBe(2);
  });
});

describe("PropertyCard does not create nested interactive elements", () => {
  it("renders CompareCheckbox as a sibling before <Link>, never inside it", () => {
    const src = readFileSync(resolve(process.cwd(), "src/components/site/PropertyCard.tsx"), "utf8");
    // Search only the actual JSX (from `return (` onward) — the file's own
    // doc comment above the component mentions "<Link>" in prose, which
    // would otherwise be mistaken for the real JSX tag.
    const jsx = src.slice(src.indexOf("return ("));
    const checkboxIndex = jsx.indexOf("<CompareCheckbox");
    const linkOpenIndex = jsx.indexOf("<Link");
    expect(checkboxIndex).toBeGreaterThan(-1);
    expect(linkOpenIndex).toBeGreaterThan(-1);
    expect(checkboxIndex).toBeLessThan(linkOpenIndex);
  });

  it("the outer element is a <div>, not <Link> — CompareCheckbox and <Link> are siblings under it", () => {
    const src = readFileSync(resolve(process.cwd(), "src/components/site/PropertyCard.tsx"), "utf8");
    const returnBlock = src.slice(src.indexOf("return ("));
    expect(returnBlock.trimStart()).toMatch(/^return \(\r?\n\s+<div/);
  });
});
