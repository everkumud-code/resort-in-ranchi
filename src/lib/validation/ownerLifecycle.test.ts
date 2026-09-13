import { describe, expect, it } from "vitest";
import { computeOwnerLifecycleStages } from "./ownerLifecycle";

describe("computeOwnerLifecycleStages", () => {
  it("marks Discovery Listing through Owner access complete regardless of verificationStatus, since reaching this page already implies them", () => {
    for (const status of ["DISCOVERED", "OWNER_CLAIMED", "NEEDS_REVIEW", "VERIFIED", "OWNER_VERIFIED"]) {
      const stages = computeOwnerLifecycleStages(status);
      const early = stages.filter((s) =>
        ["discoveryListing", "claimSubmitted", "claimApproved", "ownerAccess"].includes(s.id)
      );
      expect(early.every((s) => s.status === "complete")).toBe(true);
    }
  });

  it("for a not-yet-verified owner, 'Owner updates listing' is the current step, and later stages are pending", () => {
    const stages = computeOwnerLifecycleStages("OWNER_CLAIMED");
    const byId = Object.fromEntries(stages.map((s) => [s.id, s.status]));
    expect(byId.ownerUpdates).toBe("current");
    expect(byId.adminVerification).toBe("pending");
    expect(byId.ownerVerified).toBe("pending");
  });

  it("never marks Owner Verified complete unless verificationStatus is actually OWNER_VERIFIED — never inferred from anything else", () => {
    for (const status of ["DISCOVERED", "OWNER_CLAIMED", "VERIFIED", "NEEDS_REVIEW", "CLOSED"]) {
      const stages = computeOwnerLifecycleStages(status);
      const ownerVerifiedStage = stages.find((s) => s.id === "ownerVerified")!;
      expect(ownerVerifiedStage.status).not.toBe("complete");
    }
  });

  it("when verificationStatus is OWNER_VERIFIED, every stage including Admin verification and Owner Verified is complete", () => {
    const stages = computeOwnerLifecycleStages("OWNER_VERIFIED");
    expect(stages.every((s) => s.status === "complete")).toBe(true);
  });

  it("VERIFIED (admin-verified without an owner claim in this flow) does not itself complete the owner-specific Owner Verified stage", () => {
    // VERIFIED and OWNER_VERIFIED are deliberately different tiers (see
    // propertyLifecycle.ts) — this function must not conflate them.
    const stages = computeOwnerLifecycleStages("VERIFIED");
    const ownerVerifiedStage = stages.find((s) => s.id === "ownerVerified")!;
    expect(ownerVerifiedStage.status).toBe("pending");
  });

  it("returns all 7 stages in the exact documented order", () => {
    const stages = computeOwnerLifecycleStages("OWNER_CLAIMED");
    expect(stages.map((s) => s.id)).toEqual([
      "discoveryListing",
      "claimSubmitted",
      "claimApproved",
      "ownerAccess",
      "ownerUpdates",
      "adminVerification",
      "ownerVerified",
    ]);
  });

  it("every stage has the exact required label text", () => {
    const stages = computeOwnerLifecycleStages("OWNER_CLAIMED");
    const labels = Object.fromEntries(stages.map((s) => [s.id, s.label]));
    expect(labels).toEqual({
      discoveryListing: "Discovery Listing",
      claimSubmitted: "Claim submitted",
      claimApproved: "Claim approved",
      ownerAccess: "Owner access",
      ownerUpdates: "Owner updates listing",
      adminVerification: "Admin verification",
      ownerVerified: "Owner Verified",
    });
  });
});
