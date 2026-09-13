import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const src = read("src/app/owner/referred/page.tsx");

describe("PHASE 6 — owner 'Referred opportunities' is scoped strictly to the signed-in owner's own property", () => {
  it("resolves the property id only from the authenticated owner session, never a URL param", () => {
    expect(src).toMatch(/getOwnerAccessPropertyId\(\)/);
    expect(src).not.toMatch(/params\.propertyId|params\.id/);
  });

  it("redirects home when there is no session or no configured partner for this property", () => {
    expect(src).toMatch(/if \(!propertyId\) redirect\("\/owner"\)/);
    expect(src).toMatch(/if \(!property \|\| !partner\) redirect\("\/owner"\)/);
  });

  it("looks up the LeadPartner by this session's own propertyId, then fetches leads only by that partner's id", () => {
    expect(src).toMatch(/prisma\.leadPartner\.findUnique\(\{ where: \{ propertyId \}/);
    expect(src).toMatch(/prisma\.partnerLead\.findMany\(\{\s*where:\s*\{\s*partnerId:\s*partner\.id\s*\}/);
  });
});
