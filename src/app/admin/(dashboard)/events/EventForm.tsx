"use client";

import { useActionState, useState } from "react";
import type { Event } from "@prisma/client";
import { createEvent, updateEvent, type EventFormState } from "./actions";
import { EVENT_STATUS_LABELS, EVENT_STATUS_VALUES } from "@/lib/validation/event";
import { slugify } from "@/lib/blog/blog";

const initialState: EventFormState = {};
const inputClass =
  "w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";
const labelClass = "block text-xs font-medium text-slate-500";

function toLocalInput(d: Date | null | undefined): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

export default function EventForm({
  event,
  locations,
  properties,
}: {
  event?: Event;
  locations: { id: string; name: string }[];
  properties: { id: string; name: string }[];
}) {
  const action = event ? updateEvent.bind(null, event.id) : createEvent;
  const [state, formAction, pending] = useActionState(action, initialState);
  const errors = state.fieldErrors ?? {};
  const [title, setTitle] = useState(event?.title ?? "");
  const [slug, setSlug] = useState(event?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(event));

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <div className="space-y-4">
        {state.error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

        <div>
          <label htmlFor="title" className={labelClass}>Title</label>
          <input
            id="title"
            name="title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            className={inputClass}
            required
          />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
        </div>

        <div>
          <label htmlFor="slug" className={labelClass}>
            Slug (URL: /events/<span className="font-mono">{slug || "your-slug"}</span>)
          </label>
          <input id="slug" name="slug" value={slug} onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }} className={inputClass} required />
          {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug}</p>}
        </div>

        <div>
          <label htmlFor="description" className={labelClass}>Description</label>
          <textarea id="description" name="description" rows={5} defaultValue={event?.description ?? ""} className={inputClass} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="startAt" className={labelClass}>Starts</label>
            <input id="startAt" name="startAt" type="datetime-local" defaultValue={toLocalInput(event?.startAt)} className={inputClass} required />
            {errors.startAt && <p className="mt-1 text-xs text-red-600">{errors.startAt}</p>}
          </div>
          <div>
            <label htmlFor="endAt" className={labelClass}>Ends (optional)</label>
            <input id="endAt" name="endAt" type="datetime-local" defaultValue={toLocalInput(event?.endAt)} className={inputClass} />
            {errors.endAt && <p className="mt-1 text-xs text-red-600">{errors.endAt}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="venueName" className={labelClass}>Venue name</label>
          <input id="venueName" name="venueName" defaultValue={event?.venueName ?? ""} className={inputClass} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="address" className={labelClass}>Address</label>
            <input id="address" name="address" defaultValue={event?.address ?? ""} className={inputClass} />
          </div>
          <div>
            <label htmlFor="localityId" className={labelClass}>Area</label>
            <select id="localityId" name="localityId" defaultValue={event?.localityId ?? ""} className={inputClass}>
              <option value="">— None —</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            {errors.localityId && <p className="mt-1 text-xs text-red-600">{errors.localityId}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="propertyId" className={labelClass}>Venue listing (optional — links to an existing property page)</label>
          <select id="propertyId" name="propertyId" defaultValue={event?.propertyId ?? ""} className={inputClass}>
            <option value="">— None —</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ticketUrl" className={labelClass}>Ticket / booking URL</label>
            <input id="ticketUrl" name="ticketUrl" defaultValue={event?.ticketUrl ?? ""} placeholder="https://" className={inputClass} />
            {errors.ticketUrl && <p className="mt-1 text-xs text-red-600">{errors.ticketUrl}</p>}
          </div>
          <div>
            <label htmlFor="coverImageUrl" className={labelClass}>Cover image URL</label>
            <input id="coverImageUrl" name="coverImageUrl" defaultValue={event?.coverImageUrl ?? ""} placeholder="https://" className={inputClass} />
            {errors.coverImageUrl && <p className="mt-1 text-xs text-red-600">{errors.coverImageUrl}</p>}
          </div>
        </div>
        <div>
          <label htmlFor="coverImageAlt" className={labelClass}>Cover image alt text</label>
          <input id="coverImageAlt" name="coverImageAlt" defaultValue={event?.coverImageAlt ?? ""} className={inputClass} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="contactPhone" className={labelClass}>Public contact phone</label>
            <input id="contactPhone" name="contactPhone" defaultValue={event?.contactPhone ?? ""} className={inputClass} />
          </div>
          <div>
            <label htmlFor="contactEmail" className={labelClass}>Public contact email</label>
            <input id="contactEmail" name="contactEmail" type="email" defaultValue={event?.contactEmail ?? ""} className={inputClass} />
            {errors.contactEmail && <p className="mt-1 text-xs text-red-600">{errors.contactEmail}</p>}
          </div>
        </div>

        {event && (event.submittedByName || event.submittedByPhone || event.submittedByEmail) && (
          <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-500">
            Submitted by: {event.submittedByName} · {event.submittedByPhone} {event.submittedByEmail ? `· ${event.submittedByEmail}` : ""}
          </div>
        )}
      </div>

      <aside className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 lg:sticky lg:top-6 lg:self-start">
        <div>
          <label htmlFor="status" className={labelClass}>Status</label>
          <select id="status" name="status" defaultValue={event?.status ?? "PUBLISHED"} className={inputClass}>
            {EVENT_STATUS_VALUES.map((v) => (
              <option key={v} value={v}>{EVENT_STATUS_LABELS[v]}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="sponsored" defaultChecked={event?.sponsored ?? false} />
          Sponsored (paid featured placement)
        </label>
        <div>
          <label htmlFor="priority" className={labelClass}>Priority (higher shows first)</label>
          <input id="priority" name="priority" type="number" defaultValue={event?.priority ?? 0} className={inputClass} />
          {errors.priority && <p className="mt-1 text-xs text-red-600">{errors.priority}</p>}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : event ? "Save changes" : "Create event"}
        </button>
      </aside>
    </form>
  );
}
