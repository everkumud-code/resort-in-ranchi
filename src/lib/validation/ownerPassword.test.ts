import { describe, expect, it } from "vitest";
import { ownerLoginSchema, ownerSetPasswordSchema } from "./ownerPassword";

describe("ownerSetPasswordSchema", () => {
  it("accepts a valid email + matching password pair", () => {
    const result = ownerSetPasswordSchema.safeParse({ email: "Owner@Example.com", password: "goodpassword1", confirmPassword: "goodpassword1" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("owner@example.com");
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = ownerSetPasswordSchema.safeParse({ email: "owner@example.com", password: "short1", confirmPassword: "short1" });
    expect(result.success).toBe(false);
  });

  it("rejects when the passwords don't match", () => {
    const result = ownerSetPasswordSchema.safeParse({ email: "owner@example.com", password: "goodpassword1", confirmPassword: "different1" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = ownerSetPasswordSchema.safeParse({ email: "not-an-email", password: "goodpassword1", confirmPassword: "goodpassword1" });
    expect(result.success).toBe(false);
  });
});

describe("ownerLoginSchema", () => {
  it("lowercases and trims the email", () => {
    const result = ownerLoginSchema.safeParse({ email: "  Owner@Example.com  ", password: "anything" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("owner@example.com");
  });

  it("rejects an empty password", () => {
    const result = ownerLoginSchema.safeParse({ email: "owner@example.com", password: "" });
    expect(result.success).toBe(false);
  });
});
