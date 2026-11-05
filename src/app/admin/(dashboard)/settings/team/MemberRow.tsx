"use client";

import { useActionState } from "react";
import { sendTeamMemberResetLink, signOutTeamMember, updateTeamMember, type SettingsFormState } from "../actions";
import { FormNotice, inputClass, secondaryButton } from "../ui";
import { ROLE_LABELS, type TeamRole } from "@/lib/settings/team";

const initial: SettingsFormState = {};

export interface MemberView {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  active: boolean;
  lastLogin: string | null;
  sessions: number;
}

export default function MemberRow({
  member,
  isSelf,
  manageable,
  roleOptions,
}: {
  member: MemberView;
  isSelf: boolean;
  manageable: boolean;
  roleOptions: TeamRole[];
}) {
  const [saveState, saveAction, saving] = useActionState(updateTeamMember, initial);
  const [outState, outAction, signingOut] = useActionState(signOutTeamMember, initial);
  const [resetState, resetAction, sending] = useActionState(sendTeamMemberResetLink, initial);

  const lastLogin = member.lastLogin
    ? new Date(member.lastLogin).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })
    : "never";
  // Roles you can pick; always include the current one so the box shows the truth.
  const options = Array.from(new Set<TeamRole>([member.role, ...roleOptions]));

  return (
    <li className="py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-slate-900">
          {member.name} {isSelf && <span className="text-xs font-normal text-slate-500">(you)</span>}
          {!member.active && <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-[11px] font-medium text-red-700">Switched off</span>}
        </p>
        <p className="text-xs text-slate-500">
          {member.email} · last sign-in {lastLogin} · {member.sessions} active sign-in(s)
        </p>
      </div>

      {manageable ? (
        <div className="mt-3 space-y-2">
          <form action={saveAction} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="id" value={member.id} />
            <div>
              <label htmlFor={`role-${member.id}`} className="block text-xs font-medium text-slate-600">
                Role
              </label>
              <select id={`role-${member.id}`} name="role" defaultValue={member.role} className={`${inputClass} w-44`}>
                {options.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
              <input type="checkbox" name="active" defaultChecked={member.active} className="h-4 w-4" />
              Can sign in
            </label>
            <button type="submit" disabled={saving} className={secondaryButton}>
              {saving ? "Saving…" : "Save"}
            </button>
          </form>
          <div className="flex flex-wrap gap-2">
            <form action={resetAction}>
              <input type="hidden" name="id" value={member.id} />
              <button type="submit" disabled={sending} className={secondaryButton}>
                {sending ? "Sending…" : "E-mail a password-reset link"}
              </button>
            </form>
            <form action={outAction}>
              <input type="hidden" name="id" value={member.id} />
              <button type="submit" disabled={signingOut} className={secondaryButton}>
                {signingOut ? "Working…" : "Sign out everywhere"}
              </button>
            </form>
          </div>
          <FormNotice state={saveState.error || saveState.success ? saveState : outState.error || outState.success ? outState : resetState} />
        </div>
      ) : (
        <p className="mt-2 text-xs text-slate-500">
          {isSelf ? `Role: ${ROLE_LABELS[member.role]}. You cannot change or switch off your own account.` : `Role: ${ROLE_LABELS[member.role]}. Only a Super admin can change this account.`}
        </p>
      )}
    </li>
  );
}
