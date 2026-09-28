"use client";

import { useActionState } from "react";
import type { PropertyImage } from "@prisma/client";
import ConfirmForm from "@/components/admin/ConfirmForm";
import { deletePropertyImage, updatePropertyImage, type PropertyImageFormState } from "../imageActions";
import {
  PROPERTY_IMAGE_KIND_LABELS,
  PROPERTY_IMAGE_KIND_VALUES,
  PROPERTY_IMAGE_TAG_LABELS,
  PROPERTY_IMAGE_TAG_VALUES,
} from "@/lib/validation/propertyImage";

const initialState: PropertyImageFormState = {};
const inputClass =
  "w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

export default function PropertyImageRow({ image }: { image: PropertyImage }) {
  const action = updatePropertyImage.bind(null, image.id);
  const [state, formAction, pending] = useActionState(action, initialState);
  const errors = state.fieldErrors ?? {};
  const deleteAction = deletePropertyImage.bind(null, image.id);

  return (
    <div className="flex gap-4 border-b border-slate-100 py-4 last:border-0">
      {/* eslint-disable-next-line @next/next/no-img-element -- admin-pasted external URL, not a Next-optimized local asset */}
      <img
        src={image.url}
        alt={image.altText ?? ""}
        className="h-20 w-28 shrink-0 rounded-md border border-slate-200 object-cover"
      />

      <form action={formAction} className="flex-1 space-y-2">
        {state.error && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}
        <div>
          <label className="block text-xs font-medium text-slate-500">Image URL</label>
          <input name="url" defaultValue={image.url} className={inputClass} required />
          {errors.url && <p className="mt-1 text-xs text-red-600">{errors.url}</p>}
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-slate-500">Alt text</label>
            <input name="altText" defaultValue={image.altText ?? ""} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Caption</label>
            <input name="caption" defaultValue={image.caption ?? ""} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">Sort order</label>
            <input name="sortOrder" type="number" defaultValue={image.sortOrder} className={inputClass} />
            {errors.sortOrder && <p className="mt-1 text-xs text-red-600">{errors.sortOrder}</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-500">Kind</label>
            <select name="kind" defaultValue={image.kind} className={inputClass}>
              {PROPERTY_IMAGE_KIND_VALUES.map((k) => (
                <option key={k} value={k}>
                  {PROPERTY_IMAGE_KIND_LABELS[k]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">What does it show? (tag)</label>
            <select name="tag" defaultValue={image.tag ?? ""} className={inputClass}>
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
          <input type="checkbox" name="isHero" defaultChecked={image.isHero} />
          Hero image (shown first and as the listing thumbnail; photos only)
          {image.isHero && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Hero</span>}
        </label>
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
          confirmMessage="Delete this image? This can't be undone."
          label="Delete"
          className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
        />
      </div>
    </div>
  );
}
