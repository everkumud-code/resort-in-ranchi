import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const actionsSrc = read("src/app/admin/(dashboard)/partners/actions.ts");
const pageSrc = read("src/app/admin/(dashboard)/partners/page.tsx");

describe("PHASE 6 — lead partner configuration is admin-only", () => {
  it("the page requires an authenticated admin", () => {
    expect(pageSrc).toMatch(/requireAdmin\(\)/);
  });

  it("every mutating action requires the owner-access-managing admin role", () => {
    expect(actionsSrc.match(/requireOwnerAccessAdmin\(\)/g)?.length).toBeGreaterThanOrEqual(3);
  });
});

describe("PHASE 6 — a property can only ever be configured as one lead partner", () => {
  it("pre-checks for an existing LeadPartner row on the same property before creating a new one", () => {
    expect(actionsSrc).toMatch(/prisma\.leadPartner\.findUnique\(\{ where: \{ propertyId \}/);
  });

  it("also catches the database's own unique-constraint error as a second line of defence", () => {
    expect(actionsSrc).toMatch(/error\.code === "P2002"/);
  });
});

describe("PHASE 6/8 — eligible categories and locations are always re-validated against real tables", () => {
  it("the shared sanitizer re-validates both category and location slugs against their live tables, never trusting raw form input", () => {
    const fn = actionsSrc.slice(actionsSrc.indexOf("async function sanitizeEligibilitySlugs"), actionsSrc.indexOf("function parsePriorityAndCap"));
    expect(fn).toMatch(/prisma\.category\.findMany\(\{ where: \{ slug: \{ in: eligibleCategorySlugs \} \}/);
    expect(fn).toMatch(/prisma\.location\.findMany\(\{ where: \{ slug: \{ in: eligibleLocationSlugs \} \}/);
  });

  it("createLeadPartner and updatePartnerEligibility both go through that shared sanitizer", () => {
    const createFn = actionsSrc.slice(actionsSrc.indexOf("export async function createLeadPartner"), actionsSrc.indexOf("export interface UpdatePartnerEligibilityState"));
    const updateFn = actionsSrc.slice(actionsSrc.indexOf("export async function updatePartnerEligibility"), actionsSrc.indexOf("export async function setPartnerEnabled"));
    expect(createFn).toMatch(/sanitizeEligibilitySlugs\(formData\)/);
    expect(updateFn).toMatch(/sanitizeEligibilitySlugs\(formData\)/);
  });
});

describe("PHASE 6 — configuring a partner never touches the underlying property's own listing data", () => {
  it("no partner action ever calls prisma.property.update", () => {
    expect(actionsSrc).not.toMatch(/prisma\.property\.update/);
  });
});

describe("PHASE 6/7 — partner-lead activity is visible to admins, never exposed publicly", () => {
  it("the admin partners page summarizes lead counts by status and links to the full detail view", () => {
    expect(pageSrc).toMatch(/prisma\.partnerLead\.groupBy/);
    expect(pageSrc).toMatch(/href="\/admin\/partners\/leads"/);
  });

  it("is explicitly documented as admin-only, never shown on a public page", () => {
    expect(pageSrc).toMatch(/Never shown publicly/);
  });
});
