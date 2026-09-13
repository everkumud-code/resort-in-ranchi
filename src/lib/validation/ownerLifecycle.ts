/**
 * Presentation-only mapping of the claim → owner access → verification
 * lifecycle to a stage list an owner can see themselves in. Never writes
 * anything, never infers a status that isn't actually true — the sole real
 * fact this reads is verificationStatus. Anything reachable only through an
 * authenticated owner-access session (see requireOwnerAccessForProperty)
 * already implies a submitted, approved claim and an exchanged owner-access
 * token, so those early stages are always "complete" by construction; there
 * is no owner-edit audit log (a known, separate gap), so "Owner updates
 * listing" is shown as the current actionable step rather than guessed at
 * from field completeness, which could just as easily be pre-existing
 * Discovery-era research data rather than something the owner did.
 */

export type OwnerLifecycleStageId =
  | "discoveryListing"
  | "claimSubmitted"
  | "claimApproved"
  | "ownerAccess"
  | "ownerUpdates"
  | "adminVerification"
  | "ownerVerified";

export type OwnerLifecycleStageStatus = "complete" | "current" | "pending";

export interface OwnerLifecycleStage {
  id: OwnerLifecycleStageId;
  label: string;
  status: OwnerLifecycleStageStatus;
}

const STAGE_LABELS: Record<OwnerLifecycleStageId, string> = {
  discoveryListing: "Discovery Listing",
  claimSubmitted: "Claim submitted",
  claimApproved: "Claim approved",
  ownerAccess: "Owner access",
  ownerUpdates: "Owner updates listing",
  adminVerification: "Admin verification",
  ownerVerified: "Owner Verified",
};

const STAGE_ORDER: OwnerLifecycleStageId[] = [
  "discoveryListing",
  "claimSubmitted",
  "claimApproved",
  "ownerAccess",
  "ownerUpdates",
  "adminVerification",
  "ownerVerified",
];

const ALWAYS_COMPLETE_BY_THE_TIME_AN_OWNER_SESSION_EXISTS = new Set<OwnerLifecycleStageId>([
  "discoveryListing",
  "claimSubmitted",
  "claimApproved",
  "ownerAccess",
]);

/**
 * `verificationStatus` is the only real signal used, and only ever read —
 * never written. Becoming Owner Verified remains a separate, explicit admin
 * decision (see approveClaim/verification actions); this function cannot
 * and does not change it.
 */
export function computeOwnerLifecycleStages(verificationStatus: string): OwnerLifecycleStage[] {
  const isOwnerVerified = verificationStatus === "OWNER_VERIFIED";

  return STAGE_ORDER.map((id) => {
    if (ALWAYS_COMPLETE_BY_THE_TIME_AN_OWNER_SESSION_EXISTS.has(id)) {
      return { id, label: STAGE_LABELS[id], status: "complete" };
    }
    if (isOwnerVerified) {
      return { id, label: STAGE_LABELS[id], status: "complete" };
    }
    if (id === "ownerUpdates") {
      return { id, label: STAGE_LABELS[id], status: "current" };
    }
    return { id, label: STAGE_LABELS[id], status: "pending" };
  });
}
