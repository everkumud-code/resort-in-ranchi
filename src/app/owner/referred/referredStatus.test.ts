import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const actionsSrc = read("src/app/owner/referred/actions.ts");
const pageSrc = read("src/app/owner/referred/page.tsx");

describe("PHASE 7 — updatePartnerLeadStatus never touches the source Enquiry", () => {
  it("only ever writes to partnerLead, never to enquiry", () => {
    expect(actionsSrc).toMatch(/prisma\.partnerLead\.updateMany/);
    expect(actionsSrc).not.toMatch(/prisma\.enquiry\.update/);
  });

  it("only updates status and statusUpdatedAt fields, never any Enquiry-owned field", () => {
    const updateCall = actionsSrc.slice(actionsSrc.indexOf("prisma.partnerLead.updateMany"), actionsSrc.indexOf("prisma.partnerLead.updateMany") + 300);
    expect(updateCall).toMatch(/data:\s*\{\s*status,\s*statusUpdatedAt:\s*new Date\(\)\s*\}/);
  });
});

describe("PHASE 7 — updatePartnerLeadStatus is strictly scoped to the signed-in owner's own partner", () => {
  it("resolves propertyId only from the authenticated owner session, never from a form field", () => {
    expect(actionsSrc).toMatch(/getOwnerAccessPropertyId\(\)/);
  });

  it("looks up the partner by that session's own propertyId first, then only matches a lead by that exact partnerId", () => {
    expect(actionsSrc).toMatch(/prisma\.leadPartner\.findUnique\(\{ where: \{ propertyId \}/);
    const updateCall = actionsSrc.slice(actionsSrc.indexOf("prisma.partnerLead.updateMany"));
    expect(updateCall).toMatch(/where:\s*\{\s*id:\s*leadId,\s*partnerId:\s*partner\.id\s*\}/);
  });

  it("verifies the conditional update actually matched exactly one row before treating it as a success", () => {
    expect(actionsSrc).toMatch(/updated\.count !== 1/);
  });
});

describe("PHASE 7 — validates status against the real enum before writing", () => {
  it("rejects any value isValidPartnerLeadStatus doesn't recognize", () => {
    expect(actionsSrc).toMatch(/isValidPartnerLeadStatus\(status\)/);
  });
});

describe("PHASE 7 — owner referred page shows full lead detail and a status control", () => {
  it("shows the same real enquiry fields a partner is entitled to (contact, event, budget, requirement)", () => {
    expect(pageSrc).toMatch(/sourceEnquiry\.phone/);
    expect(pageSrc).toMatch(/sourceEnquiry\.email/);
    expect(pageSrc).toMatch(/sourceEnquiry\.eventDate/);
    expect(pageSrc).toMatch(/sourceEnquiry\.guests/);
    expect(pageSrc).toMatch(/sourceEnquiry\.budget/);
    expect(pageSrc).toMatch(/sourceEnquiry\.requirement/);
  });

  it("shows the category/use case the lead came from", () => {
    expect(pageSrc).toMatch(/category:\s*\{\s*select:\s*\{\s*name:\s*true\s*\}\s*\}/);
  });

  it("renders the status select control, wired to this lead's own id", () => {
    expect(pageSrc).toMatch(/<PartnerLeadStatusSelect leadId=\{lead\.id\} status=\{lead\.status\} \/>/);
  });
});
