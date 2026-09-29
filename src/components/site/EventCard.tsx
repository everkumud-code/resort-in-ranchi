import Link from "next/link";

export interface EventCardData {
  title: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  venueName: string | null;
  startAt: Date;
  endAt: Date | null;
  sponsored: boolean;
  locality: { name: string; slug: string } | null;
}

export function formatEventDateRange(startAt: Date, endAt: Date | null): string {
  const dateOpts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", timeZone: "UTC" };
  const timeOpts: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit", timeZone: "UTC" };
  const startDate = startAt.toLocaleDateString("en-IN", dateOpts);
  const startTime = startAt.toLocaleTimeString("en-IN", timeOpts);
  if (!endAt) return `${startDate} · ${startTime}`;
  const sameDay = startAt.toDateString() === endAt.toDateString();
  if (sameDay) return `${startDate} · ${startTime}–${endAt.toLocaleTimeString("en-IN", timeOpts)}`;
  return `${startDate} – ${endAt.toLocaleDateString("en-IN", dateOpts)}`;
}

export default function EventCard({ event }: { event: EventCardData }) {
  return (
    <article className="overflow-hidden rounded-lg border border-brand/10 bg-white transition hover:border-brand/40 hover:shadow-md">
      <Link href={`/events/${event.slug}`} className="block aspect-[16/9] overflow-hidden bg-brand-cream">
        {event.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin/applicant-supplied external URL
          <img src={event.coverImageUrl} alt={event.coverImageAlt ?? event.title} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-cream to-brand/10">
            <span className="font-serif text-2xl font-semibold text-brand/30">{event.title.slice(0, 1)}</span>
          </div>
        )}
      </Link>
      <div className="p-4">
        {event.sponsored && (
          <span className="mb-1 inline-block rounded-full bg-brand-orange/15 px-2 py-0.5 text-xs font-semibold text-brand-orange">Sponsored</span>
        )}
        <h3 className="font-serif text-base font-semibold text-brand-dark">
          <Link href={`/events/${event.slug}`} className="hover:underline">
            {event.title}
          </Link>
        </h3>
        <p className="mt-1 text-xs text-brand/60">{formatEventDateRange(event.startAt, event.endAt)}</p>
        {(event.venueName || event.locality) && (
          <p className="mt-0.5 text-xs text-brand/60">{[event.venueName, event.locality?.name].filter(Boolean).join(" · ")}</p>
        )}
        {event.description && <p className="mt-2 line-clamp-2 text-sm text-brand-dark/70">{event.description}</p>}
      </div>
    </article>
  );
}
