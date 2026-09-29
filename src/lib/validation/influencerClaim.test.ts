import { describe, expect, it } from "vitest";
import {
  buildInfluencerClaimApprovalData,
  canApproveInfluencerOwnerAccess,
  influencerClaimSubmissionSchema,
  influencerEligibleForClaimCta,
} from "./influencerClaim";

describe("influencerClaimSubmissionSchema", () => {
  it("requires a name, valid email and phone", () => {
    expect(influencerClaimSubmissionSchema.safeParse({ claimantName: "Priya", email: "priya@x.test", phone: "9876543210" }).success).toBe(true);
    expect(influencerClaimSubmissionSchema.safeParse({ claimantName: "", email: "priya@x.test", phone: "9876543210" }).success).toBe(false);
    expect(influencerClaimSubmissionSchema.safeParse({ claimantName: "Priya", email: "not-an-email", phone: "9876543210" }).success).toBe(false);
  });
});

describe("canApproveInfluencerOwnerAccess", () => {
  it("approves only a pending claim on an unclaimed profile with no other active access", () => {
    expect(canApproveInfluencerOwnerAccess({ claimStatus: "PENDING", influencerClaimed: false, hasActiveOwnerAccess: false })).toBe(true);
    expect(canApproveInfluencerOwnerAccess({ claimStatus: "APPROVED", influencerClaimed: false, hasActiveOwnerAccess: false })).toBe(false);
    expect(canApproveInfluencerOwnerAccess({ claimStatus: "PENDING", influencerClaimed: true, hasActiveOwnerAccess: false })).toBe(false);
    expect(canApproveInfluencerOwnerAccess({ claimStatus: "PENDING", influencerClaimed: false, hasActiveOwnerAccess: true })).toBe(false);
  });
});

describe("influencerEligibleForClaimCta", () => {
  it("only a published, unclaimed profile can be claimed", () => {
    expect(influencerEligibleForClaimCta({ status: "PUBLISHED", claimed: false })).toBe(true);
    expect(influencerEligibleForClaimCta({ status: "PUBLISHED", claimed: true })).toBe(false);
    expect(influencerEligibleForClaimCta({ status: "DRAFT", claimed: false })).toBe(false);
  });
});

describe("buildInfluencerClaimApprovalData", () => {
  it("marks the profile claimed and creates access without ever touching status/featured/rating", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const writes = buildInfluencerClaimApprovalData({
      adminId: "admin-1",
      influencerId: "inf-1",
      claimRequestId: "claim-1",
      tokenHash: "hash",
      now,
      expiresAt: new Date("2026-02-01T00:00:00Z"),
    });
    expect(writes.claimUpdate).toEqual({ status: "APPROVED", reviewedAt: now, reviewedById: "admin-1" });
    expect(writes.influencerUpdate).toEqual({ claimed: true });
    expect(Object.keys(writes.influencerUpdate)).toEqual(["claimed"]);
    expect(writes.ownerAccessCreate).toEqual({ influencerId: "inf-1", claimRequestId: "claim-1", tokenHash: "hash", expiresAt: new Date("2026-02-01T00:00:00Z") });
  });
});
