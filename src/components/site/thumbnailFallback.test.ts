import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { selectCardImage } from "@/lib/public/properties";

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const cardImageSrc = read("src/components/site/CardImage.tsx");
const propertyCardSrc = read("src/components/site/PropertyCard.tsx");

describe("Listing card thumbnail — CardImage never renders a blank image area", () => {
  it("handles photo, illustrative, and logo explicitly, in that priority order", () => {
    const photoIdx = cardImageSrc.indexOf('if (image.kind === "photo")');
    const illustrativeIdx = cardImageSrc.indexOf('if (image.kind === "illustrative")');
    const logoIdx = cardImageSrc.indexOf('if (image.kind === "logo")');
    expect(photoIdx).toBeGreaterThan(-1);
    expect(illustrativeIdx).toBeGreaterThan(photoIdx);
    expect(logoIdx).toBeGreaterThan(illustrativeIdx);
  });

  it("falls through to an unconditional final render for every other kind — no branch can produce nothing", () => {
    // Exactly 3 explicit kind checks (photo/illustrative/logo); the 4th
    // return (the placeholder) is never gated behind an `if`, so any kind
    // that isn't one of those three — including a future one nobody adds a
    // branch for — still renders something instead of an empty card.
    const conditionalBranches = (cardImageSrc.match(/if \(image\.kind === "/g) ?? []).length;
    expect(conditionalBranches).toBe(3);
    const returns = (cardImageSrc.match(/\breturn \(/g) ?? []).length;
    expect(returns).toBe(4);
  });

  it("the unconditional placeholder fallback renders real visible content, never an empty box", () => {
    const placeholderBlock = cardImageSrc.slice(cardImageSrc.lastIndexOf("return ("));
    expect(placeholderBlock).toMatch(/role="img"/);
    expect(placeholderBlock).toMatch(/<CategoryIcon/);
    expect(placeholderBlock).toMatch(/aria-label=\{image\.alt\}/);
  });

  it("keeps the illustrative treatment visually distinct from a real photo (never implies it depicts this specific property)", () => {
    const illustrativeBlock = cardImageSrc.slice(
      cardImageSrc.indexOf('if (image.kind === "illustrative")'),
      cardImageSrc.indexOf('if (image.kind === "logo")')
    );
    expect(illustrativeBlock).toMatch(/Illustrative/);
  });

  it("every image kind keeps the same aspect-[4/3] card dimensions — the fallback chain never changes the card's shape", () => {
    const matches = cardImageSrc.match(/aspect-\[4\/3\]/g) ?? [];
    expect(matches.length).toBe(4);
  });
});

describe("PropertyCard always resolves and renders a thumbnail, for every property", () => {
  it("calls selectCardImage unconditionally, for every property, before rendering", () => {
    expect(propertyCardSrc).toMatch(/const image = selectCardImage\(property\);/);
  });

  it("renders CardImage unconditionally — never skipped based on whether image data exists", () => {
    expect(propertyCardSrc).toMatch(/<CardImage image=\{image\} categorySlug=\{property\.category\.slug\} name=\{property\.name\} \/>/);
    expect(propertyCardSrc).not.toMatch(/\{image(\.url)? &&/);
    expect(propertyCardSrc).not.toMatch(/image\.kind === "placeholder" \? null/);
  });
});

describe("The thumbnail fallback chain is applied consistently across every discovery surface", () => {
  const surfaces = [
    "src/app/(site)/page.tsx",
    "src/app/(site)/search/page.tsx",
    "src/app/(site)/[categorySlug]/page.tsx",
    "src/app/(site)/locations/[locationSlug]/page.tsx",
  ];

  for (const path of surfaces) {
    it(`${path} renders its listings through the shared PropertyCard component, not a bespoke card`, () => {
      const src = read(path);
      expect(src).toMatch(/<PropertyCard key=\{p\.id\} property=\{p\} \/>/);
    });
  }
});

describe("selectCardImage — every published property resolves to a non-blank result (regression)", () => {
  const name = "Test Property";

  /**
   * Every combination of asset availability a real published property could
   * have — including the worst case (nothing at all) — must resolve to a
   * real, renderable result. `url` is only ever null for "placeholder",
   * which CardImage draws rather than fetches, so "null url" never means an
   * empty/broken image area.
   */
  const scenarios: { label: string; input: Parameters<typeof selectCardImage>[0]; expectedKind: string }[] = [
    {
      label: "has a real PHOTO",
      input: { name, generatedIdentityMarkUrl: null, images: [{ url: "https://x/photo.jpg", altText: null, kind: "PHOTO" }] },
      expectedKind: "photo",
    },
    {
      label: "has only a real LOGO image",
      input: { name, generatedIdentityMarkUrl: null, images: [{ url: "https://x/logo.png", altText: null, kind: "LOGO" }] },
      expectedKind: "logo",
    },
    {
      label: "has only a generated identity mark",
      input: { name, generatedIdentityMarkUrl: "https://x/mark.png", images: [] },
      expectedKind: "logo",
    },
    {
      label: "has only an ILLUSTRATIVE image",
      input: { name, generatedIdentityMarkUrl: null, images: [{ url: "https://x/illustrative.jpg", altText: null, kind: "ILLUSTRATIVE" }] },
      expectedKind: "illustrative",
    },
    {
      label: "has absolutely nothing — no photo, no logo, no generated mark, no illustrative image",
      input: { name, generatedIdentityMarkUrl: null, images: [] },
      expectedKind: "placeholder",
    },
  ];

  for (const { label, input, expectedKind } of scenarios) {
    it(`resolves to a real, non-blank "${expectedKind}" result when the property ${label}`, () => {
      const result = selectCardImage(input);
      expect(result.kind).toBe(expectedKind);
      expect(result.alt).toBeTruthy();
      if (result.kind !== "placeholder") {
        expect(result.url).toBeTruthy();
      } else {
        // Placeholder is drawn, never fetched — a null url here is correct,
        // not a missing thumbnail (see CardImage's unconditional final branch above).
        expect(result.url).toBeNull();
      }
    });
  }
});
