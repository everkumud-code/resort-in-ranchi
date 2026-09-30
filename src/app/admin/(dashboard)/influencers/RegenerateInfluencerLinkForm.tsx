"use client";

import { useActionState, useState } from "react";
import { regenerateInfluencerOwnerLink, type RegenerateInfluencerLinkState } from "./actions";

const initialState: RegenerateInfluencerLinkState = {};

export default function RegenerateInfluencerLinkForm({ ownerAccessId, influencerName }: { ownerAccessId: string; influencerName: string }) {
  const action = regenerateInfluencerOwnerLink.bind(null, ownerAccessId);
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
          if (!window.confirm(`Generate a new access link for ${influencerName}? The old link stops working immediately.`)) {
            event.preventDefault();
          }
        }}
      >
        <button type="submit" disabled={pending} className="text-xs font-medium text-blue-700 hover:underline disabled:opacity-60">
          {pending ? "Generating…" : "Generate new link"}
        </button>
      </form>
      {state.error && <p className="mt-1 text-xs text-red-700">{state.error}</p>}
      {state.accessLink && (
        <div className="mt-2 max-w-xs rounded-md border border-blue-300 bg-blue-50 p-2 text-xs">
          <code className="block break-all rounded bg-panel-green px-2 py-1 font-mono text-[11px] text-slate-700">{state.accessLink}</code>
          <button type="button" onClick={handleCopyLink} className="mt-1 rounded bg-blue-200 px-2 py-1 text-[11px] font-medium text-blue-900 hover:bg-blue-300">
            {copied ? "✓ Copied" : "Copy link"}
          </button>
        </div>
      )}
    </div>
  );
}
