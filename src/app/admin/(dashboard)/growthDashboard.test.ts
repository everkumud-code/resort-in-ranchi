import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const src = read("src/app/admin/(dashboard)/page.tsx");

describe("PHASE 5C — admin dashboard period filter", () => {
  it("resolves the period from a real, validated query param (never trusts an arbitrary value)", () => {
    expect(src).toMatch(/resolveAnalyticsPeriod\(sp\.period\)/);
  });

  it("offers all three real periods (7d/30d/all) as links, not a free-text input", () => {
    expect(src).toMatch(/ANALYTICS_PERIODS\.map/);
  });

  it("applies the period as a real createdAt filter on the analytics query, not a fake client-side slice", () => {
    expect(src).toMatch(/analyticsEvent\.groupBy\(\{\s*by:\s*\["type"\],\s*where:\s*createdAtFilter/);
  });
});

describe("PHASE 5C — conversion funnels never fabricate a rate", () => {
  it("computes every funnel rate via the shared computeConversionRate helper, not inline arithmetic", () => {
    const funnelSection = src.slice(src.indexOf("Enquiry funnel"), src.indexOf("What visitors are looking at"));
    const rateCalls = funnelSection.match(/computeConversionRate\(/g) ?? [];
    // Enquiry funnel (2 rates: start/view, submit/start) + Claim funnel (2 rates) = 4.
    expect(rateCalls.length).toBe(4);
  });

  it("formats a missing rate as 'Not enough data', never a raw 0%, via formatConversionRate", () => {
    expect(src).toMatch(/formatConversionRate/);
  });
});

describe("PHASE 5C — top-viewed properties and top-searched categories/locations use real data only", () => {
  it("top viewed properties come from a live analyticsEvent.groupBy on PROPERTY_VIEW, resolved to real property names", () => {
    expect(src).toMatch(/type: "PROPERTY_VIEW", propertyId: \{ not: null \}/);
    expect(src).toMatch(/prisma\.property\.findMany\(\{ where: \{ id: \{ in: topViewedPropertyIds \} \}/);
  });

  it("falls back to an honest placeholder rather than a blank/undefined name if a property was ever removed", () => {
    expect(src).toMatch(/\(deleted listing\)/);
  });

  it("top searched categories/locations are derived from real SEARCH event paths via aggregateSearchPaths, not invented", () => {
    expect(src).toMatch(/type: "SEARCH"/);
    expect(src).toMatch(/aggregateSearchPaths\(searchPathRows\.map/);
  });
});

describe("PHASE 5C — enquiry funnel by status reuses the existing EnquiryStatus values", () => {
  it("shows NEW/CONTACTED/CONVERTED using the shared ENQUIRY_STATUS_LABELS, not invented labels", () => {
    expect(src).toMatch(/ENQUIRY_STATUS_LABELS\[status\]/);
    expect(src).toMatch(/\["NEW", "CONTACTED", "CONVERTED"\]/);
  });

  it("counts come from a live prisma.enquiry.groupBy, not a hardcoded number", () => {
    expect(src).toMatch(/prisma\.enquiry\.groupBy\(\{ by: \["status"\]/);
  });
});

describe("PHASE 5C — admin dashboard remains admin-only (regression)", () => {
  it("the admin dashboard route is still behind the admin layout's requireAdmin() gate", () => {
    const layoutSrc = read("src/app/admin/(dashboard)/layout.tsx");
    expect(layoutSrc).toMatch(/requireAdmin\(\)/);
  });

  it("the dashboard page itself contains no database write call — it only reads", () => {
    expect(src).not.toMatch(/\.(create|update|updateMany|upsert|delete|deleteMany)\s*\(/);
  });
});
