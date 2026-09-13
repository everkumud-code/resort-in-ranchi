"use client";

import { useActionState, useState } from "react";
import { publishProperty, type PublishState } from "../lifecycleActions";
import { canPublish, getPublicTrustTier } from "@/lib/validation/propertyLifecycle";

const TIER_LABELS = { verified: "Verified Listing", owner_verified: "Owner Verified", discovery: "Discovery Listing" } as const;

export interface PublishReviewData {
  name: string;
  categoryName: string;
  localityName: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  shortDescription: string | null;
  fullDescription: string | null;
  facilityNames: string[];
  venueSpaceNames: string[];
  verificationStatus: string;
  blockedByIdentityConflict: boolean;
}

const initialState: PublishState = {};

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-amber-200/60 py-1 last:border-0">
      <dt className="text-amber-800">{label}</dt>
      <dd className="text-right text-amber-950">{value}</dd>
    </div>
  );
}

export default function PublishPanel({ propertyId, property }: { propertyId: string; property: PublishReviewData }) {
  const [reviewing, setReviewing] = useState(false);
  const boundAction = publishProperty.bind(null, propertyId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  const eligibility = canPublish({
    verificationStatus: property.verificationStatus,
    address: property.address,
    phone: property.phone,
    website: property.website,
    blockedByIdentityConflict: property.blockedByIdentityConflict,
  });

  if (!reviewing) {
    return (
      <div>
        <button
          type="button"
          disabled={!eligibility.ok}
          onClick={() => setReviewing(true)}
          className="rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Review &amp; Publish
        </button>
        {!eligibility.ok && (
          <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs text-slate-500">
            {eligibility.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
      <p className="text-sm font-semibold text-amber-900">This information will become public:</p>
      <dl className="mt-2 text-sm">
        <ReviewRow label="Name" value={property.name} />
        <ReviewRow label="Category" value={property.categoryName} />
        <ReviewRow label="Locality" value={property.localityName ?? "Not set"} />
        <ReviewRow label="Address" value={property.address ?? "Not set"} />
        <ReviewRow label="Phone" value={property.phone ?? "Not set"} />
        <ReviewRow label="Website" value={property.website ?? "Not set"} />
        <ReviewRow label="Description" value={property.shortDescription || property.fullDescription || "Not set"} />
        <ReviewRow label="Facilities" value={property.facilityNames.length > 0 ? property.facilityNames.join(", ") : "None listed"} />
        <ReviewRow
          label="Venue spaces"
          value={property.venueSpaceNames.length > 0 ? property.venueSpaceNames.join(", ") : "None"}
        />
        <ReviewRow label="Verification status" value={property.verificationStatus.replace(/_/g, " ")} />
        <ReviewRow label="Public badge visitors will see" value={TIER_LABELS[getPublicTrustTier(property.verificationStatus)]} />
        <ReviewRow label="Publish status" value="DRAFT / ARCHIVED → about to become PUBLISHED" />
      </dl>

      {state.error && (
        <div className="mt-3 rounded-md bg-red-100 p-2 text-xs text-red-700">
          <p className="font-medium">{state.error}</p>
          {state.reasons && (
            <ul className="mt-1 list-disc pl-4">
              {state.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <form action={formAction}>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Publishing…" : "Confirm Publish"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setReviewing(false)}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
