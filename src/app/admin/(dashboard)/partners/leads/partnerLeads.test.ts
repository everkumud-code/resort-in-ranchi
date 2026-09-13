import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const src = read("src/app/admin/(dashboard)/partners/leads/page.tsx");

describe("PHASE 7 — admin partner-leads view is admin-only and read-only", () => {
  it("requires an authenticated admin", () => {
    expect(src).toMatch(/requireAdmin\(\)/);
  });

  it("never mutates any PartnerLead/Enquiry data from this view — it's an oversight page, not a status-setting one", () => {
    expect(src).not.toMatch(/prisma\.\w+\.(update|updateMany|create|createMany|delete|deleteMany)\(/);
  });
});

describe("PHASE 7 — admin partner-leads view shows every field a useful admin view needs", () => {
  it("shows the original property, the partner, and the category/use case", () => {
    expect(src).toMatch(/lead\.partner\.property\.name/);
    expect(src).toMatch(/lead\.sourceEnquiry\.property\.name/);
    expect(src).toMatch(/lead\.sourceEnquiry\.property\.category\.name/);
  });

  it("shows the full enquiry contact and event detail available to the platform", () => {
    expect(src).toMatch(/lead\.sourceEnquiry\.name/);
    expect(src).toMatch(/lead\.sourceEnquiry\.phone/);
    expect(src).toMatch(/lead\.sourceEnquiry\.email/);
    expect(src).toMatch(/lead\.sourceEnquiry\.eventDate/);
    expect(src).toMatch(/lead\.sourceEnquiry\.guests/);
    expect(src).toMatch(/lead\.sourceEnquiry\.budget/);
    expect(src).toMatch(/lead\.sourceEnquiry\.requirement/);
  });

  it("shows created time, delivery status, and the partner's own response/status", () => {
    expect(src).toMatch(/lead\.createdAt\.toLocaleString/);
    expect(src).toMatch(/lead\.deliveryStatus/);
    expect(src).toMatch(/PARTNER_LEAD_STATUS_LABELS\[lead\.status\]/);
  });

  it("supports filtering by the partner's status, using only the real validated enum values", () => {
    expect(src).toMatch(/isValidPartnerLeadStatus\(status\)/);
    expect(src).toMatch(/PARTNER_LEAD_STATUS_VALUES\.map/);
  });
});
