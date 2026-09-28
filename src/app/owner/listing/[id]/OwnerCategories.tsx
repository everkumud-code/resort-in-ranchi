"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveOwnerExtraCategories, type OwnerActionState } from "./actions";
import { COMMERCIAL_TIER_LABELS, type CommercialTierValue } from "@/lib/validation/commercial";
import { maxExtraCategories } from "@/lib/validation/planEntitlements";

const initial: OwnerActionState = {};

export default function OwnerCategories({
  propertyId,
  tier,
  primaryCategoryName,
  primaryCategoryId,
  categories,
  extraCategoryIds,
}: {
  propertyId: string;
  tier: CommercialTierValue;
  primaryCategoryName: string;
  primaryCategoryId: string;
  categories: { id: string; name: string }[];
  extraCategoryIds: string[];
}) {
  const [state, formAction, pending] = useActionState(saveOwnerExtraCategories.bind(null, propertyId), initial);
  const extraLimit = maxExtraCategories(tier);
  const others = categories.filter((c) => c.id !== primaryCategoryId);
  const chosen = extraCategoryIds.filter((id) => others.some((c) => c.id === id));

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-serif text-lg font-semibold text-brand-dark">Categories</h2>
        <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand-dark/70">
          {COMMERCIAL_TIER_LABELS[tier]} plan
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        Your listing is filed under <span className="font-medium text-slate-900">{primaryCategoryName}</span>.
        {extraLimit === Infinity
          ? " Your plan lets you appear in every category."
          : extraLimit > 0
            ? ` Your plan lets you appear in up to ${extraLimit} more.`
            : ""}
      </p>

      {extraLimit === 0 ? (
        <p className="mt-3 rounded-md bg-brand-cream/60 px-3 py-2 text-sm text-brand-dark/80">
          The Free plan lists your business in one category. To appear in more categories — or in all of them —{" "}
          <Link href="/contact" className="font-medium text-brand-teal hover:underline">
            contact us to upgrade
          </Link>
          .
        </p>
      ) : (
        <form action={formAction} className="mt-3 space-y-3">
          {state.error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
          {state.success && <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">Saved.</p>}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {others.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" name="extraCategoryIds" value={c.id} defaultChecked={chosen.includes(c.id)} />
                {c.name}
              </label>
            ))}
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save categories"}
          </button>
        </form>
      )}
    </div>
  );
}
