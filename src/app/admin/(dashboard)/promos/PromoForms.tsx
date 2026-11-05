"use client";

import { useActionState } from "react";
import { PROMO_ACCENTS, type PromoAdData } from "@/lib/promo/catalog";
import PromoCard from "@/components/site/promo/PromoCard";
import { FormNotice, dangerButton, hintClass, inputClass, labelClass, primaryButton, secondaryButton } from "../settings/ui";
import { deleteAd, saveAd, setAdActive, setSpotAd, type PromoFormState } from "./actions";

const initial: PromoFormState = {};

/** One fixed spot on the site and the ad that sits in it. */
export function SpotRow({
  spotKey,
  label,
  where,
  ads,
  currentKey,
}: {
  spotKey: string;
  label: string;
  where: string;
  ads: { key: string; brand: string; active: boolean }[];
  currentKey: string;
}) {
  const [state, action, pending] = useActionState(setSpotAd, initial);
  return (
    <form action={action} className="grid gap-2 border-t border-slate-200 py-3 first:border-t-0 sm:grid-cols-[1fr_auto] sm:items-center">
      <input type="hidden" name="slot" value={spotKey} />
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{where}</p>
        <FormNotice state={state} />
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor={`spot-${spotKey}`} className="sr-only">
          Ad for {label}
        </label>
        {/* key: after a save the server sends the new current ad, and React resets an uncontrolled select to its OLD default; remounting on change shows what was really saved. */}
        <select key={currentKey} id={`spot-${spotKey}`} name="adKey" defaultValue={currentKey} className={`${inputClass} mt-0 w-56`}>
          <option value="">No ad</option>
          {ads.map((ad) => (
            <option key={ad.key} value={ad.key}>
              {ad.brand}
              {ad.active ? "" : " (switched off)"}
            </option>
          ))}
        </select>
        <button type="submit" disabled={pending} className={secondaryButton}>
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

/** Create a new ad, or edit an existing one when `ad` is given. */
export function AdEditor({ ad }: { ad?: PromoAdData }) {
  const [state, action, pending] = useActionState(saveAd, initial);
  const id = ad?.key ?? "new";
  return (
    <form action={action} className="space-y-3">
      {ad && <input type="hidden" name="key" value={ad.key} />}
      <FormNotice state={state} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`brand-${id}`} className={labelClass}>
            Brand name
          </label>
          <input id={`brand-${id}`} name="brand" defaultValue={ad?.brand ?? ""} maxLength={40} required className={inputClass} />
        </div>
        <div>
          <label htmlFor={`tag-${id}`} className={labelClass}>
            Small line above the headline
          </label>
          <input id={`tag-${id}`} name="tag" defaultValue={ad?.tag ?? ""} maxLength={90} required className={inputClass} />
        </div>
      </div>
      <div>
        <label htmlFor={`headline-${id}`} className={labelClass}>
          Headline
        </label>
        <input id={`headline-${id}`} name="headline" defaultValue={ad?.headline ?? ""} maxLength={100} required className={inputClass} />
      </div>
      <div>
        <label htmlFor={`body-${id}`} className={labelClass}>
          Description
        </label>
        <textarea id={`body-${id}`} name="body" defaultValue={ad?.body ?? ""} maxLength={260} rows={3} required className={inputClass} />
      </div>
      <div>
        <label htmlFor={`points-${id}`} className={labelClass}>
          Highlights (one per line, up to 4)
        </label>
        <textarea id={`points-${id}`} name="points" defaultValue={ad?.points.join("\n") ?? ""} rows={4} className={inputClass} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor={`cta-${id}`} className={labelClass}>
            Button text
          </label>
          <input id={`cta-${id}`} name="ctaLabel" defaultValue={ad?.ctaLabel ?? ""} maxLength={40} required className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`href-${id}`} className={labelClass}>
            Button link
          </label>
          <input id={`href-${id}`} name="href" type="url" defaultValue={ad?.href ?? "https://"} required className={inputClass} />
          <p className={hintClass}>Must start with https://. Links to nextresource.in get a tracking tag added automatically.</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`accent-${id}`} className={labelClass}>
            Colour
          </label>
          <select id={`accent-${id}`} name="accent" defaultValue={ad?.accent ?? "teal"} className={inputClass}>
            {Object.entries(PROMO_ACCENTS).map(([value, a]) => (
              <option key={value} value={value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 pt-6 text-sm text-slate-700">
          <input type="checkbox" name="active" defaultChecked={ad?.active ?? true} className="h-4 w-4" />
          Switched on (shown where it is placed)
        </label>
      </div>
      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Saving…" : ad ? "Save changes" : "Add this ad"}
      </button>
    </form>
  );
}

export function AdPreview({ ad }: { ad: PromoAdData }) {
  return (
    <div className="pointer-events-none select-none" aria-hidden="true">
      <PromoCard ad={ad} spot="preview" />
    </div>
  );
}

export function ToggleAdButton({ adKey, active }: { adKey: string; active: boolean }) {
  const [state, action, pending] = useActionState(setAdActive, initial);
  return (
    <form action={action} className="inline-flex flex-col gap-1">
      <input type="hidden" name="key" value={adKey} />
      <input type="hidden" name="active" value={active ? "false" : "true"} />
      <button type="submit" disabled={pending} className={secondaryButton}>
        {active ? "Switch off" : "Switch on"}
      </button>
      <FormNotice state={state} />
    </form>
  );
}

export function DeleteAdButton({ adKey, brand }: { adKey: string; brand: string }) {
  const [state, action, pending] = useActionState(deleteAd, initial);
  return (
    <form
      action={action}
      className="inline-flex flex-col gap-1"
      onSubmit={(e) => {
        if (!window.confirm(`Delete the “${brand}” ad? Any spot it holds becomes empty.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="key" value={adKey} />
      <button type="submit" disabled={pending} className={dangerButton}>
        Delete
      </button>
      <FormNotice state={state} />
    </form>
  );
}
