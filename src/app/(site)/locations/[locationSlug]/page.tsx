import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocationBySlug, getLocationIdsForPage, getCategoryBreakdownForLocations } from "@/lib/public/locations";
import { getFacilitiesWithPublishedCounts } from "@/lib/public/facilities";
import { buildPublicOrderBy, listPublicProperties, type PublicPropertyCard } from "@/lib/public/properties";
import { getLocationDiscoverySupplement } from "@/lib/public/discovery";
import { buildDiscoveryCountLabel, remainingForDensity } from "@/lib/public/discoveryDensity";
import {
  buildFacilityTrustWhere,
  buildQueryString,
  hasActiveFacilityOrTrustFilter,
  hasAnyFilterOrSort,
  sanitizeFacilitySlugs,
  sanitizeTrustParam,
  type QueryParam,
  type TrustFilterValue,
} from "@/lib/public/filters";
import { buildPageMetadata } from "@/lib/public/seo";
import { itemListJsonLd } from "@/lib/public/structuredData";
import { computePagination, parsePage } from "@/lib/queries/properties";
import Breadcrumbs from "@/components/site/Breadcrumbs";
import PropertyCard from "@/components/site/PropertyCard";
import EmptyState from "@/components/site/EmptyState";
import Pagination from "@/components/site/Pagination";
import FacilityTrustFilterPanel from "@/components/site/FacilityTrustFilterPanel";
import AdSlot from "@/components/site/ads/AdSlot";
import { getAanganResortAdCreative } from "@/lib/ads/adCreative";
import JsonLd from "@/components/site/JsonLd";

interface PageParams {
  locationSlug: string;
}
interface PageSearchParams {
  category?: string;
  sort?: string;
  page?: string;
  facility?: string | string[];
  trust?: string;
}

const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "newest", label: "Newest" },
  { value: "name", label: "Name (A–Z)" },
] as const;

async function loadLocationPage(
  locationSlug: string,
  sp: PageSearchParams,
  facilitySlugs: string[],
  trust: TrustFilterValue | undefined
) {
  const location = await getLocationBySlug(locationSlug);
  if (!location) return null;

  const locationIds = await getLocationIdsForPage(location);
  const page = parsePage(sp.page);
  const where = {
    localityId: { in: locationIds },
    ...(sp.category ? { category: { slug: sp.category } } : {}),
    ...buildFacilityTrustWhere({ facilitySlugs, trust }),
  };
  const orderBy = buildPublicOrderBy(sp.sort);

  const { totalCount } = await listPublicProperties({ where });
  const { skip, take, page: safePage, totalPages } = computePagination(page, totalCount);
  const { items } = await listPublicProperties({ where, orderBy, skip, take });
  const categoryBreakdown = await getCategoryBreakdownForLocations(locationIds);

  // Same rule as the category page: supplementation only ever applies to
  // the default, unfiltered first page — a deliberate category/facility/
  // trust narrowing is the visitor asking for exactly those exact matches.
  const filtersActive = Boolean(sp.category) || facilitySlugs.length > 0 || Boolean(trust);
  let supplemented: PublicPropertyCard[] = [];
  if (safePage === 1 && !filtersActive) {
    const need = remainingForDensity(totalCount);
    if (need > 0) {
      supplemented = await getLocationDiscoverySupplement({
        location,
        exactLocationIds: locationIds,
        shownIds: new Set(items.map((p) => p.id)),
        need,
      });
    }
  }

  return { location, items, totalCount, page: safePage, totalPages, categoryBreakdown, supplemented };
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams: Promise<PageSearchParams>;
}): Promise<Metadata> {
  const { locationSlug } = await params;
  const sp = await searchParams;
  const location = await getLocationBySlug(locationSlug);
  if (!location) {
    return buildPageMetadata({ title: "Not found", description: "Location not found.", path: `/locations/${locationSlug}`, noindex: true });
  }

  const locationIds = await getLocationIdsForPage(location);
  const { totalCount } = await listPublicProperties({ where: { localityId: { in: locationIds } } });

  // Filtered/sorted variants (?category=..., ?sort=..., ?facility=..., ?trust=...)
  // are never indexed and always canonicalize back to the bare location URL
  // — `path` below never includes the query string, so canonical is already
  // the clean base URL; this just adds noindex for those variants.
  const hasFilterOrSort = hasAnyFilterOrSort({ scoping: sp.category, sort: sp.sort, facility: sp.facility, trust: sp.trust });

  return buildPageMetadata({
    title: `Places to stay, eat & celebrate in ${location.name}`,
    description:
      location.description ??
      `Resorts, hotels, restaurants and venues in ${location.name}, near Ranchi — ${totalCount} listing${totalCount === 1 ? "" : "s"}.`,
    path: `/locations/${locationSlug}`,
    noindex: totalCount === 0 || hasFilterOrSort,
  });
}

export default async function LocationPage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams: Promise<PageSearchParams>;
}) {
  const { locationSlug } = await params;
  const sp = await searchParams;
  const facilities = await getFacilitiesWithPublishedCounts();
  const activeFacilitySlugs = sanitizeFacilitySlugs(sp.facility, facilities.map((f) => f.slug));
  const activeTrust = sanitizeTrustParam(sp.trust);

  const [result, adCreative] = await Promise.all([
    loadLocationPage(locationSlug, sp, activeFacilitySlugs, activeTrust),
    getAanganResortAdCreative(),
  ]);
  if (!result) notFound();

  const { location, items, totalCount, page, totalPages, categoryBreakdown, supplemented } = result;
  const activeSort = sp.sort ?? "recommended";
  const filtersActive = hasActiveFacilityOrTrustFilter({ facilitySlugs: activeFacilitySlugs, trust: activeTrust });
  const displayedCount = items.length + supplemented.length;
  const countLabel = buildDiscoveryCountLabel({
    exactCount: totalCount,
    displayedCount,
    exactNounPhrase: `${totalCount} ${totalCount === 1 ? "listing" : "listings"}`,
  });

  const buildHref = (overrides: Record<string, QueryParam>) =>
    `/locations/${locationSlug}${buildQueryString({
      category: sp.category,
      sort: sp.sort,
      facility: activeFacilitySlugs,
      trust: activeTrust,
      ...overrides,
    })}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {items.length > 0 && (
        <JsonLd data={itemListJsonLd(items.map((p) => ({ name: p.name, path: `/property/${p.slug}` })))} />
      )}
      <Breadcrumbs items={[{ name: location.name, path: `/locations/${locationSlug}` }]} />
      <h1 className="mt-3 font-serif text-3xl font-semibold text-brand-dark">{location.name}</h1>
      {location.description && <p className="mt-2 max-w-2xl text-sm text-brand-dark/70">{location.description}</p>}
      <p className="mt-2 text-sm text-brand/60">
        {countLabel.primary}
        {countLabel.secondary && <span className="block text-xs text-brand/50">{countLabel.secondary}</span>}
      </p>

      {categoryBreakdown.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {categoryBreakdown.map((c) => (
            <Link
              key={c.slug}
              href={buildHref({ category: c.slug })}
              className={`rounded-full border px-3 py-1 ${
                sp.category === c.slug
                  ? "border-brand-orange bg-brand-orange text-white"
                  : "border-brand/20 text-brand-dark hover:border-brand/50"
              }`}
            >
              {c.name} ({c.count})
            </Link>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-brand/60">
        <span>Sort:</span>
        {SORT_OPTIONS.map((opt) => (
          <Link
            key={opt.value}
            href={buildHref({ sort: opt.value === "recommended" ? undefined : opt.value })}
            className={activeSort === opt.value ? "font-semibold text-brand-dark underline" : "hover:text-brand-dark"}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      <FacilityTrustFilterPanel
        facilities={facilities.filter((f) => f.publishedCount > 0)}
        activeFacilitySlugs={activeFacilitySlugs}
        activeTrust={activeTrust}
        buildHref={buildHref}
      />

      {adCreative && (
        <div className="mt-6">
          <AdSlot ladder="banner" creative={adCreative} />
        </div>
      )}

      <div className="mt-6 lg:grid lg:grid-cols-[1fr_280px] lg:items-start lg:gap-8">
        <div>
          {items.length === 0 ? (
            <EmptyState
              title={filtersActive ? "No listings match these filters" : "No listings here yet"}
              description={
                filtersActive
                  ? "Try removing a facility or trust filter."
                  : "Listings in this area are being verified before publishing. Check back soon."
              }
              action={
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                  {filtersActive && (
                    <Link href={buildHref({ facility: undefined, trust: undefined })} className="text-sm text-brand-teal hover:underline">
                      Clear filters
                    </Link>
                  )}
                  <Link href="/list-your-business" className="text-sm font-medium text-brand-teal hover:underline">
                    Know a business that should be here? Add it &rarr;
                  </Link>
                </div>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {items.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          )}

          <div className="mt-8">
            <Pagination
              basePath={`/locations/${locationSlug}`}
              page={page}
              totalPages={totalPages}
              params={{ category: sp.category, sort: sp.sort, facility: activeFacilitySlugs, trust: activeTrust }}
            />
          </div>

          {supplemented.length > 0 && (
            <div className="mt-10 border-t border-brand/10 pt-6">
              <h2 className="font-serif text-xl font-semibold text-brand-dark">More Places to Explore</h2>
              <p className="mt-1 text-sm text-brand/60">
                These aren&apos;t listed in {location.name}, but might interest you too.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {supplemented.map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
            </div>
          )}
        </div>

        {adCreative && (
          <aside className="hidden lg:block">
            <div className="sticky top-6">
              <AdSlot ladder="rail" creative={adCreative} />
            </div>
          </aside>
        )}
      </div>

      {categoryBreakdown.length > 0 && (
        <div className="mt-10 border-t border-brand/10 pt-6">
          <h2 className="text-sm font-semibold tracking-wide text-brand-dark uppercase">Browse categories in {location.name}</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {categoryBreakdown.map((c) => (
              <Link
                key={c.slug}
                href={`/${c.slug}`}
                className="rounded-full border border-brand/20 px-3 py-1 text-brand-dark hover:border-brand/50"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
