import Link from "next/link";

export type DiscoveryTone = "brand" | "orange" | "gold" | "teal";

const TONE_WASH: Record<DiscoveryTone, string> = {
  brand: "from-brand to-brand-dark",
  orange: "from-brand-orange to-[#c8511a]",
  gold: "from-brand-gold to-[#a86c10]",
  teal: "from-brand-teal to-[#1c6d75]",
};

/**
 * Large editorial "intent" card. Background is a brand-color wash, not
 * fabricated property photography — swap the wash div for next/image
 * (fill, object-cover) once real photography exists per category.
 */
export default function DiscoveryCard({
  label,
  description,
  count,
  href,
  tone,
}: {
  label: string;
  description: string;
  count: number;
  href: string;
  tone: DiscoveryTone;
}) {
  return (
    <Link
      href={href}
      className="group relative block h-56 overflow-hidden rounded-xl border border-brand/10 shadow-sm transition hover:shadow-lg sm:h-64"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${TONE_WASH[tone]}`} />
      <div className="absolute inset-0 bg-black/10 transition group-hover:bg-black/0" />
      <div className="relative flex h-full flex-col justify-end p-6 text-white">
        <p className="font-serif text-3xl font-semibold">{label}</p>
        <p className="mt-1 max-w-xs text-sm text-white/85">{description}</p>
        <p className="mt-3 text-xs font-medium tracking-wide uppercase text-white/70">
          {count} {count === 1 ? "listing" : "listings"} · Explore →
        </p>
      </div>
    </Link>
  );
}
