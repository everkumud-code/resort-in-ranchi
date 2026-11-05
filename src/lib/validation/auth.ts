import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/** An already-logged-in admin changing their own password. */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/** "Forgot password": only the e-mail is asked for. */
export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Email is required").email("Enter a valid email"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/** Setting a new password from the e-mailed link (the token comes from the link, never typed). */
export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, "This reset link is incomplete. Request a new one."),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
