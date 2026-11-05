import { describe, expect, it } from "vitest";
import { getMailConfig } from "@/lib/email/mailer";
import { forgotPasswordSchema, resetPasswordSchema } from "@/lib/validation/auth";
import { hashToken } from "./session";
import {
  MAX_RESET_REQUESTS_PER_HOUR,
  RESET_TOKEN_TTL_MS,
  buildResetEmail,
  buildResetUrl,
  evaluateResetToken,
  generateResetToken,
  isResetRequestThrottled,
} from "./passwordReset";

describe("generateResetToken", () => {
  it("makes a long random token that is different every time", () => {
    const a = generateResetToken();
    const b = generateResetToken();
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toBe(b);
  });

  it("is stored only as a hash that is not the token itself", () => {
    const token = generateResetToken();
    expect(hashToken(token)).not.toBe(token);
    expect(hashToken(token)).toBe(hashToken(token));
  });
});

describe("evaluateResetToken", () => {
  const now = new Date("2026-11-05T10:00:00Z");
  const fresh = { expiresAt: new Date("2026-11-05T10:30:00Z"), usedAt: null };

  it("accepts a fresh, unused link for an active admin", () => {
    expect(evaluateResetToken(fresh, { active: true }, now)).toEqual({ valid: true });
  });

  it("rejects an unknown link", () => {
    expect(evaluateResetToken(null, null, now)).toEqual({ valid: false, reason: "not-found" });
    expect(evaluateResetToken(fresh, null, now)).toEqual({ valid: false, reason: "not-found" });
  });

  it("rejects a link that was already used", () => {
    expect(evaluateResetToken({ ...fresh, usedAt: new Date("2026-11-05T09:50:00Z") }, { active: true }, now)).toEqual({ valid: false, reason: "used" });
  });

  it("rejects an expired link, including one that expires exactly now", () => {
    expect(evaluateResetToken({ expiresAt: new Date("2026-11-05T09:59:59Z"), usedAt: null }, { active: true }, now)).toEqual({ valid: false, reason: "expired" });
    expect(evaluateResetToken({ expiresAt: now, usedAt: null }, { active: true }, now)).toEqual({ valid: false, reason: "expired" });
  });

  it("rejects a link for a switched-off admin", () => {
    expect(evaluateResetToken(fresh, { active: false }, now)).toEqual({ valid: false, reason: "inactive-user" });
  });

  it("gives a link one hour", () => {
    expect(RESET_TOKEN_TTL_MS).toBe(60 * 60 * 1000);
  });
});

describe("isResetRequestThrottled with a configured limit", () => {
  it("uses the limit it is given instead of the default", () => {
    expect(isResetRequestThrottled(4, 5)).toBe(false);
    expect(isResetRequestThrottled(5, 5)).toBe(true);
    expect(isResetRequestThrottled(1, 1)).toBe(true);
  });

  it("states the configured link lifetime in the e-mail", () => {
    const mail = buildResetEmail({ name: "Kumud", url: "https://example.com/x", ttlMinutes: 15 });
    expect(mail.text).toContain("expires in 15 minutes");
    expect(mail.html).toContain("expires in 15 minutes");
  });
});

describe("isResetRequestThrottled", () => {
  it("allows a few requests an hour and stops after that", () => {
    expect(isResetRequestThrottled(0)).toBe(false);
    expect(isResetRequestThrottled(MAX_RESET_REQUESTS_PER_HOUR - 1)).toBe(false);
    expect(isResetRequestThrottled(MAX_RESET_REQUESTS_PER_HOUR)).toBe(true);
  });
});

describe("buildResetUrl", () => {
  it("uses the configured site address and trims a trailing slash", () => {
    expect(buildResetUrl("https://www.resortinranchi.com/", "abc", "production")).toBe("https://www.resortinranchi.com/admin/reset-password?token=abc");
  });

  it("makes no link in production when the site address is missing", () => {
    expect(buildResetUrl(undefined, "abc", "production")).toBeNull();
    expect(buildResetUrl("   ", "abc", "production")).toBeNull();
  });

  it("falls back to localhost only outside production", () => {
    expect(buildResetUrl(undefined, "abc", "development")).toBe("http://localhost:3000/admin/reset-password?token=abc");
  });

  it("can point at the vendor reset page", () => {
    expect(buildResetUrl("https://x.test/", "abc", "production", "/owner/reset-password")).toBe("https://x.test/owner/reset-password?token=abc");
    expect(buildResetUrl(undefined, "abc", "development", "/owner/reset-password")).toBe("http://localhost:3000/owner/reset-password?token=abc");
  });

  it("encodes the token", () => {
    expect(buildResetUrl("https://x.test", "a b&c", "production")).toBe("https://x.test/admin/reset-password?token=a%20b%26c");
  });
});

describe("buildResetEmail", () => {
  const url = "https://x.test/admin/reset-password?token=abc";

  it("carries the link, the expiry and a 'ignore it' line", () => {
    const mail = buildResetEmail({ name: "Kumud", url });
    expect(mail.subject).toContain("Reset");
    expect(mail.text).toContain(url);
    expect(mail.text).toContain("60 minutes");
    expect(mail.text).toContain("ignore this e-mail");
    expect(mail.html).toContain(`href="${url}"`);
  });

  it("says 'vendor login' in the owner version and 'admin account' in the admin one", () => {
    const owner = buildResetEmail({ name: "Hotel Kumud", url, audience: "owner" });
    expect(owner.subject).toContain("vendor");
    expect(owner.text).toContain("vendor login");
    expect(owner.html).toContain("vendor login");
    const admin = buildResetEmail({ name: "Kumud", url });
    expect(admin.subject).toContain("admin");
    expect(admin.text).toContain("admin account");
  });

  it("escapes a name that contains markup", () => {
    const mail = buildResetEmail({ name: `<script>alert("x")</script>`, url });
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
  });
});

describe("getMailConfig", () => {
  it("needs both the Gmail address and the app password", () => {
    expect(getMailConfig({})).toBeNull();
    expect(getMailConfig({ SMTP_USER: "a@gmail.com" })).toBeNull();
    expect(getMailConfig({ SMTP_APP_PASSWORD: "abcdefghijklmnop" })).toBeNull();
  });

  it("ignores the spaces Google shows in an app password, and defaults the sender name", () => {
    expect(getMailConfig({ SMTP_USER: " a@gmail.com ", SMTP_APP_PASSWORD: "abcd efgh ijkl mnop" })).toEqual({
      user: "a@gmail.com",
      pass: "abcdefghijklmnop",
      fromName: "ResortInRanchi",
    });
  });

  it("uses a given sender name", () => {
    expect(getMailConfig({ SMTP_USER: "a@gmail.com", SMTP_APP_PASSWORD: "x", SMTP_FROM_NAME: "Resort Team" })?.fromName).toBe("Resort Team");
  });
});

describe("forgot/reset validation", () => {
  it("lower-cases and checks the e-mail", () => {
    expect(forgotPasswordSchema.safeParse({ email: "  Admin@Example.COM " })).toMatchObject({ success: true, data: { email: "admin@example.com" } });
    expect(forgotPasswordSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
    expect(forgotPasswordSchema.safeParse({ email: "" }).success).toBe(false);
  });

  it("wants a token, an 8+ character password and a matching confirmation", () => {
    const ok = { token: "abc", newPassword: "longenough1", confirmPassword: "longenough1" };
    expect(resetPasswordSchema.safeParse(ok).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ ...ok, token: "" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ ...ok, newPassword: "short", confirmPassword: "short" }).success).toBe(false);
    const mismatch = resetPasswordSchema.safeParse({ ...ok, confirmPassword: "different1" });
    expect(mismatch.success).toBe(false);
    if (!mismatch.success) expect(mismatch.error.issues[0].message).toBe("Passwords don't match");
  });
});
