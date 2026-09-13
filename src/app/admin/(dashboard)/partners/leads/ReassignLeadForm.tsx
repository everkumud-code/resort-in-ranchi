"use client";

import { useActionState } from "react";
import { reassignPartnerLead, type ReassignLeadState } from "./actions";

const initialState: ReassignLeadState = {};

export interface PartnerOption {
  id: string;
  propertyName: string;
}

export default function ReassignLeadForm({ leadId, otherPartners }: { leadId: string; otherPartners: PartnerOption[] }) {
  const action = reassignPartnerLead.bind(null, leadId);
  const [state, formAction, pending] = useActionState(action, initialState);

  if (otherPartners.length === 0) {
    return <p className="text-xs text-slate-400">No other partners configured.</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <select name="partnerId" defaultValue="" className="rounded-md border border-slate-300 px-2 py-1 text-xs" required>
          <option value="" disabled>
            Reassign to…
          </option>
          {otherPartners.map((p) => (
            <option key={p.id} value={p.id}>
              {p.propertyName}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {pending ? "…" : "Go"}
        </button>
      </div>
      {state.error && <p className="max-w-[16rem] text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
