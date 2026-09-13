"use client";

import { useActionState, useRef } from "react";
import { setCommercialTier, type SetCommercialTierState } from "../lifecycleActions";
import { COMMERCIAL_TIER_VALUES, COMMERCIAL_TIER_LABELS, type CommercialTierValue } from "@/lib/validation/commercial";

const initial: SetCommercialTierState = {};

export default function CommercialTierSelect({ propertyId, commercialTier }: { propertyId: string; commercialTier: CommercialTierValue }) {
  const action = setCommercialTier.bind(null, propertyId);
  const [state, formAction] = useActionState(action, initial);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form action={formAction} ref={formRef}>
      <select
        name="commercialTier"
        defaultValue={commercialTier}
        onChange={() => formRef.current?.requestSubmit()}
        className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
      >
        {COMMERCIAL_TIER_VALUES.map((value) => (
          <option key={value} value={value}>
            {COMMERCIAL_TIER_LABELS[value]}
          </option>
        ))}
      </select>
      {state.error && <p className="mt-1 text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
