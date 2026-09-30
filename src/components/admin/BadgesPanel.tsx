"use client";

import Link from "next/link";
import { useActionState } from "react";

export interface UpdateBadgesState {
  error?: string;
}

const initialState: UpdateBadgesState = {};

/**
 * Generic trust-badge assignment checkbox grid — shared by the Property,
 * Influencer and Event admin edit pages. `action` is the entity-specific
 * Server Action already bound to that entity's id (e.g.
 * `updatePropertyBadges.bind(null, propertyId)`).
 */
export default function BadgesPanel({
  action,
  allBadges,
  selectedBadgeIds,
}: {
  action: (state: UpdateBadgesState, formData: FormData) => Promise<UpdateBadgesState>;
  allBadges: { id: string; label: string; description: string | null }[];
  selectedBadgeIds: string[];
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const selected = new Set(selectedBadgeIds);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Trust badges</h2>

      {state.error && (
        <p role="alert" className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      {allBadges.length === 0 ? (
        <p className="mt-2 text-sm text-slate-400">
          No badges defined yet.{" "}
          <Link href="/admin/badges" className="underline">
            Create badges
          </Link>{" "}
          first, then assign them here.
        </p>
      ) : (
        <form action={formAction} className="mt-3 space-y-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {allBadges.map((b) => (
              <label key={b.id} className="flex items-start gap-2 text-sm text-slate-700" title={b.description ?? undefined}>
                <input
                  type="checkbox"
                  name="badgeIds"
                  value={b.id}
                  defaultChecked={selected.has(b.id)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300"
                />
                {b.label}
              </label>
            ))}
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save badges"}
          </button>
        </form>
      )}
    </div>
  );
}
