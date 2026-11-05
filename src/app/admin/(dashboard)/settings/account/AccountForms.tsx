"use client";

import { useActionState } from "react";
import { signOutOtherSessions, updateMyName, type SettingsFormState } from "../actions";
import { Card, FormNotice, inputClass, labelClass, primaryButton, secondaryButton } from "../ui";

const initial: SettingsFormState = {};

export default function AccountForms({ name, sessions }: { name: string; sessions: number }) {
  const [nameState, nameAction, savingName] = useActionState(updateMyName, initial);
  const [outState, outAction, signingOut] = useActionState(signOutOtherSessions, initial);

  return (
    <>
      <Card title="My name">
        <form action={nameAction} className="space-y-3">
          <FormNotice state={nameState} />
          <div>
            <label htmlFor="my-name" className={labelClass}>
              Name
            </label>
            <input id="my-name" name="name" type="text" required maxLength={80} defaultValue={name} className={inputClass} />
          </div>
          <button type="submit" disabled={savingName} className={primaryButton}>
            {savingName ? "Saving…" : "Save name"}
          </button>
        </form>
      </Card>
      <Card title="Where I am signed in" description={`${sessions} active sign-in(s), including this one.`}>
        <form action={outAction} className="space-y-3">
          <FormNotice state={outState} />
          <button type="submit" disabled={signingOut} className={secondaryButton}>
            {signingOut ? "Working…" : "Sign out all other devices"}
          </button>
        </form>
      </Card>
    </>
  );
}
