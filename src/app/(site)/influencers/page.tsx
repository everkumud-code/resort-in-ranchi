import type { Metadata } from "next";
import { listPublishedInfluencers } from "@/lib/influencerQueries";
import { buildPageMetadata } from "@/lib/public/seo";
import Breadcrumbs from "@/components/site/Breadcrumbs";
import EmptyState from "@/components/site/EmptyState";
import JsonLd from "@/components/site/JsonLd";
import { itemListJsonLd } from "@/lib/public/structuredData";
import InfluencerAvatarCard from "@/components/site/InfluencerAvatarCard";

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
      {influencers.length > 0 && (
        <JsonLd data={itemListJsonLd(influencers.map((i) => ({ name: i.name, path: `/influencers/${i.slug}` })))} />
      )}
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
            <InfluencerAvatarCard key={inf.id} influencer={inf} />
          ))}
        </div>
      )}
    </div>
  );
}
