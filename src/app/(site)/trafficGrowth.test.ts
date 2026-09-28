import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("PHASE 5B — view events wired via AnalyticsBeacon on the right pages only", () => {
  it("property page fires PROPERTY_VIEW with the real property id", () => {
    const src = read("src/app/(site)/property/[slug]/page.tsx");
    expect(src).toMatch(/<AnalyticsBeacon type="PROPERTY_VIEW" propertyId=\{property\.id\}/);
  });

  it("enquire page fires ENQUIRY_START", () => {
    const src = read("src/app/(site)/property/[slug]/enquire/page.tsx");
    expect(src).toMatch(/<AnalyticsBeacon type="ENQUIRY_START" propertyId=\{property\.id\}/);
  });

  it("claim page fires CLAIM_START only in the actual claim-form branch, not the already-claimed dead-end", () => {
    const src = read("src/app/(site)/property/[slug]/claim/page.tsx");
    const ternaryStart = src.indexOf("property.claimed ?");
    const elseBranchStart = src.indexOf(") : (", ternaryStart);
    const claimedBranch = src.slice(ternaryStart, elseBranchStart);
    expect(claimedBranch).not.toMatch(/AnalyticsBeacon/);
    expect(src).toMatch(/<AnalyticsBeacon type="CLAIM_START"/);
  });

  it("search page fires SEARCH only when a real query/filter is active, never on a bare empty landing", () => {
    const src = read("src/app/(site)/search/page.tsx");
    expect(src).toMatch(/\{hasQuery && <AnalyticsBeacon type="SEARCH"/);
  });

  it("PHASE 5C — search page tracks the structured category/location filter (for the admin's top-searched report), never the visitor's free-text query", () => {
    const src = read("src/app/(site)/search/page.tsx");
    expect(src).toMatch(/buildTrackedSearchPath\(\{ category: sp\.category, location: sp\.location \}\)/);
    // buildTrackedSearchPath's own call site never receives sp.q.
    const beaconLine = src.slice(src.indexOf("<AnalyticsBeacon"), src.indexOf("<AnalyticsBeacon") + 200);
    expect(beaconLine).not.toMatch(/sp\.q/);
  });

  it("compare page fires COMPARE only in the active-comparison view, never the underfull-selection prompt", () => {
    const src = read("src/app/(site)/compare/page.tsx");
    const underfullBranch = src.slice(
      src.indexOf("if (properties.length < MIN_COMPARE_PROPERTIES)"),
      src.indexOf('<AnalyticsBeacon type="COMPARE"')
    );
    expect(underfullBranch).not.toMatch(/AnalyticsBeacon/);
    expect(src).toMatch(/<AnalyticsBeacon type="COMPARE"/);
  });
});

describe("PHASE 5B — submit events recorded server-side only, at the real point of submission", () => {
  it("enquiry submission tracks ENQUIRY_SUBMIT only after the real prisma.enquiry.create — never on the honeypot/duplicate silent-redirect paths", () => {
    const src = read("src/app/(site)/property/[slug]/enquire/actions.ts");
    const createIndex = src.indexOf("await prisma.enquiry.create(");
    const trackIndex = src.indexOf('trackEvent({ type: "ENQUIRY_SUBMIT"');
    expect(createIndex).toBeGreaterThan(-1);
    expect(trackIndex).toBeGreaterThan(createIndex);

    // The honeypot and duplicate-debounce redirects happen strictly before
    // the real create() call, so trackEvent can only ever run after them.
    const honeypotRedirect = src.indexOf("if (parsed.data.honeypot)");
    const duplicateRedirect = src.indexOf("if (recentDuplicate)");
    expect(honeypotRedirect).toBeLessThan(createIndex);
    expect(duplicateRedirect).toBeLessThan(createIndex);
  });

  it("claim submission tracks CLAIM_SUBMIT only after the real prisma.claimRequest.create", () => {
    const src = read("src/app/(site)/property/[slug]/claim/actions.ts");
    const createIndex = src.indexOf("await prisma.claimRequest.create(");
    const trackIndex = src.indexOf('trackEvent({ type: "CLAIM_SUBMIT"');
    expect(createIndex).toBeGreaterThan(-1);
    expect(trackIndex).toBeGreaterThan(createIndex);
  });
});

describe("PHASE 5B — admin activity summary shows real event counts only", () => {
  const src = read("src/app/admin/(dashboard)/page.tsx");

  it("counts come from a live prisma.analyticsEvent.groupBy, not a hardcoded/estimated number", () => {
    // Phase 5C added an optional period filter (where: createdAtFilter) to
    // this same query — still a live groupBy, never a hardcoded number.
    expect(src).toMatch(/prisma\.analyticsEvent\.groupBy\(\{\s*by:\s*\["type"\],\s*where:\s*createdAtFilter,\s*_count:\s*\{\s*_all:\s*true\s*\}\s*\}\)/);
  });

  it("renders every event type via the shared ANALYTICS_EVENT_TYPES/LABELS — never invents its own labels", () => {
    expect(src).toMatch(/ANALYTICS_EVENT_TYPES\.map/);
    expect(src).toMatch(/ANALYTICS_EVENT_LABELS\[type\]/);
  });
});

describe("PHASE 5B — internal linking: category ↔ location cross-links use real indexable URLs, not filter query params", () => {
  it("category page links to /locations/[slug] (the real page), not /{category}?location=... (a noindexed filter view)", () => {
    const src = read("src/app/(site)/[categorySlug]/page.tsx");
    expect(src).toMatch(/href=\{`\/locations\/\$\{l\.slug\}`\}/);
  });

  it("location page links to /{categorySlug} (the real page), not /locations/{loc}?category=... (a noindexed filter view)", () => {
    const src = read("src/app/(site)/locations/[locationSlug]/page.tsx");
    expect(src).toMatch(/href=\{`\/\$\{c\.slug\}`\}/);
  });
});

describe("PHASE 5B — About/Contact reachable from mobile navigation, not just the footer", () => {
  it("Header passes About/Contact links into MobileNav", () => {
    const src = read("src/components/site/Header.tsx");
    expect(src).toMatch(/href: "\/about"/);
    expect(src).toMatch(/href: "\/contact"/);
    expect(src).toMatch(/<MobileNav links=\{\[\.\.\.NAV_LINKS,.*MOBILE_ONLY_LINKS,.*LOGIN_LINKS\]\}/);
  });

  it("does not clutter the desktop nav with the same links (kept in the footer there)", () => {
    const src = read("src/components/site/Header.tsx");
    const desktopNav = src.slice(src.indexOf('className="hidden'), src.indexOf("</nav>"));
    expect(desktopNav).not.toMatch(/\/about/);
    expect(desktopNav).not.toMatch(/\/contact/);
  });
});

describe("PHASE 5B — sitemap covers every genuinely indexable static page", () => {
  it("includes /about, /contact, /privacy (added this phase)", () => {
    const src = read("src/app/sitemap.ts");
    expect(src).toMatch(/\$\{SITE_URL\}\/about/);
    expect(src).toMatch(/\$\{SITE_URL\}\/contact/);
    expect(src).toMatch(/\$\{SITE_URL\}\/privacy/);
  });
});

describe("PHASE 5B — filtered/search/utility pages remain noindex (regression check)", () => {
  it("search, compare, enquire, and claim pages all still build noindex metadata", () => {
    for (const file of [
      "src/app/(site)/search/page.tsx",
      "src/app/(site)/compare/page.tsx",
      "src/app/(site)/property/[slug]/enquire/page.tsx",
      "src/app/(site)/property/[slug]/claim/page.tsx",
    ]) {
      const src = read(file);
      expect(src).toMatch(/noindex:\s*true/);
    }
  });

  it("category/location pages still noindex their filtered/sorted variants", () => {
    for (const file of ["src/app/(site)/[categorySlug]/page.tsx", "src/app/(site)/locations/[locationSlug]/page.tsx"]) {
      const src = read(file);
      expect(src).toMatch(/hasFilterOrSort/);
      expect(src).toMatch(/noindex:\s*totalCount === 0 \|\| hasFilterOrSort/);
    }
  });
});

describe("PHASE 5B — no ranking/visibility claims are fabricated anywhere touched this phase", () => {
  it("none of the changed pages use '#1' or 'Best' language", () => {
    for (const file of [
      "src/app/(site)/[categorySlug]/page.tsx",
      "src/app/(site)/locations/[locationSlug]/page.tsx",
      "src/app/admin/(dashboard)/page.tsx",
    ]) {
      const src = read(file);
      expect(src).not.toMatch(/#1/);
      expect(src).not.toMatch(/\bBest\b/);
    }
  });
});
