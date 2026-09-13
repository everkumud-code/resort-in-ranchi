"use client";

import { useActionState } from "react";
import { submitPropertySubmission, type PropertySubmissionFormState } from "./actions";

const initialState: PropertySubmissionFormState = {};
const inputClass =
  "w-full rounded-md border border-brand/20 px-3 py-2 text-sm focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-brand-teal";
const labelClass = "block text-sm font-medium text-brand-dark";

export interface SelectOption {
  id: string;
  name: string;
}

export default function AddYourPropertyForm({
  categories,
  locations,
  facilities,
}: {
  categories: SelectOption[];
  locations: SelectOption[];
  facilities: SelectOption[];
}) {
  const [state, formAction, pending] = useActionState(submitPropertySubmission, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      {/* Honeypot — off-screen, unlabeled, never reached by a real visitor tabbing through the form. */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden">
        <label htmlFor="hp_field">Leave this field empty</label>
        <input id="hp_field" name="hp_field" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold tracking-wide text-brand-dark uppercase">About the business</h2>
        <div>
          <label htmlFor="name" className={labelClass}>
            Business / property name
          </label>
          <input id="name" name="name" className={`mt-1 ${inputClass}`} required />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="categoryId" className={labelClass}>
              Category
            </label>
            <select id="categoryId" name="categoryId" className={`mt-1 ${inputClass}`} required defaultValue="">
              <option value="" disabled>
                Choose a category
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.categoryId && <p className="mt-1 text-xs text-red-600">{errors.categoryId}</p>}
          </div>
          <div>
            <label htmlFor="localityId" className={labelClass}>
              Area <span className="text-brand/50">(optional)</span>
            </label>
            <select id="localityId" name="localityId" className={`mt-1 ${inputClass}`} defaultValue="">
              <option value="">Not listed / not sure</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            {errors.localityId && <p className="mt-1 text-xs text-red-600">{errors.localityId}</p>}
          </div>
        </div>
        <div>
          <label htmlFor="address" className={labelClass}>
            Address <span className="text-brand/50">(optional)</span>
          </label>
          <input id="address" name="address" className={`mt-1 ${inputClass}`} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className={labelClass}>
              Business phone <span className="text-brand/50">(optional)</span>
            </label>
            <input id="phone" name="phone" type="tel" className={`mt-1 ${inputClass}`} />
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>
              Business email <span className="text-brand/50">(optional)</span>
            </label>
            <input id="email" name="email" type="email" className={`mt-1 ${inputClass}`} />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>
        </div>
        <div>
          <label htmlFor="website" className={labelClass}>
            Website <span className="text-brand/50">(optional)</span>
          </label>
          <input id="website" name="website" placeholder="https://…" className={`mt-1 ${inputClass}`} />
        </div>
        <div>
          <label htmlFor="description" className={labelClass}>
            Short description <span className="text-brand/50">(optional)</span>
          </label>
          <textarea id="description" name="description" rows={3} className={`mt-1 ${inputClass}`} />
        </div>
        <div>
          <label htmlFor="venueDetails" className={labelClass}>
            Venue details <span className="text-brand/50">(optional — rooms, capacity, spaces, whatever&apos;s relevant)</span>
          </label>
          <textarea id="venueDetails" name="venueDetails" rows={2} className={`mt-1 ${inputClass}`} />
        </div>
        {facilities.length > 0 && (
          <div>
            <p className={labelClass}>Facilities</p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {facilities.map((f) => (
                <label key={f.id} className="flex items-center gap-2 text-sm text-brand-dark/80">
                  <input type="checkbox" name="facilityIds" value={f.id} className="h-4 w-4 rounded border-brand/30" />
                  {f.name}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4 border-t border-brand/10 pt-5">
        <h2 className="text-sm font-semibold tracking-wide text-brand-dark uppercase">Photos (optional)</h2>
        <div>
          <label htmlFor="logoUrl" className={labelClass}>
            Logo URL <span className="text-brand/50">(optional)</span>
          </label>
          <input id="logoUrl" name="logoUrl" placeholder="https://…" className={`mt-1 ${inputClass}`} />
          {errors.logoUrl && <p className="mt-1 text-xs text-red-600">{errors.logoUrl}</p>}
        </div>
        <div>
          <label htmlFor="photoUrlsRaw" className={labelClass}>
            Photo URLs <span className="text-brand/50">(optional — one link per line, up to 5)</span>
          </label>
          <textarea id="photoUrlsRaw" name="photoUrlsRaw" rows={3} placeholder={"https://…\nhttps://…"} className={`mt-1 ${inputClass}`} />
          {errors.photoUrlsRaw && <p className="mt-1 text-xs text-red-600">{errors.photoUrlsRaw}</p>}
          <p className="mt-1 text-xs text-brand/50">
            Paste links to images already hosted online — we don&apos;t host uploads directly yet.
          </p>
        </div>
      </div>

      <div className="space-y-4 border-t border-brand/10 pt-5">
        <h2 className="text-sm font-semibold tracking-wide text-brand-dark uppercase">Your contact details</h2>
        <p className="text-xs text-brand/50">So our team can reach you about this submission — never shown publicly.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="contactName" className={labelClass}>
              Your name
            </label>
            <input id="contactName" name="contactName" className={`mt-1 ${inputClass}`} required />
            {errors.contactName && <p className="mt-1 text-xs text-red-600">{errors.contactName}</p>}
          </div>
          <div>
            <label htmlFor="contactRole" className={labelClass}>
              Your role
            </label>
            <input id="contactRole" name="contactRole" placeholder="e.g. Owner, Manager" className={`mt-1 ${inputClass}`} required />
            {errors.contactRole && <p className="mt-1 text-xs text-red-600">{errors.contactRole}</p>}
          </div>
          <div>
            <label htmlFor="contactEmail" className={labelClass}>
              Your email
            </label>
            <input id="contactEmail" name="contactEmail" type="email" className={`mt-1 ${inputClass}`} required />
            {errors.contactEmail && <p className="mt-1 text-xs text-red-600">{errors.contactEmail}</p>}
          </div>
          <div>
            <label htmlFor="contactPhone" className={labelClass}>
              Your phone
            </label>
            <input id="contactPhone" name="contactPhone" type="tel" className={`mt-1 ${inputClass}`} required />
            {errors.contactPhone && <p className="mt-1 text-xs text-red-600">{errors.contactPhone}</p>}
          </div>
        </div>
      </div>

      <p className="text-xs text-brand/60">
        No documents are required. Our team reviews every submission before anything is published — this never
        goes live automatically.
      </p>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-brand-orange px-4 py-3 text-base font-semibold text-white hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-6"
      >
        {pending ? "Submitting…" : "Submit for review"}
      </button>
    </form>
  );
}
