import Link from "next/link";
import BadgePills from "./BadgePills";

export interface InfluencerAvatarCardData {
  id: string;
  slug: string;
  name: string;
  photoUrl: string | null;
  category: string | null;
  featured: boolean;
  rating: number | null;
  badges?: { badge: { id: string; label: string; description: string | null } }[];
}

/** The small round-photo card used in both the homepage scroll album (fixed width, for the marquee track) and the /influencers grid (fills its grid cell). */
export default function InfluencerAvatarCard({
  influencer,
  ariaHidden = false,
  fixedWidth = false,
}: {
  influencer: InfluencerAvatarCardData;
  ariaHidden?: boolean;
  fixedWidth?: boolean;
}) {
  return (
    <Link
      href={`/influencers/${influencer.slug}`}
      tabIndex={ariaHidden ? -1 : undefined}
      aria-hidden={ariaHidden || undefined}
      className={`${fixedWidth ? "w-40 shrink-0" : "w-full"} rounded-lg border border-brand/10 bg-white p-3 text-center transition hover:border-brand/40 hover:shadow-md`}
    >
      <div className="relative mx-auto h-20 w-20 overflow-hidden rounded-full bg-brand-cream">
        {influencer.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin/creator-supplied external URL
          <img src={influencer.photoUrl} alt={influencer.name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-serif text-xl font-semibold text-brand/40">{influencer.name.slice(0, 1)}</div>
        )}
        {influencer.featured && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-brand-orange px-2 py-0.5 text-[9px] font-semibold text-white shadow-sm">
            Featured
          </span>
        )}
      </div>
      <p className="mt-3 truncate text-sm font-semibold text-brand-dark">{influencer.name}</p>
      {influencer.category && <p className="truncate text-xs text-brand/60">{influencer.category}</p>}
      {influencer.rating !== null && <p className="mt-1 text-xs font-medium text-brand-gold">★ {influencer.rating.toFixed(1)}</p>}
      {influencer.badges && influencer.badges.length > 0 && (
        <div className="mt-1.5 flex justify-center">
          <BadgePills badges={influencer.badges.map((b) => b.badge)} />
        </div>
      )}
    </Link>
  );
}
