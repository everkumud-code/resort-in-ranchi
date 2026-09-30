"use client";

import ConfirmForm from "@/components/admin/ConfirmForm";
import { resendPartnerLead } from "./actions";

export default function ResendLeadButton({ leadId }: { leadId: string }) {
  return (
    <ConfirmForm
      action={resendPartnerLead.bind(null, leadId)}
      confirmMessage="Resend this lead to the partner? This refreshes its delivery time without changing the partner or the original enquiry."
      label="Resend"
      className="rounded-md border border-slate-300 bg-panel-green px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
    />
  );
}
