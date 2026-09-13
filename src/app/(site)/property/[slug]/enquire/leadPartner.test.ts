import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const actionSrc = read("src/app/(site)/property/[slug]/enquire/actions.ts");
const pageSrc = read("src/app/(site)/property/[slug]/enquire/page.tsx");
const formSrc = read("src/app/(site)/property/[slug]/enquire/EnquiryForm.tsx");

describe("PHASE 6 — enquiry action never mutates the original Enquiry when creating partner leads", () => {
  it("never calls enquiry.update or enquiry.updateMany anywhere in the action", () => {
    expect(actionSrc).not.toMatch(/enquiry\.update/);
  });

  it("creates the Enquiry row before computing partner eligibility, and PartnerLead rows reference that same enquiry's id", () => {
    const enquiryCreateIndex = actionSrc.indexOf("prisma.enquiry.create(");
    const eligiblePartnersIndex = actionSrc.indexOf("getEligiblePartnersForProperty(");
    const partnerLeadCreateIndex = actionSrc.indexOf("prisma.partnerLead.createMany(");
    expect(enquiryCreateIndex).toBeGreaterThan(-1);
    expect(eligiblePartnersIndex).toBeGreaterThan(enquiryCreateIndex);
    expect(partnerLeadCreateIndex).toBeGreaterThan(eligiblePartnersIndex);
    expect(actionSrc).toMatch(/sourceEnquiryId:\s*enquiry\.id/);
  });

  it("never sends any enquiry PII (name/phone/email) to trackEvent — analytics stay PII-free", () => {
    const trackEventCall = actionSrc.slice(actionSrc.indexOf("trackEvent({"), actionSrc.indexOf("trackEvent({") + 200);
    expect(trackEventCall).not.toMatch(/parsed\.data\.(name|phone|email)/);
  });
});

describe("PHASE 6 — enquire page/action share one eligibility source of truth", () => {
  it("both the page (for disclosure) and the action (for actually creating leads) call the same getEligiblePartnersForProperty function", () => {
    expect(pageSrc).toMatch(/getEligiblePartnersForProperty\(/);
    expect(actionSrc).toMatch(/getEligiblePartnersForProperty\(/);
    expect(pageSrc).toMatch(/from "@\/lib\/leadPartner"/);
    expect(actionSrc).toMatch(/from "@\/lib\/leadPartner"/);
  });

  it("the page only creates a PartnerLead-affecting disclosure boolean, never writes to the database itself", () => {
    expect(pageSrc).not.toMatch(/prisma\.partnerLead/);
  });
});

describe("PHASE 6 — partner-sharing disclosure is conditional, never a blanket claim either way", () => {
  it("page copy branches on mayBeSharedWithPartner rather than always claiming one thing", () => {
    expect(pageSrc).toMatch(/mayBeSharedWithPartner\s*\?/);
  });

  it("form footnote also branches on the same prop, so the two disclosures can't contradict each other", () => {
    expect(formSrc).toMatch(/mayBeSharedWithPartner\s*&&/);
  });
});

describe("PHASE 7 — duplicate PartnerLead protection", () => {
  it("createMany uses skipDuplicates, backed by the DB-level (partnerId, sourceEnquiryId) unique constraint", () => {
    const createCall = actionSrc.slice(actionSrc.indexOf("prisma.partnerLead.createMany("), actionSrc.indexOf("prisma.partnerLead.createMany(") + 300);
    expect(createCall).toMatch(/skipDuplicates:\s*true/);
  });

  it("the schema enforces one PartnerLead per (partner, enquiry) pair at the database level, not just in application code", () => {
    const schemaSrc = read("prisma/schema.prisma");
    expect(schemaSrc).toMatch(/@@unique\(\[partnerId, sourceEnquiryId\]\)/);
  });
});

describe("PHASE 8 — location and guest-capacity matching feed the real eligibility check", () => {
  it("the action passes the enquired property's own locality and the visitor's real submitted guest count", () => {
    const callSite = actionSrc.slice(actionSrc.indexOf("getEligiblePartnersForProperty({"), actionSrc.indexOf("getEligiblePartnersForProperty({") + 300);
    expect(callSite).toMatch(/localitySlug:\s*property\.locality\?\.slug\s*\?\?\s*null/);
    expect(callSite).toMatch(/guests:\s*parsed\.data\.guests/);
  });

  it("the page passes the same property locality but omits guests — unknown at render time, never guessed", () => {
    const callSite = pageSrc.slice(pageSrc.indexOf("getEligiblePartnersForProperty({"), pageSrc.indexOf("getEligiblePartnersForProperty({") + 300);
    expect(callSite).toMatch(/localitySlug:\s*property\.locality\?\.slug\s*\?\?\s*null/);
    expect(callSite).not.toMatch(/guests/);
  });

  it("both select the property's locality slug alongside its category, so the check has real data to work with", () => {
    expect(actionSrc).toMatch(/locality:\s*\{\s*select:\s*\{\s*slug:\s*true\s*\}\s*\}/);
    expect(pageSrc).toMatch(/locality:\s*\{\s*select:\s*\{\s*slug:\s*true\s*\}\s*\}/);
  });
});

describe("PHASE 8 — every created PartnerLead records why it was eligible", () => {
  it("createMany stores the reason returned by the eligibility check, not a hardcoded or omitted value", () => {
    const createCall = actionSrc.slice(actionSrc.indexOf("prisma.partnerLead.createMany("), actionSrc.indexOf("prisma.partnerLead.createMany(") + 400);
    expect(createCall).toMatch(/eligibilityReason:\s*reason/);
    expect(createCall).toMatch(/eligiblePartners\.map\(\(\{ partner, reason \}\)/);
  });
});
