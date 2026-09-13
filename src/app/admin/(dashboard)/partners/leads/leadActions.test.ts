import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const actionsSrc = read("src/app/admin/(dashboard)/partners/leads/actions.ts");
const pageSrc = read("src/app/admin/(dashboard)/partners/leads/page.tsx");

describe("PHASE 8 — resend/reassign are admin-only", () => {
  it("both reassignPartnerLead and resendPartnerLead require the owner-access-managing admin role", () => {
    const reassignFn = actionsSrc.slice(actionsSrc.indexOf("export async function reassignPartnerLead"), actionsSrc.indexOf("export async function resendPartnerLead"));
    const resendFn = actionsSrc.slice(actionsSrc.indexOf("export async function resendPartnerLead"));
    expect(reassignFn).toMatch(/requireOwnerAccessAdmin\(\)/);
    expect(resendFn).toMatch(/requireOwnerAccessAdmin\(\)/);
  });

  it("the leads page only renders the resend/reassign controls for a role that may manage owner access", () => {
    expect(pageSrc).toMatch(/canManageOwnerAccess\(admin\.role\)/);
    expect(pageSrc).toMatch(/\{mayManage && \(/);
  });
});

describe("PHASE 8 — reassignment never touches the source Enquiry", () => {
  it("reassignPartnerLead only ever writes to partnerLead, never to enquiry", () => {
    const fn = actionsSrc.slice(actionsSrc.indexOf("export async function reassignPartnerLead"), actionsSrc.indexOf("export async function resendPartnerLead"));
    expect(fn).toMatch(/prisma\.partnerLead\.update/);
    expect(fn).not.toMatch(/prisma\.enquiry\.update/);
  });

  it("resendPartnerLead only updates deliveryStatus/lastDeliveredAt, never partnerId or status", () => {
    const fn = actionsSrc.slice(actionsSrc.indexOf("export async function resendPartnerLead"));
    const updateCall = fn.slice(fn.indexOf("prisma.partnerLead.update"), fn.indexOf("prisma.partnerLead.update") + 200);
    expect(updateCall).toMatch(/data:\s*\{\s*deliveryStatus:\s*"DELIVERED",\s*lastDeliveredAt:\s*new Date\(\)\s*\}/);
    expect(updateCall).not.toMatch(/partnerId/);
    expect(updateCall).not.toMatch(/status:/);
  });
});

describe("PHASE 8 — reassignment target must be genuinely, freshly eligible", () => {
  it("re-evaluates eligibility via the same shared getEligiblePartnersForProperty function used by the public enquiry flow", () => {
    const fn = actionsSrc.slice(actionsSrc.indexOf("export async function reassignPartnerLead"), actionsSrc.indexOf("export async function resendPartnerLead"));
    expect(fn).toMatch(/getEligiblePartnersForProperty\(/);
    expect(fn).toMatch(/eligible\.find\(\(\{ partner \}\) => partner\.id === newPartnerId\)/);
  });

  it("rejects reassigning to a partner the eligibility check doesn't return, with a clear error", () => {
    const fn = actionsSrc.slice(actionsSrc.indexOf("export async function reassignPartnerLead"), actionsSrc.indexOf("export async function resendPartnerLead"));
    expect(fn).toMatch(/if \(!match\)/);
  });

  it("uses the enquiry's real guest count for capacity matching, not an unknown/optimistic one", () => {
    const fn = actionsSrc.slice(actionsSrc.indexOf("export async function reassignPartnerLead"), actionsSrc.indexOf("export async function resendPartnerLead"));
    expect(fn).toMatch(/guests:\s*lead\.sourceEnquiry\.guests/);
  });
});

describe("PHASE 8 — reassignment prevents duplicate delivery", () => {
  it("rejects reassigning onto the lead's current partner", () => {
    const fn = actionsSrc.slice(actionsSrc.indexOf("export async function reassignPartnerLead"), actionsSrc.indexOf("export async function resendPartnerLead"));
    expect(fn).toMatch(/newPartnerId === lead\.partnerId/);
  });

  it("catches the database's own unique-constraint error as a second line of defence against a partner already having a separate lead for this enquiry", () => {
    const fn = actionsSrc.slice(actionsSrc.indexOf("export async function reassignPartnerLead"), actionsSrc.indexOf("export async function resendPartnerLead"));
    expect(fn).toMatch(/error\.code === "P2002"/);
  });

  it("regenerates the eligibility reason for the new partner rather than keeping the stale one from the old assignment", () => {
    const fn = actionsSrc.slice(actionsSrc.indexOf("export async function reassignPartnerLead"), actionsSrc.indexOf("export async function resendPartnerLead"));
    expect(fn).toMatch(/eligibilityReason:\s*match\.reason/);
  });

  it("resets the partner's own status tracking to NEW on reassignment, since it's now a different partner's job", () => {
    const fn = actionsSrc.slice(actionsSrc.indexOf("export async function reassignPartnerLead"), actionsSrc.indexOf("export async function resendPartnerLead"));
    expect(fn).toMatch(/status:\s*"NEW"/);
    expect(fn).toMatch(/statusUpdatedAt:\s*null/);
  });
});
