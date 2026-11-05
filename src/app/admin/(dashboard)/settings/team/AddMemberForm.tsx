"use client";

import { useActionState } from "react";
import { createTeamMember, type SettingsFormState } from "../actions";
import { Card, FormNotice, hintClass, inputClass, labelClass, primaryButton } from "../ui";
import { ROLE_LABELS, type TeamRole } from "@/lib/settings/team";

const initial: SettingsFormState = {};

export default function AddMemberForm({ roles }: { roles: TeamRole[] }) {
  const [state, action, pending] = useActionState(createTeamMember, initial);

  return (
    <Card title="Add a person" description="Gives them their own sign-in. They can change the first password after signing in.">
      <form action={action} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FormNotice state={state} />
        </div>
        <div>
          <label htmlFor="new-name" className={labelClass}>
            Name
          </label>
          <input id="new-name" name="name" type="text" required maxLength={80} className={inputClass} />
        </div>
        <div>
          <label htmlFor="new-email" className={labelClass}>
            E-mail (their sign-in)
          </label>
          <input id="new-email" name="email" type="email" required autoComplete="off" className={inputClass} />
        </div>
        <div>
          <label htmlFor="new-role" className={labelClass}>
            Role
          </label>
          <select id="new-role" name="role" defaultValue="EDITOR" className={inputClass}>
            {roles.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="new-password" className={labelClass}>
            First password
          </label>
          <input id="new-password" name="password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
          <p className={hintClass}>At least 8 characters. Tell them in person or by phone, not in a group chat.</p>
        </div>
        <div className="sm:col-span-2">
          <button type="submit" disabled={pending} className={primaryButton}>
            {pending ? "Adding…" : "Add person"}
          </button>
        </div>
      </form>
    </Card>
  );
}
