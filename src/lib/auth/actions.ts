"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/validation/auth";
import { hashPassword, verifyPassword } from "./password";
import { consumeResetToken, issueResetEmail } from "./passwordResetService";
import { createSession, destroySessionByToken, requireAdmin, SESSION_COOKIE_NAME, SESSION_DURATION_MS } from "./session";

export interface LoginState {
  error?: string;
}

const GENERIC_ERROR = "Invalid email or password.";

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: GENERIC_ERROR };
  }

  const { email, password } = parsed.data;

  // Never reveal whether the email exists — same generic error either way.
  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin || !admin.active) {
    return { error: GENERIC_ERROR };
  }

  const validPassword = await verifyPassword(password, admin.passwordHash);
  if (!validPassword) {
    return { error: GENERIC_ERROR };
  }

  const token = await createSession(admin.id);
  await prisma.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });

  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });

  redirect("/admin");
}

export interface ChangePasswordState {
  error?: string;
  success?: boolean;
}

export async function changePassword(_prevState: ChangePasswordState, formData: FormData): Promise<ChangePasswordState> {
  const admin = await requireAdmin();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { currentPassword, newPassword } = parsed.data;

  const current = await prisma.adminUser.findUnique({ where: { id: admin.id } });
  if (!current) {
    return { error: "Account not found." };
  }

  const validCurrent = await verifyPassword(currentPassword, current.passwordHash);
  if (!validCurrent) {
    return { error: "Current password is incorrect." };
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.adminUser.update({ where: { id: admin.id }, data: { passwordHash } });

  return { success: true };
}

export interface ForgotPasswordState {
  error?: string;
  sent?: boolean;
}

/**
 * "Forgot password" form. The answer is the same whether or not the e-mail is
 * an admin (so the form cannot be used to find out who is), and the lookup and
 * the mailing run after the response so the reply takes the same time either way.
 */
export async function requestPasswordReset(_prevState: ForgotPasswordState, formData: FormData): Promise<ForgotPasswordState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid email." };
  }

  const { email } = parsed.data;
  after(async () => {
    try {
      await issueResetEmail(email);
    } catch (error) {
      console.error("[password-reset] could not issue a reset e-mail:", error instanceof Error ? error.message : "unknown error");
    }
  });

  return { sent: true };
}

export interface ResetPasswordState {
  error?: string;
}

export async function resetPassword(_prevState: ResetPasswordState, formData: FormData): Promise<ResetPasswordState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await consumeResetToken(parsed.data.token, parsed.data.newPassword);
  if (!result.ok) {
    return { error: "This reset link is invalid or has expired. Request a new one." };
  }

  redirect("/admin/login?reset=1");
}

export async function logout(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await destroySessionByToken(token);
  }
  store.delete(SESSION_COOKIE_NAME);
  redirect("/admin/login");
}
