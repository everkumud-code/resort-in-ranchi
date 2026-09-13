import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("SEO boost — custom not-found page", () => {
  const src = read("src/app/(site)/not-found.tsx");

  it("is noindexed — a 404 page must never be offered to search engines", () => {
    expect(src).toMatch(/noindex:\s*true/);
  });

  it("gives a real way back into the site, not a dead end", () => {
    expect(src).toMatch(/href="\/"/);
    expect(src).toMatch(/href="\/search"/);
  });
});

describe("SEO boost — ItemList structured data on every listing page, from exact matches only", () => {
  const categorySrc = read("src/app/(site)/[categorySlug]/page.tsx");
  const locationSrc = read("src/app/(site)/locations/[locationSlug]/page.tsx");
  const umbrellaSrc = read("src/components/site/UmbrellaCategoryView.tsx");

  it("category page builds its ItemList from `items` (exact matches), never `supplemented`", () => {
    const call = categorySrc.slice(categorySrc.indexOf("itemListJsonLd("), categorySrc.indexOf("itemListJsonLd(") + 100);
    expect(call).toMatch(/items\.map/);
    expect(call).not.toMatch(/supplemented/);
  });

  it("location page does the same", () => {
    const call = locationSrc.slice(locationSrc.indexOf("itemListJsonLd("), locationSrc.indexOf("itemListJsonLd(") + 100);
    expect(call).toMatch(/items\.map/);
    expect(call).not.toMatch(/supplemented/);
  });

  it("the umbrella view (Experiences/Picnic Spots) includes it too, reusing the same helper — not a duplicated implementation", () => {
    expect(umbrellaSrc).toMatch(/itemListJsonLd\(/);
  });

  it("is only rendered when there's at least one real item — never an empty/pointless schema block", () => {
    for (const src of [categorySrc, locationSrc, umbrellaSrc]) {
      const guardedCall = src.match(/items\.length > 0 &&|data\.items\.length > 0 &&/);
      expect(guardedCall).not.toBeNull();
    }
  });
});

describe("SEO boost — property pages use their own real photo as the social-share image", () => {
  const src = read("src/app/(site)/property/[slug]/page.tsx");

  it("only ever uses a real PHOTO — never an ILLUSTRATIVE placeholder — as the Open Graph image", () => {
    const ogBlock = src.slice(src.indexOf("const ogPhoto"), src.indexOf("const ogPhoto") + 200);
    expect(ogBlock).toMatch(/kind === "PHOTO"/);
  });

  it("passes it through as ogImage only when a real photo exists — never forces a fallback here that would override the real one", () => {
    expect(src).toMatch(/\.\.\.\(ogPhoto \? \{ ogImage: ogPhoto\.url \} : \{\}\)/);
  });
});
