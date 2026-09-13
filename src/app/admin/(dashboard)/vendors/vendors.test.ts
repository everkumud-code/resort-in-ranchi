import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const src = read("src/app/admin/(dashboard)/vendors/page.tsx");

describe("PHASE 9 — vendors page is admin-only", () => {
  it("requires an authenticated admin", () => {
    expect(src).toMatch(/requireAdmin\(\)/);
  });
});

describe("PHASE 9 — vendors page reuses existing query infrastructure instead of duplicating it", () => {
  it("builds its filter and pagination via the shared queries/properties helpers, not a bespoke reimplementation", () => {
    expect(src).toMatch(/from "@\/lib\/queries\/properties"/);
    expect(src).toMatch(/buildPropertyWhereClause\(/);
    expect(src).toMatch(/computePagination\(/);
  });

  it("reuses the same CommercialTierSelect component the property detail page uses, not a second copy", () => {
    expect(src).toMatch(/from "\.\.\/properties\/\[id\]\/CommercialTierSelect"/);
  });

  it("never redefines its own property search/filter logic beyond a simple name search", () => {
    expect(src).not.toMatch(/prisma\.category\.findMany/);
    expect(src).not.toMatch(/prisma\.location\.findMany/);
  });
});

describe("PHASE 9 — vendors page filters by real, validated commercial tiers only", () => {
  it("validates the tier query param against the real enum", () => {
    expect(src).toMatch(/isValidCommercialTier\(sp\.tier\)/);
  });

  it("shows a real per-tier count from a live groupBy, not a fabricated number", () => {
    expect(src).toMatch(/prisma\.property\.groupBy\(\{ by: \["commercialTier"\]/);
  });
});
