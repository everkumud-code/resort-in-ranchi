import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { canManageOwnerAccess, requireAdmin } from "@/lib/auth/session";
import ApproveSubmissionForm from "./ApproveSubmissionForm";
import RejectSubmissionForm from "./RejectSubmissionForm";

export const dynamic = "force-dynamic";

export default async function SubmissionsPage() {
  const admin = await requireAdmin();
  const mayReview = canManageOwnerAccess(admin.role);
  const [pending, reviewed] = await Promise.all([
    prisma.propertySubmission.findMany({
      where: { status: "PENDING" },
      include: {
        category: { select: { name: true } },
        locality: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.propertySubmission.findMany({
      where: { status: { in: ["APPROVED", "REJECTED"] } },
      include: {
        category: { select: { name: true } },
        reviewedBy: { select: { name: true } },
        approvedProperty: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { reviewedAt: "desc" },
      take: 25,
    }),
  ]);

  const duplicateIds = pending
    .map((submission) => submission.duplicateOfPropertyId)
    .filter((id): id is string => Boolean(id));
  const duplicateProperties = duplicateIds.length
    ? await prisma.property.findMany({ where: { id: { in: duplicateIds } }, select: { id: true, name: true, slug: true } })
    : [];
  const duplicateById = new Map(duplicateProperties.map((p) => [p.id, p]));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Add Your Business submissions</h1>
        <p className="mt-1 text-sm text-slate-500">
          Approving a submission publishes a new listing and grants the submitter owner access. It never marks the
          listing Verified — that stays a separate decision.
        </p>
      </div>

      {!mayReview && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">Only Admins can approve or reject submissions.</p>
      )}

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
          <p className="mt-2 text-sm text-slate-400">No pending submissions.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {pending.map((submission) => {
              const duplicate = submission.duplicateOfPropertyId ? duplicateById.get(submission.duplicateOfPropertyId) : null;
              return (
                <div key={submission.id} className="rounded-lg border border-amber-300 bg-amber-50/60 p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className="mr-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Awaiting review</span>
                      <span className="font-medium text-slate-900">{submission.name}</span>
                      <p className="mt-1 text-sm text-slate-700">
                        {submission.category.name}
                        {submission.locality ? ` · ${submission.locality.name}` : ""}
                      </p>
                      {submission.address && <p className="text-xs text-slate-500">{submission.address}</p>}
                      <p className="mt-2 text-sm text-slate-700">
                        {submission.contactName} &middot; {submission.contactRole}
                      </p>
                      <p className="text-xs text-slate-500">
                        {submission.contactEmail} &middot; {submission.contactPhone}
                      </p>
                      {submission.description && <p className="mt-2 text-sm text-slate-600">&ldquo;{submission.description}&rdquo;</p>}
                      {duplicate && (
                        <p className="mt-2 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                          Possible duplicate of{" "}
                          <Link href={`/admin/properties/${duplicate.id}`} className="underline">
                            {duplicate.name}
                          </Link>{" "}
                          — please check before approving.
                        </p>
                      )}
                      <p className="mt-1 text-xs text-slate-400">Submitted {submission.createdAt.toLocaleString()}</p>
                    </div>
                    {mayReview && (
                      <div className="flex shrink-0 gap-2">
                        <ApproveSubmissionForm submissionId={submission.id} businessName={submission.name} />
                        <RejectSubmissionForm submissionId={submission.id} businessName={submission.name} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Business</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Category</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Status</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Reviewed by</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Reviewed at</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reviewed.map((submission) => (
                  <tr key={submission.id}>
                    <td className="px-4 py-2 font-medium text-slate-900">
                      {submission.approvedProperty ? (
                        <Link href={`/admin/properties/${submission.approvedProperty.id}`} className="hover:underline">
                          {submission.approvedProperty.name}
                        </Link>
                      ) : (
                        submission.name
                      )}
                    </td>
                    <td className="px-4 py-2 text-slate-600">{submission.category.name}</td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          submission.status === "APPROVED"
                            ? "rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700"
                            : "rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700"
                        }
                      >
                        {submission.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-600">{submission.reviewedBy?.name ?? "—"}</td>
                    <td className="px-4 py-2 text-slate-600">{submission.reviewedAt?.toLocaleString() ?? "—"}</td>
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
