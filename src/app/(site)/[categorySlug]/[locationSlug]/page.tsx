import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryBySlug } from "@/lib/public/categories";
import { getLocationBySlug, getLocationIdsForPage } from "@/lib/public/locations";
import { buildPublicOrderBy, categoryMembershipWhere, listPublicProperties } from "@/lib/public/properties";
import { getComboIndex } from "@/lib/public/comboQueries";
import { comboDescription, comboPath, comboTitle } from "@/lib/public/comboPages";
import { getSponsoredListings } from "@/lib/public/sponsoredListings";
import { pinListing } from "@/lib/public/pinnedListing";
import { buildPageMetadata } from "@/lib/public/seo";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/public/structuredData";
import Breadcrumbs from "@/components/site/Breadcrumbs";
import JsonLd from "@/components/site/JsonLd";
import PropertyCardGrid from "@/components/site/PropertyCardGrid";

export const revalidate = 600;

interface PageParams {
  categorySlug: string;
  locationSlug: string;
}

const PAGE_SIZE = 24;

async function loadCombo({ categorySlug, locationSlug }: PageParams) {
  const [category, location] = await Promise.all([getCategoryBySlug(categorySlug), getLocationBySlug(locationSlug)]);
  if (!category || !location) return null;

  const locationIds = await getLocationIdsForPage(location);
  const where = { ...categoryMembershipWhere([category.id]), localityId: { in: locationIds } };
  const { items, totalCount } = await listPublicProperties({ where, orderBy: buildPublicOrderBy(), take: PAGE_SIZE });
  if (totalCount === 0) return null;
  return { category, location, items, totalCount };
}

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const p = await params;
  const combo = await loadCombo(p);
  if (!combo) {
    return buildPageMetadata({ title: "Not found", description: "Page not found.", path: comboPath(p.categorySlug, p.locationSlug), noindex: true });
  }
  return buildPageMetadata({
    title: comboTitle(combo.category.name, combo.location.name),
    description: comboDescription(combo.category.name, combo.location.name, combo.totalCount, combo.items.map((i) => i.name)),
    path: comboPath(p.categorySlug, p.locationSlug),
  });
}

export default async function CategoryInAreaPage({ params }: { params: Promise<PageParams> }) {
  const p = await params;
  const combo = await loadCombo(p);
  if (!combo) notFound();
  const { category, location, items, totalCount } = combo;

  const [index, sponsored] = await Promise.all([getComboIndex(), getSponsoredListings([category.slug])]);
  const [entries] = pinListing([items], sponsored);
  const path = comboPath(category.slug, location.slug);

  // Internal links that lead crawlers and visitors sideways: this category in
  // other areas, and other categories in this area — only real combinations.
  const otherAreas = index.filter((e) => e.categorySlug === category.slug && e.locationSlug !== location.slug);
  const otherCategories = index.filter((e) => e.locationSlug === location.slug && e.categorySlug !== category.slug);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: category.name, path: `/${category.slug}` },
          { name: location.name, path },
        ])}
      />
      <JsonLd data={itemListJsonLd(items.map((i) => ({ name: i.name, path: `/property/${i.slug}` })))} />
      <Breadcrumbs
        items={[
          { name: category.name, path: `/${category.slug}` },
          { name: location.name, path },
        ]}
      />
      <h1 className="mt-3 font-serif text-3xl font-semibold text-brand-dark">{comboTitle(category.name, location.name)}</h1>
      <p className="mt-2 max-w-2xl text-sm text-brand-dark/70">
        {totalCount} {category.name.toLowerCase()} listing{totalCount === 1 ? "" : "s"} in {location.name}, Ranchi.
        {location.description ? ` ${location.description}` : ""} Compare details, facilities, photos and contact information, then reach
        out to the business directly.
      </p>

      <div className="mt-6">
        <PropertyCardGrid entries={entries} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" />
      </div>
      {totalCount > items.length && (
        <p className="mt-6 text-sm text-brand/70">
          Showing {items.length} of {totalCount}.{" "}
          <Link href={`/${category.slug}?location=${location.slug}`} className="font-medium text-brand-teal hover:underline">
            See all {category.name.toLowerCase()} in {location.name} &rarr;
          </Link>
        </p>
      )}

      {otherAreas.length > 0 && (
        <div className="mt-10 border-t border-brand/10 pt-6">
          <h2 className="text-sm font-semibold tracking-wide text-brand-dark uppercase">{category.name} in other areas</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {otherAreas.map((e) => (
              <Link
                key={e.locationSlug}
                href={comboPath(e.categorySlug, e.locationSlug)}
                className="rounded-full border border-brand/20 px-3 py-1 text-brand-dark hover:border-brand/50"
              >
                {e.locationName} ({e.count})
              </Link>
            ))}
          </div>
        </div>
      )}

      {otherCategories.length > 0 && (
        <div className="mt-8 border-t border-brand/10 pt-6">
          <h2 className="text-sm font-semibold tracking-wide text-brand-dark uppercase">More places in {location.name}</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {otherCategories.map((e) => (
              <Link
                key={e.categorySlug}
                href={comboPath(e.categorySlug, e.locationSlug)}
                className="rounded-full border border-brand/20 px-3 py-1 text-brand-dark hover:border-brand/50"
              >
                {e.categoryName} ({e.count})
              </Link>
            ))}
          </div>
        </div>
      )}

      <p className="mt-10 text-sm text-brand/70">
        <Link href={`/${category.slug}`} className="text-brand-teal hover:underline">
          All {category.name.toLowerCase()} in Ranchi
        </Link>
        {" · "}
        <Link href={`/locations/${location.slug}`} className="text-brand-teal hover:underline">
          Everything in {location.name}
        </Link>
      </p>
    </div>
  );
}
