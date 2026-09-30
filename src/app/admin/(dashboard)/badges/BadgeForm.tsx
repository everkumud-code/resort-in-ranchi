"use client";

import { useActionState } from "react";
import type { TrustBadge } from "@prisma/client";
import { createTrustBadge, updateTrustBadge, type TrustBadgeFormState } from "./actions";

const initialState: TrustBadgeFormState = {};
const inputClass =
  "w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

export default function BadgeForm({ badge }: { badge?: TrustBadge }) {
  const action = badge ? updateTrustBadge.bind(null, badge.id) : createTrustBadge;
  const [state, formAction, pending] = useActionState(action, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="label" className="block text-xs font-medium text-slate-500">
          Label (shown on the pill)
        </label>
        <input id="label" name="label" defaultValue={badge?.label ?? ""} className={inputClass} required maxLength={40} />
        {errors.label && <p className="mt-1 text-xs text-red-600">{errors.label}</p>}
      </div>

      <div>
        <label htmlFor="key" className="block text-xs font-medium text-slate-500">
          Key (internal id, lowercase-with-hyphens)
        </label>
        <input id="key" name="key" defaultValue={badge?.key ?? ""} className={inputClass} required />
        {errors.key && <p className="mt-1 text-xs text-red-600">{errors.key}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-xs font-medium text-slate-500">
          Description (shown on hover — what this badge actually means)
        </label>
        <textarea id="description" name="description" defaultValue={badge?.description ?? ""} rows={3} className={inputClass} required maxLength={200} />
        {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving…" : badge ? "Save changes" : "Create badge"}
      </button>
    </form>
  );
}
