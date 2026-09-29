import Link from "next/link";
import EventCard from "./EventCard";
import { getHomepageEventSections } from "@/lib/eventQueries";

function EventRow({ title, events }: { title: string; events: Awaited<ReturnType<typeof getHomepageEventSections>>["today"] }) {
  if (events.length === 0) return null;
  return (
    <div>
      <h3 className="font-serif text-xl font-semibold text-brand-dark">{title}</h3>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.slice(0, 6).map((e) => (
          <EventCard key={e.id} event={e} />
        ))}
      </div>
    </div>
  );
}

/** Homepage's Today's / Sponsored / Upcoming Events strip. Renders nothing when there are no live published events at all. */
export default async function HomepageEventSections() {
  const sections = await getHomepageEventSections();
  const total = sections.sponsored.length + sections.today.length + sections.upcoming.length;
  if (total === 0) return null;

  return (
    <section className="border-t border-brand/10">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-brand-dark">Events in Ranchi</h2>
            <p className="mt-1 text-sm text-brand-dark/70">Weddings, fairs, concerts and more — happening now and coming up.</p>
          </div>
          <Link href="/events" className="shrink-0 text-sm font-medium text-brand-teal hover:underline">
            View all events &rarr;
          </Link>
        </div>

        <div className="mt-6 space-y-8">
          <EventRow title="Sponsored" events={sections.sponsored} />
          <EventRow title="Today" events={sections.today} />
          <EventRow title="Upcoming" events={sections.upcoming} />
        </div>

        <p className="mt-8 text-sm text-brand/70">
          Hosting an event?{" "}
          <Link href="/events/create" className="font-medium text-brand-teal hover:underline">
            Create your event &rarr;
          </Link>
        </p>
      </div>
    </section>
  );
}
