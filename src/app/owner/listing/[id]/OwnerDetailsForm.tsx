"use client";

import { useActionState } from "react";
import type { Property } from "@prisma/client";
import { updateOwnerProperty, type OwnerActionState } from "./actions";

const initial: OwnerActionState = {};
const inputClass =
  "w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

function Field({
  label,
  name,
  defaultValue,
  error,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue: string | number | null;
  error?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500">{label}</label>
      <input name={name} type={type} min={type === "number" ? 0 : undefined} defaultValue={defaultValue ?? ""} className={inputClass} />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Section({
  id,
  title,
  helpText,
  children,
  bordered = true,
}: {
  id: string;
  title: string;
  helpText: string;
  children: React.ReactNode;
  bordered?: boolean;
}) {
  return (
    <div id={id} className={`scroll-mt-24 space-y-3 ${bordered ? "border-t border-slate-100 pt-5" : ""}`}>
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="mt-0.5 text-xs text-slate-500">{helpText}</p>
      </div>
      {children}
    </div>
  );
}

export default function OwnerDetailsForm({ property }: { property: Property }) {
  const action = updateOwnerProperty.bind(null, property.id);
  const [state, formAction, pending] = useActionState(action, initial);
  const errors = state.fieldErrors ?? {};

  // On a validation failure the page re-renders from fresh server props, so
  // an uncontrolled input's defaultValue would otherwise silently revert
  // every field (not just the invalid one) to its last-saved value — echo
  // back exactly what the owner just typed instead.
  function fieldValue(name: string, savedValue: string | number | null): string | number {
    if (state.values && name in state.values) return state.values[name];
    return savedValue ?? "";
  }

  return (
    <form action={formAction} className="space-y-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div>
        <h2 className="font-serif text-lg font-semibold text-brand-dark">Listing details</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          These fields fill in the checklist on your dashboard and appear on your public listing once saved.
        </p>
      </div>

      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
          Saved. Your changes are live on your public listing.
        </p>
      )}

      <Section
        id="details"
        title="Details"
        helpText="A short summary and a fuller description, shown to visitors on your listing page."
        bordered={false}
      >
        <div>
          <label className="block text-xs font-medium text-slate-500">Short description</label>
          <textarea name="shortDescription" defaultValue={fieldValue("shortDescription", property.shortDescription)} rows={2} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Full description</label>
          <textarea name="fullDescription" defaultValue={fieldValue("fullDescription", property.fullDescription)} rows={4} className={inputClass} />
        </div>
      </Section>

      <Section id="contact" title="Contact" helpText="How guests or event planners can reach you directly.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Address" name="address" defaultValue={fieldValue("address", property.address)} />
          <Field label="Pincode" name="pincode" defaultValue={fieldValue("pincode", property.pincode)} />
          <Field label="Phone" name="phone" defaultValue={fieldValue("phone", property.phone)} />
          <Field label="WhatsApp" name="whatsapp" defaultValue={fieldValue("whatsapp", property.whatsapp)} />
          <Field label="Email" name="email" defaultValue={fieldValue("email", property.email)} />
          <Field label="Website" name="website" defaultValue={fieldValue("website", property.website)} />
          <Field label="Google Maps URL" name="googleMapsUrl" defaultValue={fieldValue("googleMapsUrl", property.googleMapsUrl)} />
        </div>
      </Section>

      <Section id="pricing" title="Pricing" helpText="Helps visitors know what to expect before they enquire.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Price min (₹)" name="priceMin" defaultValue={fieldValue("priceMin", property.priceMin)} type="number" error={errors.priceMin} />
          <Field label="Price max (₹)" name="priceMax" defaultValue={fieldValue("priceMax", property.priceMax)} type="number" error={errors.priceMax} />
          <Field label="Price label" name="priceLabel" defaultValue={fieldValue("priceLabel", property.priceLabel)} />
        </div>
      </Section>

      <Section id="capacity" title="Capacity" helpText="Rooms and/or the guest capacity your venue can host, whichever applies.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Rooms" name="rooms" defaultValue={fieldValue("rooms", property.rooms)} type="number" error={errors.rooms} />
          <Field
            label="Event capacity min"
            name="eventCapacityMin"
            defaultValue={fieldValue("eventCapacityMin", property.eventCapacityMin)}
            type="number"
            error={errors.eventCapacityMin}
          />
          <Field
            label="Event capacity max"
            name="eventCapacityMax"
            defaultValue={fieldValue("eventCapacityMax", property.eventCapacityMax)}
            type="number"
            error={errors.eventCapacityMax}
          />
        </div>
      </Section>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand-teal px-4 py-2 text-sm font-semibold text-white hover:bg-brand-teal/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
