"use client";

import { useActionState } from "react";
import { submitEventApplication, type EventApplicationFormState } from "./actions";

const initialState: EventApplicationFormState = {};
const inputClass =
  "w-full rounded-md border border-brand/20 px-3 py-2 text-sm focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-brand-teal";
const labelClass = "block text-sm font-medium text-brand-dark";

export interface SelectOption {
  id: string;
  name: string;
}

export default function CreateEventForm({ locations }: { locations: SelectOption[] }) {
  const [state, formAction, pending] = useActionState(submitEventApplication, initialState);
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
        <h2 className="text-sm font-semibold tracking-wide text-brand-dark uppercase">About the event</h2>
        <div>
          <label htmlFor="title" className={labelClass}>
            Event title
          </label>
          <input id="title" name="title" className={`mt-1 ${inputClass}`} required />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
        </div>
        <div>
          <label htmlFor="description" className={labelClass}>
            Description <span className="text-brand/50">(optional)</span>
          </label>
          <textarea id="description" name="description" rows={4} className={`mt-1 ${inputClass}`} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="startAt" className={labelClass}>
              Starts
            </label>
            <input id="startAt" name="startAt" type="datetime-local" className={`mt-1 ${inputClass}`} required />
            {errors.startAt && <p className="mt-1 text-xs text-red-600">{errors.startAt}</p>}
          </div>
          <div>
            <label htmlFor="endAt" className={labelClass}>
              Ends <span className="text-brand/50">(optional)</span>
            </label>
            <input id="endAt" name="endAt" type="datetime-local" className={`mt-1 ${inputClass}`} />
            {errors.endAt && <p className="mt-1 text-xs text-red-600">{errors.endAt}</p>}
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t border-brand/10 pt-4">
        <h2 className="text-sm font-semibold tracking-wide text-brand-dark uppercase">Where</h2>
        <div>
          <label htmlFor="venueName" className={labelClass}>
            Venue name <span className="text-brand/50">(optional)</span>
          </label>
          <input id="venueName" name="venueName" className={`mt-1 ${inputClass}`} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="address" className={labelClass}>
              Address <span className="text-brand/50">(optional)</span>
            </label>
            <input id="address" name="address" className={`mt-1 ${inputClass}`} />
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
      </div>

      <div className="space-y-4 border-t border-brand/10 pt-4">
        <h2 className="text-sm font-semibold tracking-wide text-brand-dark uppercase">Tickets &amp; cover image</h2>
        <div>
          <label htmlFor="ticketUrl" className={labelClass}>
            Ticket / booking link <span className="text-brand/50">(optional)</span>
          </label>
          <input id="ticketUrl" name="ticketUrl" placeholder="https://" className={`mt-1 ${inputClass}`} />
          {errors.ticketUrl && <p className="mt-1 text-xs text-red-600">{errors.ticketUrl}</p>}
        </div>
        <div>
          <label htmlFor="coverImageUrl" className={labelClass}>
            Cover image URL <span className="text-brand/50">(optional, direct image link)</span>
          </label>
          <input id="coverImageUrl" name="coverImageUrl" placeholder="https://" className={`mt-1 ${inputClass}`} />
          {errors.coverImageUrl && <p className="mt-1 text-xs text-red-600">{errors.coverImageUrl}</p>}
        </div>
      </div>

      <div className="space-y-4 border-t border-brand/10 pt-4">
        <h2 className="text-sm font-semibold tracking-wide text-brand-dark uppercase">Your contact details</h2>
        <p className="text-xs text-brand/60">Only used by our team to review and, if needed, reach you about this event — never published.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="submittedByName" className={labelClass}>
              Your name
            </label>
            <input id="submittedByName" name="submittedByName" className={`mt-1 ${inputClass}`} required />
            {errors.submittedByName && <p className="mt-1 text-xs text-red-600">{errors.submittedByName}</p>}
          </div>
          <div>
            <label htmlFor="submittedByPhone" className={labelClass}>
              Your phone
            </label>
            <input id="submittedByPhone" name="submittedByPhone" className={`mt-1 ${inputClass}`} required />
            {errors.submittedByPhone && <p className="mt-1 text-xs text-red-600">{errors.submittedByPhone}</p>}
          </div>
        </div>
        <div>
          <label htmlFor="submittedByEmail" className={labelClass}>
            Your email <span className="text-brand/50">(optional)</span>
          </label>
          <input id="submittedByEmail" name="submittedByEmail" type="email" className={`mt-1 ${inputClass}`} />
          {errors.submittedByEmail && <p className="mt-1 text-xs text-red-600">{errors.submittedByEmail}</p>}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="contactPhone" className={labelClass}>
              Public contact phone <span className="text-brand/50">(optional, shown on the event)</span>
            </label>
            <input id="contactPhone" name="contactPhone" className={`mt-1 ${inputClass}`} />
          </div>
          <div>
            <label htmlFor="contactEmail" className={labelClass}>
              Public contact email <span className="text-brand/50">(optional, shown on the event)</span>
            </label>
            <input id="contactEmail" name="contactEmail" type="email" className={`mt-1 ${inputClass}`} />
            {errors.contactEmail && <p className="mt-1 text-xs text-red-600">{errors.contactEmail}</p>}
          </div>
        </div>
      </div>

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
