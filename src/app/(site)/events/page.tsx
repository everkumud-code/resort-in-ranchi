import type { Metadata } from "next";
import Link from "next/link";
import { getHomepageEventSections } from "@/lib/eventQueries";
import { buildPageMetadata } from "@/lib/public/seo";
import Breadcrumbs from "@/components/site/Breadcrumbs";
import EventCard from "@/components/site/EventCard";
import EmptyState from "@/components/site/EmptyState";
import JsonLd from "@/components/site/JsonLd";
import { itemListJsonLd } from "@/lib/public/structuredData";

export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: "Events in Ranchi",
  description: "Weddings, fairs, concerts and more happening in and around Ranchi — today, upcoming and sponsored events.",
  path: "/events",
});

export default async function EventsPage() {
  const sections = await getHomepageEventSections();
  const total = sections.sponsored.length + sections.today.length + sections.upcoming.length;

  const allEvents = [...sections.sponsored, ...sections.today, ...sections.upcoming];
  const uniqueEvents = [...new Map(allEvents.map((e) => [e.id, e])).values()];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {uniqueEvents.length > 0 && (
        <JsonLd data={itemListJsonLd(uniqueEvents.map((e) => ({ name: e.title, path: `/events/${e.slug}` })))} />
      )}
      <Breadcrumbs items={[{ name: "Events", path: "/events" }]} />
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-brand-dark">Events in Ranchi</h1>
          <p className="mt-2 max-w-2xl text-sm text-brand-dark/70">Weddings, fairs, concerts and more — happening now and coming up.</p>
        </div>
        <Link href="/events/create" className="shrink-0 rounded-full bg-brand-orange px-4 py-2 text-sm font-semibold text-white hover:brightness-95">
          Create your event
        </Link>
      </div>

      {total === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No events listed yet"
            description="Check back soon, or be the first to feature yours."
            action={
              <Link href="/events/create" className="text-sm font-medium text-brand-teal hover:underline">
                Create your event &rarr;
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {sections.sponsored.length > 0 && (
            <div>
              <h2 className="font-serif text-xl font-semibold text-brand-dark">Sponsored</h2>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sections.sponsored.map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            </div>
          )}
          {sections.today.length > 0 && (
            <div>
              <h2 className="font-serif text-xl font-semibold text-brand-dark">Today</h2>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sections.today.map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            </div>
          )}
          {sections.upcoming.length > 0 && (
            <div>
              <h2 className="font-serif text-xl font-semibold text-brand-dark">Upcoming</h2>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sections.upcoming.map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
