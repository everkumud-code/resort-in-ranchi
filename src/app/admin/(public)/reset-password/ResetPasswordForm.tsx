"use client";

import { useActionState } from "react";
import { resetPassword, type ResetPasswordState } from "@/lib/auth/actions";

const initialState: ResetPasswordState = {};
const inputClass =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPassword, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700">
          New password
        </label>
        <input id="newPassword" name="newPassword" type="password" required minLength={8} autoComplete="new-password" autoFocus className={inputClass} />
        <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>
      </div>
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
          Confirm new password
        </label>
        <input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
      </div>

      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}
