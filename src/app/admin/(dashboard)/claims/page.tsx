import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { canManageOwnerAccess, requireAdmin } from "@/lib/auth/session";
import ConfirmForm from "@/components/admin/ConfirmForm";
import ApproveClaimForm from "./ApproveClaimForm";
import OwnerAccessActions from "./OwnerAccessActions";
import { rejectClaim } from "./actions";

export const dynamic = "force-dynamic";

export default async function ClaimsPage() {
  const admin = await requireAdmin();
  const mayManageOwnerAccess = canManageOwnerAccess(admin.role);
  const [pending, reviewed] = await Promise.all([
    prisma.claimRequest.findMany({
      where: { status: "PENDING" },
      include: { property: { select: { id: true, name: true, slug: true, claimed: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.claimRequest.findMany({
      where: { status: { in: ["APPROVED", "REJECTED"] } },
      include: {
        property: { select: { id: true, name: true, slug: true } },
        reviewedBy: { select: { name: true } },
        ownerAccess: { select: { id: true, expiresAt: true, revokedAt: true } },
      },
      orderBy: { reviewedAt: "desc" },
      take: 25,
    }),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Listing claims</h1>
        <p className="mt-1 text-sm text-slate-500">
          Approving a claim marks the property as claimed. It never marks it Verified — that stays a separate
          decision.
        </p>
      </div>

      {!mayManageOwnerAccess && <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">Only Admins can approve, reject, or revoke owner access.</p>}

      <section>
        <h2 className="text-sm font-semibold text-slate-900">
          Pending{" "}
          {pending.length > 0 ? (
            <span className="ml-1 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">{pending.length}</span>
          ) : (
            `(${pending.length})`
          )}
        </h2>
        {pending.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">No pending claims.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {pending.map((claim) => (
              <div key={claim.id} className="rounded-lg border border-amber-300 bg-amber-50/60 p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="mr-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      Awaiting review
                    </span>
                    <Link href={`/admin/properties/${claim.property.id}`} className="font-medium text-slate-900 hover:underline">
                      {claim.property.name}
                    </Link>
                    {claim.property.claimed && (
                      <span className="ml-2 text-xs font-medium text-amber-700">already claimed by another request</span>
                    )}
                    <p className="mt-1 text-sm text-slate-700">
                      {claim.ownerName} &middot; {claim.businessRole}
                    </p>
                    <p className="text-xs text-slate-500">
                      {claim.email} &middot; {claim.phone}
                    </p>
                    {claim.message && <p className="mt-2 text-sm text-slate-600">&ldquo;{claim.message}&rdquo;</p>}
                    <p className="mt-1 text-xs text-slate-400">Submitted {claim.createdAt.toLocaleString()}</p>
                  </div>
                  {mayManageOwnerAccess && <div className="flex shrink-0 gap-2">
                    <ApproveClaimForm claimId={claim.id} propertyName={claim.property.name} />
                    <ConfirmForm
                      action={rejectClaim.bind(null, claim.id)}
                      confirmMessage={`Reject this claim for ${claim.property.name}?`}
                      label="Reject"
                      className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
                    />
                  </div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-900">Recently reviewed</h2>
        {reviewed.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">None yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Property</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Claimant</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Status</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Reviewed by</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Reviewed at</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Owner access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reviewed.map((claim) => (
                  <tr key={claim.id}>
                    <td className="px-4 py-2 font-medium text-slate-900">
                      <Link href={`/admin/properties/${claim.property.id}`} className="hover:underline">
                        {claim.property.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-slate-600">{claim.ownerName}</td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          claim.status === "APPROVED"
                            ? "rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700"
                            : "rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700"
                        }
                      >
                        {claim.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-600">{claim.reviewedBy?.name ?? "—"}</td>
                    <td className="px-4 py-2 text-slate-600">{claim.reviewedAt?.toLocaleString() ?? "—"}</td>
                    <td className="px-4 py-2 text-slate-600">
                      {!claim.ownerAccess ? (
                        "—"
                      ) : (
                        <OwnerAccessActions
                          ownerAccessId={claim.ownerAccess.id}
                          propertyName={claim.property.name}
                          expiresAt={claim.ownerAccess.expiresAt}
                          revokedAt={claim.ownerAccess.revokedAt}
                          mayManage={mayManageOwnerAccess}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
