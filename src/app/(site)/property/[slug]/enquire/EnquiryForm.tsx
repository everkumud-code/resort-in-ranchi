"use client";

import { useActionState } from "react";
import { submitEnquiry, type EnquiryFormState } from "./actions";

const initialState: EnquiryFormState = {};
const inputClass =
  "w-full rounded-md border border-brand/20 px-3 py-2 text-sm focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-brand-teal";

export default function EnquiryForm({
  propertySlug,
  propertyName,
  ctaCopy,
  mayBeSharedWithPartner = false,
}: {
  propertySlug: string;
  propertyName: string;
  ctaCopy: string;
  mayBeSharedWithPartner?: boolean;
}) {
  const action = submitEnquiry.bind(null, propertySlug);
  const [state, formAction, pending] = useActionState(action, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
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

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-brand-dark">
          Your name
        </label>
        <input id="name" name="name" className={`mt-1 ${inputClass}`} required />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-brand-dark">
          Phone
        </label>
        <input id="phone" name="phone" type="tel" className={`mt-1 ${inputClass}`} required />
        {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-brand-dark">
          Email <span className="text-brand/50">(optional)</span>
        </label>
        <input id="email" name="email" type="email" className={`mt-1 ${inputClass}`} />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="eventDate" className="block text-sm font-medium text-brand-dark">
            Event date <span className="text-brand/50">(optional)</span>
          </label>
          <input id="eventDate" name="eventDate" type="date" className={`mt-1 ${inputClass}`} />
          {errors.eventDate && <p className="mt-1 text-xs text-red-600">{errors.eventDate}</p>}
        </div>
        <div>
          <label htmlFor="guests" className="block text-sm font-medium text-brand-dark">
            Guests <span className="text-brand/50">(optional)</span>
          </label>
          <input id="guests" name="guests" type="number" min={0} className={`mt-1 ${inputClass}`} />
          {errors.guests && <p className="mt-1 text-xs text-red-600">{errors.guests}</p>}
        </div>
      </div>
      <div>
        <label htmlFor="budget" className="block text-sm font-medium text-brand-dark">
          Budget <span className="text-brand/50">(optional)</span>
        </label>
        <input id="budget" name="budget" placeholder="e.g. ₹50,000–₹1,00,000" className={`mt-1 ${inputClass}`} />
      </div>
      <div>
        <label htmlFor="requirement" className="block text-sm font-medium text-brand-dark">
          What are you looking for? <span className="text-brand/50">(optional)</span>
        </label>
        <textarea id="requirement" name="requirement" rows={3} className={`mt-1 ${inputClass}`} />
      </div>

      <p className="text-xs text-brand/60">
        Your details will be shared with {propertyName} so they can respond to your enquiry directly.
        {mayBeSharedWithPartner && " They may also be shared with a relevant partner venue for this category."}
      </p>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-brand-orange px-4 py-3 text-base font-semibold text-white hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-6"
      >
        {pending ? "Sending…" : ctaCopy}
      </button>
    </form>
  );
}
