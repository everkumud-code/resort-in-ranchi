import { COMMERCIAL_TIER_BADGE_CLASS, COMMERCIAL_TIER_LABELS, type CommercialTierValue } from "@/lib/validation/commercial";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  PUBLISHED: "bg-green-100 text-green-800",
  ARCHIVED: "bg-stone-200 text-stone-600",
  CLOSED: "bg-red-100 text-red-700",
};

const VERIFICATION_STYLES: Record<string, string> = {
  DISCOVERED: "bg-slate-100 text-slate-600",
  NEEDS_REVIEW: "bg-amber-100 text-amber-800",
  VERIFIED: "bg-green-100 text-green-800",
  OWNER_CLAIMED: "bg-blue-100 text-blue-700",
  OWNER_VERIFIED: "bg-emerald-100 text-emerald-800",
  CLOSED: "bg-red-100 text-red-700",
};

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {label.replace(/_/g, " ")}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge label={status} className={STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600"} />;
}

export function VerificationBadge({ verificationStatus }: { verificationStatus: string }) {
  return (
    <Badge
      label={verificationStatus}
      className={VERIFICATION_STYLES[verificationStatus] ?? "bg-slate-100 text-slate-600"}
    />
  );
}

export function CommercialTierBadge({ commercialTier }: { commercialTier: CommercialTierValue }) {
  return <Badge label={COMMERCIAL_TIER_LABELS[commercialTier]} className={COMMERCIAL_TIER_BADGE_CLASS[commercialTier]} />;
}
