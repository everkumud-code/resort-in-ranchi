import { z } from "zod";
import { optionalDate, optionalEmail, optionalInt, optionalText, requiredPhone, requiredText } from "./shared";

/**
 * Public enquiry form. Deliberately minimal — the visitor never supplies a
 * propertyId, status, or anything else the server doesn't independently
 * derive (see buildEnquiryCreateData). `honeypot` is a hidden field real
 * visitors never see or fill; a non-empty value means a bot filled every
 * field it found, so the submission is silently dropped (see actions.ts).
 */
export const enquirySubmissionSchema = z.object({
  name: requiredText("Name"),
  phone: requiredPhone,
  email: optionalEmail,
  eventDate: optionalDate,
  guests: optionalInt,
  requirement: optionalText,
  budget: optionalText,
  honeypot: optionalText,
});

export type EnquirySubmissionInput = z.infer<typeof enquirySubmissionSchema>;

/**
 * Pure transform from validated visitor input to the full Enquiry create
 * payload. propertyId and sourcePage are supplied by the server (resolved
 * from the URL's slug, via a database lookup) — never read from the
 * visitor's own form fields, so a request can't target an arbitrary
 * property. status is always the enum's NEW value; a visitor has no way to
 * set any other status.
 */
export function buildEnquiryCreateData(
  input: EnquirySubmissionInput,
  context: { propertyId: string; sourcePage: string }
) {
  return {
    propertyId: context.propertyId,
    name: input.name,
    phone: input.phone,
    email: input.email,
    eventDate: input.eventDate,
    guests: input.guests,
    requirement: input.requirement,
    budget: input.budget,
    sourcePage: context.sourcePage,
    status: "NEW" as const,
  };
}

/** Only a published listing can receive enquiries — the same bar the site already uses to decide a page is publicly visible at all. */
export function propertyEligibleForEnquiry(property: { status: string } | null): boolean {
  return Boolean(property && property.status === "PUBLISHED");
}

export const ENQUIRY_STATUS_VALUES = ["NEW", "CONTACTED", "CONVERTED", "CLOSED", "SPAM"] as const;

export const ENQUIRY_STATUS_LABELS: Record<(typeof ENQUIRY_STATUS_VALUES)[number], string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  CONVERTED: "Converted",
  CLOSED: "Closed",
  SPAM: "Spam",
};

/** Tailwind classes for the admin status badge — every value in ENQUIRY_STATUS_VALUES has an entry, checked by a test. NEW is deliberately the loudest so unhandled leads are easy to spot in a list. */
export const ENQUIRY_STATUS_BADGE_CLASS: Record<(typeof ENQUIRY_STATUS_VALUES)[number], string> = {
  NEW: "bg-amber-100 text-amber-800 ring-1 ring-amber-300",
  CONTACTED: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  CONVERTED: "bg-green-50 text-green-700 ring-1 ring-green-200",
  CLOSED: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  SPAM: "bg-red-50 text-red-700 ring-1 ring-red-200",
};

/**
 * Contextual "Send Enquiry" CTA copy, keyed by the property's OWN category
 * slug only — never inferred from anything else (name, description, etc.).
 * A category not listed here (including one that doesn't exist yet, like a
 * future "Adventure & Camping") safely falls back to the generic default
 * rather than guessing.
 */
export const DEFAULT_ENQUIRY_CTA_COPY = "Send Enquiry";

const ENQUIRY_CTA_COPY_BY_CATEGORY_SLUG: Record<string, string> = {
  resorts: "Plan Your Stay",
  hotels: "Check Availability",
  "wedding-venues": "Plan Your Event",
  "banquet-halls": "Plan Your Event",
  "party-halls": "Plan Your Event",
  restaurants: DEFAULT_ENQUIRY_CTA_COPY,
  cafes: DEFAULT_ENQUIRY_CTA_COPY,
  "lounge-bar": DEFAULT_ENQUIRY_CTA_COPY,
  "homestays-farm-stays": "Plan Your Visit",
};

export function getEnquiryCtaCopy(categorySlug: string): string {
  return ENQUIRY_CTA_COPY_BY_CATEGORY_SLUG[categorySlug] ?? DEFAULT_ENQUIRY_CTA_COPY;
}
