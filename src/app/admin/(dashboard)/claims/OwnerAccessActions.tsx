"use client";

import { useState } from "react";
import ConfirmForm from "@/components/admin/ConfirmForm";
import RegenerateOwnerLinkForm from "./RegenerateOwnerLinkForm";
import { revokeOwnerAccess } from "./actions";

interface OwnerAccessActionsProps {
  ownerAccessId: string;
  propertyName: string;
  expiresAt: Date;
  revokedAt: Date | null;
  mayManage: boolean;
}

export default function OwnerAccessActions({
  ownerAccessId,
  propertyName,
  expiresAt,
  revokedAt,
  mayManage,
}: OwnerAccessActionsProps) {
  const [showRegenerateForm, setShowRegenerateForm] = useState(false);
  const now = new Date();
  const isExpired = expiresAt < now;
  const isRevoked = Boolean(revokedAt);
  const isActive = !isExpired && !isRevoked;

  if (!mayManage) {
    // Non-admin can still see status but can't take actions
    if (isRevoked) return <span className="text-slate-600">Revoked</span>;
    if (isExpired) return <span className="text-slate-600">Expired</span>;
    return <span className="text-slate-600">Active until {expiresAt.toLocaleDateString()}</span>;
  }

  if (showRegenerateForm) {
    return (
      <div className="space-y-2">
        <button
          onClick={() => setShowRegenerateForm(false)}
          className="text-xs font-medium text-slate-700 hover:underline"
        >
          ← Cancel
        </button>
        <RegenerateOwnerLinkForm ownerAccessId={ownerAccessId} propertyName={propertyName} />
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
            action={revokeOwnerAccess.bind(null, ownerAccessId)}
            confirmMessage="Revoke this owner's access immediately?"
            label="Revoke"
            className="text-xs font-medium text-red-700 hover:underline"
          />
        )}
        <button
          onClick={() => setShowRegenerateForm(true)}
          className="text-xs font-medium text-blue-700 hover:underline"
        >
          Generate New Link
        </button>
      </div>
    </div>
  );
}
