import { describe, expect, it } from "vitest";
import { canManageOwnerAccess, evaluateSession } from "./session";

describe("evaluateSession", () => {
  const now = new Date("2026-01-01T00:00:00Z");

  it("denies access when there is no session", () => {
    const result = evaluateSession(null, null, now);
    expect(result).toEqual({ authorized: false, reason: "no-session" });
  });

  it("denies access when the session has no matching admin user", () => {
    const result = evaluateSession({ expiresAt: new Date("2026-06-01") }, null, now);
    expect(result).toEqual({ authorized: false, reason: "no-session" });
  });

  it("denies access when the session is expired", () => {
    const result = evaluateSession({ expiresAt: new Date("2025-12-31T23:59:59Z") }, { active: true }, now);
    expect(result).toEqual({ authorized: false, reason: "expired" });
  });

  it("treats a session expiring at exactly `now` as expired", () => {
    const result = evaluateSession({ expiresAt: now }, { active: true }, now);
    expect(result.authorized).toBe(false);
    expect(result.reason).toBe("expired");
  });

  it("denies access when the admin user is deactivated", () => {
    const result = evaluateSession({ expiresAt: new Date("2026-06-01") }, { active: false }, now);
    expect(result).toEqual({ authorized: false, reason: "inactive-user" });
  });

  it("grants access for a valid, unexpired session and an active user", () => {
    const result = evaluateSession({ expiresAt: new Date("2026-06-01") }, { active: true }, now);
    expect(result).toEqual({ authorized: true });
  });
});

describe("owner-access admin roles", () => {
  it("allows ADMIN and SUPER_ADMIN, but never EDITOR, to issue or revoke owner access", () => {
    expect(canManageOwnerAccess("ADMIN")).toBe(true);
    expect(canManageOwnerAccess("SUPER_ADMIN")).toBe(true);
    expect(canManageOwnerAccess("EDITOR")).toBe(false);
  });
});
