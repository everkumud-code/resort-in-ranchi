import type { Metadata } from "next";
import { buildPublicOrderBy, buildPublicSearchWhere, listPublicProperties } from "@/lib/public/properties";
import { getCategoriesWithPublishedCounts } from "@/lib/public/categories";
import { getLocationsWithPublishedCounts } from "@/lib/public/locations";
import { getFacilitiesWithPublishedCounts } from "@/lib/public/facilities";
import {
  buildFacilityTrustWhere,
  buildQueryString,
  hasActiveFacilityOrTrustFilter,
  sanitizeFacilitySlugs,
  sanitizeTrustParam,
  type QueryParam,
} from "@/lib/public/filters";
import { buildPageMetadata } from "@/lib/public/seo";
import { buildTrackedSearchPath } from "@/lib/analyticsInsights";
import { computePagination, parsePage } from "@/lib/queries/properties";
import PropertyCard from "@/components/site/PropertyCard";
import EmptyState from "@/components/site/EmptyState";
import Pagination from "@/components/site/Pagination";
import FacilityTrustFilterPanel from "@/components/site/FacilityTrustFilterPanel";
import AnalyticsBeacon from "@/components/site/AnalyticsBeacon";
import AdSlot from "@/components/site/ads/AdSlot";
import { getAanganResortAdCreative } from "@/lib/ads/adCreative";
import Link from "next/link";

interface PageSearchParams {
  q?: string;
  category?: string;
  location?: string;
  sort?: string;
  page?: string;
  facility?: string | string[];
  trust?: string;
}

export function generateMetadata(): Metadata {
  // Search results are a filter surface, not unique content — never indexed,
  // per the product spec's SEO rules ("exclude ... private/search/filter pages").
  return buildPageMetadata({ title: "Search", description: "Search the ResortInRanchi directory.", path: "/search", noindex: true });
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<PageSearchParams> }) {
  const sp = await searchParams;
  const [categories, locations, facilities] = await Promise.all([
    getCategoriesWithPublishedCounts(),
    getLocationsWithPublishedCounts(),
    getFacilitiesWithPublishedCounts(),
  ]);

  const activeFacilitySlugs = sanitizeFacilitySlugs(sp.facility, facilities.map((f) => f.slug));
  const activeTrust = sanitizeTrustParam(sp.trust);

  const where = {
    ...buildPublicSearchWhere({ query: sp.q, categorySlug: sp.category, localitySlug: sp.location }),
    ...buildFacilityTrustWhere({ facilitySlugs: activeFacilitySlugs, trust: activeTrust }),
  };
  const orderBy = buildPublicOrderBy(sp.sort);
  const page = parsePage(sp.page);

  const { totalCount } = await listPublicProperties({ where });
  const { skip, take, page: safePage, totalPages } = computePagination(page, totalCount);
  const { items } = await listPublicProperties({ where, orderBy, skip, take });
  const adCreative = items.length > 0 ? await getAanganResortAdCreative() : null;

  const filtersActive = hasActiveFacilityOrTrustFilter({ facilitySlugs: activeFacilitySlugs, trust: activeTrust });
  const hasQuery = Boolean(sp.q || sp.category || sp.location || filtersActive);

  const buildHref = (overrides: Record<string, QueryParam>) =>
    `/search${buildQueryString({
      q: sp.q,
      category: sp.category,
      location: sp.location,
      sort: sp.sort,
      facility: activeFacilitySlugs,
      trust: activeTrust,
      ...overrides,
    })}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {hasQuery && <AnalyticsBeacon type="SEARCH" path={buildTrackedSearchPath({ category: sp.category, location: sp.location })} />}
      <h1 className="font-serif text-2xl font-semibold text-brand-dark">Search</h1>

      <form method="get" className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-brand/10 bg-white p-4 sm:grid-cols-4">
        {activeFacilitySlugs.map((slug) => (
          <input key={slug} type="hidden" name="facility" value={slug} />
        ))}
        {activeTrust && <input type="hidden" name="trust" value={activeTrust} />}
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-brand/60">Search</label>
          <input
            type="text"
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Property name…"
            className="mt-1 w-full rounded-md border border-brand/20 px-2 py-1.5 text-sm text-brand-dark focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-brand/60">Category</label>
          <select name="category" defaultValue={sp.category ?? ""} className="mt-1 w-full rounded-md border border-brand/20 px-2 py-1.5 text-sm text-brand-dark focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand">
            <option value="">All categories</option>
            {categories
              .filter((c) => c.publishedCount > 0)
              .map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-brand/60">Location</label>
          <select name="location" defaultValue={sp.location ?? ""} className="mt-1 w-full rounded-md border border-brand/20 px-2 py-1.5 text-sm text-brand-dark focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand">
            <option value="">All locations</option>
            {locations
              .filter((l) => l.publishedCount > 0)
              .map((l) => (
                <option key={l.slug} value={l.slug}>
                  {l.name}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-brand/60">Sort</label>
          <select name="sort" defaultValue={sp.sort ?? "recommended"} className="mt-1 w-full rounded-md border border-brand/20 px-2 py-1.5 text-sm text-brand-dark focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand">
            <option value="recommended">Recommended</option>
            <option value="newest">Newest</option>
            <option value="name">Name (A–Z)</option>
          </select>
        </div>
        <div className="flex items-end gap-2 sm:col-span-4">
          <button type="submit" className="rounded-md bg-brand-orange px-4 py-1.5 text-sm font-medium text-white hover:brightness-95">
            Search
          </button>
          <Link href="/search" className="rounded-md border border-brand/20 px-4 py-1.5 text-sm text-brand-dark hover:bg-brand-cream">
            Clear
          </Link>
        </div>
      </form>

      <FacilityTrustFilterPanel
        facilities={facilities.filter((f) => f.publishedCount > 0)}
        activeFacilitySlugs={activeFacilitySlugs}
        activeTrust={activeTrust}
        buildHref={buildHref}
      />

      <div className="mt-6">
        {!hasQuery ? (
          <EmptyState title="Start searching" description="Enter a name, or pick a category, location, or filter above." />
        ) : items.length === 0 ? (
          <EmptyState
            title="No matches"
            description="Try a different search term, or loosen your filters."
            action={
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                {filtersActive && (
                  <Link href={buildHref({ facility: undefined, trust: undefined })} className="text-sm text-brand-teal hover:underline">
                    Clear filters
                  </Link>
                )}
                <Link href="/list-your-business" className="text-sm font-medium text-brand-teal hover:underline">
                  Can&apos;t find the business you&apos;re looking for? Add it &rarr;
                </Link>
              </div>
            }
          />
        ) : (
          <>
            <p className="mb-4 text-sm text-brand/60">
              {totalCount} {totalCount === 1 ? "result" : "results"}
            </p>
            {adCreative && (
              <div className="mb-6">
                <AdSlot ladder="banner" creative={adCreative} />
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="mt-8">
        <Pagination
          basePath="/search"
          page={safePage}
          totalPages={totalPages}
          params={{ q: sp.q, category: sp.category, location: sp.location, sort: sp.sort, facility: activeFacilitySlugs, trust: activeTrust }}
        />
      </div>
    </div>
  );
}
