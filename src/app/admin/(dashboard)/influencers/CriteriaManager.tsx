"use client";

import { useActionState } from "react";
import { createCriterion, deleteCriterion, type CriterionFormState } from "./actions";

const initial: CriterionFormState = {};

export default function CriteriaManager({ criteria }: { criteria: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(createCriterion, initial);

  return (
    <div className="rounded-lg border border-slate-200 bg-panel-green p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Rating criteria</h2>
      <p className="mt-1 text-xs text-slate-500">
        What influencers are rated against (e.g. Content quality, Local reach). Admin-set only — never a public review.
      </p>

      {criteria.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {criteria.map((c) => (
            <li key={c.id} className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
              {c.name}
              <form action={deleteCriterion.bind(null, c.id)}>
                <button type="submit" className="ml-1 text-slate-400 hover:text-red-600" aria-label={`Remove ${c.name}`}>
                  &times;
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="mt-3 flex items-end gap-2">
        <div className="flex-1">
          <label htmlFor="criterion-name" className="block text-xs font-medium text-slate-500">
            Add criterion
          </label>
          <input id="criterion-name" name="name" placeholder="e.g. Content quality" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" required />
        </div>
        <button type="submit" disabled={pending} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">
          {pending ? "Adding…" : "Add"}
        </button>
      </form>
      {state.error && <p className="mt-1 text-xs text-red-600">{state.error}</p>}
    </div>
  );
}
