import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const src = readFileSync(resolve(process.cwd(), "src/app/(site)/property/[slug]/page.tsx"), "utf8");

describe("PHASE 3E — primary enquiry CTA is above the fold", () => {
  it("the top enquiry CTA renders before the photo gallery, not after it", () => {
    const ctaIndex = src.indexOf(`href={\`/property/\${slug}/enquire\`}`);
    const galleryIndex = src.indexOf("photoImages.length > 0");
    expect(ctaIndex).toBeGreaterThan(-1);
    expect(galleryIndex).toBeGreaterThan(-1);
    expect(ctaIndex).toBeLessThan(galleryIndex);
  });

  it("the top CTA is full-width on mobile (block w-full) so it's easy to tap", () => {
    const jsx = src.slice(src.indexOf("return ("));
    const ctaBlock = jsx.slice(jsx.indexOf("enquiryEligible || property.phone"), jsx.indexOf("photoImages.length > 0"));
    expect(ctaBlock).toMatch(/block w-full rounded-md bg-brand-orange/);
  });

  it("still uses the Phase 2E contextual CTA copy (getEnquiryCtaCopy), not new hardcoded copy", () => {
    expect(src).toMatch(/getEnquiryCtaCopy\(property\.category\.slug\)/);
    expect(src).toMatch(/\{enquiryCtaCopy\}/g);
  });
});

describe("PHASE 3E — tap-to-contact links use only stored data", () => {
  it("imports the shared contact-link builders instead of inventing formatting inline", () => {
    expect(src).toMatch(/import \{ buildTelHref, buildWhatsAppHref \} from "@\/lib\/public\/contactLinks"/);
  });

  it("renders a Call quick-action above the fold only when the property actually has a stored phone number", () => {
    const jsx = src.slice(src.indexOf("return ("));
    const topSection = jsx.slice(0, jsx.indexOf("photoImages.length > 0"));
    expect(topSection).toMatch(/\{property\.phone && \(/);
    expect(topSection).toMatch(/buildTelHref\(property\.phone\)/);
  });

  it("the Details sidebar phone/WhatsApp rows are tappable links, not plain text", () => {
    expect(src).toMatch(/href=\{buildTelHref\(property\.phone\)\}/);
    expect(src).toMatch(/href=\{buildWhatsAppHref\(property\.whatsapp\)\}/);
  });

  it("never renders a Call/WhatsApp link when the field is empty — no fabricated contact info", () => {
    // Both usages are guarded by `property.phone ? (...) : null` / `property.whatsapp ? (...) : null`.
    const phoneGuards = src.match(/property\.phone \? \(/g) ?? [];
    const whatsappGuards = src.match(/property\.whatsapp \? \(/g) ?? [];
    expect(phoneGuards.length).toBeGreaterThanOrEqual(1);
    expect(whatsappGuards.length).toBeGreaterThanOrEqual(1);
  });
});

describe("PHASE 3E — trust and featured status are clearly shown", () => {
  it("renders the real TrustBadge component (Verified / Owner Verified / Discovery), never a raw enum or invented label", () => {
    expect(src).toMatch(/<TrustBadge verificationStatus=\{property\.verificationStatus\}/);
  });

  it("shows the existing Featured badge exactly when property.featured is true — not a new/duplicate mechanism", () => {
    expect(src).toMatch(/\{property\.featured && \(/);
    expect(src).toMatch(/Featured/);
  });
});

describe("PHASE 3E — Claim Listing stays separate from Enquiry", () => {
  it("the claim CTA links to /claim, a different route from /enquire, and is gated by a different eligibility function", () => {
    expect(src).toMatch(/href=\{`\/property\/\$\{slug\}\/claim`\}/);
    expect(src).toMatch(/href=\{`\/property\/\$\{slug\}\/enquire`\}/);
    expect(src).toMatch(/propertyEligibleForClaimCta\(/);
    expect(src).toMatch(/propertyEligibleForEnquiry\(/);
  });

  it("the claim box and enquiry CTA are visually distinct blocks (claim uses brand-teal, enquiry uses brand-orange)", () => {
    expect(src).toMatch(/border-brand-teal\/20 bg-brand-teal\/5/); // claim box
    expect(src).toMatch(/bg-brand-orange/); // enquiry CTA
  });
});

describe("PHASE 3E — a clear CTA also appears near the end of the page", () => {
  it("renders a final enquiry CTA after the related-properties section", () => {
    const relatedIndex = src.indexOf("More {property.category.name.toLowerCase()}");
    const finalCtaIndex = src.lastIndexOf(`href={\`/property/\${slug}/enquire\`}`);
    expect(relatedIndex).toBeGreaterThan(-1);
    expect(finalCtaIndex).toBeGreaterThan(relatedIndex);
  });

  it("the final CTA is gated by the same enquiryEligible check — never shown for an ineligible property", () => {
    const jsx = src.slice(src.indexOf("return ("));
    const finalSection = jsx.slice(jsx.lastIndexOf("related.length > 0"));
    expect(finalSection).toMatch(/\{enquiryEligible && \(/);
  });

  it("there are at least 3 links to the enquiry route on the page (top, sidebar, closing) for real conversion opportunities throughout", () => {
    const matches = src.match(/href=\{`\/property\/\$\{slug\}\/enquire`\}/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(3);
  });
});

describe("PHASE 3E — mobile hierarchy: contact/enquiry surfaces before facilities on small screens", () => {
  it("the Details/contact column is ordered before the facilities/venue-spaces column on mobile, and restores the original desktop layout via sm:order", () => {
    expect(src).toMatch(/className="order-1 sm:order-2"/);
    expect(src).toMatch(/className="order-2 sm:order-1 sm:col-span-2"/);
  });
});

describe("PHASE 3E — never fabricates data", () => {
  it("price/rooms/event-capacity rows still resolve from real stored fields only, with no default/fallback string invented", () => {
    expect(src).toMatch(/InfoRow label="Price" value=\{property\.priceLabel\}/);
    expect(src).toMatch(/InfoRow label="Rooms" value=\{property\.rooms\}/);
  });

  it("googleRating is only ever shown when actually present on the record", () => {
    expect(src).toMatch(/\{property\.googleRating && \(/);
  });
});

describe("PHASE 3E — SEO/schema/security preserved", () => {
  it("generateMetadata still builds noindex from isThinPublicListing, unchanged", () => {
    expect(src).toMatch(/noindex: isThinPublicListing\(property\)/);
  });

  it("JSON-LD structured data is still rendered via the existing localBusinessJsonLd/JsonLd pair", () => {
    expect(src).toMatch(/localBusinessJsonLd\(property, `\/property\/\$\{slug\}`\)/);
    expect(src).toMatch(/<JsonLd data=\{jsonLd\} \/>/);
  });

  it("the page still resolves the property only via getPublishedPropertyBySlug (PUBLISHED-only, public select) — no new query path added", () => {
    expect(src).toMatch(/getPublishedPropertyBySlug\(slug\)/);
  });

  it("contains no database write call — this page remains read-only", () => {
    expect(src).not.toMatch(/\.(create|update|updateMany|upsert|delete|deleteMany)\s*\(/);
  });
});
