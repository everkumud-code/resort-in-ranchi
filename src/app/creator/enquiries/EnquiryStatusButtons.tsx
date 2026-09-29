"use client";

import { useTransition } from "react";
import { updateCreatorEnquiryStatus } from "../actions";
import { ENQUIRY_STATUS_LABELS, ENQUIRY_STATUS_VALUES } from "@/lib/validation/enquiry";

export default function EnquiryStatusButtons({
  influencerId,
  enquiryId,
  status,
}: {
  influencerId: string;
  enquiryId: string;
  status: (typeof ENQUIRY_STATUS_VALUES)[number];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={status}
      disabled={pending}
      onChange={(e) => {
        const formData = new FormData();
        formData.set("status", e.target.value);
        startTransition(() => {
          updateCreatorEnquiryStatus(influencerId, enquiryId, formData);
        });
      }}
      className="rounded-md border border-brand/20 px-2 py-1 text-xs text-brand-dark"
    >
      {ENQUIRY_STATUS_VALUES.map((value) => (
        <option key={value} value={value}>
          {ENQUIRY_STATUS_LABELS[value]}
        </option>
      ))}
    </select>
  );
}
