import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminLocationsPage() {
  const locations = await prisma.location.findMany({
    orderBy: [{ name: "asc" }],
    include: { parent: true, _count: { select: { properties: true, children: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Locations</h1>
          <p className="mt-1 text-sm text-slate-500">{locations.length} locations.</p>
        </div>
        <Link href="/admin/locations/new" className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700">
          New location
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-panel-green shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Name</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Slug</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Parent</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Properties</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {locations.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No locations yet.
                </td>
              </tr>
            )}
            {locations.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-medium text-slate-900">{l.name}</td>
                <td className="px-4 py-2 text-slate-500">{l.slug}</td>
                <td className="px-4 py-2 text-slate-600">{l.parent?.name ?? "—"}</td>
                <td className="px-4 py-2 text-slate-600">{l._count.properties}</td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/admin/locations/${l.id}`} className="text-slate-600 hover:text-slate-900 hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
