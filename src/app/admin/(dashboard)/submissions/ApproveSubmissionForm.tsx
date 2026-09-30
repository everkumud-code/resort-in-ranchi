"use client";

import { useActionState, useState } from "react";
import { approveSubmission, type SubmissionApprovalState } from "./actions";

const initialState: SubmissionApprovalState = {};

export default function ApproveSubmissionForm({ submissionId, businessName }: { submissionId: string; businessName: string }) {
  const action = approveSubmission.bind(null, submissionId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    if (!state.accessLink) return;
    try {
      await navigator.clipboard.writeText(state.accessLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const code = document.querySelector(`[data-submission-access-link]`) as HTMLElement;
      if (code) {
        const range = document.createRange();
        range.selectNodeContents(code);
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
          document.execCommand("copy");
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      }
    }
  };

  return (
    <div>
      <form
        action={formAction}
        onSubmit={(event) => {
          if (!window.confirm(`Approve this submission and publish "${businessName}"? This creates a live listing and grants one owner access credential.`)) {
            event.preventDefault();
          }
        }}
      >
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-green-300 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-60"
        >
          {pending ? "Approving…" : "Approve & Publish"}
        </button>
      </form>
      {state.error && <p role="alert" className="mt-1 max-w-xs text-xs text-red-700">{state.error}</p>}
      {state.accessLink && (
        <div className="mt-3 max-w-md rounded-lg border-2 border-green-400 bg-green-50 p-4 text-sm text-green-950 shadow-sm">
          <div className="mb-3 flex items-start gap-2">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-200 text-xs font-bold">✓</div>
            <div>
              <p className="font-semibold text-green-900">Listing published &amp; owner access granted</p>
              <p className="mt-1 text-xs text-green-800">Share this single-use link with the submitter. It will not appear again after you leave this page.</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <code data-submission-access-link className="block break-all rounded bg-panel-green px-3 py-2 font-mono text-xs text-slate-700">
              {state.accessLink}
            </code>
            <button
              type="button"
              onClick={handleCopyLink}
              className={`rounded px-3 py-2 text-xs font-medium transition-colors ${
                copied ? "bg-green-200 text-green-900" : "bg-green-200 text-green-900 hover:bg-green-300"
              }`}
            >
              {copied ? "✓ Copied to clipboard" : "Copy Link"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
