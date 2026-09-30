import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  buildPropertyOrderBy,
  buildPropertyWhereClause,
  computePagination,
  parsePage,
  type PropertySort,
} from "@/lib/queries/properties";
import { PROPERTY_STATUS_VALUES, VERIFICATION_STATUS_VALUES } from "@/lib/validation/property";
import { StatusBadge, VerificationBadge } from "@/components/admin/LifecycleBadges";

export const dynamic = "force-dynamic";

interface SearchParams {
  search?: string;
  category?: string;
  location?: string;
  status?: string;
  verificationStatus?: string;
  missing?: string;
  claimed?: string;
  featured?: string;
  sort?: string;
  page?: string;
}

function qs(params: Record<string, string | undefined>) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) usp.set(k, v);
  }
  const s = usp.toString();
  return s ? `?${s}` : "";
}

export default async function AdminPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const sort = (sp.sort as PropertySort) || "newest";
  const page = parsePage(sp.page);

  const where = buildPropertyWhereClause({
    search: sp.search ?? null,
    categorySlug: sp.category ?? null,
    localitySlug: sp.location ?? null,
    status: sp.status ?? null,
    verificationStatus: sp.verificationStatus ?? null,
    missingField: (sp.missing as "phone" | "website" | "address" | "email") ?? null,
    claimed: sp.claimed === "true",
    featured: sp.featured === "true",
  });
  const orderBy = buildPropertyOrderBy(sort);

  const [totalCount, categories, locations] = await Promise.all([
    prisma.property.count({ where }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } }),
    prisma.location.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } }),
  ]);

  const { skip, take, page: safePage, totalPages } = computePagination(page, totalCount);

  const properties = await prisma.property.findMany({
    where,
    orderBy,
    skip,
    take,
    include: { category: true, locality: true, _count: { select: { venueSpaces: true } } },
  });

  const baseParams = {
    search: sp.search,
    category: sp.category,
    location: sp.location,
    status: sp.status,
    verificationStatus: sp.verificationStatus,
    missing: sp.missing,
    claimed: sp.claimed,
    featured: sp.featured,
    sort: sp.sort,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Properties</h1>
          <p className="mt-1 text-sm text-slate-500">{totalCount} matching properties.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/properties/bulk-publish"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Bulk publish Discovery listings
          </Link>
          <Link href="/admin/properties/new" className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700">
            New property
          </Link>
        </div>
      </div>

      <form method="get" className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-panel-green p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-2">
          <label className="block text-xs font-medium text-slate-500">Search name</label>
          <input
            type="text"
            name="search"
            defaultValue={sp.search ?? ""}
            placeholder="Property name…"
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Category</label>
          <select name="category" defaultValue={sp.category ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Location</label>
          <select name="location" defaultValue={sp.location ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
            <option value="">All locations</option>
            {locations.map((l) => (
              <option key={l.slug} value={l.slug}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Status</label>
          <select name="status" defaultValue={sp.status ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
            <option value="">All statuses</option>
            {PROPERTY_STATUS_VALUES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Verification status</label>
          <select
            name="verificationStatus"
            defaultValue={sp.verificationStatus ?? ""}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">All statuses</option>
            {VERIFICATION_STATUS_VALUES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Sort</label>
          <select name="sort" defaultValue={sort} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
            <option value="newest">Newest</option>
            <option value="name">Name</option>
            <option value="status">Status</option>
          </select>
        </div>
        <div className="flex items-end gap-2 lg:col-span-7">
          <button type="submit" className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700">
            Apply filters
          </button>
          <Link href="/admin/properties" className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
            Clear
          </Link>
        </div>
      </form>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-panel-green shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Name</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Category</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Location</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Status</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Verification</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Venue spaces</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {properties.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  No properties match these filters.
                </td>
              </tr>
            )}
            {properties.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-medium text-slate-900">{p.name}</td>
                <td className="px-4 py-2 text-slate-600">{p.category.name}</td>
                <td className="px-4 py-2 text-slate-600">{p.locality?.name ?? "—"}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-2">
                  <VerificationBadge verificationStatus={p.verificationStatus} />
                </td>
                <td className="px-4 py-2 text-slate-600">{p._count.venueSpaces}</td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/admin/properties/${p.id}`} className="text-slate-600 hover:text-slate-900 hover:underline">
                    View / Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            Page {safePage} of {totalPages}
          </span>
          <div className="flex gap-2">
            {safePage > 1 && (
              <Link
                href={`/admin/properties${qs({ ...baseParams, page: String(safePage - 1) })}`}
                className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
              >
                Previous
              </Link>
            )}
            {safePage < totalPages && (
              <Link
                href={`/admin/properties${qs({ ...baseParams, page: String(safePage + 1) })}`}
                className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
