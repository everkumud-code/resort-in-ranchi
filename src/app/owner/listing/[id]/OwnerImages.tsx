"use client";

import { useActionState } from "react";
import type { PropertyImage } from "@prisma/client";
import { addOwnerImage, deleteOwnerImage, setOwnerHeroImage, setOwnerImageTag, type OwnerActionState } from "./actions";
import { getImageTagLabel, PROPERTY_IMAGE_TAG_LABELS, PROPERTY_IMAGE_TAG_VALUES } from "@/lib/validation/propertyImage";

const initial: OwnerActionState = {};
const inputClass =
  "w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

const KIND_LABEL: Record<string, string> = {
  PHOTO: "Photo",
  LOGO: "Logo",
  ILLUSTRATIVE: "Illustrative (generated placeholder — not a real photo)",
};

function TagOptions() {
  return (
    <>
      <option value="">— What does it show? (optional) —</option>
      {PROPERTY_IMAGE_TAG_VALUES.map((t) => (
        <option key={t} value={t}>
          {PROPERTY_IMAGE_TAG_LABELS[t]}
        </option>
      ))}
    </>
  );
}

export default function OwnerImages({ propertyId, images }: { propertyId: string; images: PropertyImage[] }) {
  const action = addOwnerImage.bind(null, propertyId);
  const [state, formAction, pending] = useActionState(action, initial);
  const errors = state.fieldErrors ?? {};

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="font-serif text-lg font-semibold text-brand-dark">Photos &amp; logo ({images.length})</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        Add real photos of your property, or your business logo. Paste a link to an image already hosted online (the
        direct image address, ending in .jpg, .png or .webp). Choose one photo as your <strong>hero image</strong> — it is
        shown first on your page and as your thumbnail in listings — and tag each photo (lawn, rooms, hall, parking…).
      </p>

      {state.success && (
        <p role="status" className="mt-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
          Saved.
        </p>
      )}

      {images.length > 0 && (
        <ul className="mt-3 space-y-2">
          {images.map((img) => (
            <li key={img.id} className="flex items-start gap-3 rounded-md border border-slate-100 px-3 py-2 text-sm">
              {/* eslint-disable-next-line @next/next/no-img-element -- owner-pasted external URL, not a Next-optimized local asset */}
              <img src={img.url} alt={img.altText ?? ""} className="h-16 w-24 shrink-0 rounded-md border border-slate-200 object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-slate-900">{img.url}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>{KIND_LABEL[img.kind] ?? img.kind}</span>
                  {getImageTagLabel(img.tag) && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{getImageTagLabel(img.tag)}</span>
                  )}
                  {img.isHero && <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">Hero image</span>}
                </p>
                <form action={setOwnerImageTag.bind(null, propertyId, img.id)} className="mt-2 flex items-center gap-2">
                  <select name="tag" defaultValue={img.tag ?? ""} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
                    <TagOptions />
                  </select>
                  <button type="submit" className="text-xs font-medium text-slate-600 hover:underline">
                    Save tag
                  </button>
                </form>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                {img.kind === "PHOTO" && !img.isHero && (
                  <form action={setOwnerHeroImage.bind(null, propertyId, img.id)}>
                    <button type="submit" className="text-xs font-medium text-brand-teal hover:underline">
                      Make hero
                    </button>
                  </form>
                )}
                <form action={deleteOwnerImage.bind(null, propertyId, img.id)}>
                  <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
                    Remove
                  </button>
                </form>
              </div>
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
        <select name="tag" defaultValue="" className={inputClass}>
          <TagOptions />
        </select>
        {errors.tag && <p className="text-xs text-red-600">{errors.tag}</p>}
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="isHero" />
          Make this my hero image (photos only)
        </label>
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
