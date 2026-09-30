import Link from "next/link";

type Tone = "brand" | "orange" | "gold" | "olive" | "teal" | "dark";

interface IntentTile {
  label: string;
  href: string;
  tone: Tone;
  icon: React.ReactNode;
}

/**
 * Full literal class strings (not built dynamically) so Tailwind's compiler
 * can see and include them. Each tile keeps its own real icon shape (never
 * a literal power-button symbol) but gets a glossy gradient badge in our
 * own brand colors — a soft tint at rest, filling in to a richer gradient
 * with a white icon and a lifted shadow on hover, the same "pressable"
 * depth as a premium round icon button, just on-brand instead of pink.
 */
const TONE_CLASSES: Record<Tone, { badge: string; icon: string; label: string }> = {
  brand: {
    badge: "from-brand/20 to-brand/5 group-hover:from-brand group-hover:to-brand-dark group-hover:shadow-lg group-hover:shadow-brand/30",
    icon: "group-hover:text-white",
    label: "group-hover:text-brand",
  },
  orange: {
    badge:
      "from-brand-orange/20 to-brand-orange/5 group-hover:from-brand-orange group-hover:to-[#c8511a] group-hover:shadow-lg group-hover:shadow-brand-orange/30",
    icon: "group-hover:text-white",
    label: "group-hover:text-brand-orange",
  },
  gold: {
    badge: "from-brand-gold/20 to-brand-gold/5 group-hover:from-brand-gold group-hover:to-[#a86c10] group-hover:shadow-lg group-hover:shadow-brand-gold/30",
    icon: "group-hover:text-white",
    label: "group-hover:text-brand-gold",
  },
  olive: {
    badge: "from-brand-olive/20 to-brand-olive/5 group-hover:from-brand-olive group-hover:to-[#4c5a30] group-hover:shadow-lg group-hover:shadow-brand-olive/30",
    icon: "group-hover:text-white",
    label: "group-hover:text-brand-olive",
  },
  teal: {
    badge: "from-brand-teal/20 to-brand-teal/5 group-hover:from-brand-teal group-hover:to-[#1c6d75] group-hover:shadow-lg group-hover:shadow-brand-teal/30",
    icon: "group-hover:text-white",
    label: "group-hover:text-brand-teal",
  },
  dark: {
    badge: "from-brand-dark/20 to-brand-dark/5 group-hover:from-brand-dark group-hover:to-black group-hover:shadow-lg group-hover:shadow-brand-dark/30",
    icon: "group-hover:text-white",
    label: "group-hover:text-brand-dark",
  },
};

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const TILES: IntentTile[] = [
  {
    label: "Stay",
    href: "/resorts",
    tone: "brand",
    icon: (
      <svg {...iconProps}>
        <path d="M3 19V7a1 1 0 0 1 1-1h6v9" />
        <path d="M10 10h9a1 1 0 0 1 1 1v8" />
        <path d="M3 19h18" />
        <circle cx="7" cy="10" r="1" />
      </svg>
    ),
  },
  {
    label: "Eat",
    href: "/restaurants",
    tone: "orange",
    icon: (
      <svg {...iconProps}>
        <path d="M6 3v7a2 2 0 0 0 4 0V3" />
        <path d="M8 10v11" />
        <path d="M17 3c-1.5 0-3 1.5-3 4s1.5 4 3 4v10" />
      </svg>
    ),
  },
  {
    label: "Celebrate",
    href: "/banquet-halls",
    tone: "gold",
    icon: (
      <svg {...iconProps}>
        <path d="M4 20l3-9 9 3-9 3" />
        <path d="M13.5 10.5L20 4" />
        <circle cx="19" cy="6" r="1.2" />
        <circle cx="15.5" cy="3.5" r="1" />
        <circle cx="21" cy="9.5" r="1" />
      </svg>
    ),
  },
  {
    label: "Picnic",
    href: "/picnic-spots",
    tone: "olive",
    icon: (
      <svg {...iconProps}>
        <path d="M12 3v6" />
        <path d="M12 9l6 10H6l6-10Z" />
        <path d="M4 21h16" />
      </svg>
    ),
  },
  {
    label: "Experience",
    href: "/experiences",
    tone: "teal",
    icon: (
      <svg {...iconProps}>
        <path d="M3 19l6-11 4 7 3-5 5 9Z" />
        <path d="M3 19h18" />
      </svg>
    ),
  },
  {
    label: "Promote",
    href: "/influencers",
    tone: "dark",
    icon: (
      <svg {...iconProps}>
        <path d="M3 11v3a1 1 0 0 0 1 1h2l4 4V6l-4 4H4a1 1 0 0 0-1 1Z" />
        <path d="M15 8a4 4 0 0 1 0 8" />
        <path d="M18 5a8 8 0 0 1 0 14" />
      </svg>
    ),
  },
  {
    label: "Events",
    href: "/events",
    tone: "orange",
    icon: (
      <svg {...iconProps}>
        <rect x="3.5" y="5" width="17" height="15" rx="2" />
        <path d="M3.5 9.5h17" />
        <path d="M8 3v4" />
        <path d="M16 3v4" />
      </svg>
    ),
  },
];

/**
 * MakeMyTrip-style icon-tab quick nav, adapted to what ResortInRanchi
 * actually offers — a browse directory, not a booking engine, so each tile
 * is a real section of the site (Stay/Eat/Celebrate/Picnic/Experience are
 * category umbrellas, Promote is the influencer program, Events is the
 * events calendar), not a transport mode.
 */
export default function HeroIntentTiles() {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-7 sm:gap-1">
      {TILES.map((tile) => {
        const tone = TONE_CLASSES[tile.tone];
        return (
          <Link
            key={tile.href}
            href={tile.href}
            className="intent-tile group flex flex-col items-center gap-1.5 rounded-lg px-1 py-2 text-center transition hover:-translate-y-0.5 hover:bg-brand/5"
          >
            <span
              className={`intent-tile-icon flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br text-brand-dark shadow-sm transition-all duration-300 ${tone.badge} ${tone.icon}`}
            >
              {tile.icon}
            </span>
            <span className={`text-[11px] font-medium text-brand-dark transition-colors sm:text-xs ${tone.label}`}>{tile.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
