import { describe, expect, it } from "vitest";
import { canPublish, getPublicTrustTier, IDENTITY_CONFLICT_PROPERTY_IDS } from "./propertyLifecycle";
import { TIER_LABEL } from "@/components/site/TrustBadge";

function candidate(overrides: Partial<Parameters<typeof canPublish>[0]> = {}) {
  return {
    verificationStatus: "VERIFIED",
    address: "123 Main Road",
    phone: null,
    website: null,
    ...overrides,
  };
}

describe("canPublish", () => {
  it("allows publishing when verified and has an address", () => {
    const result = canPublish(candidate());
    expect(result.ok).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it("allows publishing when verified and has only a phone", () => {
    const result = canPublish(candidate({ address: null, phone: "+91-9000000000" }));
    expect(result.ok).toBe(true);
  });

  it("allows publishing when verified and has only a website", () => {
    const result = canPublish(candidate({ address: null, website: "https://example.com" }));
    expect(result.ok).toBe(true);
  });

  it("allows OWNER_VERIFIED as well as VERIFIED", () => {
    const result = canPublish(candidate({ verificationStatus: "OWNER_VERIFIED" }));
    expect(result.ok).toBe(true);
  });

  it("blocks publishing when verified but no address, phone, or website", () => {
    const result = canPublish(candidate({ address: null, phone: null, website: null }));
    expect(result.ok).toBe(false);
    expect(result.reasons.some((r) => r.includes("address, phone, or website"))).toBe(true);
  });

  it("treats an empty string field the same as missing (not real contact info)", () => {
    const result = canPublish(candidate({ address: "", phone: "", website: "" }));
    expect(result.ok).toBe(false);
  });

  describe("DISCOVERED (scaled discovery directory)", () => {
    it("allows publishing a DISCOVERED property with full contact info", () => {
      const result = canPublish(candidate({ verificationStatus: "DISCOVERED" }));
      expect(result.ok).toBe(true);
      expect(result.reasons).toHaveLength(0);
    });

    it("allows publishing a DISCOVERED property with NO contact info at all — a bare discovery listing is legitimate", () => {
      const result = canPublish({ verificationStatus: "DISCOVERED", address: null, phone: null, website: null });
      expect(result.ok).toBe(true);
      expect(result.reasons).toHaveLength(0);
    });
  });

  it("blocks publishing when NEEDS_REVIEW, even with full contact info", () => {
    const result = canPublish(candidate({ verificationStatus: "NEEDS_REVIEW" }));
    expect(result.ok).toBe(false);
  });

  it("blocks publishing when CLOSED", () => {
    const result = canPublish(candidate({ verificationStatus: "CLOSED" }));
    expect(result.ok).toBe(false);
  });

  it("blocks publishing an identity-conflict record regardless of verification status or contact info", () => {
    const result = canPublish(candidate({ verificationStatus: "DISCOVERED", blockedByIdentityConflict: true }));
    expect(result.ok).toBe(false);
    expect(result.reasons.some((r) => r.toLowerCase().includes("identity conflict"))).toBe(true);
  });

  it("identity-conflict check takes precedence even for an otherwise-eligible VERIFIED property", () => {
    const result = canPublish(candidate({ verificationStatus: "VERIFIED", blockedByIdentityConflict: true }));
    expect(result.ok).toBe(false);
  });
});

describe("IDENTITY_CONFLICT_PROPERTY_IDS", () => {
  it("contains the 10 Batch 1 duplicate/conflict property IDs", () => {
    expect(IDENTITY_CONFLICT_PROPERTY_IDS.size).toBe(10);
  });

  it("does not contain Aangan Resort's ID", () => {
    expect(IDENTITY_CONFLICT_PROPERTY_IDS.has("cmtsc3n2w009duzekl2tr6t24")).toBe(false);
  });
});

describe("getPublicTrustTier", () => {
  it("maps VERIFIED to 'verified'", () => {
    expect(getPublicTrustTier("VERIFIED")).toBe("verified");
  });

  it("maps OWNER_VERIFIED to 'owner_verified'", () => {
    expect(getPublicTrustTier("OWNER_VERIFIED")).toBe("owner_verified");
  });

  it("maps DISCOVERED to 'discovery'", () => {
    expect(getPublicTrustTier("DISCOVERED")).toBe("discovery");
  });

  it("falls back to 'discovery' for any other/unrecognized status, never overclaiming trust", () => {
    for (const status of ["NEEDS_REVIEW", "OWNER_CLAIMED", "CLOSED", "SOMETHING_UNKNOWN"]) {
      expect(getPublicTrustTier(status)).toBe("discovery");
    }
  });
});

describe("TIER_LABEL (public trust badge copy)", () => {
  it("uses the exact required labels for each tier", () => {
    expect(TIER_LABEL.verified).toBe("Verified Listing");
    expect(TIER_LABEL.owner_verified).toBe("Owner Verified");
    expect(TIER_LABEL.discovery).toBe("Discovery Listing");
  });

  it("has a label for every tier getPublicTrustTier can return", () => {
    for (const status of ["VERIFIED", "OWNER_VERIFIED", "DISCOVERED", "NEEDS_REVIEW"]) {
      const tier = getPublicTrustTier(status);
      expect(TIER_LABEL[tier]).toBeTruthy();
    }
  });
});
