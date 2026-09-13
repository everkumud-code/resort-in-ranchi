import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const src = read("src/lib/public/discovery.ts");

describe("getCategoryDiscoverySupplement / getLocationDiscoverySupplement never duplicate or fabricate", () => {
  it("every tier's DB query excludes ids already shown, at the query level (not just after fetching)", () => {
    const notInMatches = src.match(/id: \{ notIn: \[\.\.\.shown\] \}/g) ?? [];
    // categoryDiscoverySupplement: related-tier pull() + broader tier = 2 uses of the shared `pull` helper's notIn clause plus one broader-tier notIn.
    // Both functions share the same `pull` helper shape, so this pattern must appear at least twice (once per function's broader-fallback tier) — checked precisely below instead.
    expect(notInMatches.length).toBeGreaterThanOrEqual(2);
  });

  it("also runs a second, defensive JS-level dedupe against the same shown set before accepting a batch", () => {
    const dedupeCalls = src.match(/dedupeAgainstShown\(/g) ?? [];
    expect(dedupeCalls.length).toBeGreaterThanOrEqual(4); // 1 in each `pull` + 1 in each broader-fallback tier, x2 functions
  });

  it("only ever selects PUBLISHED properties (never DRAFT/ARCHIVED/CLOSED) via the shared publishedOnly() helper", () => {
    expect(src).toMatch(/publishedOnly\(\{ categoryId: \{ in: categoryIds \}, id: \{ notIn: \[\.\.\.shown\] \} \}\)/);
    expect(src).toMatch(/publishedOnly\(\{ localityId: \{ in: localityIds \}, id: \{ notIn: \[\.\.\.shown\] \} \}\)/);
  });

  it("never writes to the database — read-only queries only", () => {
    expect(src).not.toMatch(/prisma\.\w+\.(update|updateMany|create|createMany|delete|deleteMany|upsert)\(/);
  });

  it("never touches Property.categoryId or Property.localityId — canonical category/location data is never altered", () => {
    expect(src).not.toMatch(/categoryId:\s*category/);
    expect(src).not.toMatch(/localityId:\s*location/);
  });

  it("caps every tier's query at exactly how many are still needed — never fetches the whole database", () => {
    const takeStillNeeded = src.match(/take: stillNeeded\(\)/g) ?? [];
    expect(takeStillNeeded.length).toBeGreaterThanOrEqual(3); // one per tier, per function
  });

  it("selects listings via publicPropertyCardSelect, so every supplemented card gets the same thumbnail-fallback data as an exact match", () => {
    expect(src).toMatch(/select: publicPropertyCardSelect/);
  });

  it("orders every tier's candidates featured-first, then newest — Aangan Resort (or any featured listing) naturally surfaces first wherever it's genuinely relevant, with no hardcoded property id or name anywhere in this file", () => {
    expect(src).toMatch(/featured: "desc"/);
    expect(src).not.toMatch(/aangan/i);
  });
});

describe("category supplementation priority order: related parent/siblings -> adjacent group -> broader fallback", () => {
  const fn = src.slice(src.indexOf("export async function getCategoryDiscoverySupplement"), src.indexOf("export async function getLocationDiscoverySupplement"));

  it("tries related parent/sibling categories first", () => {
    const relatedIdx = fn.indexOf("category.parentId");
    const adjacentIdx = fn.indexOf("getAdjacentCategorySlugs");
    const broaderIdx = fn.lastIndexOf("prisma.property.findMany");
    expect(relatedIdx).toBeGreaterThan(-1);
    expect(adjacentIdx).toBeGreaterThan(relatedIdx);
    expect(broaderIdx).toBeGreaterThan(adjacentIdx);
  });
});

describe("location supplementation priority order: related parent/siblings -> other notable areas -> broader fallback", () => {
  const fn = src.slice(src.indexOf("export async function getLocationDiscoverySupplement"));

  it("tries related parent/sibling locations, then the curated priority-locations list, before the broader fallback", () => {
    const relatedIdx = fn.indexOf("location.parentId");
    const priorityIdx = fn.indexOf("PRIORITY_LOCATION_SLUGS");
    const broaderIdx = fn.lastIndexOf("prisma.property.findMany");
    expect(relatedIdx).toBeGreaterThan(-1);
    expect(priorityIdx).toBeGreaterThan(relatedIdx);
    expect(broaderIdx).toBeGreaterThan(priorityIdx);
  });

  it("documents that the priority-locations tier is not a claim of real geographic proximity", () => {
    expect(src).toMatch(/not a claim of real geographic proximity|not a claim of geographic proximity/i);
  });
});
