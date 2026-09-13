/**
 * The partner's own working status on a referred lead — entirely separate
 * from EnquiryStatus (see validation/enquiry.ts). A partner updating this
 * never touches the source Enquiry row; see updatePartnerLeadStatus.
 */
export const PARTNER_LEAD_STATUS_VALUES = ["NEW", "CONTACTED", "CONVERTED", "CLOSED_LOST"] as const;

export const PARTNER_LEAD_STATUS_LABELS: Record<(typeof PARTNER_LEAD_STATUS_VALUES)[number], string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  CONVERTED: "Converted",
  CLOSED_LOST: "Closed / Lost",
};

/** Tailwind classes for the status badge — every value in PARTNER_LEAD_STATUS_VALUES has an entry, checked by a test. */
export const PARTNER_LEAD_STATUS_BADGE_CLASS: Record<(typeof PARTNER_LEAD_STATUS_VALUES)[number], string> = {
  NEW: "bg-amber-100 text-amber-800 ring-1 ring-amber-300",
  CONTACTED: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  CONVERTED: "bg-green-50 text-green-700 ring-1 ring-green-200",
  CLOSED_LOST: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
};

export function isValidPartnerLeadStatus(value: string): value is (typeof PARTNER_LEAD_STATUS_VALUES)[number] {
  return (PARTNER_LEAD_STATUS_VALUES as readonly string[]).includes(value);
}
