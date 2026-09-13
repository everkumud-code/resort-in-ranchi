import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug, getCategoryIdsForPage } from "@/lib/public/categories";
import { getLocationsWithPublishedCounts } from "@/lib/public/locations";
import { getFacilitiesWithPublishedCounts } from "@/lib/public/facilities";
import { buildPublicOrderBy, listPublicProperties, type PublicPropertyCard } from "@/lib/public/properties";
import { getCategoryDiscoverySupplement } from "@/lib/public/discovery";
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
import JsonLd from "@/components/site/JsonLd";
import Link from "next/link";

interface PageParams {
  categorySlug: string;
}
interface PageSearchParams {
  location?: string;
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

async function loadCategoryPage(
  categorySlug: string,
  sp: PageSearchParams,
  facilitySlugs: string[],
  trust: TrustFilterValue | undefined
) {
  const category = await getCategoryBySlug(categorySlug);
  if (!category) return null;

  const categoryIds = await getCategoryIdsForPage(category);
  const where = {
    categoryId: { in: categoryIds },
    ...(sp.location ? { locality: { slug: sp.location } } : {}),
    ...buildFacilityTrustWhere({ facilitySlugs, trust }),
  };
  const orderBy = buildPublicOrderBy(sp.sort);

  const { totalCount } = await listPublicProperties({ where });
  const { skip, take, page: safePage, totalPages } = computePagination(page, totalCount);
  const { items } = await listPublicProperties({ where, orderBy, skip, take });

  const filtersActive = Boolean(sp.location) || facilitySlugs.length > 0 || Boolean(trust);
  let supplemented: PublicPropertyCard[] = [];
  if (safePage === 1 && !filtersActive) {
    const need = remainingForDensity(totalCount);
    if (need > 0) {
      supplemented = await getCategoryDiscoverySupplement({
        category,
        exactCategoryIds: categoryIds,
        shownIds: new Set(items.map((p) => p.id)),
        need,
      });
    }
  }

  return { category, items, totalCount, page: safePage, totalPages, supplemented };
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams: Promise<PageSearchParams>;
}): Promise<Metadata> {
  const { categorySlug } = await params;
  const sp = await searchParams;
  const category = await getCategoryBySlug(categorySlug);
  if (!category) return buildPageMetadata({ title: "Not found", description: "Category not found.", path: `/${categorySlug}`, noindex: true });

  const categoryIds = await getCategoryIdsForPage(category);
  const { totalCount } = await listPublicProperties({ where: { categoryId: { in: categoryIds } } });
  const hasFilterOrSort = hasAnyFilterOrSort({ scoping: sp.location, sort: sp.sort, facility: sp.facility, trust: sp.trust });

  return buildPageMetadata({
    title: `${category.name} in Ranchi`,
    description:
      category.description ??
      `Browse ${category.name.toLowerCase()} in and around Ranchi — ${totalCount} listing${totalCount === 1 ? "" : "s"} on ResortInRanchi.`,
    path: `/${categorySlug}`,
    noindex: totalCount === 0 || hasFilterOrSort,
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams: Promise<PageSearchParams>;
}) {
  const { categorySlug } = await params;
  const sp = await searchParams;
  const facilities = await getFacilitiesWithPublishedCounts();
  const activeFacilitySlugs = sanitizeFacilitySlugs(sp.facility, facilities.map((f) => f.slug));
  const activeTrust = sanitizeTrustParam(sp.trust);

  const result = await loadCategoryPage(categorySlug, sp, activeFacilitySlugs, activeTrust);
  if (!result) notFound();

  const { category, items, totalCount, page, totalPages, supplemented } = result;
  const locations = await getLocationsWithPublishedCounts();
  const relevantLocations = locations.filter((l) => l.publishedCount > 0).slice(0, 12);
  const activeSort = sp.sort ?? "recommended";
  const filtersActive = hasActiveFacilityOrTrustFilter({ facilitySlugs: activeFacilitySlugs, trust: activeTrust });
  const displayedCount = items.length + supplemented.length;
  const countLabel = buildDiscoveryCountLabel({
    exactCount: totalCount,
    displayedCount,
    exactNounPhrase: `${totalCount} ${totalCount === 1 ? "listing" : "listings"}`,
  });

  const buildHref = (overrides: Record<string, QueryParam>) =>
    `/${categorySlug}${buildQueryString({
      location: sp.location,
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
      <Breadcrumbs items={[{ name: category.name, path: `/${categorySlug}` }]} />
      <h1 className="mt-3 font-serif text-3xl font-semibold text-brand-dark">{category.name} in Ranchi</h1>
      {category.description && <p className="mt-2 max-w-2xl text-sm text-brand-dark/70">{category.description}</p>}
      <p className="mt-2 text-sm text-brand/60">
        {countLabel.primary}
        {countLabel.secondary && <span className="block text-xs text-brand/50">{countLabel.secondary}</span>}
      </p>

      {relevantLocations.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {relevantLocations.map((l) => (
            <Link
              key={l.slug}
              href={buildHref({ location: l.slug })}
              className={`rounded-full border px-3 py-1 ${
                sp.location === l.slug
                  ? "border-brand-orange bg-brand-orange text-white"
                  : "border-brand/20 text-brand-dark hover:border-brand/50"
              }`}
            >
              {l.name}
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

      <div className="mt-6 lg:grid lg:grid-cols-1 lg:items-start">
        <div>
          {items.length === 0 ? (
            <EmptyState
              title={filtersActive ? "No listings match these filters" : "No listings here yet"}
              description={
                filtersActive
                  ? "Try removing a facility or trust filter."
                  : "Listings in this category are being verified before publishing. Check back soon."
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
              basePath={`/${categorySlug}`}
              page={page}
              totalPages={totalPages}
              params={{ location: sp.location, sort: sp.sort, facility: activeFacilitySlugs, trust: activeTrust }}
            />
          </div>

          {supplemented.length > 0 && (
            <div className="mt-10 border-t border-brand/10 pt-6">
              <h2 className="font-serif text-xl font-semibold text-brand-dark">More Places to Explore</h2>
              <p className="mt-1 text-sm text-brand/60">
                These aren&apos;t {category.name} listings, but might interest you too.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {supplemented.map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {relevantLocations.length > 0 && (
        <div className="mt-10 border-t border-brand/10 pt-6">
          <h2 className="text-sm font-semibold tracking-wide text-brand-dark uppercase">Explore Ranchi by area</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {relevantLocations.map((l) => (
              <Link
                key={l.slug}
                href={`/locations/${l.slug}`}
                className="rounded-full border border-brand/20 px-3 py-1 text-brand-dark hover:border-brand/50"
              >
                {l.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
