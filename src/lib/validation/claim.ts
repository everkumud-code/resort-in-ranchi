import { z } from "zod";
import { optionalText, requiredEmail, requiredText } from "./shared";
import { getPublicTrustTier } from "./propertyLifecycle";

/**
 * Public claim-submission form. Deliberately minimal — no documents/proof
 * required at this stage (per product decision: speed over verification
 * friction). Submitting a claim only ever creates a PENDING ClaimRequest; it
 * never grants trust or edit access by itself — see claimActions.ts.
 */
export const claimSubmissionSchema = z.object({
  ownerName: requiredText("Name"),
  email: requiredEmail,
  phone: requiredText("Phone"),
  businessRole: requiredText("Your relationship to the business"),
  message: optionalText,
});

export type ClaimSubmissionInput = z.infer<typeof claimSubmissionSchema>;

export function buildClaimCreateData(input: ClaimSubmissionInput) {
  return {
    ownerName: input.ownerName,
    email: input.email,
    phone: input.phone,
    businessRole: input.businessRole,
    message: input.message,
  };
}

/**
 * Pure shape of what approving a claim writes — kept separate from the
 * Server Action so the invariant "approval never touches verificationStatus
 * or ownerVerified" is directly assertable in a test, not just true by
 * reading the action's code.
 */
export function buildClaimApprovalData(params: {
  adminId: string;
  propertyId: string;
  claimRequestId: string;
  tokenHash: string;
  now: Date;
  expiresAt: Date;
}) {
  return {
    claimUpdate: { status: "APPROVED" as const, reviewedAt: params.now, reviewedById: params.adminId },
    propertyUpdate: { claimed: true as const },
    ownerAccessCreate: {
      propertyId: params.propertyId,
      claimRequestId: params.claimRequestId,
      tokenHash: params.tokenHash,
      expiresAt: params.expiresAt,
    },
  };
}

/**
 * Pure shape of what regenerating an owner-access link writes. Deliberately
 * has no `propertyId`/`claimRequestId`/`id` key at all — it is an UPDATE
 * payload only, applied to the existing PropertyOwnerAccess row by its own
 * id. This is what makes regeneration structurally incapable of creating a
 * second row for the same property/claim: there is no code path from this
 * function's output to a `.create()` call, so the `propertyId`/
 * `claimRequestId` unique constraints can never be at risk here.
 *
 * Always resets `consumedAt`/`revokedAt` to null — a regenerated link is a
 * fresh, unconsumed, unrevoked, single-use credential regardless of the
 * previous credential's state. It does NOT touch any PropertyOwnerSession —
 * an already-established owner browser session is validated against this
 * row's `revokedAt`/`expiresAt` only (never its `tokenHash`), so refreshing
 * the initial token here never invalidates a session already in use.
 */
export function buildRegenerateOwnerLinkData(params: { tokenHash: string; expiresAt: Date }) {
  return {
    tokenHash: params.tokenHash,
    expiresAt: params.expiresAt,
    consumedAt: null as Date | null,
    revokedAt: null as Date | null,
  };
}

/** Pure precondition used before the transaction's conditional writes. */
export function canApproveOwnerAccess(input: {
  claimStatus: ClaimStatusLike;
  propertyClaimed: boolean;
  hasActiveOwnerAccess: boolean;
}): boolean {
  return input.claimStatus === "PENDING" && !input.propertyClaimed && !input.hasActiveOwnerAccess;
}

type ClaimStatusLike = "PENDING" | "APPROVED" | "REJECTED";

/**
 * The single source of truth for whether the public "Claim this listing"
 * CTA should be shown — reused by the property page rather than an inline
 * `isDiscoveryTier && !property.claimed` check, so the rule is named and
 * independently testable. A claim CTA only ever makes sense for a
 * DISCOVERED-tier ("Discovery listing") property: VERIFIED/OWNER_VERIFIED
 * listings have already been through a stronger trust process and aren't
 * offered a claim flow here. `status` is checked explicitly (not just
 * assumed from the page having rendered) for the same defense-in-depth
 * reason propertyEligibleForEnquiry checks it.
 */
export function propertyEligibleForClaimCta(property: {
  status: string;
  verificationStatus: string;
  claimed: boolean;
}): boolean {
  return property.status === "PUBLISHED" && !property.claimed && getPublicTrustTier(property.verificationStatus) === "discovery";
}

/**
 * Exact copy requested for the commercial foundation — states the value of
 * claiming without advertising any price or paid plan. Reused everywhere a
 * claim CTA/explanation appears, so the pitch is consistent.
 */
export const CLAIM_VALUE_PROP_COPY = "Claim your listing to keep your business information up to date.";
