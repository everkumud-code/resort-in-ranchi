import { z } from "zod";

/**
 * Who may manage which admin accounts. Pure so the rules are tested directly.
 *
 *  - EDITOR      : no access to the Settings console except "My account".
 *  - ADMIN       : manages EDITOR accounts only.
 *  - SUPER_ADMIN : manages everyone, but not themselves into a lock-out.
 */

export type TeamRole = "SUPER_ADMIN" | "ADMIN" | "EDITOR";

export const TEAM_ROLES: readonly TeamRole[] = ["SUPER_ADMIN", "ADMIN", "EDITOR"];

export const ROLE_LABELS: Record<TeamRole, string> = {
  SUPER_ADMIN: "Super admin",
  ADMIN: "Admin",
  EDITOR: "Editor",
};

export const ROLE_DESCRIPTIONS: Record<TeamRole, string> = {
  SUPER_ADMIN: "Everything, including other admins and all settings.",
  ADMIN: "Settings, e-mail, vendor and creator access, and Editor accounts.",
  EDITOR: "Day-to-day content work. No Settings console.",
};

export function canOpenSettings(role: TeamRole): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function rolesAssignableBy(actor: TeamRole): TeamRole[] {
  if (actor === "SUPER_ADMIN") return ["SUPER_ADMIN", "ADMIN", "EDITOR"];
  if (actor === "ADMIN") return ["EDITOR"];
  return [];
}

export interface TeamMember {
  id: string;
  role: TeamRole;
  active: boolean;
}

export interface TeamChange {
  role?: TeamRole;
  active?: boolean;
}

/**
 * Returns a plain-words reason when the change is not allowed, or null.
 * `activeSuperAdmins` counts active SUPER_ADMIN accounts before the change.
 */
export function checkTeamChange(actor: TeamMember, target: TeamMember, change: TeamChange, activeSuperAdmins: number): string | null {
  if (!canOpenSettings(actor.role)) return "You do not have permission to manage accounts.";

  if (actor.id === target.id) {
    if (change.role !== undefined && change.role !== target.role) return "You cannot change your own role. Ask another super admin.";
    if (change.active === false) return "You cannot switch off your own account.";
    return null;
  }

  if (actor.role === "ADMIN" && target.role !== "EDITOR") return "Admins can only manage Editor accounts.";
  if (change.role !== undefined && !rolesAssignableBy(actor.role).includes(change.role)) return `You cannot give the ${ROLE_LABELS[change.role]} role.`;

  const losesSuper =
    target.role === "SUPER_ADMIN" && target.active && ((change.role !== undefined && change.role !== "SUPER_ADMIN") || change.active === false);
  if (losesSuper && activeSuperAdmins <= 1) return "There must always be at least one active super admin.";

  return null;
}

export function checkNewMemberRole(actor: TeamRole, role: TeamRole): string | null {
  if (!canOpenSettings(actor)) return "You do not have permission to add accounts.";
  if (!rolesAssignableBy(actor).includes(role)) return `You cannot create ${ROLE_LABELS[role]} accounts.`;
  return null;
}

export const newMemberSchema = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(80, "Keep the name under 80 characters."),
  email: z.string().trim().toLowerCase().min(1, "Enter an e-mail.").email("Enter a valid e-mail."),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "EDITOR"]),
  password: z.string().min(8, "The first password must be at least 8 characters."),
});

export const profileNameSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(80, "Keep the name under 80 characters."),
});
