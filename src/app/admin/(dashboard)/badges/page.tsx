import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ConfirmForm from "@/components/admin/ConfirmForm";
import { deleteTrustBadge } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminBadgesPage() {
  const badges = await prisma.trustBadge.findMany({
    orderBy: [{ order: "asc" }, { label: "asc" }],
    include: { _count: { select: { properties: true, influencers: true, events: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Trust badges</h1>
          <p className="mt-1 text-sm text-slate-500">
            {badges.length} badges. Assigned per-listing from each property/influencer/event&apos;s own edit page.
          </p>
        </div>
        <Link href="/admin/badges/new" className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700">
          New badge
        </Link>
      </div>

      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Every badge needs a real, checkable meaning — the description is shown on hover wherever it appears. Don&apos;t
        assign a badge you can&apos;t back up with a real source or an explicit admin decision.
      </p>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-panel-green shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Label</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Key</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Description</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Used on</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {badges.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No badges yet.
                </td>
              </tr>
            )}
            {badges.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-medium text-slate-900">{b.label}</td>
                <td className="px-4 py-2 text-slate-500">{b.key}</td>
                <td className="max-w-xs px-4 py-2 text-slate-600">{b.description}</td>
                <td className="px-4 py-2 text-slate-600">
                  {b._count.properties + b._count.influencers + b._count.events === 0
                    ? "—"
                    : `${b._count.properties} properties, ${b._count.influencers} influencers, ${b._count.events} events`}
                </td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/admin/badges/${b.id}`} className="mr-3 text-slate-600 hover:text-slate-900 hover:underline">
                    Edit
                  </Link>
                  <ConfirmForm
                    action={deleteTrustBadge.bind(null, b.id)}
                    confirmMessage={`Delete the "${b.label}" badge? It will be removed from everything it's currently assigned to.`}
                    label="Delete"
                    className="text-red-600 hover:underline"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
