import Link from "next/link";
import { listPublishedInfluencers } from "@/lib/influencerQueries";
import InfluencerAvatarCard from "./InfluencerAvatarCard";

/**
 * Continuously auto-scrolling creator album on the homepage — the card list
 * is rendered twice so the CSS animation (creator-marquee, globals.css) can
 * loop seamlessly; the second copy is aria-hidden so screen readers and tab
 * order only ever see one set of real links. Renders nothing until at least
 * one creator is published.
 */
export default async function InfluencerAlbum() {
  const influencers = await listPublishedInfluencers();
  if (influencers.length === 0) return null;

  return (
    <section className="border-t border-brand/10 bg-brand-cream/40">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex items-end justify-between gap-4 px-4">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-brand-dark">Ranchi Creators &amp; Influencers</h2>
            <p className="mt-1 text-sm text-brand-dark/70">Local voices covering stays, food and events around Ranchi.</p>
          </div>
          <Link href="/influencers" className="shrink-0 text-sm font-medium text-brand-teal hover:underline">
            View all &rarr;
          </Link>
        </div>

        <div className="mt-6 overflow-hidden">
          <div className="creator-marquee-track gap-4">
            {influencers.map((inf) => (
              <InfluencerAvatarCard key={inf.id} influencer={inf} fixedWidth />
            ))}
            {influencers.map((inf) => (
              <InfluencerAvatarCard key={`${inf.id}-repeat`} influencer={inf} fixedWidth ariaHidden />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
