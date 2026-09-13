import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminFacilitiesPage() {
  const facilities = await prisma.facility.findMany({
    orderBy: [{ name: "asc" }],
    include: { _count: { select: { properties: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Facilities</h1>
          <p className="mt-1 text-sm text-slate-500">{facilities.length} facilities.</p>
        </div>
        <Link href="/admin/facilities/new" className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700">
          New facility
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Name</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Slug</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Properties</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {facilities.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  No facilities yet. Create the first one — the taxonomy starts empty and is built up manually.
                </td>
              </tr>
            )}
            {facilities.map((f) => (
              <tr key={f.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-medium text-slate-900">{f.name}</td>
                <td className="px-4 py-2 text-slate-500">{f.slug}</td>
                <td className="px-4 py-2 text-slate-600">{f._count.properties}</td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/admin/facilities/${f.id}`} className="text-slate-600 hover:text-slate-900 hover:underline">
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
