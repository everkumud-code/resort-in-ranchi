"use client";

import { useActionState } from "react";
import { addPropertyImage, type PropertyImageFormState } from "../imageActions";
import {
  PROPERTY_IMAGE_KIND_LABELS,
  PROPERTY_IMAGE_KIND_VALUES,
  PROPERTY_IMAGE_TAG_LABELS,
  PROPERTY_IMAGE_TAG_VALUES,
} from "@/lib/validation/propertyImage";

const initialState: PropertyImageFormState = {};
const inputClass =
  "w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

export default function AddPropertyImageForm({ propertyId }: { propertyId: string }) {
  const action = addPropertyImage.bind(null, propertyId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-2 rounded-md border border-dashed border-slate-300 p-3">
      <p className="text-xs font-medium text-slate-500">Add image</p>
      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <div>
        <label className="block text-xs font-medium text-slate-500">Image URL</label>
        <input name="url" placeholder="https://…" className={inputClass} required />
        {errors.url && <p className="mt-1 text-xs text-red-600">{errors.url}</p>}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-medium text-slate-500">Alt text</label>
          <input name="altText" className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Caption</label>
          <input name="caption" className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Sort order</label>
          <input name="sortOrder" type="number" placeholder="Auto" className={inputClass} />
          {errors.sortOrder && <p className="mt-1 text-xs text-red-600">{errors.sortOrder}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-500">Kind</label>
          <select name="kind" defaultValue="PHOTO" className={inputClass}>
            {PROPERTY_IMAGE_KIND_VALUES.map((k) => (
              <option key={k} value={k}>
                {PROPERTY_IMAGE_KIND_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">What does it show? (tag)</label>
          <select name="tag" defaultValue="" className={inputClass}>
            <option value="">— No tag —</option>
            {PROPERTY_IMAGE_TAG_VALUES.map((t) => (
              <option key={t} value={t}>
                {PROPERTY_IMAGE_TAG_LABELS[t]}
              </option>
            ))}
          </select>
          {errors.tag && <p className="mt-1 text-xs text-red-600">{errors.tag}</p>}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name="isHero" />
        Use as the hero image (shown first and as the listing thumbnail; photos only)
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add image"}
      </button>
    </form>
  );
}
