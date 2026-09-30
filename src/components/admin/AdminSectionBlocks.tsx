import Link from "next/link";

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

interface SectionBlock {
  href: string;
  label: string;
  gradient: string;
  icon: React.ReactNode;
  pendingCount?: number;
}

/** Full literal gradient class strings so Tailwind's compiler includes them. */
export default function AdminSectionBlocks({
  pendingClaims,
  pendingSubmissions,
  newEnquiries,
  pendingEvents,
}: {
  pendingClaims: number;
  pendingSubmissions: number;
  newEnquiries: number;
  pendingEvents: number;
}) {
  const blocks: SectionBlock[] = [
    {
      href: "/admin/properties",
      label: "Properties",
      gradient: "from-blue-500 to-indigo-600",
      icon: (
        <svg {...iconProps}>
          <path d="M3 21V7a1 1 0 0 1 1-1h7v15" />
          <path d="M11 10h9a1 1 0 0 1 1 1v10" />
          <path d="M3 21h18" />
          <path d="M7 9h.01M7 13h.01M7 17h.01M15 14h.01M15 18h.01" />
        </svg>
      ),
    },
    {
      href: "/admin/categories",
      label: "Categories",
      gradient: "from-purple-500 to-purple-700",
      icon: (
        <svg {...iconProps}>
          <path d="M3 11l8-8 10 10-8 8Z" />
          <circle cx="8.5" cy="8.5" r="1.2" />
        </svg>
      ),
    },
    {
      href: "/admin/locations",
      label: "Locations",
      gradient: "from-teal-500 to-cyan-600",
      icon: (
        <svg {...iconProps}>
          <path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12Z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      ),
    },
    {
      href: "/admin/facilities",
      label: "Facilities",
      gradient: "from-emerald-500 to-green-600",
      icon: (
        <svg {...iconProps}>
          <path d="M4 12.5 9 17l11-11" />
        </svg>
      ),
    },
    {
      href: "/admin/badges",
      label: "Badges",
      gradient: "from-amber-400 to-orange-500",
      icon: (
        <svg {...iconProps}>
          <path d="M12 3l2.3 4.6 5.1.7-3.7 3.6.9 5-4.6-2.4-4.6 2.4.9-5-3.7-3.6 5.1-.7Z" />
        </svg>
      ),
    },
    {
      href: "/admin/claims",
      label: "Claims",
      gradient: "from-rose-500 to-red-600",
      pendingCount: pendingClaims,
      icon: (
        <svg {...iconProps}>
          <path d="M7 11V6a2 2 0 0 1 4 0v5" />
          <path d="M11 10V4a2 2 0 0 1 4 0v7" />
          <path d="M15 10.5V6a2 2 0 0 1 4 0v8c0 4-2.5 7-7 7s-6-2-7.5-4.5L3 13a1.8 1.8 0 0 1 3-2l1.5 1.8" />
        </svg>
      ),
    },
    {
      href: "/admin/submissions",
      label: "Submissions",
      gradient: "from-orange-500 to-amber-600",
      pendingCount: pendingSubmissions,
      icon: (
        <svg {...iconProps}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <path d="M7 10l5 5 5-5" />
          <path d="M12 15V3" />
        </svg>
      ),
    },
    {
      href: "/admin/partners",
      label: "Lead Partners",
      gradient: "from-cyan-500 to-sky-600",
      icon: (
        <svg {...iconProps}>
          <path d="M8 12h8" />
          <path d="M8 12a4 4 0 1 1 0-8h1" />
          <path d="M16 12a4 4 0 1 0 0 8h-1" />
        </svg>
      ),
    },
    {
      href: "/admin/vendors",
      label: "Vendors",
      gradient: "from-violet-500 to-purple-600",
      icon: (
        <svg {...iconProps}>
          <path d="M3 9l1.5-5h15L21 9" />
          <path d="M3 9h18v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
          <path d="M9 20v-6h6v6" />
        </svg>
      ),
    },
    {
      href: "/admin/enquiries",
      label: "Enquiries",
      gradient: "from-pink-500 to-rose-600",
      pendingCount: newEnquiries,
      icon: (
        <svg {...iconProps}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 7l9 6 9-6" />
        </svg>
      ),
    },
    {
      href: "/admin/blog",
      label: "Blog",
      gradient: "from-slate-500 to-slate-700",
      icon: (
        <svg {...iconProps}>
          <path d="M4 4h13a2 2 0 0 1 2 2v13a1 1 0 0 1-1.6.8L4 4Z" />
          <path d="M8 9h7M8 13h5" />
        </svg>
      ),
    },
    {
      href: "/admin/events",
      label: "Events",
      gradient: "from-emerald-500 to-teal-600",
      pendingCount: pendingEvents,
      icon: (
        <svg {...iconProps}>
          <rect x="3.5" y="5" width="17" height="15" rx="2" />
          <path d="M3.5 9.5h17M8 3v4M16 3v4" />
        </svg>
      ),
    },
    {
      href: "/admin/influencers",
      label: "Influencers",
      gradient: "from-fuchsia-500 to-pink-600",
      icon: (
        <svg {...iconProps}>
          <path d="M3 11v3a1 1 0 0 0 1 1h2l4 4V6l-4 4H4a1 1 0 0 0-1 1Z" />
          <path d="M15 8a4 4 0 0 1 0 8" />
        </svg>
      ),
    },
    {
      href: "/admin/data-quality",
      label: "Data Quality",
      gradient: "from-yellow-400 to-amber-600",
      icon: (
        <svg {...iconProps}>
          <path d="M12 3l9 16H3Z" />
          <path d="M12 10v4M12 17h.01" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {blocks.map((block) => (
        <Link
          key={block.href}
          href={block.href}
          className={`group relative flex flex-col justify-between overflow-hidden rounded-xl bg-gradient-to-br p-4 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${block.gradient}`}
        >
          {!!block.pendingCount && block.pendingCount > 0 && (
            <span className="absolute top-2 right-2 rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-900 shadow">
              {block.pendingCount}
            </span>
          )}
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">{block.icon}</span>
          <span className="mt-4 text-sm font-semibold">{block.label}</span>
        </Link>
      ))}
    </div>
  );
}
