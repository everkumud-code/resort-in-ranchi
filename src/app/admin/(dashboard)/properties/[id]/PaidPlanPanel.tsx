"use client";

import { useActionState } from "react";
import { removeSponsoredPlacement, saveExtraCategories, saveSponsoredPlacement, type PlanFormState } from "../planActions";
import { COMMERCIAL_TIER_LABELS, type CommercialTierValue } from "@/lib/validation/commercial";
import {
  canHaveSponsoredPlacement,
  canSponsorAllCategories,
  isPlacementActive,
  maxExtraCategories,
} from "@/lib/validation/planEntitlements";

const initial: PlanFormState = {};
const inputClass =
  "w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface PlacementValue {
  enabled: boolean;
  allCategories: boolean;
  categorySlugs: string[];
  startsAt: Date | null;
  endsAt: Date | null;
}

const dateInput = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export default function PaidPlanPanel({
  propertyId,
  tier,
  primaryCategoryId,
  categories,
  extraCategoryIds,
  placement,
}: {
  propertyId: string;
  tier: CommercialTierValue;
  primaryCategoryId: string;
  categories: CategoryOption[];
  extraCategoryIds: string[];
  placement: PlacementValue | null;
}) {
  const [catState, catAction, catPending] = useActionState(saveExtraCategories.bind(null, propertyId), initial);
  const [plState, plAction, plPending] = useActionState(saveSponsoredPlacement.bind(null, propertyId), initial);

  const extraLimit = maxExtraCategories(tier);
  const limitText = extraLimit === Infinity ? "every category" : extraLimit === 0 ? "no extra categories" : `up to ${extraLimit} extra`;
  const sponsorAllowed = canHaveSponsoredPlacement(tier);
  const otherCategories = categories.filter((c) => c.id !== primaryCategoryId);
  const active = placement ? isPlacementActive(placement) : false;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Paid plan features</h2>
      <p className="mt-1 text-xs text-slate-500">
        Plan: <span className="font-medium text-slate-700">{COMMERCIAL_TIER_LABELS[tier]}</span> — allows {limitText}
        {sponsorAllowed ? ", and sponsored placement." : "; no sponsored placement. Change the plan under Commercial status once payment is received."}
      </p>

      <form action={catAction} className="mt-4 space-y-2">
        <p className="text-xs font-medium text-slate-600">Extra categories (the listing also appears in these)</p>
        {catState.error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{catState.error}</p>}
        {catState.success && <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">Saved.</p>}
        {extraLimit === 0 ? (
          <p className="text-xs text-slate-400">The Free plan lists a business in its main category only.</p>
        ) : (
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
            {otherCategories.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" name="extraCategoryIds" value={c.id} defaultChecked={extraCategoryIds.includes(c.id)} />
                {c.name}
              </label>
            ))}
          </div>
        )}
        {extraLimit !== 0 && (
          <button
            type="submit"
            disabled={catPending}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {catPending ? "Saving…" : "Save categories"}
          </button>
        )}
      </form>

      <form action={plAction} className="mt-6 space-y-2 border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-slate-600">Sponsored placement (positions 2, 12, 22 — labelled &quot;Sponsored&quot;)</p>
          {placement && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${active ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}`}>
              {active ? "Active" : "Not active"}
            </span>
          )}
        </div>
        {plState.error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{plState.error}</p>}
        {plState.success && <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">Saved.</p>}

        {!sponsorAllowed ? (
          <p className="text-xs text-slate-400">Needs a Premium or Lead Partner plan.</p>
        ) : (
          <>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="enabled" defaultChecked={placement?.enabled ?? true} />
              Enabled
            </label>
            {canSponsorAllCategories(tier) && (
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" name="allCategories" defaultChecked={placement?.allCategories ?? false} />
                Sponsor in every category (and on location pages)
              </label>
            )}
            <div>
              <p className="text-xs text-slate-500">Or only in these categories:</p>
              <div className="mt-1 grid grid-cols-2 gap-1 sm:grid-cols-3">
                {categories.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" name="categorySlugs" value={c.slug} defaultChecked={placement?.categorySlugs.includes(c.slug) ?? false} />
                    {c.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-500">Starts (optional)</label>
                <input type="date" name="startsAt" defaultValue={dateInput(placement?.startsAt ?? null)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500">Paid until (blank = no end)</label>
                <input type="date" name="endsAt" defaultValue={dateInput(placement?.endsAt ?? null)} className={inputClass} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={plPending}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
              >
                {plPending ? "Saving…" : "Save placement"}
              </button>
              {placement && (
                <button
                  type="submit"
                  formAction={removeSponsoredPlacement.bind(null, propertyId)}
                  className="text-sm font-medium text-red-600 hover:underline"
                >
                  End placement now
                </button>
              )}
            </div>
          </>
        )}
      </form>
    </div>
  );
}
