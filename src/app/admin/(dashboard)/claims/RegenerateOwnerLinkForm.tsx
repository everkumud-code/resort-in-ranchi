"use client";

import { useActionState, useState } from "react";
import { regenerateOwnerLink, type RegenerateOwnerLinkState } from "./actions";

const initialState: RegenerateOwnerLinkState = {};

export default function RegenerateOwnerLinkForm({
  ownerAccessId,
  propertyName,
}: {
  ownerAccessId: string;
  propertyName: string;
}) {
  const action = regenerateOwnerLink.bind(null, ownerAccessId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    if (!state.accessLink) return;
    try {
      await navigator.clipboard.writeText(state.accessLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select and copy manually
      const code = document.querySelector(`[data-regenerate-access-link]`) as HTMLElement;
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

  if (state.accessLink) {
    return (
      <div className="mt-3 rounded-lg border-2 border-blue-400 bg-blue-50 p-4 text-sm text-blue-950 shadow-sm">
        <div className="mb-3 flex items-start gap-2">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-200 text-xs font-bold">✓</div>
          <div>
            <p className="font-semibold text-blue-900">New Owner Access Link Generated</p>
            <p className="mt-1 text-xs text-blue-800">The previous access link has been revoked. Share this new single-use link with the owner.</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <code 
            data-regenerate-access-link 
            className="block break-all rounded bg-panel-green px-3 py-2 font-mono text-xs text-slate-700"
          >
            {state.accessLink}
          </code>
          <button
            type="button"
            onClick={handleCopyLink}
            className={`rounded px-3 py-2 text-xs font-medium transition-colors ${
              copied
                ? "bg-blue-200 text-blue-900"
                : "bg-blue-200 text-blue-900 hover:bg-blue-300"
            }`}
          >
            {copied ? "✓ Copied to clipboard" : "Copy Link"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <form
        action={formAction}
        onSubmit={(event) => {
          if (!window.confirm(`Generate a new owner access link for ${propertyName}? The previous link will be revoked immediately.`)) {
            event.preventDefault();
          }
        }}
      >
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-60"
        >
          {pending ? "Generating…" : "Generate New Link"}
        </button>
      </form>
      {state.error && <p role="alert" className="mt-1 max-w-xs text-xs text-red-700">{state.error}</p>}
    </div>
  );
}
