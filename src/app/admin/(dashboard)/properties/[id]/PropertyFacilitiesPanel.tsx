"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updatePropertyFacilities, type UpdateFacilitiesState } from "../actions";

const initialState: UpdateFacilitiesState = {};

export default function PropertyFacilitiesPanel({
  propertyId,
  allFacilities,
  selectedFacilityIds,
}: {
  propertyId: string;
  allFacilities: { id: string; name: string }[];
  selectedFacilityIds: string[];
}) {
  const action = updatePropertyFacilities.bind(null, propertyId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const selected = new Set(selectedFacilityIds);

  return (
    <div className="rounded-lg border border-slate-200 bg-panel-green p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Facilities</h2>

      {state.error && (
        <p role="alert" className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      {allFacilities.length === 0 ? (
        <p className="mt-2 text-sm text-slate-400">
          No facilities defined yet.{" "}
          <Link href="/admin/facilities" className="underline">
            Create facilities
          </Link>{" "}
          first, then assign them here.
        </p>
      ) : (
        <form action={formAction} className="mt-3 space-y-3">
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
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save facilities"}
          </button>
        </form>
      )}
    </div>
  );
}
