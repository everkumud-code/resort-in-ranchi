import { getPublicTrustTier } from "@/lib/validation/propertyLifecycle";

/** Exported so its exact wording is directly testable, not just readable from the rendered component. */
export const TIER_LABEL: Record<ReturnType<typeof getPublicTrustTier>, string> = {
  verified: "Verified Listing",
  owner_verified: "Owner Verified",
  discovery: "Discovery Listing",
};

const TIER_CLASS: Record<ReturnType<typeof getPublicTrustTier>, string> = {
  verified: "bg-brand-teal/15 text-brand-teal",
  owner_verified: "bg-brand-gold/20 text-brand-gold",
  discovery: "bg-brand/10 text-brand-dark/60",
};

/** Public-facing trust badge — the only place verificationStatus's meaning ever reaches a visitor, always via getPublicTrustTier(), never as a raw enum value. */
export default function TrustBadge({ verificationStatus }: { verificationStatus: string }) {
  const tier = getPublicTrustTier(verificationStatus);
  return (
    <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TIER_CLASS[tier]}`}>
      {TIER_LABEL[tier]}
    </span>
  );
}
