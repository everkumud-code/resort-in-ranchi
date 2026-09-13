"use client";

import { useActionState } from "react";
import { submitPropertyClaim, type ClaimFormState } from "./actions";

const initialState: ClaimFormState = {};
const inputClass =
  "w-full rounded-md border border-brand/20 px-3 py-2 text-sm focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-brand-teal";

export default function ClaimListingForm({ propertySlug }: { propertySlug: string }) {
  const action = submitPropertyClaim.bind(null, propertySlug);
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
        <label htmlFor="ownerName" className="block text-sm font-medium text-brand-dark">
          Your name
        </label>
        <input id="ownerName" name="ownerName" className={`mt-1 ${inputClass}`} required />
        {errors.ownerName && <p className="mt-1 text-xs text-red-600">{errors.ownerName}</p>}
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
        <label htmlFor="businessRole" className="block text-sm font-medium text-brand-dark">
          Your relationship to this business
        </label>
        <input
          id="businessRole"
          name="businessRole"
          placeholder="e.g. Owner, Manager, Authorized representative"
          className={`mt-1 ${inputClass}`}
          required
        />
        {errors.businessRole && <p className="mt-1 text-xs text-red-600">{errors.businessRole}</p>}
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-brand-dark">
          Message <span className="text-brand/50">(optional)</span>
        </label>
        <textarea id="message" name="message" rows={3} className={`mt-1 ${inputClass}`} />
      </div>
      <p className="text-xs text-brand/60">
        No documents are required to submit a claim. Our team reviews every claim before granting access to
        edit this listing.
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
