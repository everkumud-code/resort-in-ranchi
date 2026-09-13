import { prisma } from "./prisma";

/**
 * The complete, fixed set of trackable events — deliberately just these
 * seven, matching exactly what was asked for. No page-view-everywhere
 * tracking, no per-click instrumentation, nothing that would need a new
 * event type added casually later.
 */
export const ANALYTICS_EVENT_TYPES = [
  "SEARCH",
  "PROPERTY_VIEW",
  "COMPARE",
  "ENQUIRY_START",
  "ENQUIRY_SUBMIT",
  "CLAIM_START",
  "CLAIM_SUBMIT",
] as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];

export const ANALYTICS_EVENT_LABELS: Record<AnalyticsEventType, string> = {
  SEARCH: "Searches",
  PROPERTY_VIEW: "Property views",
  COMPARE: "Compare views",
  ENQUIRY_START: "Enquiry starts",
  ENQUIRY_SUBMIT: "Enquiry submits",
  CLAIM_START: "Claim starts",
  CLAIM_SUBMIT: "Claim submits",
};

export interface TrackEventInput {
  type: AnalyticsEventType;
  /** A real Property.id, when the event is about one specific listing — never any other identifier. */
  propertyId?: string | null;
  /** The site-relative path the event happened on, e.g. "/search" — never a full URL with query-string PII. */
  path?: string | null;
}

/**
 * Fire-and-forget, fully anonymous event logging. No visitor-identifying
 * data is ever accepted by this function's own type — there is no name,
 * email, phone, IP, user-agent, or cookie/session-id field on
 * TrackEventInput, so none can leak in by accident. Never throws: a
 * database hiccup here must never break the real page render or form
 * submission it's attached to (same "degrade silently" principle already
 * used for localStorage elsewhere in this codebase).
 */
export async function trackEvent(input: TrackEventInput): Promise<void> {
  try {
    await prisma.analyticsEvent.create({
      data: { type: input.type, propertyId: input.propertyId ?? null, path: input.path ?? null },
    });
  } catch {
    // Analytics must never break a real user-facing action.
  }
}

/** Event types a client is ever allowed to directly request — view/"start" events only. Submit events are recorded exclusively server-side, at the real point of submission, so a client can never inflate submit counts without actually submitting anything. */
export const CLIENT_TRIGGERABLE_EVENT_TYPES: ReadonlySet<AnalyticsEventType> = new Set([
  "SEARCH",
  "PROPERTY_VIEW",
  "COMPARE",
  "ENQUIRY_START",
  "CLAIM_START",
]);
