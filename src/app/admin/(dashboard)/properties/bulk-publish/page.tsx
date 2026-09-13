import { prisma } from "@/lib/prisma";
import { computeBulkPublishPlan } from "@/lib/validation/bulkPublish";
import BulkPublishConfirmForm from "./BulkPublishConfirmForm";

export const dynamic = "force-dynamic";

export default async function BulkPublishPage() {
  const properties = await prisma.property.findMany({
    select: { id: true, name: true, status: true, verificationStatus: true },
  });
  const plan = computeBulkPublishPlan(properties);

  const rows = [
    ["Total properties", properties.length],
    ["Eligible for bulk publish", plan.eligibleIds.length],
    ["Already published", plan.excludedAlreadyPublished.length],
    ["Not DISCOVERED (NEEDS_REVIEW, VERIFIED, CLOSED, etc.)", plan.excludedNotDiscovered.length],
    ["Identity-conflict records", plan.excludedIdentityConflict.length],
    ["Explicitly protected (Aangan Palace)", plan.excludedProtected.length],
    ["Held (RED — identity/operational/source concern)", plan.excludedRed.length],
  ] as const;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Bulk publish Discovery listings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Publishes every currently-eligible DISCOVERED property as a Discovery listing. Never touches
          verificationStatus — every published property here stays honestly labeled &ldquo;Discovery
          listing&rdquo; until an admin separately verifies it.
        </p>
      </div>

      <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <tbody className="divide-y divide-slate-100">
            {rows.map(([label, count]) => (
              <tr key={label}>
                <td className="px-4 py-2 text-slate-600">{label}</td>
                <td className="px-4 py-2 text-right font-medium text-slate-900">{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-lg border border-red-200 bg-red-50/40 p-4">
        <h2 className="text-sm font-semibold text-red-900">Publish</h2>
        <p className="mt-1 text-xs text-red-800">
          This is irreversible via this form (listings can be individually unpublished afterward, but not
          bulk-reverted). Re-read the counts above before confirming.
        </p>
        <div className="mt-3">
          <BulkPublishConfirmForm eligibleCount={plan.eligibleIds.length} />
        </div>
      </section>
    </div>
  );
}
