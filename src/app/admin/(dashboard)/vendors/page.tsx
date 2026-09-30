import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { buildPropertyOrderBy, buildPropertyWhereClause, computePagination, parsePage } from "@/lib/queries/properties";
import { COMMERCIAL_TIER_LABELS, COMMERCIAL_TIER_VALUES, isValidCommercialTier } from "@/lib/validation/commercial";
import { StatusBadge } from "@/components/admin/LifecycleBadges";
import CommercialTierSelect from "../properties/[id]/CommercialTierSelect";

export const dynamic = "force-dynamic";

interface SearchParams {
  search?: string;
  tier?: string;
  page?: string;
}

/**
 * A focused view of vendor commercial status — deliberately NOT a second
 * properties table. Filtering/sorting/editing everything else about a
 * property still happens on /admin/properties and its detail page; this
 * page exists only to make "what commercial tier is everyone on, and who's
 * a configured Lead Partner" quick to see and adjust across the directory.
 */
export default async function VendorsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const tier = sp.tier && isValidCommercialTier(sp.tier) ? sp.tier : undefined;

  const where = buildPropertyWhereClause({ search: sp.search ?? null, commercialTier: tier ?? null });
  const orderBy = buildPropertyOrderBy("name");

  const [totalCount, tierCounts] = await Promise.all([
    prisma.property.count({ where }),
    prisma.property.groupBy({ by: ["commercialTier"], _count: { _all: true } }),
  ]);
  const countByTier = Object.fromEntries(tierCounts.map((g) => [g.commercialTier, g._count._all]));

  const { skip, take, page: safePage, totalPages } = computePagination(page, totalCount);

  const properties = await prisma.property.findMany({
    where,
    orderBy,
    skip,
    take,
    select: {
      id: true,
      name: true,
      commercialTier: true,
      featured: true,
      status: true,
      category: { select: { name: true } },
      leadPartner: { select: { id: true, enabled: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Vendors &amp; commercial status</h1>
        <p className="mt-1 text-sm text-slate-500">
          FREE is the default for every listing. PREMIUM and LEAD_PARTNER are plain labels an admin sets — there&apos;s
          no billing yet, and nothing here ever changes automatically.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/admin/vendors"
          className={!tier ? "rounded-full bg-slate-900 px-3 py-1 text-white" : "rounded-full border border-slate-300 px-3 py-1 text-slate-600 hover:bg-slate-50"}
        >
          All ({Object.values(countByTier).reduce((a: number, b) => a + (b as number), 0)})
        </Link>
        {COMMERCIAL_TIER_VALUES.map((value) => (
          <Link
            key={value}
            href={`/admin/vendors?tier=${value}`}
            className={tier === value ? "rounded-full bg-slate-900 px-3 py-1 text-white" : "rounded-full border border-slate-300 px-3 py-1 text-slate-600 hover:bg-slate-50"}
          >
            {COMMERCIAL_TIER_LABELS[value]} ({countByTier[value] ?? 0})
          </Link>
        ))}
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-panel-green p-4 shadow-sm">
        {tier && <input type="hidden" name="tier" value={tier} />}
        <div>
          <label className="block text-xs font-medium text-slate-500">Search name</label>
          <input
            type="text"
            name="search"
            defaultValue={sp.search ?? ""}
            placeholder="Property name…"
            className="mt-1 w-64 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <button type="submit" className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700">
          Search
        </button>
        {sp.search && (
          <Link href={tier ? `/admin/vendors?tier=${tier}` : "/admin/vendors"} className="text-sm text-slate-500 hover:underline">
            Clear
          </Link>
        )}
      </form>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-panel-green shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Name</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Category</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Status</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Featured</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Lead Partner</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Commercial tier</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {properties.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No properties match these filters.
                </td>
              </tr>
            )}
            {properties.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-medium text-slate-900">
                  <Link href={`/admin/properties/${p.id}`} className="hover:underline">
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-slate-600">{p.category.name}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-2 text-slate-600">{p.featured ? "Yes" : "—"}</td>
                <td className="px-4 py-2 text-slate-600">
                  {p.leadPartner ? (p.leadPartner.enabled ? "Enabled" : "Disabled") : "—"}
                </td>
                <td className="px-4 py-2">
                  <CommercialTierSelect propertyId={p.id} commercialTier={p.commercialTier} />
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
                href={`/admin/vendors?${new URLSearchParams({ ...(tier ? { tier } : {}), ...(sp.search ? { search: sp.search } : {}), page: String(safePage - 1) }).toString()}`}
                className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
              >
                Previous
              </Link>
            )}
            {safePage < totalPages && (
              <Link
                href={`/admin/vendors?${new URLSearchParams({ ...(tier ? { tier } : {}), ...(sp.search ? { search: sp.search } : {}), page: String(safePage + 1) }).toString()}`}
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
