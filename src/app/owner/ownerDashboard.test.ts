import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const src = read("src/app/owner/page.tsx");

describe("PHASE 9 — owner dashboard shows plan/visibility status", () => {
  it("selects commercialTier and featured for the session's own property only", () => {
    const selectBlock = src.slice(src.indexOf("select: {"), src.indexOf("select: {") + 700);
    expect(selectBlock).toMatch(/featured:\s*true/);
    expect(selectBlock).toMatch(/commercialTier:\s*true/);
  });

  it("renders the commercial tier and featured facts as independent, real values — never inferring one from the other", () => {
    const section = src.slice(src.indexOf("function CommercialStatusSection"), src.indexOf("interface PageSearchParams"));
    expect(section).toMatch(/COMMERCIAL_TIER_LABELS\[commercialTier\]/);
    expect(section).toMatch(/featured \? "Featured" : "Not featured"/);
  });

  it("the upgrade/partner CTA only appears for the FREE tier and only ever links to /contact — no payment or checkout flow", () => {
    const section = src.slice(src.indexOf("function CommercialStatusSection"), src.indexOf("interface PageSearchParams"));
    expect(section).toMatch(/commercialTier === "FREE"/);
    expect(section).toMatch(/href="\/contact"/);
    expect(section).not.toMatch(/checkout|payment|stripe|razorpay/i);
  });
});

describe("PHASE 9 — referred/partner leads are shown, strictly scoped to this owner's own partner", () => {
  it("only queries partnerLead counts when this property's own LeadPartner row exists", () => {
    expect(src).toMatch(/const convertedReferredLeads = leadPartner\s*\n\s*\? await prisma\.partnerLead\.count\(\{ where: \{ partnerId: leadPartner\.id, status: "CONVERTED" \} \}\)/);
  });

  it("the summary component shows a clear empty state when there are no referred leads yet", () => {
    const section = src.slice(src.indexOf("function ReferredLeadsSummary"), src.indexOf("const COMMERCIAL_TIER_BADGE_CLASS"));
    expect(section).toMatch(/No referred opportunities yet/);
  });

  it("is only rendered on the page when a LeadPartner row actually exists for this property", () => {
    expect(src).toMatch(/\{leadPartner && \(\s*<ReferredLeadsSummary/);
  });
});
