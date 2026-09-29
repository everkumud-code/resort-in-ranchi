"use client";

import { useActionState } from "react";
import { submitInfluencerEnquiry, type InfluencerEnquiryFormState } from "./actions";

const initialState: InfluencerEnquiryFormState = {};
const inputClass =
  "w-full rounded-md border border-brand/20 px-3 py-2 text-sm focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-brand-teal";

export default function ContactCreatorForm({ influencerSlug, influencerName }: { influencerSlug: string; influencerName: string }) {
  const action = submitInfluencerEnquiry.bind(null, influencerSlug);
  const [state, formAction, pending] = useActionState(action, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-3">
      {state.error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

      {/* Honeypot — off-screen, unlabeled, never reached by a real visitor tabbing through the form. */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden">
        <label htmlFor="hp_field">Leave this field empty</label>
        <input id="hp_field" name="hp_field" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label htmlFor="name" className="block text-xs font-medium text-brand-dark">Your name</label>
        <input id="name" name="name" className={`mt-1 ${inputClass}`} required />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
      </div>
      <div>
        <label htmlFor="phone" className="block text-xs font-medium text-brand-dark">Your phone</label>
        <input id="phone" name="phone" type="tel" className={`mt-1 ${inputClass}`} required />
        {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
      </div>
      <div>
        <label htmlFor="email" className="block text-xs font-medium text-brand-dark">Your email (optional)</label>
        <input id="email" name="email" type="email" className={`mt-1 ${inputClass}`} />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
      </div>
      <div>
        <label htmlFor="message" className="block text-xs font-medium text-brand-dark">Message (optional)</label>
        <textarea id="message" name="message" rows={3} placeholder={`What would you like to work with ${influencerName} on?`} className={`mt-1 ${inputClass}`} />
      </div>
      <p className="text-xs text-brand/60">Your details go directly to {influencerName} for a reply, and are visible to our team.</p>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand-teal px-4 py-2 text-sm font-semibold text-white hover:bg-brand-teal/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
