import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedEvent } from "@/lib/eventQueries";
import { formatEventDateRange } from "@/components/site/EventCard";
import { buildPageMetadata } from "@/lib/public/seo";
import Breadcrumbs from "@/components/site/Breadcrumbs";
import JsonLd from "@/components/site/JsonLd";
import ShareButtons from "@/components/site/ShareButtons";
import { absoluteUrl } from "@/lib/public/site";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublishedEvent(slug);
  if (!event) return buildPageMetadata({ title: "Not found", description: "Event not found.", path: `/events/${slug}`, noindex: true });
  return buildPageMetadata({
    title: event.title,
    description: event.description ?? `${event.title} — ${formatEventDateRange(event.startAt, event.endAt)} in Ranchi.`,
    path: `/events/${slug}`,
    ogImage: event.coverImageUrl ?? undefined,
  });
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getPublishedEvent(slug);
  if (!event) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: event.startAt.toISOString(),
    ...(event.endAt ? { endDate: event.endAt.toISOString() } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    ...(event.description ? { description: event.description } : {}),
    ...(event.coverImageUrl ? { image: [event.coverImageUrl] } : {}),
    location: {
      "@type": "Place",
      name: event.venueName || event.locality?.name || "Ranchi",
      address: { "@type": "PostalAddress", streetAddress: event.address ?? undefined, addressLocality: event.locality?.name ?? "Ranchi", addressCountry: "IN" },
    },
    ...(event.ticketUrl ? { offers: { "@type": "Offer", url: event.ticketUrl, availability: "https://schema.org/InStock" } } : {}),
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={[{ name: "Events", path: "/events" }, { name: event.title, path: `/events/${slug}` }]} />

      {event.sponsored && (
        <span className="mt-3 inline-block rounded-full bg-brand-orange/15 px-2.5 py-0.5 text-xs font-semibold text-brand-orange">Sponsored</span>
      )}
      <h1 className="mt-2 font-serif text-3xl font-semibold text-brand-dark sm:text-4xl">{event.title}</h1>
      <p className="mt-2 text-sm text-brand/70">{formatEventDateRange(event.startAt, event.endAt)}</p>
      {(event.venueName || event.address || event.locality) && (
        <p className="mt-1 text-sm text-brand/70">
          {[event.venueName, event.address, event.locality?.name].filter(Boolean).join(", ")}
        </p>
      )}

      {event.coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- admin/applicant-supplied external URL
        <img src={event.coverImageUrl} alt={event.coverImageAlt ?? event.title} className="mt-6 w-full rounded-lg object-cover" />
      )}

      {event.description && <p className="mt-6 whitespace-pre-line text-base leading-7 text-brand-dark/90">{event.description}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {event.ticketUrl && (
          <a
            href={event.ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-brand-orange px-5 py-2 text-sm font-semibold text-white hover:brightness-95"
          >
            Tickets / Booking
          </a>
        )}
        {event.property && (
          <Link href={`/property/${event.property.slug}`} className="text-sm font-medium text-brand-teal hover:underline">
            View venue: {event.property.name} &rarr;
          </Link>
        )}
      </div>

      {(event.contactPhone || event.contactEmail) && (
        <p className="mt-4 text-sm text-brand-dark/70">
          Contact: {event.contactPhone}
          {event.contactPhone && event.contactEmail ? " · " : ""}
          {event.contactEmail}
        </p>
      )}

      <ShareButtons url={absoluteUrl(`/events/${slug}`)} title={event.title} />

      <p className="mt-10 text-sm text-brand/70">
        <Link href="/events" className="text-brand-teal hover:underline">
          All events in Ranchi
        </Link>
        {" · "}
        <Link href="/events/create" className="text-brand-teal hover:underline">
          Create your event
        </Link>
      </p>
    </article>
  );
}
