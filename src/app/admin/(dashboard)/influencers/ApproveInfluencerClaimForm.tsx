"use client";

import { useActionState, useState } from "react";
import { approveInfluencerClaim, type InfluencerClaimApprovalState } from "./actions";

const initialState: InfluencerClaimApprovalState = {};

export default function ApproveInfluencerClaimForm({ claimId, influencerName }: { claimId: string; influencerName: string }) {
  const action = approveInfluencerClaim.bind(null, claimId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    if (!state.accessLink) return;
    try {
      await navigator.clipboard.writeText(state.accessLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", state.accessLink);
    }
  };

  return (
    <div>
      <form
        action={formAction}
        onSubmit={(event) => {
          if (!window.confirm(`Approve this claim for ${influencerName}? This grants one creator access credential.`)) {
            event.preventDefault();
          }
        }}
      >
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-green-300 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-60"
        >
          {pending ? "Approving…" : "Approve"}
        </button>
      </form>
      {state.error && <p role="alert" className="mt-1 max-w-xs text-xs text-red-700">{state.error}</p>}
      {state.accessLink && (
        <div className="mt-3 max-w-md rounded-lg border-2 border-green-400 bg-green-50 p-4 text-sm text-green-950 shadow-sm">
          <p className="font-semibold text-green-900">Creator access approved</p>
          <p className="mt-1 text-xs text-green-800">Share this single-use link with the creator. It won&apos;t appear again after you leave this page.</p>
          <div className="mt-3 flex flex-col gap-2">
            <code className="block break-all rounded bg-panel-green px-3 py-2 font-mono text-xs text-slate-700">{state.accessLink}</code>
            <button type="button" onClick={handleCopyLink} className="rounded bg-green-200 px-3 py-2 text-xs font-medium text-green-900 hover:bg-green-300">
              {copied ? "✓ Copied to clipboard" : "Copy Link"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
