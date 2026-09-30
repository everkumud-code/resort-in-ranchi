import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedInfluencer } from "@/lib/influencerQueries";
import { buildPageMetadata } from "@/lib/public/seo";
import Breadcrumbs from "@/components/site/Breadcrumbs";
import ShareButtons from "@/components/site/ShareButtons";
import { absoluteUrl } from "@/lib/public/site";
import ContactCreatorForm from "./ContactCreatorForm";
import { influencerEligibleForClaimCta } from "@/lib/validation/influencerClaim";
import BadgePills from "@/components/site/BadgePills";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const influencer = await getPublishedInfluencer(slug);
  if (!influencer) return buildPageMetadata({ title: "Not found", description: "Influencer not found.", path: `/influencers/${slug}`, noindex: true });
  return buildPageMetadata({
    title: `${influencer.name} — Ranchi Creator`,
    description: influencer.bio ?? `${influencer.name}, a Ranchi content creator on ResortInRanchi.`,
    path: `/influencers/${slug}`,
    ogImage: influencer.photoUrl ?? undefined,
  });
}

const SOCIAL_LINKS = (i: { instagramUrl: string | null; youtubeUrl: string | null; websiteUrl: string | null }) =>
  [
    { url: i.instagramUrl, label: "Instagram" },
    { url: i.youtubeUrl, label: "YouTube" },
    { url: i.websiteUrl, label: "Website" },
  ].filter((l): l is { url: string; label: string } => Boolean(l.url));

export default async function InfluencerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ claimed?: string; contacted?: string }>;
}) {
  const { slug } = await params;
  const { claimed: justClaimed, contacted } = await searchParams;
  const influencer = await getPublishedInfluencer(slug);
  if (!influencer) notFound();

  const links = SOCIAL_LINKS(influencer);
  // getPublishedInfluencer only ever returns a PUBLISHED profile — status is passed explicitly here
  // since the public select this page reads from never carries the raw status field.
  const claimEligible = influencerEligibleForClaimCta({ status: "PUBLISHED", claimed: influencer.claimed });

  return (
    <article className="mx-auto max-w-2xl px-4 py-8">
      <Breadcrumbs items={[{ name: "Influencers", path: "/influencers" }, { name: influencer.name, path: `/influencers/${slug}` }]} />

      {justClaimed && (
        <div className="mt-4 rounded-md border border-green-200 bg-green-50 px-4 py-3" role="status">
          <p className="text-sm font-medium text-green-900">Your claim is under review.</p>
          <p className="mt-0.5 text-xs text-green-800">We&apos;ll review it and get in touch once a decision is made.</p>
        </div>
      )}
      {contacted && (
        <div className="mt-4 rounded-md border border-green-200 bg-green-50 px-4 py-3" role="status">
          <p className="text-sm font-medium text-green-900">Message sent.</p>
        </div>
      )}

      <div className="mt-4 flex items-center gap-4">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-brand-cream">
          {influencer.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin-supplied external URL
            <img src={influencer.photoUrl} alt={influencer.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-serif text-3xl font-semibold text-brand/40">{influencer.name.slice(0, 1)}</div>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-semibold text-brand-dark">{influencer.name}</h1>
            {influencer.featured && (
              <span className="rounded-full bg-brand-orange/15 px-2 py-0.5 text-xs font-semibold text-brand-orange">Featured</span>
            )}
          </div>
          {influencer.category && <p className="text-sm text-brand/60">{influencer.category}</p>}
          {influencer.rating !== null && <p className="mt-0.5 text-sm font-medium text-brand-gold">★ {influencer.rating.toFixed(1)} / 5</p>}
          {influencer.badges.length > 0 && (
            <div className="mt-1.5">
              <BadgePills badges={influencer.badges.map((b) => b.badge)} />
            </div>
          )}
        </div>
      </div>

      {influencer.bio && <p className="mt-6 text-sm leading-6 text-brand-dark/80">{influencer.bio}</p>}

      {influencer.videoUrl && (
        <div className="mt-4">
          <a href={influencer.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-teal hover:underline">
            ▶ Watch feature video
          </a>
        </div>
      )}

      {(influencer.contactEmail || influencer.contactPhone) && (
        <p className="mt-2 text-sm text-brand-dark/70">
          Contact: {influencer.contactPhone}
          {influencer.contactPhone && influencer.contactEmail ? " · " : ""}
          {influencer.contactEmail}
        </p>
      )}

      {links.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-brand/20 px-3 py-1 text-xs font-medium text-brand-dark hover:border-brand/50"
            >
              {l.label}
            </a>
          ))}
        </div>
      )}

      {influencer.ratings.length > 0 && (
        <div className="mt-6 rounded-lg border border-brand/10 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-dark/60">Editorial rating</p>
          <p className="mt-1 text-xs text-brand/50">Rated by our team against set criteria — not a public review.</p>
          <ul className="mt-3 space-y-1.5 text-sm">
            {influencer.ratings.map((r, i) => (
              <li key={i} className="flex items-center justify-between">
                <span className="text-brand-dark/80">{r.criterion.name}</span>
                <span className="font-medium text-brand-gold">{r.score} / 5</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ShareButtons url={absoluteUrl(`/influencers/${slug}`)} title={influencer.name} />

      <div className="mt-8 rounded-lg border border-brand/10 bg-white p-5">
        <p className="font-serif text-lg font-semibold text-brand-dark">Contact {influencer.name}</p>
        <p className="mt-1 text-xs text-brand/60">Reach out about a collaboration, feature or event.</p>
        <div className="mt-3">
          <ContactCreatorForm influencerSlug={slug} influencerName={influencer.name} />
        </div>
      </div>

      {claimEligible && (
        <p className="mt-6 rounded-md bg-brand-cream/60 px-3 py-2 text-sm text-brand-dark/70">
          Are you {influencer.name}?{" "}
          <Link href={`/influencers/${slug}/claim`} className="font-medium text-brand-teal hover:underline">
            Claim this profile
          </Link>{" "}
          to manage your own photo, video, bio and contact details.
        </p>
      )}

      <p className="mt-6 text-sm text-brand/70">
        <Link href="/influencers" className="text-brand-teal hover:underline">
          All Ranchi creators &amp; influencers
        </Link>
      </p>
    </article>
  );
}
