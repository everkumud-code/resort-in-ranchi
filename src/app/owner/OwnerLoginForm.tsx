"use client";

import { useActionState } from "react";
import { loginOwnerWithPassword, type OwnerLoginFormState } from "./actions";

const initialState: OwnerLoginFormState = {};
const inputClass =
  "mt-1 w-full rounded-md border border-brand/20 px-3 py-2 text-sm text-brand-dark focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-brand-teal";

/** For an owner who has already set up email+password from their dashboard — an alternative to needing a fresh one-time link every time. */
export default function OwnerLoginForm() {
  const [state, formAction, pending] = useActionState(loginOwnerWithPassword, initialState);

  return (
    <form action={formAction} className="space-y-3">
      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="owner-login-email" className="block text-xs font-medium text-brand-dark/70">
          Email
        </label>
        <input id="owner-login-email" name="email" type="email" required autoComplete="username" className={inputClass} />
      </div>
      <div>
        <label htmlFor="owner-login-password" className="block text-xs font-medium text-brand-dark/70">
          Password
        </label>
        <input id="owner-login-password" name="password" type="password" required autoComplete="current-password" className={inputClass} />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
