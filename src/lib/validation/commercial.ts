/**
 * The vendor's commercial relationship with the platform — a plain,
 * admin-set label (see CommercialTier's own schema doc comment). No billing
 * or pricing logic reads this yet; it exists as a foundation for a future
 * paid-plan system.
 */
export const COMMERCIAL_TIER_VALUES = ["FREE", "PREMIUM", "LEAD_PARTNER"] as const;

export type CommercialTierValue = (typeof COMMERCIAL_TIER_VALUES)[number];

export const COMMERCIAL_TIER_LABELS: Record<CommercialTierValue, string> = {
  FREE: "Free",
  PREMIUM: "Premium",
  LEAD_PARTNER: "Lead Partner",
};

/** Tailwind classes for the commercial-tier badge — every value has an entry, checked by a test. */
export const COMMERCIAL_TIER_BADGE_CLASS: Record<CommercialTierValue, string> = {
  FREE: "bg-slate-100 text-slate-600",
  PREMIUM: "bg-amber-100 text-amber-800",
  LEAD_PARTNER: "bg-emerald-100 text-emerald-800",
};

export function isValidCommercialTier(value: string): value is CommercialTierValue {
  return (COMMERCIAL_TIER_VALUES as readonly string[]).includes(value);
}
