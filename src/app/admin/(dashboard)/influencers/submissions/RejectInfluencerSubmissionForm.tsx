"use client";

import { useState } from "react";
import { rejectInfluencerSubmission } from "./actions";

export default function RejectInfluencerSubmissionForm({ submissionId, name }: { submissionId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const action = rejectInfluencerSubmission.bind(null, submissionId);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
      >
        Reject
      </button>
    );
  }

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(`Reject the submission for "${name}"?`)) {
          event.preventDefault();
        }
      }}
      className="flex max-w-xs flex-col gap-2"
    >
      <textarea
        name="rejectionNote"
        rows={2}
        placeholder="Reason (optional, not shown publicly)"
        className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
      />
      <div className="flex gap-2">
        <button type="submit" className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100">
          Confirm reject
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
