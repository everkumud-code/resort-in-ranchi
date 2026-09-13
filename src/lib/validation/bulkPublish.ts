import { IDENTITY_CONFLICT_PROPERTY_IDS } from "./propertyLifecycle";

/**
 * Properties held back from Batch 2A research (Batch 2B superseded per the
 * speed-first pivot — see BULK_PUBLISH_EXCLUDED_RED_IDS below for why these
 * specific 3 still apply): a genuine identity/duplicate concern, a signal
 * the business may have closed, and one whose existence couldn't be
 * confirmed from any real source. None of the three should be published
 * until an admin resolves them by hand.
 */
export const BULK_PUBLISH_EXCLUDED_RED_IDS = new Set([
  "cmtsc3mxh002puzek9xx4leo3", // Shagun Banquet (Morabadi)
  "cmtsc3mxk002tuzekhc6kcdtg", // IMA Bhawan
  "cmtsc3mxr0031uzekazpdyls5", // Shree Greens Banquet Hall
]);

/** Aangan Palace is a separate, deliberately-protected property — never auto-published alongside the discovery batch. */
export const BULK_PUBLISH_EXCLUDED_PROPERTY_IDS = new Set(["cmtsc3my4003fuzek83k22zl7"]);

export interface BulkPublishCandidate {
  id: string;
  status: string;
  verificationStatus: string;
}

export interface BulkPublishPlan {
  eligibleIds: string[];
  excludedAlreadyPublished: string[];
  excludedNotDiscovered: string[];
  excludedIdentityConflict: string[];
  excludedProtected: string[];
  excludedRed: string[];
}

/**
 * Pure selection logic for the bulk "publish every eligible Discovery
 * listing" action — deliberately separate from the Server Action so it can
 * be unit tested without a database, and so the action can re-derive the
 * exact same set server-side from fresh data rather than trusting whatever
 * a client last rendered.
 *
 * A property is eligible when it is currently DRAFT + DISCOVERED, is not a
 * known identity-conflict record, is not explicitly protected (Aangan
 * Palace), and is not one of the Batch 2A RED holds. NEEDS_REVIEW and
 * CLOSED records are excluded by the DISCOVERED check alone — they're never
 * in this verificationStatus. Aangan Resort is excluded because it's
 * already PUBLISHED, not by special-casing its id.
 */
export function computeBulkPublishPlan(properties: BulkPublishCandidate[]): BulkPublishPlan {
  const plan: BulkPublishPlan = {
    eligibleIds: [],
    excludedAlreadyPublished: [],
    excludedNotDiscovered: [],
    excludedIdentityConflict: [],
    excludedProtected: [],
    excludedRed: [],
  };

  for (const p of properties) {
    if (p.status === "PUBLISHED") {
      plan.excludedAlreadyPublished.push(p.id);
      continue;
    }
    if (p.verificationStatus !== "DISCOVERED") {
      plan.excludedNotDiscovered.push(p.id);
      continue;
    }
    if (IDENTITY_CONFLICT_PROPERTY_IDS.has(p.id)) {
      plan.excludedIdentityConflict.push(p.id);
      continue;
    }
    if (BULK_PUBLISH_EXCLUDED_PROPERTY_IDS.has(p.id)) {
      plan.excludedProtected.push(p.id);
      continue;
    }
    if (BULK_PUBLISH_EXCLUDED_RED_IDS.has(p.id)) {
      plan.excludedRed.push(p.id);
      continue;
    }
    plan.eligibleIds.push(p.id);
  }

  return plan;
}

/** The exact confirmation phrase an admin must type to enable the bulk-publish submit button. */
export const BULK_PUBLISH_CONFIRM_PHRASE = "PUBLISH DISCOVERY LISTINGS";
