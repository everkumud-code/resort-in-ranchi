import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { averageInfluencerRating } from "@/lib/influencers";
import { canManageOwnerAccess, requireAdmin } from "@/lib/auth/session";
import CriteriaManager from "./CriteriaManager";
import { deleteInfluencer, rejectInfluencerClaim } from "./actions";
import ApproveInfluencerClaimForm from "./ApproveInfluencerClaimForm";
import InfluencerOwnerAccessStatus from "./InfluencerOwnerAccessStatus";
import ConfirmForm from "@/components/admin/ConfirmForm";

export const dynamic = "force-dynamic";

export default async function AdminInfluencersPage() {
  const admin = await requireAdmin();
  const mayManageOwnerAccess = canManageOwnerAccess(admin.role);

  const [influencers, criteria, pendingClaims, reviewedClaims, pendingSubmissionCount] = await Promise.all([
    prisma.influencer.findMany({
      orderBy: [{ featured: "desc" }, { order: "asc" }, { name: "asc" }],
      include: { ratings: { select: { score: true, criterionId: true } } },
    }),
    prisma.influencerCriterion.findMany({ orderBy: { order: "asc" } }),
    prisma.influencerClaimRequest.findMany({
      where: { status: "PENDING" },
      include: { influencer: { select: { id: true, name: true, slug: true, claimed: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.influencerClaimRequest.findMany({
      where: { status: { in: ["APPROVED", "REJECTED"] } },
      include: {
        influencer: { select: { id: true, name: true, slug: true } },
        reviewedBy: { select: { name: true } },
        ownerAccess: { select: { id: true, expiresAt: true, revokedAt: true } },
      },
      orderBy: { reviewedAt: "desc" },
      take: 15,
    }),
    prisma.influencerSubmission.count({ where: { status: "PENDING" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Influencers</h1>
          <p className="mt-1 text-sm text-slate-500">
            {influencers.length} total. Published ones appear at <Link href="/influencers" className="underline">/influencers</Link> and on the homepage.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Link href="/admin/influencers/submissions" className="text-sm font-medium text-slate-600 hover:underline">
            Join submissions
            {pendingSubmissionCount > 0 && (
              <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-xs font-semibold text-white">{pendingSubmissionCount}</span>
            )}
          </Link>
          <Link href="/admin/influencers/enquiries" className="text-sm font-medium text-slate-600 hover:underline">
            Creator messages
          </Link>
          <Link href="/admin/influencers/new" className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700">
            New influencer
          </Link>
        </div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-panel-green p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">
          Creator claims — Pending{" "}
          {pendingClaims.length > 0 ? (
            <span className="ml-1 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">{pendingClaims.length}</span>
          ) : (
            `(${pendingClaims.length})`
          )}
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Approving grants a one-time dashboard access link (share it with the creator) and marks the profile claimed. It never publishes or verifies it.
        </p>
        {!mayManageOwnerAccess && <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">Only Admins can approve, reject, or revoke creator access.</p>}

        {pendingClaims.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">No pending claims.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {pendingClaims.map((claim) => (
              <div key={claim.id} className="rounded-lg border border-amber-300 bg-amber-50/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link href={`/admin/influencers/${claim.influencer.id}`} className="font-medium text-slate-900 hover:underline">
                      {claim.influencer.name}
                    </Link>
                    {claim.influencer.claimed && <span className="ml-2 text-xs font-medium text-amber-700">already claimed by another request</span>}
                    <p className="mt-1 text-sm text-slate-700">{claim.claimantName}</p>
                    <p className="text-xs text-slate-500">{claim.email} &middot; {claim.phone}</p>
                    {claim.message && <p className="mt-2 text-sm text-slate-600">&ldquo;{claim.message}&rdquo;</p>}
                    <p className="mt-1 text-xs text-slate-400">Submitted {claim.createdAt.toLocaleString()}</p>
                  </div>
                  {mayManageOwnerAccess && (
                    <div className="flex shrink-0 gap-2">
                      <ApproveInfluencerClaimForm claimId={claim.id} influencerName={claim.influencer.name} />
                      <ConfirmForm
                        action={rejectInfluencerClaim.bind(null, claim.id)}
                        confirmMessage={`Reject this claim for ${claim.influencer.name}?`}
                        label="Reject"
                        className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {reviewedClaims.length > 0 && (
          <div className="mt-5 overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-1.5 text-left font-medium text-slate-500">Creator</th>
                  <th className="px-3 py-1.5 text-left font-medium text-slate-500">Status</th>
                  <th className="px-3 py-1.5 text-left font-medium text-slate-500">Reviewed by</th>
                  <th className="px-3 py-1.5 text-left font-medium text-slate-500">Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reviewedClaims.map((claim) => (
                  <tr key={claim.id}>
                    <td className="px-3 py-1.5 font-medium text-slate-900">{claim.influencer.name}</td>
                    <td className="px-3 py-1.5">
                      <span className={claim.status === "APPROVED" ? "rounded-full bg-green-50 px-2 py-0.5 text-green-700" : "rounded-full bg-red-50 px-2 py-0.5 text-red-700"}>
                        {claim.status}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-slate-600">{claim.reviewedBy?.name ?? "—"}</td>
                    <td className="px-3 py-1.5 text-slate-600">
                      {!claim.ownerAccess ? "—" : (
                        <InfluencerOwnerAccessStatus
                          ownerAccessId={claim.ownerAccess.id}
                          influencerName={claim.influencer.name}
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

      <CriteriaManager criteria={criteria} />

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-panel-green shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Name</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Status</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Featured</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Claimed</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Rating</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {influencers.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No influencers yet.</td></tr>
            )}
            {influencers.map((inf) => {
              const rating = averageInfluencerRating(inf.ratings);
              return (
                <tr key={inf.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium text-slate-900">{inf.name}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        inf.status === "PUBLISHED"
                          ? "rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700"
                          : "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                      }
                    >
                      {inf.status === "PUBLISHED" ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{inf.featured ? "Yes" : "—"}</td>
                  <td className="px-4 py-2 text-slate-600">{inf.claimed ? "Yes" : "—"}</td>
                  <td className="px-4 py-2 text-slate-600">{rating !== null ? `${rating.toFixed(1)} / 5` : "—"}</td>
                  <td className="px-4 py-2 text-right">
                    {inf.status === "PUBLISHED" && (
                      <Link href={`/influencers/${inf.slug}`} className="mr-3 text-slate-500 hover:text-slate-900 hover:underline">View</Link>
                    )}
                    <Link href={`/admin/influencers/${inf.id}`} className="mr-3 text-slate-600 hover:text-slate-900 hover:underline">Edit</Link>
                    <ConfirmForm
                      action={deleteInfluencer.bind(null, inf.id)}
                      confirmMessage={`Delete "${inf.name}"? This can't be undone.`}
                      label="Delete"
                      className="text-red-600 hover:underline"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
