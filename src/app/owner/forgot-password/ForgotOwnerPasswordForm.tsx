"use client";

import { useActionState } from "react";
import { requestOwnerPasswordReset, type OwnerForgotPasswordState } from "../actions";

const initialState: OwnerForgotPasswordState = {};
const inputClass =
  "mt-1 w-full rounded-md border border-brand/20 px-3 py-2 text-sm text-brand-dark focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-brand-teal";

export default function ForgotOwnerPasswordForm() {
  const [state, formAction, pending] = useActionState(requestOwnerPasswordReset, initialState);

  if (state.sent) {
    return (
      <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
        If that email is the one you use to sign in as a vendor, a link to choose a new password is on its way. It works once and expires
        in one hour. Check the spam folder if you do not see it.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="owner-forgot-email" className="block text-xs font-medium text-brand-dark/70">
          Email
        </label>
        <input id="owner-forgot-email" name="email" type="email" required autoComplete="username" autoFocus className={inputClass} />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
