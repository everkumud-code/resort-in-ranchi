"use client";

import { useActionState } from "react";
import { submitInfluencerClaim, type InfluencerClaimFormState } from "./actions";

const initialState: InfluencerClaimFormState = {};
const inputClass =
  "w-full rounded-md border border-brand/20 px-3 py-2 text-sm focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-brand-teal";

export default function ClaimCreatorForm({ influencerSlug }: { influencerSlug: string }) {
  const action = submitInfluencerClaim.bind(null, influencerSlug);
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
        <label htmlFor="claimantName" className="block text-sm font-medium text-brand-dark">
          Your name
        </label>
        <input id="claimantName" name="claimantName" className={`mt-1 ${inputClass}`} required />
        {errors.claimantName && <p className="mt-1 text-xs text-red-600">{errors.claimantName}</p>}
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-brand-dark">
          Email
        </label>
        <input id="email" name="email" type="email" className={`mt-1 ${inputClass}`} required />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-brand-dark">
          Phone
        </label>
        <input id="phone" name="phone" type="tel" className={`mt-1 ${inputClass}`} required />
        {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-brand-dark">
          Message <span className="text-brand/50">(optional — e.g. a link that proves this is your account)</span>
        </label>
        <textarea id="message" name="message" rows={3} className={`mt-1 ${inputClass}`} />
      </div>
      <p className="text-xs text-brand/60">
        No documents are required to submit a claim. Our team reviews every claim before granting access to edit
        this profile.
      </p>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand-teal px-4 py-2 text-sm font-semibold text-white hover:bg-brand-teal/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Submit claim"}
      </button>
    </form>
  );
}
