import Link from "next/link";

interface IntentTile {
  label: string;
  href: string;
  icon: React.ReactNode;
}

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
      {TILES.map((tile) => (
        <Link
          key={tile.href}
          href={tile.href}
          className="group flex flex-col items-center gap-1.5 rounded-lg px-1 py-2 text-center transition hover:bg-brand/5"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-cream text-brand-dark transition group-hover:bg-brand-orange/15 group-hover:text-brand-orange">
            {tile.icon}
          </span>
          <span className="text-[11px] font-medium text-brand-dark sm:text-xs">{tile.label}</span>
        </Link>
      ))}
    </div>
  );
}
