"use server";

import { trackEvent, CLIENT_TRIGGERABLE_EVENT_TYPES, type AnalyticsEventType } from "@/lib/analytics";

/**
 * The only analytics entry point a Client Component may call. Rejects
 * anything outside CLIENT_TRIGGERABLE_EVENT_TYPES (silently — a rejected
 * call is a no-op, not an error a client needs to handle) so a submit-type
 * event can never be recorded from here, only from inside the real
 * enquiry/claim submission Server Actions.
 */
export async function recordViewEvent(type: AnalyticsEventType, propertyId?: string, path?: string): Promise<void> {
  if (!CLIENT_TRIGGERABLE_EVENT_TYPES.has(type)) return;
  await trackEvent({ type, propertyId, path });
}
