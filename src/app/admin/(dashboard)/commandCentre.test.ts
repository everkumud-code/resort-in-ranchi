import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const dashboardSrc = read("src/app/admin/(dashboard)/page.tsx");
const sectionBlocksSrc = read("src/components/admin/AdminSectionBlocks.tsx");
// Navigation to every section lives in the colorful block grid on the dashboard
// (AdminSectionBlocks) rather than a flat text nav in the layout — combine both
// sources when checking overall coverage.
const navSurface = `${dashboardSrc}\n${sectionBlocksSrc}`;

describe("PHASE 9 — admin command centre gives efficient access to every required area", () => {
  it("the nav includes Vendors alongside the existing Properties/Claims/Submissions/Partners/Enquiries", () => {
    expect(sectionBlocksSrc).toMatch(/href:\s*"\/admin\/vendors"/);
  });

  it("the dashboard quick links cover properties, submissions, claims, enquiries, partner leads, lead partners, vendors, and featured", () => {
    for (const href of [
      "/admin/properties",
      "/admin/submissions",
      "/admin/claims",
      "/admin/enquiries",
      "/admin/partners/leads",
      "/admin/partners",
      "/admin/vendors",
      "/admin/properties?featured=true",
    ]) {
      expect(navSurface).toMatch(new RegExp(`href[:=]\\s*"${href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
    }
  });

  it("shows a real, live-counted breakdown of vendor commercial tiers linking to the vendors page", () => {
    expect(dashboardSrc).toMatch(/prisma\.property\.groupBy\(\{ by: \["commercialTier"\]/);
    expect(dashboardSrc).toMatch(/href={`\/admin\/vendors\?tier=\$\{tier\}`}/);
  });

  it("shows real lead-marketplace counts (configured partners, total partner leads) from live queries", () => {
    expect(dashboardSrc).toMatch(/prisma\.leadPartner\.count\(\)/);
    expect(dashboardSrc).toMatch(/prisma\.partnerLead\.count\(\)/);
  });
});
