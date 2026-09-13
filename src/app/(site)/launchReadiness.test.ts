import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CONTACT_EMAIL, SITE_OPERATOR_NAME } from "@/lib/public/contact";

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("PHASE 5A — contact constants", () => {
  it("CONTACT_EMAIL is a plausible, non-empty email address", () => {
    expect(CONTACT_EMAIL).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });

  it("SITE_OPERATOR_NAME is set", () => {
    expect(SITE_OPERATOR_NAME.length).toBeGreaterThan(0);
  });
});

describe("PHASE 5A — About/Contact/Privacy pages exist, are indexable, and use real content only", () => {
  it("About page uses the real site description/positioning constants, not invented marketing copy", () => {
    const src = read("src/app/(site)/about/page.tsx");
    expect(src).toMatch(/SITE_DESCRIPTION/);
    expect(src).toMatch(/SITE_POSITIONING/);
  });

  it("About page is indexable (no noindex) — it's real, permanent content, not a filter/utility page", () => {
    const src = read("src/app/(site)/about/page.tsx");
    expect(src).not.toMatch(/noindex:\s*true/);
  });

  it("Contact page shows the real CONTACT_EMAIL constant via a mailto link, never a hardcoded/invented address", () => {
    const src = read("src/app/(site)/contact/page.tsx");
    expect(src).toMatch(/CONTACT_EMAIL/);
    expect(src).toMatch(/mailto:\$\{CONTACT_EMAIL\}/);
    // No literal email string hardcoded directly in the page.
    expect(src).not.toMatch(/@resortinranchi\.in/);
  });

  it("Contact page directs business-specific enquiries to each listing's own contact info, never fabricating one", () => {
    const src = read("src/app/(site)/contact/page.tsx");
    expect(src).toMatch(/don't handle bookings or enquiries on a business's behalf|don&apos;t handle bookings or enquiries on a business&apos;s behalf/);
  });

  it("Privacy page describes only real, verified data practices: enquiry/claim form fields, functional-only cookies, no analytics", () => {
    const src = read("src/app/(site)/privacy/page.tsx");
    expect(src).toMatch(/Enquiries/);
    expect(src).toMatch(/Listing claims/);
    expect(src).toMatch(/functional cookies only/);
    expect(src).toMatch(/don't run any analytics|don&apos;t run any analytics/);
    expect(src).toMatch(/CONTACT_EMAIL/);
  });

  it("none of the three pages contain a database write call — they are static/read-only content", () => {
    for (const file of ["src/app/(site)/about/page.tsx", "src/app/(site)/contact/page.tsx", "src/app/(site)/privacy/page.tsx"]) {
      const src = read(file);
      expect(src).not.toMatch(/\.(create|update|updateMany|upsert|delete|deleteMany)\s*\(/);
    }
  });
});

describe("PHASE 5A — sitemap includes the new real content pages", () => {
  it("lists /about, /contact, and /privacy as static, permanent entries", () => {
    const src = read("src/app/sitemap.ts");
    expect(src).toMatch(/\$\{SITE_URL\}\/about/);
    expect(src).toMatch(/\$\{SITE_URL\}\/contact/);
    expect(src).toMatch(/\$\{SITE_URL\}\/privacy/);
  });
});

describe("PHASE 5A — footer links to the new pages without breaking existing navigation", () => {
  const src = read("src/components/site/Footer.tsx");

  it("adds About/Contact/Privacy links", () => {
    expect(src).toMatch(/href: "\/about"/);
    expect(src).toMatch(/href: "\/contact"/);
    expect(src).toMatch(/href: "\/privacy"/);
  });

  it("preserves the existing category and location links unchanged", () => {
    expect(src).toMatch(/href: "\/resorts"/);
    expect(src).toMatch(/href: "\/hotels"/);
    expect(src).toMatch(/href: "\/locations\/ranchi"/);
    expect(src).toMatch(/href: "\/locations\/ormanjhi"/);
  });
});

describe("PHASE 5A — claim page's 'contact us' is a real link, not dead text", () => {
  it("links to /contact instead of unlinked 'contact us' text", () => {
    const src = read("src/app/(site)/property/[slug]/claim/page.tsx");
    expect(src).toMatch(/<Link href="\/contact"/);
  });
});

describe("PHASE 5A — homepage clarity and owner-acquisition CTA", () => {
  const src = read("src/app/(site)/page.tsx");

  it("hero uses the real SITE_DESCRIPTION (a 'why' statement) rather than a separately invented tagline string", () => {
    expect(src).toMatch(/\{SITE_DESCRIPTION\}/);
  });

  it("adds a distinct 'Own a business' CTA section reusing the existing, approved CLAIM_VALUE_PROP_COPY — no new/invented claim pitch", () => {
    expect(src).toMatch(/Own a business in Ranchi\?/);
    expect(src).toMatch(/\{CLAIM_VALUE_PROP_COPY\}/);
  });

  it("the owner CTA offers both real, existing flows — find & claim an existing listing, or add a new one (PHASE 6's Add Your Property)", () => {
    const jsx = src.slice(src.indexOf("Own a business in Ranchi?"), src.indexOf("Own a business in Ranchi?") + 800);
    expect(jsx).toMatch(/href="\/search"/);
    expect(jsx).toMatch(/href="\/list-your-business"/);
  });

  it("never invents ranking language anywhere on the homepage", () => {
    expect(src).not.toMatch(/#1/);
    expect(src).not.toMatch(/\bBest\b/);
  });
});
