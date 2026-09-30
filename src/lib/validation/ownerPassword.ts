import { z } from "zod";

const emailField = z.preprocess(
  (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
  z.string().min(1, "Email is required").email("Enter a valid email")
);

/** Setting up (or changing) direct email+password login — always done by the owner themselves, from inside their own dashboard. */
export const ownerSetPasswordSchema = z
  .object({
    email: emailField,
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((v) => v.password === v.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });

export type OwnerSetPasswordInput = z.infer<typeof ownerSetPasswordSchema>;

/** Logging in with a previously set-up email+password. */
export const ownerLoginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required"),
});

export type OwnerLoginInput = z.infer<typeof ownerLoginSchema>;
