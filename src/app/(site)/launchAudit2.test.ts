import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("FINAL LAUNCH — Add Your Property is visible across discovery surfaces", () => {
  it("the homepage hero links to Add Your Property right under the search box, not just further down the page", () => {
    const src = read("src/app/(site)/page.tsx");
    const heroSection = src.slice(src.indexOf("<HeroVisual"), src.indexOf("</section>"));
    expect(heroSection).toMatch(/href="\/list-your-business"/);
  });

  it("the homepage no longer claims claiming/adding is a future feature — both already exist", () => {
    const src = read("src/app/(site)/page.tsx");
    expect(src).not.toMatch(/will be able to claim and verify their own listing in a future update/);
  });

  it("the footer links to Add Your Property alongside About/Contact/Privacy", () => {
    const src = read("src/components/site/Footer.tsx");
    expect(src).toMatch(/href: "\/list-your-business"/);
  });

  it("the search page's no-results empty state offers Add Your Property", () => {
    const src = read("src/app/(site)/search/page.tsx");
    const emptyState = src.slice(src.indexOf('title="No matches"'), src.indexOf('title="No matches"') + 700);
    expect(emptyState).toMatch(/href="\/list-your-business"/);
  });

  it("the category page's empty state offers Add Your Property", () => {
    const src = read("src/app/(site)/[categorySlug]/page.tsx");
    expect(src).toMatch(/href="\/list-your-business"/);
  });

  it("the location page's empty state offers Add Your Property", () => {
    const src = read("src/app/(site)/locations/[locationSlug]/page.tsx");
    expect(src).toMatch(/href="\/list-your-business"/);
  });

  it("the umbrella category view's (Picnic Spots / Experiences) empty state offers Add Your Property", () => {
    const src = read("src/components/site/UmbrellaCategoryView.tsx");
    expect(src).toMatch(/href="\/list-your-business"/);
  });

  it("the About page distinguishes claiming an existing listing from adding a new one", () => {
    const src = read("src/app/(site)/about/page.tsx");
    expect(src).toMatch(/href="\/search"/);
    expect(src).toMatch(/href="\/list-your-business"/);
    expect(src).toMatch(/Not listed at all yet/);
  });

  it("the Contact page also offers a path for an unlisted business, not just already-claimed support", () => {
    const src = read("src/app/(site)/contact/page.tsx");
    expect(src).toMatch(/href="\/list-your-business"/);
  });
});

describe("FINAL LAUNCH — Claim vs Add Your Property stay clearly distinct, never conflated", () => {
  it("homepage CTA section explicitly separates 'already listed' (claim) from 'not listed yet' (add)", () => {
    const src = read("src/app/(site)/page.tsx");
    const section = src.slice(src.indexOf("Own a business in Ranchi?"), src.indexOf("Own a business in Ranchi?") + 800);
    expect(section).toMatch(/already listed/i);
    expect(section).toMatch(/[Nn]ot listed yet/);
  });

  it("Add Your Property's own page still cross-links to Contact for an already-listed business, rather than conflating the two flows", () => {
    const src = read("src/app/(site)/list-your-business/page.tsx");
    expect(src).toMatch(/Already listed/);
    expect(src).toMatch(/href="\/contact"/);
  });
});

describe("FINAL LAUNCH — Add Your Property submission is clearly pending review, never implying auto-publish", () => {
  it("the form intro and success state both say review happens before anything goes live", () => {
    const src = read("src/app/(site)/list-your-business/page.tsx");
    expect(src).toMatch(/review it before it goes live/);
    expect(src).toMatch(/team will review your submission/i);
  });

  it("the underlying action never auto-publishes or auto-verifies — only ever creates a PENDING PropertySubmission", () => {
    const src = read("src/app/(site)/list-your-business/actions.ts");
    expect(src).toMatch(/prisma\.propertySubmission\.create/);
    expect(src).not.toMatch(/prisma\.property\.(create|update)/);
  });
});
