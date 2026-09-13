import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { evaluateInitialOwnerAccess, evaluateOwnerAccess, ownerAccessGrantsProperty, propertyEligibleForOwnerAccess } from "./ownerAccess";

describe("evaluateOwnerAccess", () => {
  const now = new Date("2026-01-01T00:00:00Z");

  it("denies access when there is no matching token row", () => {
    const result = evaluateOwnerAccess(null, now);
    expect(result).toEqual({ authorized: false, reason: "no-token" });
  });

  it("denies access when the token has been revoked", () => {
    const result = evaluateOwnerAccess(
      { expiresAt: new Date("2026-06-01"), revokedAt: new Date("2025-12-15") },
      now
    );
    expect(result).toEqual({ authorized: false, reason: "revoked" });
  });

  it("denies access when the token has expired", () => {
    const result = evaluateOwnerAccess({ expiresAt: new Date("2025-12-31T23:59:59Z"), revokedAt: null }, now);
    expect(result).toEqual({ authorized: false, reason: "expired" });
  });

  it("treats a token expiring at exactly `now` as expired", () => {
    const result = evaluateOwnerAccess({ expiresAt: now, revokedAt: null }, now);
    expect(result.authorized).toBe(false);
    expect(result.reason).toBe("expired");
  });

  it("grants access for a valid, unexpired, unrevoked token", () => {
    const result = evaluateOwnerAccess({ expiresAt: new Date("2026-06-01"), revokedAt: null }, now);
    expect(result).toEqual({ authorized: true });
  });

  it("checks revocation before expiry, so a revoked-but-not-yet-expired token is still denied", () => {
    const result = evaluateOwnerAccess({ expiresAt: new Date("2026-06-01"), revokedAt: new Date("2025-12-20") }, now);
    expect(result.reason).toBe("revoked");
  });
});

describe("ownerAccessGrantsProperty", () => {
  it("denies when the token has no valid access at all", () => {
    expect(ownerAccessGrantsProperty(null, "property-a")).toBe(false);
  });

  it("denies when the token's real property does not match the requested one — an owner of property A cannot edit property B by changing the URL", () => {
    expect(ownerAccessGrantsProperty("property-a", "property-b")).toBe(false);
  });

  it("grants only when the token's real property exactly matches the requested one", () => {
    expect(ownerAccessGrantsProperty("property-a", "property-a")).toBe(true);
  });
});

describe("initial access-token exchange", () => {
  const now = new Date("2026-01-01T00:00:00Z");
  const valid = { expiresAt: new Date("2026-02-01T00:00:00Z"), revokedAt: null, consumedAt: null };

  it("accepts a valid initial token for a successful exchange", () => {
    expect(evaluateInitialOwnerAccess(valid, now)).toEqual({ authorized: true });
  });

  it("makes an initial token unusable after exchange", () => {
    expect(evaluateInitialOwnerAccess({ ...valid, consumedAt: now }, now)).toEqual({ authorized: false, reason: "consumed" });
  });

  it("rejects expired and revoked initial tokens", () => {
    expect(evaluateInitialOwnerAccess({ ...valid, expiresAt: now }, now).authorized).toBe(false);
    expect(evaluateInitialOwnerAccess({ ...valid, revokedAt: now }, now).authorized).toBe(false);
  });
});

describe("property eligibility", () => {
  it.each(["DRAFT", "CLOSED", "ARCHIVED"])('rejects %s properties', (status) => {
    expect(propertyEligibleForOwnerAccess({ id: "ordinary-property", status })).toBe(false);
  });

  it("accepts only published, non-protected properties", () => {
    expect(propertyEligibleForOwnerAccess({ id: "ordinary-property", status: "PUBLISHED" })).toBe(true);
    expect(propertyEligibleForOwnerAccess({ id: "cmtsc3my4003fuzek83k22zl7", status: "PUBLISHED" })).toBe(false);
  });
});

describe("single-owner database guard", () => {
  it("declares a unique propertyId constraint so concurrent approvals cannot persist two owner accesses", () => {
    const schema = readFileSync(resolve(process.cwd(), "prisma/schema.prisma"), "utf8");
    const migration = readFileSync(resolve(process.cwd(), "prisma/migrations/20260909113000_harden_owner_access/migration.sql"), "utf8");
    expect(schema).toContain("propertyId     String       @unique");
    expect(migration).toContain('CREATE UNIQUE INDEX "PropertyOwnerAccess_propertyId_key"');
  });
});
