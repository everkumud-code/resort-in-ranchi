/**
 * Pure publish-eligibility logic, deliberately separate from the generic
 * property edit schema — publishing is its own decision, never a side
 * effect of an ordinary field edit.
 *
 * Product strategy (scaled discovery directory): DISCOVERED ≠ VERIFIED, but
 * DISCOVERED records may now be published as clearly-labeled "Discovery
 * listings" — the site no longer requires manual verification before a
 * legitimate discovered business can appear publicly. VERIFIED/OWNER_VERIFIED
 * keep their original, stricter bar (contact info required) since that tier
 * makes a stronger trust claim to the visitor.
 */

export const VERIFIED_FOR_PUBLISH = new Set(["VERIFIED", "OWNER_VERIFIED"]);

/**
 * Property IDs identified during Batch 1 research as duplicate/identity
 * conflicts — publishing either record in a pair (or any of a sibling
 * group) would create two public pages for the same real-world business.
 * This is a temporary, manually-curated publish-time safety gate, not a
 * merge system: neither record is modified, deleted, or hidden from admin;
 * both simply cannot be published until an admin resolves the relationship.
 *
 * - Bloom Hotel / Bloom Hotel - Ranchi
 * - The Royal Lush / THE ROYAL LUSH HOTEL
 * - Hotel Genista Inn / Hotel Genista Inn - Zinnia
 * - The Royal Retreat / The Royal Retreat - Rangmahal / The Royal Retreat - On The Rocks
 * - Pratishtha Banquet and Resort
 */
export const IDENTITY_CONFLICT_PROPERTY_IDS = new Set([
  "cmtsc3n23008buzekysq3q075", // Bloom Hotel
  "cmtsc3n0x006vuzekv3th2ys8", // Bloom Hotel - Ranchi
  "cmtsc3n3a009vuzek6szhii7x", // The Royal Lush
  "cmtsc3n2d008nuzeku21beiop", // THE ROYAL LUSH HOTEL
  "cmtsc3n0i006fuzekxv9twjav", // Hotel Genista Inn
  "cmtsc3n4300axuzekett8tk79", // Hotel Genista Inn - Zinnia
  "cmtsc3n2a008juzek0kxc99st", // The Royal Retreat
  "cmtsc3mzp005fuzek9uq3g6h1", // The Royal Retreat - Rangmahal
  "cmtsc3n5t00d3uzekx9e6h16r", // The Royal Retreat - On The Rocks
  "cmtsc3n3b009xuzekkvlwfjq6", // Pratishtha Banquet and Resort
]);

export interface PublishCandidate {
  verificationStatus: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  /** True when this record is a known duplicate/identity conflict — see IDENTITY_CONFLICT_PROPERTY_IDS. */
  blockedByIdentityConflict?: boolean;
}

export interface PublishEligibility {
  ok: boolean;
  reasons: string[];
}

/**
 * A property may be published when:
 *  - it's a known identity conflict → never eligible until resolved, or
 *  - it's Verified/Owner Verified AND has at least one real way for a
 *    visitor to reach/find it (address, phone, or website) — unchanged from
 *    the original rule, and still the bar for the stronger trust badges, or
 *  - it's DISCOVERED (and not NEEDS_REVIEW/CLOSED/other) → eligible as a
 *    "Discovery listing" with no contact-info requirement; a bare
 *    name+category+locality entry is a legitimate directory listing as long
 *    as it's honestly labeled as unverified.
 *
 * Never fills in or guesses a missing field — only reports what's missing
 * so an admin can decide how to resolve it.
 */
export function canPublish(property: PublishCandidate): PublishEligibility {
  const reasons: string[] = [];

  if (property.blockedByIdentityConflict) {
    reasons.push("This record is flagged as a duplicate/identity conflict and cannot be published until resolved.");
    return { ok: false, reasons };
  }

  const isHighTrust = VERIFIED_FOR_PUBLISH.has(property.verificationStatus);
  const isDiscovered = property.verificationStatus === "DISCOVERED";

  if (!isHighTrust && !isDiscovered) {
    reasons.push(
      "Property must be Verified, Owner Verified, or Discovered (and not flagged for review) before it can be published."
    );
    return { ok: false, reasons };
  }

  if (isHighTrust) {
    const hasContactInfo = Boolean(property.address || property.phone || property.website);
    if (!hasContactInfo) {
      reasons.push("Property needs at least one of: address, phone, or website before it can be published.");
    }
  }
  // Discovery-tier (DISCOVERED): no contact-info requirement.

  return { ok: reasons.length === 0, reasons };
}

export type PublicTrustTier = "verified" | "owner_verified" | "discovery";

/**
 * Maps the internal verificationStatus enum to the coarse 3-way label a
 * visitor is allowed to see. Deliberately collapses everything that isn't
 * VERIFIED/OWNER_VERIFIED (DISCOVERED, NEEDS_REVIEW, OWNER_CLAIMED, CLOSED)
 * into "discovery" — the public site never renders the raw internal enum,
 * and never overclaims trust for a state it doesn't recognize.
 */
export function getPublicTrustTier(verificationStatus: string): PublicTrustTier {
  if (verificationStatus === "OWNER_VERIFIED") return "owner_verified";
  if (verificationStatus === "VERIFIED") return "verified";
  return "discovery";
}
