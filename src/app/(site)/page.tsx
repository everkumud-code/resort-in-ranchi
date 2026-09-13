import type { Metadata } from "next";
import Link from "next/link";
import { getCategoriesWithPublishedCounts, type CategoryWithCount } from "@/lib/public/categories";
import { getLocationsWithPublishedCounts, PRIORITY_LOCATION_SLUGS } from "@/lib/public/locations";
import { getFeaturedProperties, getRecentProperties } from "@/lib/public/properties";
import { buildPageMetadata } from "@/lib/public/seo";
import { organizationJsonLd, websiteJsonLd } from "@/lib/public/structuredData";
import { SITE_DESCRIPTION, SITE_POSITIONING } from "@/lib/public/site";
import { CLAIM_VALUE_PROP_COPY } from "@/lib/validation/claim";
import CategoryCard from "@/components/site/CategoryCard";
import LocationCard from "@/components/site/LocationCard";
import PropertyCard from "@/components/site/PropertyCard";
import DiscoveryCard from "@/components/site/DiscoveryCard";
import EmptyState from "@/components/site/EmptyState";
import SearchBox from "@/components/site/SearchBox";
import JsonLd from "@/components/site/JsonLd";
import HeroVisual from "@/components/site/HeroVisual";
import BrandLogo from "@/components/site/BrandLogo";
import AdSlot from "@/components/site/ads/AdSlot";
import { getAanganResortAdCreative } from "@/lib/ads/adCreative";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return buildPageMetadata({ title: SITE_POSITIONING, description: SITE_DESCRIPTION, path: "/" });
}

function sumCounts(categories: CategoryWithCount[], slugs: string[]): number {
  return categories.filter((c) => slugs.includes(c.slug)).reduce((sum, c) => sum + c.publishedCount, 0);
}

export default async function HomePage() {
  const [categories, locations, featured, recent, adCreative] = await Promise.all([
    getCategoriesWithPublishedCounts(),
    getLocationsWithPublishedCounts(),
    getFeaturedProperties(6),
    getRecentProperties(8),
    getAanganResortAdCreative(),
  ]);

  // Only 10 categories exist in total, so show all of them rather than an
  // arbitrary top-N slice — with published counts still mostly at 0, a
  // count-based slice would otherwise hide real categories (e.g.
  // Restaurants, Wedding Venues) behind alphabetically-earlier ties.
  const topCategories = [...categories].sort((a, b) => b.publishedCount - a.publishedCount);

  const priorityLocations = PRIORITY_LOCATION_SLUGS.map((slug) => locations.find((l) => l.slug === slug)).filter(
    (l): l is NonNullable<typeof l> => Boolean(l)
  );

  return (
    <div>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />

      <section className="relative overflow-hidden">
        <HeroVisual />
        <div className="relative mx-auto max-w-6xl px-4 py-12 text-center sm:py-28">
          <p className="text-xs font-semibold tracking-[0.15em] text-white/80 uppercase sm:text-sm">
            {SITE_POSITIONING}
          </p>
          {/* This headline is the site tagline (see SITE_TAGLINE) — shown once,
           * large, as the primary hero statement rather than repeated again
           * below as a separate small tagline line. */}
          <h1 className="mx-auto mt-4 max-w-2xl font-serif text-4xl leading-tight font-semibold text-white sm:mt-5 sm:text-6xl">
            Discover. Compare.
            <br className="hidden sm:block" /> Experience Ranchi.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/85 sm:mt-4 sm:text-base">{SITE_DESCRIPTION}</p>
          <div className="mt-6 flex justify-center sm:mt-9">
            <SearchBox locations={locations} />
          </div>
          <p className="mt-4 text-sm text-white/80">
            Own a business here?{" "}
            <Link href="/list-your-business" className="font-semibold text-white underline hover:text-brand-cream">
              Add Your Property
            </Link>
          </p>
        </div>
      </section>

      {adCreative && (
        <section className="mx-auto max-w-6xl px-4 pt-8">
          <AdSlot ladder="hero" creative={adCreative} />
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="font-serif text-2xl font-semibold text-brand-dark">Browse by category</h2>
        {topCategories.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="Categories are set up, listings are pending" description="Check back soon." />
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {topCategories.map((c) => (
              <CategoryCard key={c.id} name={c.name} slug={c.slug} count={c.publishedCount} />
            ))}
          </div>
        )}
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
          <Link href="/picnic-spots" className="text-brand-teal hover:text-brand-dark hover:underline">
            Picnic Spots &amp; Day Outings →
          </Link>
          <Link href="/experiences" className="text-brand-teal hover:text-brand-dark hover:underline">
            Experiences Near Ranchi →
          </Link>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-serif text-2xl font-semibold text-brand-dark">Stay, eat, celebrate, explore</h2>
          <p className="mt-1 text-sm text-brand/60">Four ways to discover Ranchi.</p>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DiscoveryCard
              label="Stay"
              description="Resorts, hotels and homestays around Ranchi."
              count={sumCounts(categories, ["resorts", "hotels", "homestays-farm-stays"])}
              href="/resorts"
              tone="brand"
            />
            <DiscoveryCard
              label="Eat"
              description="Restaurants and cafés worth the trip."
              count={sumCounts(categories, ["restaurants", "cafes"])}
              href="/restaurants"
              tone="orange"
            />
            <DiscoveryCard
              label="Celebrate"
              description="Banquet halls, wedding venues and party halls."
              count={sumCounts(categories, ["banquet-halls", "wedding-venues", "party-halls"])}
              href="/banquet-halls"
              tone="gold"
            />
            <DiscoveryCard
              label="Experience"
              description="Adventure, camping and weekend getaways near Ranchi."
              count={sumCounts(categories, ["adventure-camping", "weekend-getaways", "homestays-farm-stays"])}
              href="/experiences"
              tone="teal"
            />
          </div>
        </div>
      </section>

      {priorityLocations.length > 0 && (
        <section id="explore-by-area" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14">
          <h2 className="font-serif text-2xl font-semibold text-brand-dark">Explore by area</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {priorityLocations.map((l) => (
              <LocationCard key={l.id} name={l.name} slug={l.slug} count={l.publishedCount} />
            ))}
          </div>
        </section>
      )}

      <section className="bg-brand-dark py-12">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-serif text-2xl font-semibold text-white">Own a business in Ranchi?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-brand-cream/80">
            {CLAIM_VALUE_PROP_COPY} If you&apos;re already listed, search for your business and use the claim
            option on its listing page. Not listed yet? Add your business and our team will review it.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/search"
              className="inline-block rounded-md bg-brand-orange px-6 py-3 text-sm font-semibold text-white shadow-sm hover:brightness-95"
            >
              Find &amp; claim your listing
            </Link>
            <Link
              href="/list-your-business"
              className="inline-block rounded-md border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Add Your Business
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="font-serif text-2xl font-semibold text-brand-dark">Featured listings</h2>
        {featured.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No featured listings yet"
              description="Listings are being verified before publishing. Check back soon."
            />
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </section>

      {recent.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="font-serif text-2xl font-semibold text-brand-dark">Recently added</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </section>
      )}

      <section className="border-t border-brand/10 bg-white">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-4 py-14 sm:flex-row sm:items-start">
          <BrandLogo variant="vertical" className="h-40 w-auto shrink-0" />
          <div>
            <h2 className="font-serif text-2xl font-semibold text-brand-dark">About this directory</h2>
            <p className="mt-4 text-sm leading-6 text-brand-dark/70">
              Resort In Ranchi is an independent directory covering resorts, hotels, restaurants, cafés, banquet
              halls, wedding venues and other places to stay, eat and celebrate across Ranchi and the surrounding
              area. Listings start from public research and are progressively verified — a listing only shows the
              details that have actually been confirmed, and is only published once it&apos;s ready. Business owners
              can claim their existing listing or add a new one — see{" "}
              <Link href="/list-your-business" className="text-brand-teal hover:underline">
                Add Your Property
              </Link>{" "}
              above.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
