import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const actionsSrc = read("src/app/admin/(dashboard)/submissions/actions.ts");
const pageSrc = read("src/app/admin/(dashboard)/submissions/page.tsx");

describe("PHASE 6 — submissions review is admin-only", () => {
  it("the page requires an authenticated admin", () => {
    expect(pageSrc).toMatch(/requireAdmin\(\)/);
  });

  it("approveSubmission and rejectSubmission both require the owner-access-managing admin role", () => {
    const approveFn = actionsSrc.slice(actionsSrc.indexOf("export async function approveSubmission"), actionsSrc.indexOf("export async function rejectSubmission"));
    const rejectFn = actionsSrc.slice(actionsSrc.indexOf("export async function rejectSubmission"));
    expect(approveFn).toMatch(/requireOwnerAccessAdmin\(\)/);
    expect(rejectFn).toMatch(/requireOwnerAccessAdmin\(\)/);
  });
});

describe("PHASE 6 — approving a submission reuses the claim/owner-access architecture", () => {
  it("creates a Property, a ClaimRequest, and a PropertyOwnerAccess inside one transaction — no parallel access mechanism", () => {
    const txBody = actionsSrc.slice(actionsSrc.indexOf("prisma.$transaction"), actionsSrc.indexOf("revalidatePath(\"/admin/submissions\")"));
    expect(txBody).toMatch(/tx\.property\.create/);
    expect(txBody).toMatch(/tx\.claimRequest\.create/);
    expect(txBody).toMatch(/tx\.propertyOwnerAccess\.create/);
  });

  it("builds the Property via buildPropertyCreateDataFromSubmission, never inline field-by-field — keeps the DISCOVERED/never-VERIFIED guarantee in one place", () => {
    expect(actionsSrc).toMatch(/buildPropertyCreateDataFromSubmission\(submission, slug\)/);
  });

  it("generates the slug via the shared uniqueSlug helper, never a raw/unchecked slug", () => {
    expect(actionsSrc).toMatch(/uniqueSlug\(submission\.name,/);
  });

  it("marks the source submission APPROVED and links it to the created property, only via a conditional updateMany (safe against a second concurrent approval)", () => {
    expect(actionsSrc).toMatch(/tx\.propertySubmission\.updateMany\(\{\s*where:\s*\{\s*id:\s*submissionId,\s*status:\s*"PENDING"\s*\}/);
    expect(actionsSrc).toMatch(/approvedPropertyId:\s*property\.id/);
  });

  it("never sets verificationStatus directly in the action — that stays inside buildPropertyCreateDataFromSubmission's own DISCOVERED-only guarantee", () => {
    expect(actionsSrc).not.toMatch(/verificationStatus:\s*"VERIFIED"/);
    expect(actionsSrc).not.toMatch(/verificationStatus:\s*"OWNER_VERIFIED"/);
  });

  it("the one-time owner access link is returned only in the action's response, never embedded in a revalidated admin path", () => {
    const revalidateLines = actionsSrc.match(/revalidatePath\([^)]*\)/g) ?? [];
    for (const line of revalidateLines) {
      expect(line).not.toMatch(/token/);
    }
  });
});

describe("PHASE 6 — rejecting a submission never creates a Property", () => {
  it("rejectSubmission only updates the PropertySubmission row", () => {
    const rejectFn = actionsSrc.slice(actionsSrc.indexOf("export async function rejectSubmission"));
    expect(rejectFn).toMatch(/prisma\.propertySubmission\.update\(/);
    expect(rejectFn).not.toMatch(/prisma\.property\.create/);
  });

  it("only ever transitions a PENDING submission (guards against re-rejecting an already-decided one)", () => {
    const rejectFn = actionsSrc.slice(actionsSrc.indexOf("export async function rejectSubmission"));
    expect(rejectFn).toMatch(/submission\.status !== "PENDING"/);
  });
});
