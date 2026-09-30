import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ name: "asc" }],
    include: { parent: true, _count: { select: { properties: true, children: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Categories</h1>
          <p className="mt-1 text-sm text-slate-500">{categories.length} categories.</p>
        </div>
        <Link href="/admin/categories/new" className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700">
          New category
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
            {categories.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No categories yet.
                </td>
              </tr>
            )}
            {categories.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-medium text-slate-900">{c.name}</td>
                <td className="px-4 py-2 text-slate-500">{c.slug}</td>
                <td className="px-4 py-2 text-slate-600">{c.parent?.name ?? "—"}</td>
                <td className="px-4 py-2 text-slate-600">{c._count.properties}</td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/admin/categories/${c.id}`} className="text-slate-600 hover:text-slate-900 hover:underline">
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
