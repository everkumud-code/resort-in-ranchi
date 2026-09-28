import Link from "next/link";
import Breadcrumbs from "./Breadcrumbs";
import PropertyCardGrid from "./PropertyCardGrid";
import { getSponsoredListings } from "@/lib/public/sponsoredListings";
import { pinListing } from "@/lib/public/pinnedListing";
import EmptyState from "./EmptyState";
import Pagination from "./Pagination";
import JsonLd from "./JsonLd";
import { itemListJsonLd } from "@/lib/public/structuredData";
import type { UmbrellaCategoryRoute } from "@/lib/public/categoryRoutes";
import type { UmbrellaCategoryData } from "@/lib/public/umbrellaQueries";

export default async function UmbrellaCategoryView({
  route,
  data,
}: {
  route: UmbrellaCategoryRoute;
  data: UmbrellaCategoryData;
}) {
  // Sponsored placement only on the first page of the list.
  const pinned = data.page === 1 ? await getSponsoredListings(route.categorySlugs) : null;
  const [pinnedItems] = pinListing([data.items], pinned);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {data.items.length > 0 && (
        <JsonLd data={itemListJsonLd(data.items.map((p) => ({ name: p.name, path: `/property/${p.slug}` })))} />
      )}
      <Breadcrumbs items={[{ name: route.title, path: `/${route.slug}` }]} />
      <h1 className="mt-3 font-serif text-3xl font-semibold text-brand-dark">{route.title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-brand-dark/70">{route.intro}</p>
      <p className="mt-2 text-sm text-brand/60">
        {data.totalCount} {data.totalCount === 1 ? "listing" : "listings"}
      </p>

      <div className="mt-6">
        {data.items.length === 0 ? (
          <EmptyState
            title="No listings here yet"
            description="This category is being researched and verified. Check back soon."
            action={
              <Link href="/list-your-business" className="text-sm font-medium text-brand-teal hover:underline">
                Know a business that should be here? Add it &rarr;
              </Link>
            }
          />
        ) : (
          <PropertyCardGrid entries={pinnedItems} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" />
        )}
      </div>

      <div className="mt-8">
        <Pagination basePath={`/${route.slug}`} page={data.page} totalPages={data.totalPages} />
      </div>
    </div>
  );
}
