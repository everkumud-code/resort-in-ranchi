import Link from "next/link";

/**
 * A colorful gradient action tile for the owner/creator self-serve
 * dashboards — same "tap into a section" visual language as the admin
 * panel's AdminSectionBlocks, so every dashboard in the product feels like
 * one consistent, modern system rather than a plain list of gray links.
 */
export default function DashboardTile({
  href,
  title,
  description,
  badge,
  icon,
  gradient,
}: {
  href: string;
  title: string;
  description: string;
  badge?: string;
  icon: React.ReactNode;
  gradient: string;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center justify-between gap-3 rounded-xl bg-gradient-to-br p-4 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${gradient}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">{icon}</span>
        <div className="min-w-0">
          <p className="font-semibold">{title}</p>
          <p className="mt-0.5 truncate text-xs text-white/80">{description}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {badge && <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-900">{badge}</span>}
        <span aria-hidden="true">&rarr;</span>
      </div>
    </Link>
  );
}
