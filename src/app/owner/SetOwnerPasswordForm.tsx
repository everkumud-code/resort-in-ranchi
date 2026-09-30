"use client";

import { useActionState } from "react";
import { setOwnerPassword, type OwnerPasswordFormState } from "./actions";

const initialState: OwnerPasswordFormState = {};
const inputClass =
  "mt-1 w-full rounded-md border border-brand/20 px-3 py-2 text-sm text-brand-dark focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-brand-teal";

/** Lets the owner set up (or change) their own email+password for quick future logins — never set by us or an admin on their behalf. */
export default function SetOwnerPasswordForm({ currentEmail }: { currentEmail: string | null }) {
  const [state, formAction, pending] = useActionState(setOwnerPassword, initialState);

  return (
    <form action={formAction} className="mt-3 space-y-3">
      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          Saved — you can now sign in with this email and password anytime from the vendor login page.
        </p>
      )}
      <div>
        <label htmlFor="set-password-email" className="block text-xs font-medium text-brand-dark/70">
          Email
        </label>
        <input
          id="set-password-email"
          name="email"
          type="email"
          required
          autoComplete="username"
          defaultValue={currentEmail ?? ""}
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="set-password-password" className="block text-xs font-medium text-brand-dark/70">
            {currentEmail ? "New password" : "Password"}
          </label>
          <input
            id="set-password-password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="set-password-confirm" className="block text-xs font-medium text-brand-dark/70">
            Confirm password
          </label>
          <input
            id="set-password-confirm"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand-teal px-4 py-2 text-sm font-semibold text-white hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving…" : currentEmail ? "Update login" : "Set up email + password login"}
      </button>
    </form>
  );
}
