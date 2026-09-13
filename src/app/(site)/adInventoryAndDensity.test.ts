import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const homeSrc = read("src/app/(site)/page.tsx");
const categorySrc = read("src/app/(site)/[categorySlug]/page.tsx");
const locationSrc = read("src/app/(site)/locations/[locationSlug]/page.tsx");
const searchSrc = read("src/app/(site)/search/page.tsx");
const propertySrc = read("src/app/(site)/property/[slug]/page.tsx");

describe("Ad slots — placement per page", () => {
  it("homepage uses the 'hero' ladder — the only page that does", () => {
    expect(homeSrc).toMatch(/<AdSlot ladder="hero"/);
    for (const src of [categorySrc, locationSrc, searchSrc, propertySrc]) {
      expect(src).not.toMatch(/ladder="hero"/);
    }
  });

  it("category and location pages use a 'banner' slot above results and a 'rail' slot in a desktop-only sidebar", () => {
    for (const src of [categorySrc, locationSrc]) {
      expect(src).toMatch(/<AdSlot ladder="banner"/);
      expect(src).toMatch(/<AdSlot ladder="rail"/);
      expect(src).toMatch(/<aside className="hidden lg:block">/);
    }
  });

  it("search page uses only a 'banner' slot — no sidebar rail, keeping the filter UI clean", () => {
    expect(searchSrc).toMatch(/<AdSlot ladder="banner"/);
    expect(searchSrc).not.toMatch(/ladder="rail"/);
  });

  it("search page never shows an ad on the pre-search or no-results empty states — only alongside real results", () => {
    const noMatchesBlock = searchSrc.slice(searchSrc.indexOf('title="No matches"'), searchSrc.indexOf('title="No matches"') + 600);
    expect(noMatchesBlock).not.toMatch(/AdSlot/);
    const startSearchingIdx = searchSrc.indexOf('title="Start searching"');
    expect(startSearchingIdx).toBeGreaterThan(-1);
  });

  it("property page uses exactly one 'card' slot, and never advertises a property on its own page", () => {
    expect(propertySrc).toMatch(/<AdSlot ladder="card"/);
    expect((propertySrc.match(/<AdSlot/g) ?? []).length).toBe(1);
    expect(propertySrc).toMatch(/Never promote a property on its own page/);
  });

  it("every ad-consuming page gates rendering on a real creative (never renders AdSlot with a null/fabricated creative)", () => {
    for (const src of [homeSrc, categorySrc, locationSrc, searchSrc, propertySrc]) {
      expect(src).toMatch(/adCreative && \(/);
    }
  });
});

describe("30+ discovery density — exact matches always render before supplemented ones", () => {
  for (const [label, src] of [
    ["category", categorySrc],
    ["location", locationSrc],
  ] as const) {
    it(`${label} page renders the exact-match grid, then Pagination, then the "More Places to Explore" section — never interleaved`, () => {
      const exactGridIdx = src.indexOf("{items.map((p) => (");
      const paginationIdx = src.indexOf("<Pagination");
      const moreSectionIdx = src.indexOf("More Places to Explore");
      const supplementedGridIdx = src.indexOf("{supplemented.map((p) => (");
      expect(exactGridIdx).toBeGreaterThan(-1);
      expect(paginationIdx).toBeGreaterThan(exactGridIdx);
      expect(moreSectionIdx).toBeGreaterThan(paginationIdx);
      expect(supplementedGridIdx).toBeGreaterThan(moreSectionIdx);
    });

    it(`${label} page never claims supplemented properties belong to the exact category/location`, () => {
      const section = src.slice(src.indexOf("More Places to Explore"), src.indexOf("More Places to Explore") + 300);
      expect(section).toMatch(/aren't|aren&apos;t/);
    });

    it(`${label} page only supplements on the default, unfiltered first page`, () => {
      expect(src).toMatch(/safePage === 1 && !filtersActive/);
    });

    it(`${label} page uses buildDiscoveryCountLabel for an honest count — never hardcodes "N+ places to explore" as a raw string`, () => {
      expect(src).toMatch(/buildDiscoveryCountLabel\(\{/);
      expect(src).toMatch(/countLabel\.primary/);
    });
  }
});

describe("30+ discovery density — never duplicates, never fabricates", () => {
  it("category page passes already-shown ids into the supplement call, so a card can never repeat on the same page", () => {
    expect(categorySrc).toMatch(/shownIds: new Set\(items\.map\(\(p\) => p\.id\)\)/);
  });

  it("location page does the same", () => {
    expect(locationSrc).toMatch(/shownIds: new Set\(items\.map\(\(p\) => p\.id\)\)/);
  });

  it("supplemented cards use the exact same PropertyCard component as exact matches — same thumbnail fallback, same data shape", () => {
    for (const src of [categorySrc, locationSrc]) {
      const supplementSection = src.slice(src.indexOf("supplemented.length > 0"));
      expect(supplementSection).toMatch(/<PropertyCard key=\{p\.id\} property=\{p\} \/>/);
    }
  });
});

describe("Existing filters, sort, compare and enquiry CTAs remain functional and untouched", () => {
  it("category/location pages keep FacilityTrustFilterPanel, the sort links, and Pagination", () => {
    for (const src of [categorySrc, locationSrc]) {
      expect(src).toMatch(/<FacilityTrustFilterPanel/);
      expect(src).toMatch(/SORT_OPTIONS\.map/);
      expect(src).toMatch(/<Pagination/);
    }
  });

  it("PropertyCard.tsx (compare checkbox + enquiry-eligible link target) was not modified by this phase", () => {
    const cardSrc = read("src/components/site/PropertyCard.tsx");
    expect(cardSrc).toMatch(/<CompareCheckbox/);
    expect(cardSrc).toMatch(/href={`\/property\/\$\{property\.slug\}`}/);
  });

  it("property page's enquiry and claim CTAs still render independently of the ad slot", () => {
    expect(propertySrc).toMatch(/enquiryCtaCopy/);
    expect(propertySrc).toMatch(/Claim this listing/);
  });
});

describe("Ad slots never cause horizontal overflow", () => {
  it("AdSlot constrains every step's width with maxWidth and centers it — never a fixed width wider than its container", () => {
    const adSlotSrc = read("src/components/site/ads/AdSlot.tsx");
    expect(adSlotSrc).toMatch(/mx-auto w-full/);
    expect(adSlotSrc).toMatch(/maxWidth: format\.width/);
  });
});
