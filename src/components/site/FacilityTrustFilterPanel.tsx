import Link from "next/link";
import type { FacilityWithCount } from "@/lib/public/facilities";
import {
  TRUST_FILTER_VALUES,
  TRUST_FILTER_LABELS,
  toggleFacilitySlug,
  type TrustFilterValue,
  type QueryParam,
} from "@/lib/public/filters";

const pillClass = (active: boolean) =>
  active
    ? "rounded-full border border-brand-orange bg-brand-orange px-3 py-1 text-sm text-white"
    : "rounded-full border border-brand/20 px-3 py-1 text-sm text-brand-dark hover:border-brand/50";

/**
 * A compact, collapsible (native <details>, no client JS) filter drawer —
 * never a permanent sidebar. Every option shown is either a real Facility
 * row with at least one published property already using it, or one of the
 * two real trust tiers — nothing here is invented or assumed.
 */
export default function FacilityTrustFilterPanel({
  facilities,
  activeFacilitySlugs,
  activeTrust,
  buildHref,
  defaultOpen = false,
}: {
  facilities: FacilityWithCount[];
  activeFacilitySlugs: string[];
  activeTrust?: TrustFilterValue;
  buildHref: (overrides: Record<string, QueryParam>) => string;
  defaultOpen?: boolean;
}) {
  const activeCount = activeFacilitySlugs.length + (activeTrust ? 1 : 0);

  return (
    <details open={defaultOpen} className="mt-4 rounded-lg border border-brand/10 bg-white">
      <summary className="cursor-pointer select-none px-4 py-2.5 text-sm font-medium text-brand-dark">
        Filters{activeCount > 0 ? ` (${activeCount} active)` : ""}
      </summary>
      <div className="space-y-4 border-t border-brand/10 px-4 py-4">
        {facilities.length > 0 && (
          <div>
            <p className="text-xs font-medium tracking-wide text-brand/50 uppercase">Facilities</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {facilities.map((f) => {
                const active = activeFacilitySlugs.includes(f.slug);
                return (
                  <Link
                    key={f.slug}
                    href={buildHref({ facility: toggleFacilitySlug(activeFacilitySlugs, f.slug) })}
                    className={pillClass(active)}
                  >
                    {f.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-medium tracking-wide text-brand/50 uppercase">Trust</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link href={buildHref({ trust: undefined })} className={pillClass(!activeTrust)}>
              All listings
            </Link>
            {TRUST_FILTER_VALUES.map((value) => (
              <Link key={value} href={buildHref({ trust: value })} className={pillClass(activeTrust === value)}>
                {TRUST_FILTER_LABELS[value]}
              </Link>
            ))}
          </div>
        </div>

        {activeCount > 0 && (
          <Link href={buildHref({ facility: undefined, trust: undefined })} className="inline-block text-xs text-brand-teal hover:underline">
            Clear filters
          </Link>
        )}
      </div>
    </details>
  );
}
