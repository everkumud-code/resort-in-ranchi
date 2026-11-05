"use client";

import { useActionState } from "react";
import { resetOwnerPassword, type OwnerResetPasswordState } from "../actions";

const initialState: OwnerResetPasswordState = {};
const inputClass =
  "mt-1 w-full rounded-md border border-brand/20 px-3 py-2 text-sm text-brand-dark focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-brand-teal";

export default function ResetOwnerPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetOwnerPassword, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      <div>
        <label htmlFor="owner-reset-new" className="block text-xs font-medium text-brand-dark/70">
          New password
        </label>
        <input id="owner-reset-new" name="newPassword" type="password" required minLength={8} autoComplete="new-password" autoFocus className={inputClass} />
        <p className="mt-1 text-xs text-brand/60">At least 8 characters.</p>
      </div>
      <div>
        <label htmlFor="owner-reset-confirm" className="block text-xs font-medium text-brand-dark/70">
          Confirm new password
        </label>
        <input id="owner-reset-confirm" name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
      </div>
      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}
