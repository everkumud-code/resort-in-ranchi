import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  DEFAULT_PLACEMENTS,
  DEFAULT_PROMO_ADS,
  PROMO_ACCENTS,
  PROMO_SPOTS,
  buildAdHref,
  isPromoSpot,
  parseAdHref,
  parsePointsText,
  pickAdForSpot,
  promoAdSchema,
  slugifyKey,
  type PromoAdData,
} from "./catalog";
import { starterState } from "./store";

const ads: PromoAdData[] = DEFAULT_PROMO_ADS.map((a) => ({ ...a, id: a.key }));

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

describe("starter ads", () => {
  it("has the agency ad and one separate ad for each of Next Era, Next Edge, NextFit, NextGlow and NextCare", () => {
    expect(DEFAULT_PROMO_ADS.map((a) => a.key)).toEqual(["next-resource", "next-era", "next-edge", "nextfit", "nextglow", "nextcare"]);
    expect(new Set(DEFAULT_PROMO_ADS.map((a) => a.headline)).size).toBe(6);
    expect(new Set(DEFAULT_PROMO_ADS.map((a) => a.href)).size).toBe(6);
  });

  it("every starter ad passes the same rules the admin screen enforces", () => {
    for (const ad of DEFAULT_PROMO_ADS) {
      expect(promoAdSchema.safeParse(ad).success, ad.key).toBe(true);
      expect(parseAdHref(ad.href).ok, ad.key).toBe(true);
      expect(Object.keys(PROMO_ACCENTS), ad.key).toContain(ad.accent);
    }
  });

  it("gives each brand its own colour so no two look alike", () => {
    expect(new Set(DEFAULT_PROMO_ADS.map((a) => a.accent)).size).toBe(6);
  });

  it("quotes no prices and none of the unverified agency numbers or partner badges", () => {
    for (const ad of DEFAULT_PROMO_ADS) {
      const text = [ad.brand, ad.tag, ad.headline, ad.body, ...ad.points].join(" ");
      expect(text, ad.key).not.toMatch(/₹|\bRs\.?\s?\d|\b100\+|\b50\+|5M\+|Google Partner|Meta (Business )?Partner/i);
    }
  });
});

describe("spots and placement", () => {
  it("has unique spot keys", () => {
    const keys = PROMO_SPOTS.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(isPromoSpot("home")).toBe(true);
    expect(isPromoSpot("footer")).toBe(false);
  });

  it("the starter placement fills every spot with a real starter ad", () => {
    for (const spot of PROMO_SPOTS) {
      expect(ads.map((a) => a.key), spot.key).toContain(DEFAULT_PLACEMENTS[spot.key]);
    }
    expect(Object.keys(DEFAULT_PLACEMENTS).sort()).toEqual(PROMO_SPOTS.map((s) => s.key).sort());
  });

  it("each brand ad has a spot of its own, and no two neighbouring spots repeat an ad (only the agency ad appears twice, on two unrelated pages)", () => {
    const used = Object.values(DEFAULT_PLACEMENTS);
    const counts = used.reduce<Record<string, number>>((m, k) => ({ ...m, [k]: (m[k] ?? 0) + 1 }), {});
    for (const [key, n] of Object.entries(counts)) expect(n === 1 || key === "next-resource", key).toBe(true);
    expect(DEFAULT_PLACEMENTS.home).toBe("next-resource");
    expect(DEFAULT_PLACEMENTS["list-business"]).toBe("next-resource");
  });

  it("starterState lines up with the catalog", () => {
    const s = starterState();
    expect(s.usingStarter).toBe(true);
    expect(s.placements).toHaveLength(PROMO_SPOTS.length);
    expect(pickAdForSpot("category", s.placements, s.ads)?.key).toBe("next-era");
  });

  it("pickAdForSpot returns nothing for an empty spot, a missing ad or a switched-off ad", () => {
    expect(pickAdForSpot("home", [{ slot: "home", adId: null }], ads)).toBeNull();
    expect(pickAdForSpot("home", [{ slot: "home", adId: "gone" }], ads)).toBeNull();
    expect(pickAdForSpot("home", [], ads)).toBeNull();
    const off = ads.map((a) => (a.key === "next-era" ? { ...a, active: false } : a));
    expect(pickAdForSpot("home", [{ slot: "home", adId: "next-era" }], off)).toBeNull();
    expect(pickAdForSpot("home", [{ slot: "home", adId: "next-era" }], ads)?.key).toBe("next-era");
  });
});

describe("links", () => {
  it("accepts only https links without credentials", () => {
    expect(parseAdHref(" https://www.nextresource.in/next-era ").ok).toBe(true);
    for (const bad of ["", "javascript:alert(1)", "http://example.com", "data:text/html,x", "https://u:p@example.com", "nextresource.in", "//evil.test"]) {
      expect(parseAdHref(bad).ok, bad).toBe(false);
    }
  });

  it("tags nextresource.in links with the ad and the spot, and leaves everything else alone", () => {
    const tagged = new URL(buildAdHref("https://www.nextresource.in/next-era", "next-era", "category"));
    expect(tagged.searchParams.get("utm_source")).toBe("resortinranchi");
    expect(tagged.searchParams.get("utm_medium")).toBe("sponsored");
    expect(tagged.searchParams.get("utm_campaign")).toBe("next-era");
    expect(tagged.searchParams.get("utm_content")).toBe("category");
    expect(buildAdHref("https://example.com/x", "k", "home")).toBe("https://example.com/x");
    const own = "https://www.nextresource.in/?utm_source=mine";
    expect(buildAdHref(own, "k", "home")).toBe(own);
  });
});

describe("editing rules", () => {
  it("limits highlights and text lengths", () => {
    const ok = { brand: "A", tag: "t", headline: "h", body: "b", ctaLabel: "go", accent: "teal", points: ["1", "2", "3", "4"] };
    expect(promoAdSchema.safeParse(ok).success).toBe(true);
    expect(promoAdSchema.safeParse({ ...ok, points: ["1", "2", "3", "4", "5"] }).success).toBe(false);
    expect(promoAdSchema.safeParse({ ...ok, body: "x".repeat(261) }).success).toBe(false);
    expect(promoAdSchema.safeParse({ ...ok, accent: "pink" }).success).toBe(false);
    expect(promoAdSchema.safeParse({ ...ok, brand: " " }).success).toBe(false);
  });

  it("splits highlights by line and makes a safe key", () => {
    expect(parsePointsText("a\r\n\n  b \n")).toEqual(["a", "b"]);
    expect(slugifyKey("Next Era!")).toBe("next-era");
    expect(slugifyKey("  --  ")).toBe("");
  });
});

describe("page layout: ads never clash", () => {
  const root = resolve(process.cwd(), "src");
  const files = walk(root).filter((f) => /\.tsx$/.test(f) && !f.endsWith(".test.tsx"));
  const withSpot = files
    .map((f) => ({ f, src: readFileSync(f, "utf8") }))
    .filter(({ src }) => /<PromoAd\b/.test(src));

  it("every spot is used exactly once in the code", () => {
    const all = withSpot.flatMap(({ src }) => [...src.matchAll(/<PromoAd spot="([^"]+)"/g)].map((m) => m[1]));
    expect(all.sort()).toEqual(PROMO_SPOTS.map((s) => s.key).sort());
  });

  it("no file renders more than one promo, so a page never shows two", () => {
    for (const { f, src } of withSpot) expect(src.match(/<PromoAd\b/g)?.length, f).toBe(1);
  });

  it("no promo sits on a page that already has the Aangan ad, or on enquiry, claim, legal or admin pages", () => {
    for (const { f } of withSpot) {
      const path = f.replace(/\\/g, "/");
      expect(path, f).not.toMatch(/blog\/\[slug]|\/search\/|locations\/|\/enquire\/|\/claim\/|privacy|\/admin\/|\/owner\/|\/creator\//);
    }
  });

  it("is never placed inside the site layout, where it would repeat on every page", () => {
    const layout = readFileSync(resolve(root, "app/(site)/layout.tsx"), "utf8");
    expect(layout).not.toMatch(/PromoAd/);
  });
});
