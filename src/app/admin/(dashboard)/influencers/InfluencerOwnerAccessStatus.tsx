"use client";

import { useState } from "react";
import ConfirmForm from "@/components/admin/ConfirmForm";
import RegenerateInfluencerLinkForm from "./RegenerateInfluencerLinkForm";
import { revokeInfluencerOwnerAccess } from "./actions";

export default function InfluencerOwnerAccessStatus({
  ownerAccessId,
  influencerName,
  expiresAt,
  revokedAt,
  mayManage,
}: {
  ownerAccessId: string;
  influencerName: string;
  expiresAt: Date;
  revokedAt: Date | null;
  mayManage: boolean;
}) {
  const [showRegenerateForm, setShowRegenerateForm] = useState(false);
  const isExpired = expiresAt < new Date();
  const isRevoked = Boolean(revokedAt);
  const isActive = !isExpired && !isRevoked;

  if (!mayManage) {
    if (isRevoked) return <span className="text-slate-600">Revoked</span>;
    if (isExpired) return <span className="text-slate-600">Expired</span>;
    return <span className="text-slate-600">Active until {expiresAt.toLocaleDateString()}</span>;
  }

  if (showRegenerateForm) {
    return (
      <div className="space-y-2">
        <button onClick={() => setShowRegenerateForm(false)} className="text-xs font-medium text-slate-700 hover:underline">
          ← Cancel
        </button>
        <RegenerateInfluencerLinkForm ownerAccessId={ownerAccessId} influencerName={influencerName} />
      </div>
    );
  }

  const statusText = isRevoked ? "Revoked" : isExpired ? "Expired" : `Active until ${expiresAt.toLocaleDateString()}`;

  return (
    <div className="space-y-2">
      <div className="text-slate-600">{statusText}</div>
      <div className="flex gap-2">
        {isActive && (
          <ConfirmForm
            action={revokeInfluencerOwnerAccess.bind(null, ownerAccessId)}
            confirmMessage="Revoke this creator's access immediately?"
            label="Revoke"
            className="text-xs font-medium text-red-700 hover:underline"
          />
        )}
        <button onClick={() => setShowRegenerateForm(true)} className="text-xs font-medium text-blue-700 hover:underline">
          Generate New Link
        </button>
      </div>
    </div>
  );
}
