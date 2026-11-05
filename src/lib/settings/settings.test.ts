import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret, isEncryptionConfigured, parseEncryptionKey } from "./crypto";
import {
  RESET_LINK_MINUTES,
  appPasswordSchema,
  gmailAddressSchema,
  mergeMailConfig,
  normalizeSiteUrl,
  parseBoundedInt,
  resolveResetPolicy,
  resolveSiteUrl,
} from "./definitions";
import { checkNewMemberRole, checkTeamChange, newMemberSchema, rolesAssignableBy } from "./team";

const KEY = "a".repeat(64);
const env = { SETTINGS_ENCRYPTION_KEY: KEY };

describe("secret encryption", () => {
  it("round-trips and never stores the plain text", () => {
    const stored = encryptSecret("abcdefghijklmnop", env);
    expect(stored.startsWith("v1:")).toBe(true);
    expect(stored).not.toContain("abcdefghijklmnop");
    expect(decryptSecret(stored, env)).toBe("abcdefghijklmnop");
  });

  it("uses a fresh IV each time", () => {
    expect(encryptSecret("same", env)).not.toBe(encryptSecret("same", env));
  });

  it("returns null for a different key, a tampered value or a missing key", () => {
    const stored = encryptSecret("secret-value", env);
    expect(decryptSecret(stored, { SETTINGS_ENCRYPTION_KEY: "b".repeat(64) })).toBeNull();
    expect(decryptSecret(stored.slice(0, -4) + "AAAA", env)).toBeNull();
    expect(decryptSecret(stored, {})).toBeNull();
    expect(decryptSecret("not-a-payload", env)).toBeNull();
  });

  it("refuses to encrypt without a valid key", () => {
    expect(() => encryptSecret("x", {})).toThrow();
    expect(() => encryptSecret("x", { SETTINGS_ENCRYPTION_KEY: "short" })).toThrow();
  });

  it("accepts a hex or base64 32-byte key only", () => {
    expect(parseEncryptionKey(KEY)?.length).toBe(32);
    expect(parseEncryptionKey(Buffer.alloc(32, 7).toString("base64"))?.length).toBe(32);
    expect(parseEncryptionKey("")).toBeNull();
    expect(parseEncryptionKey(Buffer.alloc(16).toString("base64"))).toBeNull();
    expect(isEncryptionConfigured(env)).toBe(true);
    expect(isEncryptionConfigured({})).toBe(false);
  });
});

describe("field rules", () => {
  it("normalises the Gmail address and the app password", () => {
    expect(gmailAddressSchema.parse("  Owner@Gmail.COM ")).toBe("owner@gmail.com");
    expect(gmailAddressSchema.safeParse("nope").success).toBe(false);
    expect(appPasswordSchema.parse("abcd efgh ijkl mnop")).toBe("abcdefghijklmnop");
    expect(appPasswordSchema.safeParse("short").success).toBe(false);
  });

  it("accepts only an https origin (http only for localhost)", () => {
    expect(normalizeSiteUrl("https://www.resortinranchi.com/")).toEqual({ ok: true, value: "https://www.resortinranchi.com" });
    expect(normalizeSiteUrl("http://localhost:3000")).toEqual({ ok: true, value: "http://localhost:3000" });
    for (const bad of ["", "resortinranchi.com", "http://example.com", "javascript:alert(1)", "https://user:pw@example.com", "https://example.com/blog", "https://example.com/?a=1"]) {
      expect(normalizeSiteUrl(bad).ok, bad).toBe(false);
    }
  });

  it("keeps bounded numbers inside their range", () => {
    expect(parseBoundedInt("60", RESET_LINK_MINUTES, "x")).toEqual({ ok: true, value: 60 });
    expect(parseBoundedInt("9", RESET_LINK_MINUTES, "x").ok).toBe(false);
    expect(parseBoundedInt("1441", RESET_LINK_MINUTES, "x").ok).toBe(false);
    expect(parseBoundedInt("12.5", RESET_LINK_MINUTES, "x").ok).toBe(false);
    expect(parseBoundedInt("-5", RESET_LINK_MINUTES, "x").ok).toBe(false);
    expect(parseBoundedInt("", RESET_LINK_MINUTES, "x").ok).toBe(false);
  });
});

describe("resolving live values", () => {
  it("console values win over the environment, field by field", () => {
    const { config, sources } = mergeMailConfig(
      { "mail.user": "console@gmail.com" },
      { SMTP_USER: "env@gmail.com", SMTP_APP_PASSWORD: "env pass word 1234", SMTP_FROM_NAME: "Env Name" }
    );
    expect(config).toEqual({ user: "console@gmail.com", pass: "envpassword1234", fromName: "Env Name" });
    expect(sources).toEqual({ user: "console", appPassword: "environment", fromName: "environment" });
  });

  it("is not configured without both an address and a password, and defaults the sender name", () => {
    expect(mergeMailConfig({}, {}).config).toBeNull();
    expect(mergeMailConfig({ "mail.user": "a@gmail.com" }, {}).config).toBeNull();
    const ok = mergeMailConfig({ "mail.user": "a@gmail.com", "mail.appPassword": "abcdefghijklmnop" }, {});
    expect(ok.config?.fromName).toBe("ResortInRanchi");
    expect(ok.sources.fromName).toBe("default");
  });

  it("resolves the site address from the console, then the environment", () => {
    expect(resolveSiteUrl("https://a.example", "https://b.example")).toEqual({ value: "https://a.example", source: "console" });
    expect(resolveSiteUrl(undefined, "https://b.example/")).toEqual({ value: "https://b.example", source: "environment" });
    expect(resolveSiteUrl(undefined, undefined)).toEqual({ value: undefined, source: "none" });
  });

  it("falls back to the safe default for missing or out-of-range reset rules", () => {
    expect(resolveResetPolicy({})).toEqual({ linkMinutes: 60, requestsPerHour: 3 });
    expect(resolveResetPolicy({ "security.resetLinkMinutes": "30", "security.resetRequestsPerHour": "5" })).toEqual({ linkMinutes: 30, requestsPerHour: 5 });
    expect(resolveResetPolicy({ "security.resetLinkMinutes": "999999", "security.resetRequestsPerHour": "0" })).toEqual({ linkMinutes: 60, requestsPerHour: 3 });
  });
});

describe("team permissions", () => {
  const superA = { id: "s1", role: "SUPER_ADMIN" as const, active: true };
  const admin = { id: "a1", role: "ADMIN" as const, active: true };
  const editor = { id: "e1", role: "EDITOR" as const, active: true };
  const otherAdmin = { id: "a2", role: "ADMIN" as const, active: true };

  it("lets only Admin and Super admin manage accounts", () => {
    expect(checkTeamChange(editor, { ...editor, id: "e2" }, { active: false }, 1)).not.toBeNull();
    expect(rolesAssignableBy("EDITOR")).toEqual([]);
    expect(rolesAssignableBy("ADMIN")).toEqual(["EDITOR"]);
    expect(rolesAssignableBy("SUPER_ADMIN")).toContain("SUPER_ADMIN");
  });

  it("limits Admins to Editor accounts", () => {
    expect(checkTeamChange(admin, editor, { active: false }, 1)).toBeNull();
    expect(checkTeamChange(admin, otherAdmin, { active: false }, 1)).not.toBeNull();
    expect(checkTeamChange(admin, editor, { role: "ADMIN" }, 1)).not.toBeNull();
    expect(checkTeamChange(admin, superA, { role: "EDITOR" }, 1)).not.toBeNull();
  });

  it("stops anyone locking themselves out", () => {
    expect(checkTeamChange(superA, superA, { active: false }, 2)).not.toBeNull();
    expect(checkTeamChange(superA, superA, { role: "ADMIN" }, 2)).not.toBeNull();
    expect(checkTeamChange(superA, superA, { role: "SUPER_ADMIN", active: true }, 1)).toBeNull();
  });

  it("keeps at least one active Super admin", () => {
    const otherSuper = { id: "s2", role: "SUPER_ADMIN" as const, active: true };
    expect(checkTeamChange(superA, otherSuper, { active: false }, 2)).toBeNull();
    expect(checkTeamChange(superA, otherSuper, { active: false }, 1)).not.toBeNull();
    expect(checkTeamChange(superA, otherSuper, { role: "ADMIN" }, 1)).not.toBeNull();
  });

  it("restricts which roles can be created", () => {
    expect(checkNewMemberRole("ADMIN", "EDITOR")).toBeNull();
    expect(checkNewMemberRole("ADMIN", "ADMIN")).not.toBeNull();
    expect(checkNewMemberRole("SUPER_ADMIN", "ADMIN")).toBeNull();
    expect(checkNewMemberRole("EDITOR", "EDITOR")).not.toBeNull();
  });

  it("validates a new person", () => {
    expect(newMemberSchema.safeParse({ name: "Asha", email: "ASHA@Example.com", role: "EDITOR", password: "longenough" }).success).toBe(true);
    expect(newMemberSchema.safeParse({ name: "Asha", email: "x", role: "EDITOR", password: "longenough" }).success).toBe(false);
    expect(newMemberSchema.safeParse({ name: "Asha", email: "a@b.co", role: "OWNER", password: "longenough" }).success).toBe(false);
    expect(newMemberSchema.safeParse({ name: "Asha", email: "a@b.co", role: "EDITOR", password: "short" }).success).toBe(false);
  });
});
