import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("owner dashboard home (/owner)", () => {
  const src = read("src/app/owner/page.tsx");

  it("resolves the property from the authenticated owner session, never from a URL/search param", () => {
    expect(src).toMatch(/getOwnerAccessPropertyId\(\)/);
    // The property lookup is keyed by the session-derived propertyId, not by
    // any value read out of searchParams.
    expect(src).toMatch(/where:\s*{\s*id:\s*propertyId/);
  });

  it("reuses the existing public TrustBadge/lifecycle labels instead of inventing new trust wording", () => {
    expect(src).toMatch(/from "@\/components\/site\/TrustBadge"/);
  });

  it("links to the public listing using the property's own slug from the authenticated record, not a client-supplied slug", () => {
    expect(src).toMatch(/\/property\/\$\{property\.slug\}/);
  });

  it("provides a sign-out control wired to the real logout action", () => {
    expect(src).toMatch(/logoutOwner/);
  });

  it("never shows fabricated statistics — enquiry counts come from a live prisma.enquiry.count scoped to propertyId", () => {
    expect(src).toMatch(/prisma\.enquiry\.count\(\{\s*where:\s*{\s*propertyId\s*}\s*\}\)/);
    expect(src).toMatch(/prisma\.enquiry\.count\(\{\s*where:\s*{\s*propertyId,\s*status:\s*"NEW"\s*}\s*\}\)/);
  });
});

describe("owner logout", () => {
  const src = read("src/app/owner/actions.ts");

  it("destroys the session row server-side, not just the cookie — a leaked cookie value stops working immediately", () => {
    expect(src).toMatch(/destroyOwnerSessionByToken/);
  });

  it("clears the owner_session cookie", () => {
    expect(src).toMatch(/OWNER_SESSION_COOKIE_NAME/);
    expect(src).toMatch(/delete\(/);
  });

  it("destroyOwnerSessionByToken removes the PropertyOwnerSession row scoped to that token's hash only", () => {
    const authSrc = read("src/lib/auth/ownerAccess.ts");
    expect(authSrc).toMatch(/export async function destroyOwnerSessionByToken/);
    expect(authSrc).toMatch(/propertyOwnerSession\.deleteMany\(\{ where: \{ tokenHash: hashToken\(token\) \} \}\)/);
  });
});

describe("owner enquiries (/owner/enquiries) — scoped strictly to the authenticated property", () => {
  const src = read("src/app/owner/enquiries/page.tsx");

  it("requires owner authentication and redirects unauthenticated visitors away", () => {
    expect(src).toMatch(/getOwnerAccessPropertyId\(\)/);
    expect(src).toMatch(/redirect\("\/owner"\)/);
  });

  it("queries enquiries always scoped to the session-derived propertyId, whether or not a status filter is applied", () => {
    expect(src).toMatch(/where: validStatus \? \{ propertyId, status: validStatus[^}]*\} : \{ propertyId \}/);
  });

  it("PHASE 4 — the status filter narrows within the property, but can never widen scope to another property (no propertyId is ever read from searchParams)", () => {
    expect(src).not.toMatch(/searchParams\.propertyId/);
    expect(src).not.toMatch(/sp\.propertyId/);
    // The only searchParams field this page reads is `status`.
    const searchParamsInterface = src.slice(src.indexOf("interface PageSearchParams"), src.indexOf("interface PageSearchParams") + 100);
    expect(searchParamsInterface).toMatch(/status\?:\s*string/);
    expect(searchParamsInterface).not.toMatch(/propertyId/);
  });

  it("takes no route params (no dynamic [id]/[slug] segment) — the only params object is searchParams for the status filter", () => {
    expect(src).not.toMatch(/params:\s*Promise<\{/);
  });

  it("PHASE 4 — validates the status filter against the real ENQUIRY_STATUS_VALUES enum before using it, never trusting an arbitrary query value", () => {
    expect(src).toMatch(/ENQUIRY_STATUS_VALUES\.includes\(status as/);
  });

  it("never renders another property's name/id — only the single property resolved from the session", () => {
    expect(src).toMatch(/prisma\.property\.findUnique\(\{\s*where:\s*{\s*id:\s*propertyId\s*}/);
  });

  it("shows an honest empty state rather than fabricated data", () => {
    expect(src).toMatch(/No enquiries yet\./);
  });

  it("does not expose an enquiry status-change control to owners in this MVP", () => {
    expect(src).not.toMatch(/updateEnquiryStatus/);
    expect(src).not.toMatch(/<select/);
  });
});

describe("owner image (photo) management — scoped to the authenticated property, ILLUSTRATIVE never owner-writable", () => {
  const actionsSrc = read("src/app/owner/listing/[id]/actions.ts");

  it("every owner action asserts owner access for the given propertyId before touching data", () => {
    expect(actionsSrc).toMatch(/async function assertOwnerAccess\(propertyId: string\)/);
    expect(actionsSrc).toMatch(/requireOwnerAccessForProperty\(propertyId\)/);
  });

  it("addOwnerImage calls assertOwnerAccess before creating an image", () => {
    const fn = actionsSrc.slice(actionsSrc.indexOf("export async function addOwnerImage"));
    expect(fn.slice(0, fn.indexOf("await prisma.propertyImage.create"))).toMatch(/assertOwnerAccess\(propertyId\)/);
  });

  it("addOwnerImage never trusts an ILLUSTRATIVE kind from client input — the kind can only ever resolve to LOGO or PHOTO, regardless of what the client submits", () => {
    const fn = actionsSrc.slice(
      actionsSrc.indexOf("export async function addOwnerImage"),
      actionsSrc.indexOf("export async function deleteOwnerImage")
    );
    expect(fn).toMatch(/requestedKind === "LOGO" \? "LOGO" : "PHOTO"/);
    // The only place `kind` is assigned is that ternary — there is no branch
    // that ever assigns it the client-submitted value directly.
    expect(fn).not.toMatch(/kind\s*=\s*requestedKind(?!\s*===)/);
    expect(fn).not.toMatch(/kind:\s*requestedKind/);
  });

  it("deleteOwnerImage scopes its delete to both the image id AND the caller's own propertyId, so an owner can't delete another property's image by guessing its id", () => {
    const fn = actionsSrc.slice(actionsSrc.indexOf("export async function deleteOwnerImage"));
    expect(fn).toMatch(/assertOwnerAccess\(propertyId\)/);
    expect(fn).toMatch(/propertyImage\.deleteMany\(\{ where: \{ id: imageId, propertyId \} \}\)/);
  });

  it("the dashboard exposes photo management via the existing owner-image architecture rather than a new upload system", () => {
    const dashboardSrc = read("src/app/owner/page.tsx");
    expect(dashboardSrc).toMatch(/#photos/);
  });
});

describe("no client-submitted propertyId is ever trusted for an owner write", () => {
  it("every owner Server Action takes propertyId as its own bound first argument (from the authenticated page), never reads formData.get(\"propertyId\")", () => {
    const actionsSrc = read("src/app/owner/listing/[id]/actions.ts");
    expect(actionsSrc).not.toMatch(/formData\.get\(\s*["']propertyId["']\s*\)/);
  });
});

describe("owner listing editor — facilities/venue-space scoping (Phase 3C)", () => {
  const actionsSrc = read("src/app/owner/listing/[id]/actions.ts");

  it("updateOwnerFacilities asserts owner access before writing, and scopes both the delete and the create to propertyId", () => {
    const fn = actionsSrc.slice(
      actionsSrc.indexOf("export async function updateOwnerFacilities"),
      actionsSrc.indexOf("export async function addOwnerVenueSpace")
    );
    expect(fn).toMatch(/assertOwnerAccess\(propertyId\)/);
    expect(fn).toMatch(/propertyFacility\.deleteMany\(\{ where: \{ propertyId \} \}\)/);
    expect(fn).toMatch(/data: validIds\.map\(\(facilityId\) => \(\{ propertyId, facilityId \}\)\)/);
  });

  it("addOwnerVenueSpace asserts owner access and creates the venue space scoped to propertyId", () => {
    const fn = actionsSrc.slice(
      actionsSrc.indexOf("export async function addOwnerVenueSpace"),
      actionsSrc.indexOf("export async function deleteOwnerVenueSpace")
    );
    expect(fn).toMatch(/assertOwnerAccess\(propertyId\)/);
    expect(fn).toMatch(/venueSpace\.create\(\{ data: \{ propertyId, \.\.\.buildVenueSpaceData\(parsed\.data\) \} \}\)/);
  });

  it("deleteOwnerVenueSpace scopes its delete to both the venue-space id AND propertyId, so an owner can't delete another property's venue space by guessing its id", () => {
    const fn = actionsSrc.slice(
      actionsSrc.indexOf("export async function deleteOwnerVenueSpace"),
      actionsSrc.indexOf("/** Owner-uploaded images")
    );
    expect(fn).toMatch(/assertOwnerAccess\(propertyId\)/);
    expect(fn).toMatch(/venueSpace\.deleteMany\(\{ where: \{ id: venueSpaceId, propertyId \} \}\)/);
  });
});

describe("owner listing editor — save/update feedback (Phase 3C)", () => {
  const actionsSrc = read("src/app/owner/listing/[id]/actions.ts");

  it("OwnerActionState carries a success flag so forms can show explicit save confirmation, not just clear an error", () => {
    expect(actionsSrc).toMatch(/success\?:\s*boolean/);
  });

  it("every mutating owner action returns an explicit { success: true } on its happy path", () => {
    const successReturns = actionsSrc.match(/return \{ success: true \};/g) ?? [];
    // updateOwnerProperty, updateOwnerFacilities, addOwnerVenueSpace, addOwnerImage,
    // saveOwnerExtraCategories
    expect(successReturns.length).toBe(5);
  });

  it("updateOwnerFacilities now follows the useActionState shape (accepts prevState, returns OwnerActionState) like every other owner form action", () => {
    expect(actionsSrc).toMatch(
      /export async function updateOwnerFacilities\(\s*propertyId: string,\s*_prevState: OwnerActionState,\s*formData: FormData\s*\): Promise<OwnerActionState>/
    );
  });

  it("every owner mutation revalidates both the edit page and the dashboard, so Listing Quality reflects saved changes immediately", () => {
    expect(actionsSrc).toMatch(/function revalidateOwnerPaths\(propertyId: string\)/);
    expect(actionsSrc).toMatch(/revalidatePath\(`\/owner\/listing\/\$\{propertyId\}`\)/);
    expect(actionsSrc).toMatch(/revalidatePath\("\/owner"\)/);
    const calls = actionsSrc.match(/revalidateOwnerPaths\(propertyId\);/g) ?? [];
    // updateOwnerProperty, updateOwnerFacilities, addOwnerVenueSpace,
    // deleteOwnerVenueSpace, addOwnerImage, setOwnerHeroImage, setOwnerImageTag,
    // deleteOwnerImage, saveOwnerExtraCategories — every mutation.
    expect(calls.length).toBe(9);
  });

  it("on a validation failure, updateOwnerProperty echoes back exactly what was submitted so a re-render doesn't silently wipe other, valid fields", () => {
    const fn = actionsSrc.slice(
      actionsSrc.indexOf("export async function updateOwnerProperty"),
      actionsSrc.indexOf("export async function updateOwnerFacilities")
    );
    expect(fn).toMatch(/return \{ error: "Please fix the errors below\.", fieldErrors, values: rawValues \};/);
  });

  it("OwnerDetailsForm prefers the echoed submitted value over the last-saved property value when one was returned", () => {
    const src = read("src/app/owner/listing/[id]/OwnerDetailsForm.tsx");
    expect(src).toMatch(/function fieldValue\(/);
    expect(src).toMatch(/state\.values && name in state\.values/);
  });

  it("client forms render a distinct success message when state.success is true", () => {
    for (const file of [
      "src/app/owner/listing/[id]/OwnerDetailsForm.tsx",
      "src/app/owner/listing/[id]/OwnerFacilitiesForm.tsx",
      "src/app/owner/listing/[id]/OwnerVenueSpaces.tsx",
      "src/app/owner/listing/[id]/OwnerImages.tsx",
    ]) {
      const src = read(file);
      expect(src).toMatch(/state\.success/);
    }
  });
});

describe("PHASE 4 — owner dashboard shows the claim/verification lifecycle honestly", () => {
  const src = read("src/app/owner/page.tsx");

  it("computes the lifecycle from the real, current verificationStatus — never a hardcoded/assumed stage", () => {
    expect(src).toMatch(/computeOwnerLifecycleStages\(property\.verificationStatus\)/);
  });

  it("tells the owner Owner Verified is a separate team decision, matching the 'never auto-change on claim approval' rule", () => {
    expect(src).toMatch(/never\s+happens automatically/);
  });
});

describe("owner listing editor — section anchors match the dashboard's Listing Quality links (Phase 3C)", () => {
  it("every anchor the dashboard's checklist links to actually exists as a section id on the listing edit page", () => {
    const dashboardSrc = read("src/app/owner/page.tsx");
    const listingPageSrc = read("src/app/owner/listing/[id]/page.tsx");
    const detailsFormSrc = read("src/app/owner/listing/[id]/OwnerDetailsForm.tsx");

    // Scoped to the QUALITY_ITEM_ANCHOR object specifically — a whole-file
    // scan would false-positive on any unrelated `key: "lowercase-value"`
    // line (e.g. an icon prop like `fill: "none"`).
    const anchorMapSrc = dashboardSrc.match(/const QUALITY_ITEM_ANCHOR[^{]*\{([\s\S]*?)\n\};/)?.[1] ?? "";
    const anchorTargets = [...anchorMapSrc.matchAll(/^\s*\w+:\s*"([a-z-]+)",?$/gm)].map((m) => m[1]);
    expect(anchorTargets.length).toBeGreaterThan(0);

    for (const anchor of anchorTargets) {
      const idPattern = new RegExp(`id="${anchor}"`);
      const existsOnListingPage = idPattern.test(listingPageSrc);
      const existsInDetailsForm = idPattern.test(detailsFormSrc);
      expect(existsOnListingPage || existsInDetailsForm).toBe(true);
    }
  });

  it("Details/Contact/Pricing/Capacity are distinct anchors inside OwnerDetailsForm, not all collapsed into one section", () => {
    const src = read("src/app/owner/listing/[id]/OwnerDetailsForm.tsx");
    for (const id of ["details", "contact", "pricing", "capacity"]) {
      expect(src).toMatch(new RegExp(`id="${id}"`));
    }
  });
});

describe("PHASE 5C — owner Leads summary is scoped strictly to the authenticated property", () => {
  const src = read("src/app/owner/page.tsx");

  it("counts property views via a live analyticsEvent.count scoped to this property's own id only", () => {
    expect(src).toMatch(/prisma\.analyticsEvent\.count\(\{ where: \{ type: "PROPERTY_VIEW", propertyId \} \}\)/);
  });

  it("counts converted enquiries scoped to this property's own id only", () => {
    expect(src).toMatch(/prisma\.enquiry\.count\(\{ where: \{ propertyId, status: "CONVERTED" \} \}\)/);
  });

  it("never queries another property's analytics or enquiries — no propertyId is ever read from searchParams", () => {
    expect(src).not.toMatch(/searchParams\.propertyId/);
  });

  it("computes the conversion rate via the shared computeConversionRate/formatConversionRate helpers — never a fabricated percentage when there are no enquiries yet", () => {
    expect(src).toMatch(/computeConversionRate\(convertedCount, totalEnquiries\)/);
    expect(src).toMatch(/formatConversionRate\(conversionRate\)/);
  });

  it("renders the LeadsSummary card on the dashboard", () => {
    expect(src).toMatch(/<LeadsSummary viewCount=\{viewCount\} totalEnquiries=\{totalEnquiries\} convertedCount=\{convertedEnquiries\} \/>/);
  });
});
