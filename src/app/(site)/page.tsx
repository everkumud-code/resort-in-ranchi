import type { Metadata } from "next";
import Link from "next/link";
import { getCategoriesWithPublishedCounts } from "@/lib/public/categories";
import { getLocationsWithPublishedCounts, PRIORITY_LOCATION_SLUGS } from "@/lib/public/locations";
import { getFeaturedProperties, getRecentProperties } from "@/lib/public/properties";
import { buildPageMetadata } from "@/lib/public/seo";
import { organizationJsonLd, websiteJsonLd } from "@/lib/public/structuredData";
import { SITE_DESCRIPTION, SITE_POSITIONING } from "@/lib/public/site";
import { CLAIM_VALUE_PROP_COPY } from "@/lib/validation/claim";
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_DISPLAY } from "@/lib/public/contact";
import CategoryCard from "@/components/site/CategoryCard";
import LocationCard from "@/components/site/LocationCard";
import PropertyCard from "@/components/site/PropertyCard";
import EmptyState from "@/components/site/EmptyState";
import SearchBox from "@/components/site/SearchBox";
import JsonLd from "@/components/site/JsonLd";
import HeroVisual from "@/components/site/HeroVisual";
import HeroIntentTiles from "@/components/site/HeroIntentTiles";
import BrandLogo from "@/components/site/BrandLogo";
import LatestBlogSection from "@/components/site/LatestBlogSection";
import HomepageEventSections from "@/components/site/HomepageEventSections";
import InfluencerAlbum from "@/components/site/InfluencerAlbum";
import RanchiClockWeather from "@/components/site/RanchiClockWeather";
import TravelInfoSection from "@/components/site/TravelInfoSection";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: "Resorts, Hotels, Restaurants & Venues in Ranchi",
    description: SITE_DESCRIPTION,
    path: "/",
  });
}

export default async function HomePage() {
  const [categories, locations, featured, recent] = await Promise.all([
    getCategoriesWithPublishedCounts(),
    getLocationsWithPublishedCounts(),
    getFeaturedProperties(6),
    getRecentProperties(8),
  ]);

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
        <div className="relative mx-auto max-w-6xl px-4 pt-12 pb-8 text-center sm:pt-20 sm:pb-12">
          <p className="text-xs font-semibold tracking-[0.15em] text-white/80 uppercase sm:text-sm">{SITE_POSITIONING}</p>
          <h1 className="mx-auto mt-4 max-w-2xl font-serif text-4xl leading-tight font-semibold text-white sm:mt-5 sm:text-6xl">
            Discover. Compare.
            <br className="hidden sm:block" /> Experience Ranchi.
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-white/85 sm:mt-4 sm:text-base">{SITE_DESCRIPTION}</p>
          <p className="mt-4 text-sm text-white/80">Own a business here? <Link href="/list-your-business" className="font-semibold text-white underline">Add Your Property</Link></p>
        </div>
        {/* A floating white card for quick-nav + search — same idea as a
         * booking site's search widget sitting on its hero image, adapted to
         * a browse directory: intent tiles instead of a flight/train search. */}
        <div className="relative mx-auto max-w-5xl px-4 pb-10 sm:pb-16">
          <div className="rounded-2xl bg-white p-4 shadow-xl sm:p-6">
            <HeroIntentTiles />
            <div className="mt-5 flex justify-center border-t border-brand/10 pt-5">
              <SearchBox locations={locations} />
            </div>
            <div className="mt-4 border-t border-brand/10 pt-4">
              <RanchiClockWeather />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="font-serif text-2xl font-semibold text-brand-dark">Find places to stay, eat and celebrate in Ranchi</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-dark/70">
          ResortInRanchi is a local discovery directory for people planning a stay, meal, celebration, wedding,
          corporate event or weekend outing in Ranchi. Browse by business type or area, open an individual listing,
          compare useful details and contact the business directly when contact information is available.
        </p>
        {topCategories.length === 0 ? (
          <div className="mt-4"><EmptyState title="Categories are set up, listings are pending" description="Check back soon." /></div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{topCategories.map((c) => <CategoryCard key={c.id} name={c.name} slug={c.slug} count={c.publishedCount} />)}</div>
        )}
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
          <Link href="/picnic-spots" className="text-brand-teal hover:underline">Picnic Spots &amp; Day Outings →</Link>
          <Link href="/experiences" className="text-brand-teal hover:underline">Experiences Near Ranchi →</Link>
        </div>
      </section>

      {/* Time-sensitive content sits right after the core discovery nav — the same
       * "what's on now" prominence a Stay/Eat/Celebrate-style directory needs to
       * compete on, and a reason to come back beyond one-off listing browsing. */}
      <HomepageEventSections />

      <section className="bg-white py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-serif text-2xl font-semibold text-brand-dark">Featured listings</h2>
          {featured.length === 0 ? <div className="mt-4"><EmptyState title="No featured listings yet" description="Listings are being verified before publishing. Check back soon." /></div> : <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{featured.map((p) => <PropertyCard key={p.id} property={p} />)}</div>}
        </div>
      </section>

      <InfluencerAlbum />

      {priorityLocations.length > 0 && (
        <section id="explore-by-area" className="scroll-mt-24 bg-white py-14">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="font-serif text-2xl font-semibold text-brand-dark">Explore businesses by Ranchi area</h2>
            <p className="mt-2 max-w-2xl text-sm text-brand-dark/70">Explore published listings by locality so you can choose a place closer to where you are staying or travelling.</p>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{priorityLocations.map((l) => <LocationCard key={l.id} name={l.name} slug={l.slug} count={l.publishedCount} />)}</div>
          </div>
        </section>
      )}

      {recent.length > 0 && <section className="mx-auto max-w-6xl px-4 py-14"><h2 className="font-serif text-2xl font-semibold text-brand-dark">Recently added businesses</h2><div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{recent.map((p) => <PropertyCard key={p.id} property={p} />)}</div></section>}

      <TravelInfoSection />

      <LatestBlogSection />

      <section className="bg-brand-dark py-12">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-serif text-2xl font-semibold text-white">Own a business in Ranchi?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-brand-cream/80">{CLAIM_VALUE_PROP_COPY} If you&apos;re already listed, search for your business and use the claim option on its listing page. Not listed yet? Add your business and our team will review it.</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link href="/search" className="inline-block rounded-md bg-brand-orange px-6 py-3 text-sm font-semibold text-white shadow-sm">Find &amp; claim your listing</Link>
            <Link href="/list-your-business" className="inline-block rounded-md border border-white/30 px-6 py-3 text-sm font-semibold text-white">Add Your Business</Link>
          </div>
        </div>
      </section>

      <section className="border-t border-brand/10 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-14">
          <h2 className="font-serif text-2xl font-semibold text-brand-dark">How ResortInRanchi works</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            <div><h3 className="font-semibold text-brand-dark">1. Discover</h3><p className="mt-1 text-sm leading-6 text-brand-dark/70">Find resorts, hotels, restaurants and venues by category or locality.</p></div>
            <div><h3 className="font-semibold text-brand-dark">2. Compare</h3><p className="mt-1 text-sm leading-6 text-brand-dark/70">Review the information available on each published business profile, including facilities, photos and contact details.</p></div>
            <div><h3 className="font-semibold text-brand-dark">3. Connect</h3><p className="mt-1 text-sm leading-6 text-brand-dark/70">Use the available phone, website, WhatsApp, directions or enquiry options to contact the business directly.</p></div>
          </div>
          <p className="mt-8 text-sm leading-6 text-brand-dark/70">Listings are progressively researched and verified. We show confirmed information where available and do not manufacture ratings, reviews, amenities or business claims.</p>
        </div>
      </section>

      <section className="border-t border-brand/10 bg-white">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-4 py-14 sm:flex-row sm:items-start">
          <BrandLogo variant="vertical" className="h-40 w-auto shrink-0" />
          <div>
            <h2 className="font-serif text-2xl font-semibold text-brand-dark">About ResortInRanchi</h2>
            <p className="mt-4 text-sm leading-6 text-brand-dark/70">ResortInRanchi is an independent Ranchi hospitality and venue discovery directory covering places to stay, eat, celebrate and explore across Ranchi and nearby areas. Business owners can claim an existing profile or submit a new business for review.</p>
            <p className="mt-3 text-sm leading-6 text-brand-dark/70">
              Have a question? Email us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-brand-teal hover:underline">
                {CONTACT_EMAIL}
              </a>{" "}
              or call{" "}
              <a href={`tel:+91${CONTACT_PHONE}`} className="font-medium text-brand-teal hover:underline">
                {CONTACT_PHONE_DISPLAY}
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
