"use client";

import { useActionState } from "react";
import { updatePartnerEligibility, setPartnerEnabled, type UpdatePartnerEligibilityState } from "./actions";
import type { CategoryOption } from "./PartnerForm";
import type { LocationOption } from "./PartnerForm";

const initialState: UpdatePartnerEligibilityState = {};

export default function PartnerEligibilityForm({
  partnerId,
  enabled,
  eligibleCategorySlugs,
  eligibleLocationSlugs,
  priority,
  monthlyLeadCap,
  categories,
  locations,
}: {
  partnerId: string;
  enabled: boolean;
  eligibleCategorySlugs: string[];
  eligibleLocationSlugs: string[];
  priority: number;
  monthlyLeadCap: number | null;
  categories: CategoryOption[];
  locations: LocationOption[];
}) {
  const updateAction = updatePartnerEligibility.bind(null, partnerId);
  const [state, formAction] = useActionState(updateAction, initialState);
  const disableAction = setPartnerEnabled.bind(null, partnerId, !enabled);

  return (
    <div className="space-y-3">
      <form action={disableAction}>
        <button
          type="submit"
          className={
            enabled
              ? "rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800 hover:bg-green-200"
              : "rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-300"
          }
        >
          {enabled ? "Enabled — click to disable" : "Disabled — click to enable"}
        </button>
      </form>

      <form action={formAction} className="space-y-3">
        {state.error && <p role="alert" className="text-xs text-red-600">{state.error}</p>}

        <div>
          <p className="text-xs font-medium text-slate-500">Eligible categories</p>
          <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
            {categories.map((c) => (
              <label key={c.slug} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="eligibleCategorySlugs"
                  value={c.slug}
                  defaultChecked={eligibleCategorySlugs.includes(c.slug)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                {c.name}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-slate-500">Eligible locations (leave all unchecked for no restriction)</p>
          <div className="mt-1 grid max-h-40 grid-cols-2 gap-x-4 gap-y-1 overflow-y-auto sm:grid-cols-3">
            {locations.map((l) => (
              <label key={l.slug} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="eligibleLocationSlugs"
                  value={l.slug}
                  defaultChecked={eligibleLocationSlugs.includes(l.slug)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                {l.name}
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500" htmlFor={`priority-${partnerId}`}>
              Priority (higher ranks first)
            </label>
            <input
              id={`priority-${partnerId}`}
              type="number"
              name="priority"
              defaultValue={priority}
              className="mt-1 w-24 rounded-md border border-slate-300 px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500" htmlFor={`cap-${partnerId}`}>
              Monthly lead cap (blank = unlimited)
            </label>
            <input
              id={`cap-${partnerId}`}
              type="number"
              name="monthlyLeadCap"
              min={0}
              defaultValue={monthlyLeadCap ?? ""}
              className="mt-1 w-32 rounded-md border border-slate-300 px-2 py-1 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-md border border-slate-300 bg-panel-green px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Save settings
          </button>
        </div>
      </form>
    </div>
  );
}
