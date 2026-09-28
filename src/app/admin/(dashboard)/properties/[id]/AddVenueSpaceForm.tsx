"use client";

import { useActionState } from "react";
import { addVenueSpace, type VenueSpaceFormState } from "../venueSpaceActions";

const initialState: VenueSpaceFormState = {};
const inputClass =
  "w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

export default function AddVenueSpaceForm({ propertyId }: { propertyId: string }) {
  const action = addVenueSpace.bind(null, propertyId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-2 rounded-md border border-dashed border-slate-300 p-3">
      <p className="text-xs font-medium text-slate-500">Add venue space</p>
      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-500">Name</label>
          <input name="name" className={inputClass} required />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Type</label>
          <input name="type" placeholder="e.g. Lawn, Banquet Hall" className={inputClass} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-500">Capacity min</label>
          <input name="capacityMin" type="number" className={inputClass} />
          {errors.capacityMin && <p className="mt-1 text-xs text-red-600">{errors.capacityMin}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Capacity max</label>
          <input name="capacityMax" type="number" className={inputClass} />
          {errors.capacityMax && <p className="mt-1 text-xs text-red-600">{errors.capacityMax}</p>}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500">Description</label>
        <textarea name="description" rows={2} className={inputClass} />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500">Image URL (optional — a direct link ending in .jpg / .png / .webp)</label>
        <input name="imageUrl" placeholder="https://…" className={inputClass} />
        {errors.imageUrl && <p className="mt-1 text-xs text-red-600">{errors.imageUrl}</p>}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add venue space"}
      </button>
    </form>
  );
}
