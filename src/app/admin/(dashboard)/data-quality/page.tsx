import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMissingFieldsSummary, groupNeedsReviewByName } from "@/lib/queries/dataQuality";

export const dynamic = "force-dynamic";

export default async function DataQualityPage() {
  const [needsReviewProperties, unresolvedVenueSpaces, mergedProperties, totalCount, missingCounts] =
    await Promise.all([
      prisma.property.findMany({
        where: { verificationStatus: "NEEDS_REVIEW" },
        include: { locality: true },
        orderBy: { name: "asc" },
      }),
      prisma.unresolvedVenueSpace.findMany({ orderBy: { sourceRecordId: "asc" } }),
      prisma.property.findMany({
        where: { mergedFromSourceRecordIds: { isEmpty: false } },
        orderBy: { name: "asc" },
      }),
      prisma.property.count(),
      Promise.all([
        prisma.property.count({ where: { phone: null } }),
        prisma.property.count({ where: { website: null } }),
        prisma.property.count({ where: { address: null } }),
        prisma.property.count({ where: { email: null } }),
      ]),
    ]);

  const [phoneMissing, websiteMissing, addressMissing, emailMissing] = missingCounts;
  const missingSummary = formatMissingFieldsSummary(
    { phone: phoneMissing, website: websiteMissing, address: addressMissing, email: emailMissing },
    totalCount
  );

  const needsReviewGroups = groupNeedsReviewByName(
    needsReviewProperties.map((p) => ({ id: p.id, name: p.name, localityName: p.locality?.name ?? null }))
  );

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Data quality</h1>
        <p className="mt-1 text-sm text-slate-500">
          Everything here is surfaced for manual review. Nothing is auto-resolved.
        </p>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-slate-900">
          Properties marked NEEDS_REVIEW ({needsReviewProperties.length})
        </h2>
        {needsReviewGroups.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">None.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {needsReviewGroups.map((group) => (
              <div key={group.normalizedName} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                {group.properties.length > 1 && (
                  <p className="mb-2 text-xs font-medium text-amber-800">
                    Possible duplicate group — {group.properties.length} records with matching normalized name
                  </p>
                )}
                <ul className="space-y-1 text-sm">
                  {group.properties.map((p) => (
                    <li key={p.id} className="flex items-center justify-between">
                      <span className="text-slate-900">
                        {p.name} <span className="text-slate-500">({p.localityName ?? "no locality"})</span>
                      </span>
                      <Link href={`/admin/properties/${p.id}`} className="text-slate-600 hover:underline">
                        Review →
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-900">
          Unresolved venue spaces ({unresolvedVenueSpaces.length})
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          These spreadsheet rows named a parent property that couldn&apos;t be confidently matched. No parent was
          invented — they need manual research.
        </p>
        {unresolvedVenueSpaces.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">None.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-panel-green shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Venue space</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Source record ID</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Parent Property (raw text)</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Reason unresolved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unresolvedVenueSpaces.map((v) => (
                  <tr key={v.id}>
                    <td className="px-4 py-2 font-medium text-slate-900">{v.name}</td>
                    <td className="px-4 py-2 text-slate-600">{v.sourceRecordId}</td>
                    <td className="px-4 py-2 text-slate-600">{v.rawParentName}</td>
                    <td className="px-4 py-2 text-slate-600">{v.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-900">
          Duplicate / merge provenance ({mergedProperties.length})
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Properties that absorbed a confirmed-duplicate spreadsheet row during import.
        </p>
        {mergedProperties.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">None.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-panel-green shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Canonical property</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Canonical source ID</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-500">Merged source record IDs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mergedProperties.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2 font-medium text-slate-900">
                      <Link href={`/admin/properties/${p.id}`} className="hover:underline">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-slate-600">{p.sourceRecordId}</td>
                    <td className="px-4 py-2 text-slate-600">{p.mergedFromSourceRecordIds.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-900">Records missing important fields</h2>
        <p className="mt-1 text-xs text-slate-400">
          Out of {totalCount} total properties. This dataset is research-stage — most fields are expected to be
          empty until verified.
        </p>
        <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-panel-green shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Field</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Missing</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">% missing</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {missingSummary.map((row) => (
                <tr key={row.field}>
                  <td className="px-4 py-2 font-medium text-slate-900">{row.label}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {row.missingCount} / {row.totalCount}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{row.missingPercent}%</td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/admin/properties?missing=${row.field}`} className="text-slate-600 hover:underline">
                      View properties →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
