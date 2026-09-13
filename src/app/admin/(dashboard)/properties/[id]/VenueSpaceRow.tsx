"use client";

import { useActionState } from "react";
import type { VenueSpace } from "@prisma/client";
import ConfirmForm from "@/components/admin/ConfirmForm";
import { deleteVenueSpace, updateVenueSpace, type VenueSpaceFormState } from "../venueSpaceActions";

const initialState: VenueSpaceFormState = {};
const inputClass =
  "w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

export default function VenueSpaceRow({ venueSpace }: { venueSpace: VenueSpace }) {
  const action = updateVenueSpace.bind(null, venueSpace.id);
  const [state, formAction, pending] = useActionState(action, initialState);
  const errors = state.fieldErrors ?? {};
  const deleteAction = deleteVenueSpace.bind(null, venueSpace.id);

  return (
    <div className="border-b border-slate-100 py-4 last:border-0">
      {venueSpace.sourceRecordId && (
        <p className="mb-2 text-xs text-slate-400">
          Imported record — source ID {venueSpace.sourceRecordId}
          {venueSpace.rawParentName ? ` · raw parent "${venueSpace.rawParentName}"` : ""}
        </p>
      )}

      <div className="flex gap-4">
        <form action={formAction} className="flex-1 space-y-2">
          {state.error && (
            <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          )}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-500">Name</label>
              <input name="name" defaultValue={venueSpace.name} className={inputClass} required />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500">Type</label>
              <input name="type" defaultValue={venueSpace.type ?? ""} placeholder="e.g. Lawn, Banquet Hall" className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-500">Capacity min</label>
              <input name="capacityMin" type="number" defaultValue={venueSpace.capacityMin ?? ""} className={inputClass} />
              {errors.capacityMin && <p className="mt-1 text-xs text-red-600">{errors.capacityMin}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500">Capacity max</label>
              <input name="capacityMax" type="number" defaultValue={venueSpace.capacityMax ?? ""} className={inputClass} />
              {errors.capacityMax && <p className="mt-1 text-xs text-red-600">{errors.capacityMax}</p>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Description</label>
            <textarea name="description" defaultValue={venueSpace.description ?? ""} rows={2} className={inputClass} />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save"}
          </button>
        </form>

        <div className="self-start">
          <ConfirmForm
            action={deleteAction}
            confirmMessage={`Delete the venue space "${venueSpace.name}"? This can't be undone.`}
            label="Delete"
            className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
          />
        </div>
      </div>
    </div>
  );
}
