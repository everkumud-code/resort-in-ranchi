"use client";

import { useActionState } from "react";
import { createLeadPartner, type CreatePartnerState } from "./actions";

const initialState: CreatePartnerState = {};

export interface PropertyOption {
  id: string;
  name: string;
}

export interface CategoryOption {
  slug: string;
  name: string;
}

export interface LocationOption {
  slug: string;
  name: string;
}

export default function PartnerForm({
  properties,
  categories,
  locations,
}: {
  properties: PropertyOption[];
  categories: CategoryOption[];
  locations: LocationOption[];
}) {
  const [state, formAction, pending] = useActionState(createLeadPartner, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Configure a new lead partner</h3>
      {state.error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

      <div>
        <label htmlFor="propertyId" className="block text-sm font-medium text-slate-700">
          Property
        </label>
        <select id="propertyId" name="propertyId" required defaultValue="" className="mt-1 w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="" disabled>
            Choose a property
          </option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="block text-sm font-medium text-slate-700">Eligible categories</p>
        <p className="text-xs text-slate-500">This partner may receive an enquiry only for the categories checked below.</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {categories.map((c) => (
            <label key={c.slug} className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="eligibleCategorySlugs" value={c.slug} className="h-4 w-4 rounded border-slate-300" />
              {c.name}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="block text-sm font-medium text-slate-700">Eligible locations</p>
        <p className="text-xs text-slate-500">Leave all unchecked for no location restriction.</p>
        <div className="mt-2 grid max-h-40 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
          {locations.map((l) => (
            <label key={l.slug} className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="eligibleLocationSlugs" value={l.slug} className="h-4 w-4 rounded border-slate-300" />
              {l.name}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-slate-700">
            Priority
          </label>
          <input id="priority" type="number" name="priority" defaultValue={0} className="mt-1 w-24 rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="monthlyLeadCap" className="block text-sm font-medium text-slate-700">
            Monthly lead cap
          </label>
          <input
            id="monthlyLeadCap"
            type="number"
            name="monthlyLeadCap"
            min={0}
            placeholder="Unlimited"
            className="mt-1 w-32 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Add partner"}
      </button>
    </form>
  );
}
