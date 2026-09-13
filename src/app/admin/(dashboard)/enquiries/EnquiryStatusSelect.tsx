"use client";

import { useActionState, useRef } from "react";
import { updateEnquiryStatus, type UpdateEnquiryStatusState } from "./actions";
import { ENQUIRY_STATUS_VALUES, ENQUIRY_STATUS_LABELS } from "@/lib/validation/enquiry";

const initial: UpdateEnquiryStatusState = {};

export default function EnquiryStatusSelect({ enquiryId, status }: { enquiryId: string; status: string }) {
  const action = updateEnquiryStatus.bind(null, enquiryId);
  const [state, formAction] = useActionState(action, initial);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form action={formAction} ref={formRef}>
      <select
        name="status"
        defaultValue={status}
        onChange={() => formRef.current?.requestSubmit()}
        className="rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
      >
        {ENQUIRY_STATUS_VALUES.map((value) => (
          <option key={value} value={value}>
            {ENQUIRY_STATUS_LABELS[value]}
          </option>
        ))}
      </select>
      {state.error && <p className="mt-1 text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
