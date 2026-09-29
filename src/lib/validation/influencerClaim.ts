import { z } from "zod";
import { optionalText, requiredEmail, requiredText } from "./shared";

/** Public claim-submission form, mirrors claimSubmissionSchema exactly. No proof required up front. */
export const influencerClaimSubmissionSchema = z.object({
  claimantName: requiredText("Name"),
  email: requiredEmail,
  phone: requiredText("Phone"),
  message: optionalText,
});

export type InfluencerClaimSubmissionInput = z.infer<typeof influencerClaimSubmissionSchema>;

export function buildInfluencerClaimCreateData(input: InfluencerClaimSubmissionInput) {
  return { claimantName: input.claimantName, email: input.email, phone: input.phone, message: input.message };
}

/** Mirrors buildClaimApprovalData — the exact write shape for approving a creator claim. */
export function buildInfluencerClaimApprovalData(params: {
  adminId: string;
  influencerId: string;
  claimRequestId: string;
  tokenHash: string;
  now: Date;
  expiresAt: Date;
}) {
  return {
    claimUpdate: { status: "APPROVED" as const, reviewedAt: params.now, reviewedById: params.adminId },
    influencerUpdate: { claimed: true as const },
    ownerAccessCreate: {
      influencerId: params.influencerId,
      claimRequestId: params.claimRequestId,
      tokenHash: params.tokenHash,
      expiresAt: params.expiresAt,
    },
  };
}

export function buildRegenerateInfluencerOwnerLinkData(params: { tokenHash: string; expiresAt: Date }) {
  return { tokenHash: params.tokenHash, expiresAt: params.expiresAt, consumedAt: null as Date | null, revokedAt: null as Date | null };
}

type ClaimStatusLike = "PENDING" | "APPROVED" | "REJECTED";

export function canApproveInfluencerOwnerAccess(input: {
  claimStatus: ClaimStatusLike;
  influencerClaimed: boolean;
  hasActiveOwnerAccess: boolean;
}): boolean {
  return input.claimStatus === "PENDING" && !input.influencerClaimed && !input.hasActiveOwnerAccess;
}

/** Only an unclaimed, published profile can be claimed — mirrors propertyEligibleForClaimCta's shape. */
export function influencerEligibleForClaimCta(influencer: { status: string; claimed: boolean }): boolean {
  return influencer.status === "PUBLISHED" && !influencer.claimed;
}
