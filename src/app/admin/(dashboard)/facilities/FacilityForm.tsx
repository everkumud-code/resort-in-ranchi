"use client";

import { useActionState } from "react";
import type { Facility } from "@prisma/client";
import { createFacility, updateFacility, type FacilityFormState } from "./actions";

const initialState: FacilityFormState = {};
const inputClass =
  "w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

export default function FacilityForm({ facility }: { facility?: Facility }) {
  const action = facility ? updateFacility.bind(null, facility.id) : createFacility;
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
        <label htmlFor="name" className="block text-xs font-medium text-slate-500">
          Name
        </label>
        <input id="name" name="name" defaultValue={facility?.name ?? ""} className={inputClass} required />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="slug" className="block text-xs font-medium text-slate-500">
          Slug
        </label>
        <input id="slug" name="slug" defaultValue={facility?.slug ?? ""} className={inputClass} required />
        {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug}</p>}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving…" : facility ? "Save changes" : "Create facility"}
      </button>
    </form>
  );
}
