import { PROMO_ACCENTS, buildAdHref, isPromoAccent, type PromoAdData } from "@/lib/promo/catalog";

/**
 * One sponsored card. It sits in the normal page flow (never fixed, sticky,
 * overlaid or animated), is clearly labelled "Ad", and only its button is a
 * link. Headings are deliberately plain text, so an ad never adds to a page's
 * heading outline. Built entirely from the ad's own saved text.
 */
export default function PromoCard({ ad, spot }: { ad: PromoAdData; spot: string }) {
  const accent = PROMO_ACCENTS[isPromoAccent(ad.accent) ? ad.accent : "teal"];
  const href = buildAdHref(ad.href, ad.key, spot);

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${accent.surface} text-white shadow-sm`}>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.16]"
        viewBox="0 0 800 220"
        preserveAspectRatio="none"
        fill="none"
        stroke="white"
        strokeWidth="1.5"
      >
        <path d="M0 150 C 120 90, 220 210, 360 140 S 600 70, 800 130" />
        <path d="M0 175 C 140 115, 240 235, 380 165 S 620 95, 800 155" />
        <path d="M0 200 C 160 140, 260 260, 400 190 S 640 120, 800 180" />
      </svg>

      <div className="relative grid gap-4 p-4 sm:gap-5 sm:p-7 md:grid-cols-[1fr_auto] md:items-center md:gap-8">
        <div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold tracking-wide text-slate-700 uppercase">Ad</span>
            <span className="text-[11px] font-medium tracking-wide text-white/75 uppercase">{ad.tag}</span>
          </div>
          <p className="mt-3 font-serif text-base font-semibold text-white/90">{ad.brand}</p>
          <p className="mt-0.5 font-serif text-xl leading-snug font-semibold sm:text-2xl">{ad.headline}</p>
          {/* On a phone the card is kept short (two lines of text, two highlights) so it never takes over the screen. */}
          <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-6 text-white/85 sm:line-clamp-none">{ad.body}</p>
          {ad.points.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {ad.points.map((point, index) => (
                <li key={point} className={`rounded-full px-3 py-1 text-xs font-medium ${index >= 2 ? "hidden sm:block" : ""} ${accent.chip}`}>
                  {point}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col items-start gap-2 md:items-end">
          <a
            href={href}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className={`inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold ${accent.button} shadow-sm transition hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`}
          >
            {ad.ctaLabel}
            <span aria-hidden="true">&rarr;</span>
          </a>
          <span className="text-[11px] text-white/60">Sponsored</span>
        </div>
      </div>
    </div>
  );
}
