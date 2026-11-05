"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { issueResetEmail } from "@/lib/auth/passwordResetService";
import { hashToken, requireAdmin, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { sendMailDetailed } from "@/lib/email/mailer";
import {
  RESET_LINK_MINUTES,
  RESET_REQUESTS_PER_HOUR,
  appPasswordSchema,
  fromNameSchema,
  gmailAddressSchema,
  normalizeSiteUrl,
  parseBoundedInt,
} from "@/lib/settings/definitions";
import { clearSetting, logSettingChange, saveSetting } from "@/lib/settings/store";
import {
  ROLE_LABELS,
  TEAM_ROLES,
  canOpenSettings,
  checkNewMemberRole,
  checkTeamChange,
  newMemberSchema,
  profileNameSchema,
  type TeamRole,
} from "@/lib/settings/team";

export interface SettingsFormState {
  error?: string;
  success?: string;
}

const NOT_ALLOWED: SettingsFormState = { error: "Only Admins and Super admins can change settings." };

/** The signed-in admin, or null when their role may not use the Settings console. */
async function settingsAdmin() {
  const admin = await requireAdmin();
  return canOpenSettings(admin.role) ? admin : null;
}

// ---------------------------------------------------------------------------
// E-mail (Gmail + app password)
// ---------------------------------------------------------------------------

export async function saveMailSettings(_prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const admin = await settingsAdmin();
  if (!admin) return NOT_ALLOWED;

  const user = gmailAddressSchema.safeParse(formData.get("user"));
  if (!user.success) return { error: user.error.issues[0]?.message ?? "Enter a valid Gmail address." };
  const fromName = fromNameSchema.safeParse(formData.get("fromName"));
  if (!fromName.success) return { error: fromName.error.issues[0]?.message ?? "Enter a sender name." };

  // Leaving the password box empty keeps the saved one.
  const rawPassword = String(formData.get("appPassword") ?? "");
  const changes: string[] = [];

  if (rawPassword.trim()) {
    const pass = appPasswordSchema.safeParse(rawPassword);
    if (!pass.success) return { error: pass.error.issues[0]?.message ?? "That app password is not valid." };
    const saved = await saveSetting("mail.appPassword", pass.data, admin.id);
    if (!saved.ok) return { error: saved.error };
    changes.push("saved a new app password");
  }
  await saveSetting("mail.user", user.data, admin.id);
  await saveSetting("mail.fromName", fromName.data, admin.id);
  changes.push("updated the sending address and sender name");

  await logSettingChange("E-mail", `${changes.join(" and ")[0].toUpperCase()}${changes.join(" and ").slice(1)}`, admin.email);
  revalidatePath("/admin/settings", "layout");
  return { success: "Saved. Use “Send a test e-mail” to check that it works." };
}

export async function clearMailSettings(): Promise<SettingsFormState> {
  const admin = await settingsAdmin();
  if (!admin) return NOT_ALLOWED;
  await clearSetting("mail.user");
  await clearSetting("mail.appPassword");
  await clearSetting("mail.fromName");
  await logSettingChange("E-mail", "Removed the saved e-mail account (the server's own settings apply again)", admin.email);
  revalidatePath("/admin/settings", "layout");
  return { success: "Removed. The server's own e-mail settings (if any) apply again." };
}

const TEST_MAIL_LIMIT = 5;

export async function sendTestEmail(): Promise<SettingsFormState> {
  const admin = await settingsAdmin();
  if (!admin) return NOT_ALLOWED;

  const since = new Date(Date.now() - 10 * 60 * 1000);
  const recent = await prisma.settingChange.count({
    where: { area: "E-mail test", adminEmail: admin.email, createdAt: { gte: since } },
  });
  if (recent >= TEST_MAIL_LIMIT) return { error: "Too many test e-mails just now. Wait a few minutes and try again." };

  const result = await sendMailDetailed({
    to: admin.email,
    subject: "ResortInRanchi test e-mail",
    text: `Hello ${admin.name},\n\nThis is a test e-mail from the ResortInRanchi admin Settings. If you can read it, sending e-mail works.\n`,
    html: `<p>Hello ${admin.name.replace(/[<>&"]/g, "")},</p><p>This is a test e-mail from the ResortInRanchi admin Settings. If you can read it, sending e-mail works.</p>`,
  });

  await logSettingChange("E-mail test", result.ok ? "Sent a test e-mail to themselves" : "A test e-mail could not be sent", admin.email);
  revalidatePath("/admin/settings", "layout");

  if (result.ok) return { success: `Sent to ${admin.email}. Check that inbox (and spam).` };
  if (result.reason === "not-configured") return { error: "No Gmail address and app password are set yet." };
  if (result.reason === "login-failed") {
    return { error: "Gmail refused the login. Check the address and create a fresh app password (2-Step Verification must be on)." };
  }
  return { error: "The e-mail could not be sent. Check the internet connection and the Gmail address, then try again." };
}

// ---------------------------------------------------------------------------
// Site address and password-reset rules
// ---------------------------------------------------------------------------

export async function saveSiteSettings(_prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const admin = await settingsAdmin();
  if (!admin) return NOT_ALLOWED;

  const rawUrl = String(formData.get("siteUrl") ?? "").trim();
  const minutes = parseBoundedInt(String(formData.get("resetLinkMinutes") ?? ""), RESET_LINK_MINUTES, "Link lifetime");
  if (!minutes.ok) return { error: minutes.error };
  const perHour = parseBoundedInt(String(formData.get("resetRequestsPerHour") ?? ""), RESET_REQUESTS_PER_HOUR, "Requests per hour");
  if (!perHour.ok) return { error: perHour.error };

  if (rawUrl) {
    const url = normalizeSiteUrl(rawUrl);
    if (!url.ok) return { error: url.error };
    await saveSetting("site.url", url.value, admin.id);
  } else {
    await clearSetting("site.url");
  }
  await saveSetting("security.resetLinkMinutes", String(minutes.value), admin.id);
  await saveSetting("security.resetRequestsPerHour", String(perHour.value), admin.id);

  await logSettingChange("Site & security", "Updated the website address for e-mailed links and the password-reset rules", admin.email);
  revalidatePath("/admin/settings", "layout");
  return { success: "Saved. New password-reset links follow these rules." };
}

// ---------------------------------------------------------------------------
// Team (admin accounts)
// ---------------------------------------------------------------------------

async function activeSuperAdminCount(): Promise<number> {
  return prisma.adminUser.count({ where: { role: "SUPER_ADMIN", active: true } });
}

export async function createTeamMember(_prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const admin = await settingsAdmin();
  if (!admin) return NOT_ALLOWED;

  const parsed = newMemberSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the details and try again." };

  const roleError = checkNewMemberRole(admin.role, parsed.data.role);
  if (roleError) return { error: roleError };

  const existing = await prisma.adminUser.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { error: "That e-mail already has an account." };

  await prisma.adminUser.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      passwordHash: await hashPassword(parsed.data.password),
    },
  });
  await logSettingChange("Team", `Added ${parsed.data.email} as ${ROLE_LABELS[parsed.data.role]}`, admin.email);
  revalidatePath("/admin/settings/team");
  return { success: `Added ${parsed.data.email}. Tell them the first password; they can change it after signing in, or use “Forgot password”.` };
}

export async function updateTeamMember(_prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const admin = await settingsAdmin();
  if (!admin) return NOT_ALLOWED;

  const id = String(formData.get("id") ?? "");
  const target = await prisma.adminUser.findUnique({ where: { id } });
  if (!target) return { error: "That account no longer exists." };

  const roleRaw = String(formData.get("role") ?? target.role);
  const role = (TEAM_ROLES as readonly string[]).includes(roleRaw) ? (roleRaw as TeamRole) : null;
  if (!role) return { error: "Choose a valid role." };
  const active = formData.get("active") === "on";

  const reason = checkTeamChange(
    { id: admin.id, role: admin.role, active: admin.active },
    { id: target.id, role: target.role, active: target.active },
    { role, active },
    await activeSuperAdminCount()
  );
  if (reason) return { error: reason };

  const notes: string[] = [];
  if (role !== target.role) notes.push(`role ${ROLE_LABELS[target.role]} -> ${ROLE_LABELS[role]}`);
  if (active !== target.active) notes.push(active ? "switched on" : "switched off");
  if (notes.length === 0) return { success: "No changes." };

  await prisma.$transaction([
    prisma.adminUser.update({ where: { id: target.id }, data: { role, active } }),
    // A switched-off or demoted account is signed out right away.
    ...(!active || role !== target.role ? [prisma.adminSession.deleteMany({ where: { adminUserId: target.id } })] : []),
  ]);
  await logSettingChange("Team", `${target.email}: ${notes.join(", ")}`, admin.email);
  revalidatePath("/admin/settings/team");
  return { success: `Updated ${target.email}.` };
}

export async function signOutTeamMember(_prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const admin = await settingsAdmin();
  if (!admin) return NOT_ALLOWED;
  const target = await prisma.adminUser.findUnique({ where: { id: String(formData.get("id") ?? "") } });
  if (!target) return { error: "That account no longer exists." };
  const reason = checkTeamChange(
    { id: admin.id, role: admin.role, active: admin.active },
    { id: target.id, role: target.role, active: target.active },
    {},
    await activeSuperAdminCount()
  );
  if (reason) return { error: reason };
  const removed = await prisma.adminSession.deleteMany({ where: { adminUserId: target.id } });
  await logSettingChange("Team", `Signed ${target.email} out everywhere`, admin.email);
  revalidatePath("/admin/settings/team");
  return { success: `${target.email} was signed out of ${removed.count} session(s).` };
}

/** Sends the person the normal "choose a new password" link (same rules and limits as "Forgot password"). */
export async function sendTeamMemberResetLink(_prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const admin = await settingsAdmin();
  if (!admin) return NOT_ALLOWED;
  const target = await prisma.adminUser.findUnique({ where: { id: String(formData.get("id") ?? "") } });
  if (!target) return { error: "That account no longer exists." };
  const reason = checkTeamChange(
    { id: admin.id, role: admin.role, active: admin.active },
    { id: target.id, role: target.role, active: target.active },
    {},
    await activeSuperAdminCount()
  );
  if (reason) return { error: reason };
  await issueResetEmail(target.email);
  await logSettingChange("Team", `Sent a password-reset link to ${target.email}`, admin.email);
  return { success: `If e-mail is set up, a reset link is on its way to ${target.email}.` };
}

// ---------------------------------------------------------------------------
// My account
// ---------------------------------------------------------------------------

export async function updateMyName(_prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const admin = await requireAdmin();
  const parsed = profileNameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter your name." };
  await prisma.adminUser.update({ where: { id: admin.id }, data: { name: parsed.data.name } });
  revalidatePath("/admin/settings", "layout");
  return { success: "Name updated." };
}

/** Ends every other sign-in of this account (other browsers/devices), keeping this one. */
export async function signOutOtherSessions(): Promise<SettingsFormState> {
  const admin = await requireAdmin();
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const removed = await prisma.adminSession.deleteMany({
    where: { adminUserId: admin.id, ...(token ? { NOT: { tokenHash: hashToken(token) } } : {}) },
  });
  revalidatePath("/admin/settings/account");
  return { success: removed.count === 0 ? "You were not signed in anywhere else." : `Signed out of ${removed.count} other session(s).` };
}
