import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { evaluateCreatorAccess, evaluateInitialCreatorAccess, influencerEligibleForOwnerAccess } from "./creatorAccess";

describe("evaluateCreatorAccess", () => {
  const now = new Date("2026-01-01T00:00:00Z");

  it("denies access when there is no matching token row", () => {
    expect(evaluateCreatorAccess(null, now)).toEqual({ authorized: false, reason: "no-token" });
  });

  it("denies access when the token has been revoked", () => {
    expect(evaluateCreatorAccess({ expiresAt: new Date("2026-06-01"), revokedAt: new Date("2025-12-15") }, now)).toEqual({ authorized: false, reason: "revoked" });
  });

  it("denies access when the token has expired", () => {
    expect(evaluateCreatorAccess({ expiresAt: new Date("2025-12-31T23:59:59Z"), revokedAt: null }, now)).toEqual({ authorized: false, reason: "expired" });
  });

  it("checks revocation before expiry", () => {
    expect(evaluateCreatorAccess({ expiresAt: new Date("2026-06-01"), revokedAt: new Date("2025-12-20") }, now).reason).toBe("revoked");
  });

  it("grants access for a valid, unexpired, unrevoked token", () => {
    expect(evaluateCreatorAccess({ expiresAt: new Date("2026-06-01"), revokedAt: null }, now)).toEqual({ authorized: true });
  });
});

describe("initial creator access-token exchange", () => {
  const now = new Date("2026-01-01T00:00:00Z");
  const valid = { expiresAt: new Date("2026-02-01T00:00:00Z"), revokedAt: null, consumedAt: null };

  it("accepts a valid initial token for a successful exchange", () => {
    expect(evaluateInitialCreatorAccess(valid, now)).toEqual({ authorized: true });
  });

  it("makes an initial token unusable after exchange", () => {
    expect(evaluateInitialCreatorAccess({ ...valid, consumedAt: now }, now)).toEqual({ authorized: false, reason: "consumed" });
  });

  it("rejects expired and revoked initial tokens", () => {
    expect(evaluateInitialCreatorAccess({ ...valid, expiresAt: now }, now).authorized).toBe(false);
    expect(evaluateInitialCreatorAccess({ ...valid, revokedAt: now }, now).authorized).toBe(false);
  });
});

describe("influencer eligibility", () => {
  it.each(["DRAFT"])("rejects %s profiles", (status) => {
    expect(influencerEligibleForOwnerAccess({ id: "creator-1", status })).toBe(false);
  });

  it("accepts only published profiles", () => {
    expect(influencerEligibleForOwnerAccess({ id: "creator-1", status: "PUBLISHED" })).toBe(true);
  });

  it("denies when there is no influencer at all", () => {
    expect(influencerEligibleForOwnerAccess(null)).toBe(false);
  });
});

describe("single-creator database guard", () => {
  it("declares a unique influencerId constraint so concurrent approvals cannot persist two creator accesses", () => {
    const schema = readFileSync(resolve(process.cwd(), "prisma/schema.prisma"), "utf8");
    const block = schema.slice(schema.indexOf("model InfluencerOwnerAccess"), schema.indexOf("model InfluencerOwnerSession"));
    expect(block).toMatch(/influencerId\s+String\s+@unique/);
  });
});
