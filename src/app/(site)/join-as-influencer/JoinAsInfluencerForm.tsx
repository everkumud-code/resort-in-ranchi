"use client";

import { useActionState } from "react";
import { submitInfluencerSubmission, type InfluencerSubmissionFormState } from "./actions";

const initialState: InfluencerSubmissionFormState = {};
const inputClass =
  "w-full rounded-md border border-brand/20 px-3 py-2 text-sm focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-brand-teal";
const labelClass = "block text-sm font-medium text-brand-dark";

export default function JoinAsInfluencerForm() {
  const [state, formAction, pending] = useActionState(submitInfluencerSubmission, initialState);
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
        <h2 className="text-sm font-semibold tracking-wide text-brand-dark uppercase">About you</h2>
        <div>
          <label htmlFor="name" className={labelClass}>
            Name / brand name
          </label>
          <input id="name" name="name" className={`mt-1 ${inputClass}`} required />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="category" className={labelClass}>
            Category <span className="text-brand/50">(optional — e.g. Travel, Food, Wedding)</span>
          </label>
          <input id="category" name="category" className={`mt-1 ${inputClass}`} />
        </div>
        <div>
          <label htmlFor="bio" className={labelClass}>
            Short bio <span className="text-brand/50">(optional)</span>
          </label>
          <textarea id="bio" name="bio" rows={3} className={`mt-1 ${inputClass}`} />
        </div>
        <div>
          <label htmlFor="photoUrl" className={labelClass}>
            Photo URL <span className="text-brand/50">(optional — a link to your photo already hosted online)</span>
          </label>
          <input id="photoUrl" name="photoUrl" placeholder="https://…" className={`mt-1 ${inputClass}`} />
          {errors.photoUrl && <p className="mt-1 text-xs text-red-600">{errors.photoUrl}</p>}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="instagramUrl" className={labelClass}>
              Instagram <span className="text-brand/50">(optional)</span>
            </label>
            <input id="instagramUrl" name="instagramUrl" placeholder="https://instagram.com/…" className={`mt-1 ${inputClass}`} />
            {errors.instagramUrl && <p className="mt-1 text-xs text-red-600">{errors.instagramUrl}</p>}
          </div>
          <div>
            <label htmlFor="youtubeUrl" className={labelClass}>
              YouTube <span className="text-brand/50">(optional)</span>
            </label>
            <input id="youtubeUrl" name="youtubeUrl" placeholder="https://youtube.com/…" className={`mt-1 ${inputClass}`} />
            {errors.youtubeUrl && <p className="mt-1 text-xs text-red-600">{errors.youtubeUrl}</p>}
          </div>
        </div>
        <div>
          <label htmlFor="websiteUrl" className={labelClass}>
            Website <span className="text-brand/50">(optional)</span>
          </label>
          <input id="websiteUrl" name="websiteUrl" placeholder="https://…" className={`mt-1 ${inputClass}`} />
          {errors.websiteUrl && <p className="mt-1 text-xs text-red-600">{errors.websiteUrl}</p>}
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
