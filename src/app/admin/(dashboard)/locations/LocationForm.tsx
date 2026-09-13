"use client";

import { useActionState } from "react";
import type { Location } from "@prisma/client";
import { createLocation, updateLocation, type LocationFormState } from "./actions";

const initialState: LocationFormState = {};
const inputClass =
  "w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

export default function LocationForm({
  location,
  parentOptions,
}: {
  location?: Location;
  parentOptions: Location[];
}) {
  const action = location ? updateLocation.bind(null, location.id) : createLocation;
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
        <input id="name" name="name" defaultValue={location?.name ?? ""} className={inputClass} required />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="slug" className="block text-xs font-medium text-slate-500">
          Slug
        </label>
        <input id="slug" name="slug" defaultValue={location?.slug ?? ""} className={inputClass} required />
        {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug}</p>}
      </div>

      <div>
        <label htmlFor="parentId" className="block text-xs font-medium text-slate-500">
          Parent location
        </label>
        <select id="parentId" name="parentId" defaultValue={location?.parentId ?? ""} className={inputClass}>
          <option value="">— None (top level) —</option>
          {parentOptions
            .filter((l) => l.id !== location?.id)
            .map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
        </select>
        {errors.parentId && <p className="mt-1 text-xs text-red-600">{errors.parentId}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-xs font-medium text-slate-500">
          Description
        </label>
        <textarea id="description" name="description" defaultValue={location?.description ?? ""} rows={3} className={inputClass} />
      </div>

      <div>
        <label htmlFor="seoTitle" className="block text-xs font-medium text-slate-500">
          SEO title
        </label>
        <input id="seoTitle" name="seoTitle" defaultValue={location?.seoTitle ?? ""} className={inputClass} />
      </div>

      <div>
        <label htmlFor="seoDescription" className="block text-xs font-medium text-slate-500">
          SEO description
        </label>
        <textarea id="seoDescription" name="seoDescription" defaultValue={location?.seoDescription ?? ""} rows={2} className={inputClass} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving…" : location ? "Save changes" : "Create location"}
      </button>
    </form>
  );
}
