"use client";

import { useActionState } from "react";
import { createProperty, updateProperty, type UpdatePropertyState } from "../actions";
import type { Category, Location, Property } from "@prisma/client";

const initialState: UpdatePropertyState = {};

function Field({
  label,
  name,
  error,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs font-medium text-slate-500">
        {label}
      </label>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

export default function PropertyEditForm({
  property,
  categories,
  locations,
}: {
  property?: Property;
  categories: Category[];
  locations: Location[];
}) {
  const action = property ? updateProperty.bind(null, property.id) : createProperty;
  const [state, formAction, pending] = useActionState(action, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-8">
      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-semibold text-slate-900">Basic info</legend>
        <Field label="Name" name="name" error={errors.name}>
          <input id="name" name="name" defaultValue={property?.name} className={inputClass} required />
        </Field>
        <Field label="Slug" name="slug" error={errors.slug}>
          <input id="slug" name="slug" defaultValue={property?.slug} className={inputClass} required />
        </Field>
        <Field label="Category" name="categoryId" error={errors.categoryId}>
          <select id="categoryId" name="categoryId" defaultValue={property?.categoryId} className={inputClass} required>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Location" name="localityId" error={errors.localityId}>
          <select id="localityId" name="localityId" defaultValue={property?.localityId ?? ""} className={inputClass}>
            <option value="">— None —</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Short description" name="shortDescription" error={errors.shortDescription}>
            <input
              id="shortDescription"
              name="shortDescription"
              defaultValue={property?.shortDescription ?? ""}
              className={inputClass}
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Full description" name="fullDescription" error={errors.fullDescription}>
            <textarea
              id="fullDescription"
              name="fullDescription"
              defaultValue={property?.fullDescription ?? ""}
              rows={4}
              className={inputClass}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <legend className="mb-2 text-sm font-semibold text-slate-900">Address</legend>
        <div className="sm:col-span-2 lg:col-span-3">
          <Field label="Address" name="address" error={errors.address}>
            <input id="address" name="address" defaultValue={property?.address ?? ""} className={inputClass} />
          </Field>
        </div>
        <Field label="City" name="city" error={errors.city}>
          <input id="city" name="city" defaultValue={property?.city} className={inputClass} required />
        </Field>
        <Field label="State" name="state" error={errors.state}>
          <input id="state" name="state" defaultValue={property?.state} className={inputClass} required />
        </Field>
        <Field label="Pincode" name="pincode" error={errors.pincode}>
          <input id="pincode" name="pincode" defaultValue={property?.pincode ?? ""} className={inputClass} />
        </Field>
        <Field label="Latitude" name="latitude" error={errors.latitude}>
          <input id="latitude" name="latitude" type="number" step="any" defaultValue={property?.latitude ?? ""} className={inputClass} />
        </Field>
        <Field label="Longitude" name="longitude" error={errors.longitude}>
          <input id="longitude" name="longitude" type="number" step="any" defaultValue={property?.longitude ?? ""} className={inputClass} />
        </Field>
      </fieldset>

      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-semibold text-slate-900">Contact</legend>
        <Field label="Phone" name="phone" error={errors.phone}>
          <input id="phone" name="phone" defaultValue={property?.phone ?? ""} className={inputClass} />
        </Field>
        <Field label="WhatsApp" name="whatsapp" error={errors.whatsapp}>
          <input id="whatsapp" name="whatsapp" defaultValue={property?.whatsapp ?? ""} className={inputClass} />
        </Field>
        <Field label="Email" name="email" error={errors.email}>
          <input id="email" name="email" defaultValue={property?.email ?? ""} className={inputClass} />
        </Field>
        <Field label="Website" name="website" error={errors.website}>
          <input id="website" name="website" defaultValue={property?.website ?? ""} className={inputClass} />
        </Field>
        <Field label="Google Maps URL" name="googleMapsUrl" error={errors.googleMapsUrl}>
          <input id="googleMapsUrl" name="googleMapsUrl" defaultValue={property?.googleMapsUrl ?? ""} className={inputClass} />
        </Field>
        <Field
          label="Generated identity mark URL (not an official logo)"
          name="generatedIdentityMarkUrl"
          error={errors.generatedIdentityMarkUrl}
        >
          <input
            id="generatedIdentityMarkUrl"
            name="generatedIdentityMarkUrl"
            defaultValue={property?.generatedIdentityMarkUrl ?? ""}
            className={inputClass}
          />
        </Field>
      </fieldset>

      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <legend className="mb-2 text-sm font-semibold text-slate-900">Ratings, pricing &amp; capacity</legend>
        <Field label="Google rating (0–5)" name="googleRating" error={errors.googleRating}>
          <input id="googleRating" name="googleRating" type="number" step="0.1" min={0} max={5} defaultValue={property?.googleRating ?? ""} className={inputClass} />
        </Field>
        <Field label="Review count" name="reviewCount" error={errors.reviewCount}>
          <input id="reviewCount" name="reviewCount" type="number" min={0} defaultValue={property?.reviewCount ?? ""} className={inputClass} />
        </Field>
        <Field label="Price label" name="priceLabel" error={errors.priceLabel}>
          <input id="priceLabel" name="priceLabel" defaultValue={property?.priceLabel ?? ""} className={inputClass} />
        </Field>
        <Field label="Price min (₹)" name="priceMin" error={errors.priceMin}>
          <input id="priceMin" name="priceMin" type="number" min={0} defaultValue={property?.priceMin ?? ""} className={inputClass} />
        </Field>
        <Field label="Price max (₹)" name="priceMax" error={errors.priceMax}>
          <input id="priceMax" name="priceMax" type="number" min={0} defaultValue={property?.priceMax ?? ""} className={inputClass} />
        </Field>
        <Field label="Rooms" name="rooms" error={errors.rooms}>
          <input id="rooms" name="rooms" type="number" min={0} defaultValue={property?.rooms ?? ""} className={inputClass} />
        </Field>
        <Field label="Event capacity min" name="eventCapacityMin" error={errors.eventCapacityMin}>
          <input id="eventCapacityMin" name="eventCapacityMin" type="number" min={0} defaultValue={property?.eventCapacityMin ?? ""} className={inputClass} />
        </Field>
        <Field label="Event capacity max" name="eventCapacityMax" error={errors.eventCapacityMax}>
          <input id="eventCapacityMax" name="eventCapacityMax" type="number" min={0} defaultValue={property?.eventCapacityMax ?? ""} className={inputClass} />
        </Field>
      </fieldset>

      {property && (
        <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <legend className="mb-2 text-sm font-semibold text-slate-900">Flags</legend>
          <p className="text-xs text-slate-400 sm:col-span-2">
            Publish status and verification status are managed from the Lifecycle panel, not this form — see the
            right-hand side of this page.
          </p>
          <div className="flex items-center gap-2">
            <input id="claimed" name="claimed" type="checkbox" defaultChecked={property.claimed} className="h-4 w-4 rounded border-slate-300" />
            <label htmlFor="claimed" className="text-sm text-slate-700">
              Claimed by owner
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input id="ownerVerified" name="ownerVerified" type="checkbox" defaultChecked={property.ownerVerified} className="h-4 w-4 rounded border-slate-300" />
            <label htmlFor="ownerVerified" className="text-sm text-slate-700">
              Owner verified
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input id="featured" name="featured" type="checkbox" defaultChecked={property.featured} className="h-4 w-4 rounded border-slate-300" />
            <label htmlFor="featured" className="text-sm text-slate-700">
              Featured
            </label>
          </div>
        </fieldset>
      )}

      {!property && (
        <p className="text-xs text-slate-400">
          The new listing starts as a Draft, not yet verified — publish and verify it from the Lifecycle panel on its
          own page once it&apos;s created.
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : property ? "Save changes" : "Create listing"}
        </button>
      </div>
    </form>
  );
}
