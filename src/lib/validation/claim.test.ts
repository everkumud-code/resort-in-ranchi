import { describe, expect, it } from "vitest";
import {
  claimSubmissionSchema,
  buildClaimCreateData,
  buildClaimApprovalData,
  buildRegenerateOwnerLinkData,
  canApproveOwnerAccess,
  propertyEligibleForClaimCta,
} from "./claim";
import { evaluateOwnerAccess } from "../auth/ownerAccess";

describe("claimSubmissionSchema", () => {
  it("accepts a valid submission", () => {
    const result = claimSubmissionSchema.safeParse({
      ownerName: "Priya Sharma",
      email: "priya@example.com",
      phone: "+91 9876543210",
      businessRole: "Owner",
      message: "",
    });
    expect(result.success).toBe(true);
  });

  it("requires a name", () => {
    const result = claimSubmissionSchema.safeParse({
      ownerName: "",
      email: "priya@example.com",
      phone: "+91 9876543210",
      businessRole: "Owner",
    });
    expect(result.success).toBe(false);
  });

  it("requires a plausible email address", () => {
    const result = claimSubmissionSchema.safeParse({
      ownerName: "Priya Sharma",
      email: "not-an-email",
      phone: "+91 9876543210",
      businessRole: "Owner",
    });
    expect(result.success).toBe(false);
  });

  it("requires a phone number", () => {
    const result = claimSubmissionSchema.safeParse({
      ownerName: "Priya Sharma",
      email: "priya@example.com",
      phone: "",
      businessRole: "Owner",
    });
    expect(result.success).toBe(false);
  });

  it("requires a business role", () => {
    const result = claimSubmissionSchema.safeParse({
      ownerName: "Priya Sharma",
      email: "priya@example.com",
      phone: "+91 9876543210",
      businessRole: "",
    });
    expect(result.success).toBe(false);
  });

  it("treats a blank message as null (optional)", () => {
    const result = claimSubmissionSchema.safeParse({
      ownerName: "Priya Sharma",
      email: "priya@example.com",
      phone: "+91 9876543210",
      businessRole: "Owner",
      message: "",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.message).toBeNull();
  });

  it("normalizes email addresses to lowercase before storage and duplicate comparison", () => {
    const result = claimSubmissionSchema.safeParse({
      ownerName: "Priya Sharma",
      email: "Priya@EXAMPLE.com",
      phone: "+91 9876543210",
      businessRole: "Owner",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("priya@example.com");
  });

  it("does not require documents/proof at submission (no proofReference field)", () => {
    const result = claimSubmissionSchema.safeParse({
      ownerName: "Priya Sharma",
      email: "priya@example.com",
      phone: "+91 9876543210",
      businessRole: "Owner",
    });
    expect(result.success).toBe(true);
  });
});

describe("buildClaimCreateData", () => {
  it("carries every submitted field through unchanged", () => {
    const input = {
      ownerName: "Priya Sharma",
      email: "priya@example.com",
      phone: "+91 9876543210",
      businessRole: "Owner",
      message: "I run this business.",
    };
    expect(buildClaimCreateData(input)).toEqual(input);
  });
});

describe("buildClaimApprovalData", () => {
  const params = {
    adminId: "admin-1",
    propertyId: "prop-1",
    claimRequestId: "claim-1",
    tokenHash: "abc123",
    now: new Date("2026-01-01"),
    expiresAt: new Date("2026-01-31"),
  };

  it("never includes verificationStatus or ownerVerified in the property update", () => {
    const writes = buildClaimApprovalData(params);
    expect(writes.propertyUpdate).not.toHaveProperty("verificationStatus");
    expect(writes.propertyUpdate).not.toHaveProperty("ownerVerified");
    expect(writes.propertyUpdate).toEqual({ claimed: true });
  });

  it("marks the claim APPROVED with the reviewing admin and timestamp", () => {
    const writes = buildClaimApprovalData(params);
    expect(writes.claimUpdate).toEqual({
      status: "APPROVED",
      reviewedAt: params.now,
      reviewedById: "admin-1",
    });
  });

  it("creates owner access scoped to exactly this property and claim, storing only the token hash", () => {
    const writes = buildClaimApprovalData(params);
    expect(writes.ownerAccessCreate).toEqual({
      propertyId: "prop-1",
      claimRequestId: "claim-1",
      tokenHash: "abc123",
      expiresAt: params.expiresAt,
    });
  });
});

describe("buildRegenerateOwnerLinkData (regenerateOwnerLink fix)", () => {
  const params = { tokenHash: "new-hash-xyz", expiresAt: new Date("2026-02-01") };

  it("returns an UPDATE payload only — no propertyId, claimRequestId, or id key", () => {
    const writes = buildRegenerateOwnerLinkData(params);
    expect(writes).not.toHaveProperty("propertyId");
    expect(writes).not.toHaveProperty("claimRequestId");
    expect(writes).not.toHaveProperty("id");
    // Structurally this can only ever be passed to `.update({ where: { id }, data: writes })`
    // on the existing row — never to `.create()` — so the unique constraints
    // on propertyId/claimRequestId (one PropertyOwnerAccess row ever, per
    // property/per claim) can never be violated by regeneration.
    expect(Object.keys(writes).sort()).toEqual(["consumedAt", "expiresAt", "revokedAt", "tokenHash"].sort());
  });

  it("stores the new token's hash and expiry exactly as given", () => {
    const writes = buildRegenerateOwnerLinkData(params);
    expect(writes.tokenHash).toBe("new-hash-xyz");
    expect(writes.expiresAt).toBe(params.expiresAt);
  });

  it("always resets consumedAt to null — a regenerated link is single-use again, regardless of prior state", () => {
    expect(buildRegenerateOwnerLinkData(params).consumedAt).toBeNull();
  });

  it("always resets revokedAt to null — regeneration reactivates the row rather than leaving it revoked", () => {
    expect(buildRegenerateOwnerLinkData(params).revokedAt).toBeNull();
  });

  it("two successive regenerations produce different token hashes, so the previous link's hash can never match again", () => {
    const first = buildRegenerateOwnerLinkData({ tokenHash: "hash-1", expiresAt: params.expiresAt });
    const second = buildRegenerateOwnerLinkData({ tokenHash: "hash-2", expiresAt: params.expiresAt });
    expect(first.tokenHash).not.toBe(second.tokenHash);
  });

  it("leaves the row's revokedAt/expiresAt in a state where an already-established owner session is still authorized (sessions never depend on tokenHash)", () => {
    const writes = buildRegenerateOwnerLinkData({ tokenHash: "new-hash", expiresAt: new Date(Date.now() + 1000 * 60 * 60) });
    const sessionCheck = evaluateOwnerAccess({ expiresAt: writes.expiresAt, revokedAt: writes.revokedAt });
    expect(sessionCheck).toEqual({ authorized: true });
  });
});

describe("owner-access approval preconditions", () => {
  it("rejects a second owner approval for a claimed property or active owner access", () => {
    expect(canApproveOwnerAccess({ claimStatus: "PENDING", propertyClaimed: true, hasActiveOwnerAccess: false })).toBe(false);
    expect(canApproveOwnerAccess({ claimStatus: "PENDING", propertyClaimed: false, hasActiveOwnerAccess: true })).toBe(false);
  });

  it("accepts only a pending claim for an unclaimed property with no active access", () => {
    expect(canApproveOwnerAccess({ claimStatus: "PENDING", propertyClaimed: false, hasActiveOwnerAccess: false })).toBe(true);
    expect(canApproveOwnerAccess({ claimStatus: "APPROVED", propertyClaimed: false, hasActiveOwnerAccess: false })).toBe(false);
  });

  it("prevents re-approval of already-approved claims", () => {
    expect(canApproveOwnerAccess({ claimStatus: "APPROVED", propertyClaimed: true, hasActiveOwnerAccess: true })).toBe(false);
  });

  it("prevents approval if property already has active owner access", () => {
    expect(canApproveOwnerAccess({ claimStatus: "PENDING", propertyClaimed: false, hasActiveOwnerAccess: true })).toBe(false);
  });

  it("prevents approval for claimed properties", () => {
    expect(canApproveOwnerAccess({ claimStatus: "PENDING", propertyClaimed: true, hasActiveOwnerAccess: false })).toBe(false);
  });
});

describe("propertyEligibleForClaimCta", () => {
  it("shows the CTA for a published, unclaimed, Discovery-tier property", () => {
    expect(
      propertyEligibleForClaimCta({ status: "PUBLISHED", verificationStatus: "DISCOVERED", claimed: false })
    ).toBe(true);
  });

  it("hides the CTA for an unpublished property", () => {
    expect(
      propertyEligibleForClaimCta({ status: "DRAFT", verificationStatus: "DISCOVERED", claimed: false })
    ).toBe(false);
  });

  it("hides the CTA once the property is already claimed", () => {
    expect(
      propertyEligibleForClaimCta({ status: "PUBLISHED", verificationStatus: "DISCOVERED", claimed: true })
    ).toBe(false);
  });

  it("hides the CTA for a VERIFIED property — a stronger trust process already applies", () => {
    expect(
      propertyEligibleForClaimCta({ status: "PUBLISHED", verificationStatus: "VERIFIED", claimed: false })
    ).toBe(false);
  });

  it("hides the CTA for an OWNER_VERIFIED property", () => {
    expect(
      propertyEligibleForClaimCta({ status: "PUBLISHED", verificationStatus: "OWNER_VERIFIED", claimed: false })
    ).toBe(false);
  });

  it("hides the CTA when both unpublished and already claimed", () => {
    expect(
      propertyEligibleForClaimCta({ status: "CLOSED", verificationStatus: "DISCOVERED", claimed: true })
    ).toBe(false);
  });
});
