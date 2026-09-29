import Link from "next/link";
import { listPublishedInfluencers } from "@/lib/influencerQueries";

/** Horizontally-scrolling album of influencers on the homepage. Renders nothing until at least one is published. */
export default async function InfluencerAlbum() {
  const influencers = await listPublishedInfluencers();
  if (influencers.length === 0) return null;

  return (
    <section className="border-t border-brand/10 bg-brand-cream/40">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-brand-dark">Ranchi Creators &amp; Influencers</h2>
            <p className="mt-1 text-sm text-brand-dark/70">Local voices covering stays, food and events around Ranchi.</p>
          </div>
          <Link href="/influencers" className="shrink-0 text-sm font-medium text-brand-teal hover:underline">
            View all &rarr;
          </Link>
        </div>

        <div className="mt-6 -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2">
          {influencers.map((inf) => (
            <Link
              key={inf.id}
              href={`/influencers/${inf.slug}`}
              className="w-40 shrink-0 snap-start rounded-lg border border-brand/10 bg-white p-3 text-center transition hover:border-brand/40 hover:shadow-md"
            >
              <div className="relative mx-auto h-20 w-20 overflow-hidden rounded-full bg-brand-cream">
                {inf.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin-supplied external URL
                  <img src={inf.photoUrl} alt={inf.name} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-serif text-xl font-semibold text-brand/40">
                    {inf.name.slice(0, 1)}
                  </div>
                )}
                {inf.featured && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-brand-orange px-2 py-0.5 text-[9px] font-semibold text-white shadow-sm">
                    Featured
                  </span>
                )}
              </div>
              <p className="mt-3 truncate text-sm font-semibold text-brand-dark">{inf.name}</p>
              {inf.category && <p className="truncate text-xs text-brand/60">{inf.category}</p>}
              {inf.rating !== null && <p className="mt-1 text-xs font-medium text-brand-gold">★ {inf.rating.toFixed(1)}</p>}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
