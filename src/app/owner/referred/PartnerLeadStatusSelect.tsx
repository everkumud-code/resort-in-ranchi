"use client";

import { useActionState, useRef } from "react";
import { updatePartnerLeadStatus, type UpdatePartnerLeadStatusState } from "./actions";
import { PARTNER_LEAD_STATUS_VALUES, PARTNER_LEAD_STATUS_LABELS } from "@/lib/validation/partnerLead";

const initial: UpdatePartnerLeadStatusState = {};

export default function PartnerLeadStatusSelect({ leadId, status }: { leadId: string; status: string }) {
  const action = updatePartnerLeadStatus.bind(null, leadId);
  const [state, formAction] = useActionState(action, initial);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form action={formAction} ref={formRef}>
      <select
        name="status"
        defaultValue={status}
        onChange={() => formRef.current?.requestSubmit()}
        className="rounded-md border border-brand/20 px-2 py-1 text-xs focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-brand-teal"
      >
        {PARTNER_LEAD_STATUS_VALUES.map((value) => (
          <option key={value} value={value}>
            {PARTNER_LEAD_STATUS_LABELS[value]}
          </option>
        ))}
      </select>
      {state.error && <p className="mt-1 text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
