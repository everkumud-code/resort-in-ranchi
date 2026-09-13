"use client";

import { useActionState } from "react";
import type { PropertyImage } from "@prisma/client";
import { addOwnerImage, deleteOwnerImage, type OwnerActionState } from "./actions";

const initial: OwnerActionState = {};
const inputClass =
  "w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

const KIND_LABEL: Record<string, string> = {
  PHOTO: "Photo",
  LOGO: "Logo",
  ILLUSTRATIVE: "Illustrative (generated placeholder — not a real photo)",
};

export default function OwnerImages({ propertyId, images }: { propertyId: string; images: PropertyImage[] }) {
  const action = addOwnerImage.bind(null, propertyId);
  const [state, formAction, pending] = useActionState(action, initial);
  const errors = state.fieldErrors ?? {};

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="font-serif text-lg font-semibold text-brand-dark">Photos &amp; logo ({images.length})</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        Add real photos of your property, or your business logo. Paste a link to an image already hosted online.
      </p>

      {state.success && (
        <p role="status" className="mt-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
          Saved.
        </p>
      )}

      {images.length > 0 && (
        <ul className="mt-3 space-y-2">
          {images.map((img) => (
            <li key={img.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-100 px-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate text-slate-900">{img.url}</p>
                <p className="text-xs text-slate-500">{KIND_LABEL[img.kind] ?? img.kind}</p>
              </div>
              <form action={deleteOwnerImage.bind(null, propertyId, img.id)}>
                <button type="submit" className="shrink-0 text-xs font-medium text-red-600 hover:underline">
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="mt-4 space-y-2 rounded-md border border-dashed border-slate-300 p-3">
        <p className="text-xs font-medium text-slate-500">Add a photo or logo</p>
        {state.error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
        <input name="url" placeholder="Image URL" className={inputClass} required />
        {errors.url && <p className="text-xs text-red-600">{errors.url}</p>}
        <input name="altText" placeholder="Alt text (optional)" className={inputClass} />
        <select name="kind" defaultValue="PHOTO" className={inputClass}>
          <option value="PHOTO">Photo of my property</option>
          <option value="LOGO">My business logo</option>
        </select>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add"}
        </button>
      </form>
    </div>
  );
}
