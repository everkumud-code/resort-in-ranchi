import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("plan enforcement is shared and server-side", () => {
  const planLib = read("src/lib/propertyPlan.ts");
  const adminActions = read("src/app/admin/(dashboard)/properties/planActions.ts");
  const ownerActions = read("src/app/owner/listing/[id]/actions.ts");

  it("both the admin and the vendor save extra categories through the same plan-checked helper", () => {
    expect(planLib).toMatch(/checkExtraCategories\(/);
    expect(adminActions).toMatch(/saveExtraCategoriesForProperty\(/);
    expect(ownerActions).toMatch(/saveExtraCategoriesForProperty\(/);
  });

  it("sponsored placement can only be saved by an admin, and is checked against the plan", () => {
    expect(planLib).toMatch(/checkPlacementScope\(/);
    expect(adminActions).toMatch(/requireAdmin\(\)/);
    expect(ownerActions).not.toMatch(/saveSponsoredPlacementForProperty|SponsoredPlacement/);
  });

  it("the vendor action derives the property from the owner session, never from the form", () => {
    const fn = ownerActions.slice(ownerActions.indexOf("export async function saveOwnerExtraCategories"));
    expect(fn.slice(0, 400)).toMatch(/await assertOwnerAccess\(propertyId\)/);
  });
});
