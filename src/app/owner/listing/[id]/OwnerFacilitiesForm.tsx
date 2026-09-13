"use client";

import { useActionState } from "react";
import { updateOwnerFacilities, type OwnerActionState } from "./actions";

const initial: OwnerActionState = {};

export default function OwnerFacilitiesForm({
  propertyId,
  allFacilities,
  selectedFacilityIds,
}: {
  propertyId: string;
  allFacilities: { id: string; name: string }[];
  selectedFacilityIds: string[];
}) {
  const selected = new Set(selectedFacilityIds);
  const action = updateOwnerFacilities.bind(null, propertyId);
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="font-serif text-lg font-semibold text-brand-dark">Facilities</h2>
      <p className="mt-0.5 text-xs text-slate-500">Select everything available at your property.</p>

      <form action={formAction} className="mt-3 space-y-3">
        {state.success && (
          <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
            Saved.
          </p>
        )}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {allFacilities.map((f) => (
            <label key={f.id} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="facilityIds"
                value={f.id}
                defaultChecked={selected.has(f.id)}
                className="h-4 w-4 rounded border-slate-300"
              />
              {f.name}
            </label>
          ))}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-brand-teal px-4 py-2 text-sm font-semibold text-white hover:bg-brand-teal/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save facilities"}
        </button>
      </form>
    </div>
  );
}
