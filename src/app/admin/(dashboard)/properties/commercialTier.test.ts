import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const actionsSrc = read("src/app/admin/(dashboard)/properties/lifecycleActions.ts");
const detailPageSrc = read("src/app/admin/(dashboard)/properties/[id]/page.tsx");

describe("PHASE 9 — setCommercialTier is a deliberate, separate, admin-only action", () => {
  it("requires an authenticated admin", () => {
    const fn = actionsSrc.slice(actionsSrc.indexOf("export async function setCommercialTier"), actionsSrc.indexOf("export interface PublishState"));
    expect(fn).toMatch(/requireAdmin\(\)/);
  });

  it("validates the submitted tier against the real enum before writing, never trusting raw input", () => {
    const fn = actionsSrc.slice(actionsSrc.indexOf("export async function setCommercialTier"), actionsSrc.indexOf("export interface PublishState"));
    expect(fn).toMatch(/isValidCommercialTier\(tier\)/);
  });

  it("only ever writes commercialTier — never bundles in status/verificationStatus/featured", () => {
    const fn = actionsSrc.slice(actionsSrc.indexOf("export async function setCommercialTier"), actionsSrc.indexOf("export interface PublishState"));
    const updateCall = fn.slice(fn.indexOf("prisma.property.update"), fn.indexOf("prisma.property.update") + 150);
    expect(updateCall).toMatch(/data:\s*\{\s*commercialTier:\s*tier\s*\}/);
  });

  it("no other lifecycle action (publish/unpublish/verify/close/needs-review) ever touches commercialTier — nothing sets it automatically", () => {
    // Sliced up to the interface declaration (not the function itself) so the
    // setCommercialTier doc comment — which legitimately mentions
    // "commercialTier" while explaining this very guarantee — isn't
    // mistaken for a violation of it.
    const otherActions = actionsSrc.slice(0, actionsSrc.indexOf("export interface SetCommercialTierState"));
    const rest = actionsSrc.slice(actionsSrc.indexOf("export interface PublishState"));
    expect(otherActions).not.toMatch(/commercialTier/);
    expect(rest).not.toMatch(/commercialTier/);
  });
});

describe("PHASE 9 — the property detail page surfaces commercial status clearly, independent of featured/lead-partner facts", () => {
  it("shows the CommercialTierBadge and the editable select", () => {
    expect(detailPageSrc).toMatch(/<CommercialTierBadge commercialTier={property\.commercialTier}/);
    expect(detailPageSrc).toMatch(/<CommercialTierSelect propertyId={property\.id} commercialTier={property\.commercialTier}/);
  });

  it("also shows the real, independent featured and Lead Partner facts alongside it", () => {
    const panel = detailPageSrc.slice(detailPageSrc.indexOf("Commercial status"), detailPageSrc.indexOf("<PropertyEditForm"));
    expect(panel).toMatch(/property\.featured/);
    expect(panel).toMatch(/property\.leadPartner/);
  });
});
