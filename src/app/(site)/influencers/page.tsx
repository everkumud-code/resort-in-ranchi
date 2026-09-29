import type { Metadata } from "next";
import Link from "next/link";
import { listPublishedInfluencers } from "@/lib/influencerQueries";
import { buildPageMetadata } from "@/lib/public/seo";
import Breadcrumbs from "@/components/site/Breadcrumbs";
import EmptyState from "@/components/site/EmptyState";

export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: "Ranchi Creators & Influencers",
  description: "Local content creators and influencers covering stays, food, weddings and events in and around Ranchi.",
  path: "/influencers",
});

export default async function InfluencersPage() {
  const influencers = await listPublishedInfluencers();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ name: "Influencers", path: "/influencers" }]} />
      <h1 className="mt-3 font-serif text-3xl font-semibold text-brand-dark">Ranchi Creators &amp; Influencers</h1>
      <p className="mt-2 max-w-2xl text-sm text-brand-dark/70">Local voices covering stays, food, weddings and events around Ranchi.</p>

      {influencers.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No influencers listed yet" description="Check back soon." />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {influencers.map((inf) => (
            <Link
              key={inf.id}
              href={`/influencers/${inf.slug}`}
              className="rounded-lg border border-brand/10 bg-white p-4 text-center transition hover:border-brand/40 hover:shadow-md"
            >
              <div className="relative mx-auto h-20 w-20 overflow-hidden rounded-full bg-brand-cream">
                {inf.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin-supplied external URL
                  <img src={inf.photoUrl} alt={inf.name} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-serif text-xl font-semibold text-brand/40">{inf.name.slice(0, 1)}</div>
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
      )}
    </div>
  );
}
