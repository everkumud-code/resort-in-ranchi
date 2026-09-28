"use client";

import { useActionState } from "react";
import type { VenueSpace } from "@prisma/client";
import { addOwnerVenueSpace, deleteOwnerVenueSpace, type OwnerActionState } from "./actions";

const initial: OwnerActionState = {};
const inputClass =
  "w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

export default function OwnerVenueSpaces({ propertyId, venueSpaces }: { propertyId: string; venueSpaces: VenueSpace[] }) {
  const action = addOwnerVenueSpace.bind(null, propertyId);
  const [state, formAction, pending] = useActionState(action, initial);
  const errors = state.fieldErrors ?? {};

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="font-serif text-lg font-semibold text-brand-dark">Venue spaces ({venueSpaces.length})</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        Add each distinct space you offer — e.g. a banquet hall, lawn, or conference room.
      </p>

      {state.success && (
        <p role="status" className="mt-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
          Saved.
        </p>
      )}

      {venueSpaces.length > 0 && (
        <ul className="mt-3 space-y-2">
          {venueSpaces.map((vs) => (
            <li key={vs.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-100 px-3 py-2 text-sm">
              {vs.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- owner-pasted external URL, not a Next-optimized local asset
                <img src={vs.imageUrl} alt={vs.name} className="h-12 w-16 shrink-0 rounded-md border border-slate-200 object-cover" />
              )}
              <span className="min-w-0 flex-1">
                <span className="font-medium text-slate-900">{vs.name}</span>
                {vs.type && <span className="text-slate-500"> · {vs.type}</span>}
                {(vs.capacityMin || vs.capacityMax) && (
                  <span className="text-slate-500"> · {vs.capacityMin ?? "?"}–{vs.capacityMax ?? "?"}</span>
                )}
              </span>
              <form action={deleteOwnerVenueSpace.bind(null, propertyId, vs.id)}>
                <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="mt-4 space-y-2 rounded-md border border-dashed border-slate-300 p-3">
        <p className="text-xs font-medium text-slate-500">Add venue space</p>
        {state.error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input name="name" placeholder="Name" className={inputClass} required />
          <input name="type" placeholder="e.g. Lawn, Banquet Hall" className={inputClass} />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input name="capacityMin" type="number" placeholder="Capacity min" className={inputClass} />
          <input name="capacityMax" type="number" placeholder="Capacity max" className={inputClass} />
        </div>
        {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
        <textarea name="description" placeholder="Description (optional)" rows={2} className={inputClass} />
        <input name="imageUrl" placeholder="Picture of this space — direct image URL (optional)" className={inputClass} />
        {errors.imageUrl && <p className="text-xs text-red-600">{errors.imageUrl}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add venue space"}
        </button>
      </form>
    </div>
  );
}
