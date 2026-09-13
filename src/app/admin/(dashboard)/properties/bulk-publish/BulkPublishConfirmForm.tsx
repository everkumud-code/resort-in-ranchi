"use client";

import { useActionState, useState } from "react";
import { bulkPublishDiscoveryListings, type BulkPublishState } from "../bulkPublishActions";
import { BULK_PUBLISH_CONFIRM_PHRASE } from "@/lib/validation/bulkPublish";

const initialState: BulkPublishState = {};

export default function BulkPublishConfirmForm({ eligibleCount }: { eligibleCount: number }) {
  const [state, formAction, pending] = useActionState(bulkPublishDiscoveryListings, initialState);
  const [typed, setTyped] = useState("");
  const confirmed = typed === BULK_PUBLISH_CONFIRM_PHRASE;

  if (state.publishedCount !== undefined) {
    return (
      <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800" role="status">
        Published {state.publishedCount} Discovery listings.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <label htmlFor="confirm" className="block text-sm font-medium text-slate-700">
        Type <code className="rounded bg-slate-100 px-1 py-0.5">{BULK_PUBLISH_CONFIRM_PHRASE}</code> to publish all{" "}
        {eligibleCount} eligible Discovery listings
      </label>
      <input
        id="confirm"
        name="confirm"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        autoComplete="off"
      />
      <button
        type="submit"
        disabled={!confirmed || pending || eligibleCount === 0}
        className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? "Publishing…" : `Publish ${eligibleCount} listings`}
      </button>
    </form>
  );
}
