export interface BadgeLike {
  id: string;
  label: string;
  description: string | null;
}

/** Small pill row for admin-assigned trust badges — shown on cards and detail pages across Property, Influencer and Event. */
export default function BadgePills({ badges, className = "" }: { badges: BadgeLike[]; className?: string }) {
  if (badges.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {badges.map((b) => (
        <span
          key={b.id}
          title={b.description ?? undefined}
          className="rounded-full bg-brand-teal/10 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-brand-teal"
        >
          {b.label}
        </span>
      ))}
    </div>
  );
}
