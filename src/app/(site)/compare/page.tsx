import type { Metadata } from "next";
import Link from "next/link";
import {
  getComparableProperties,
  getCompareSuggestion,
  compareSuggestionEligible,
  buildAddToCompareHref,
  sanitizeCompareSlugs,
  formatCompareValue,
} from "@/lib/public/compare";
import { MIN_COMPARE_PROPERTIES } from "@/lib/public/compareConstants";
import type { PublicProperty } from "@/lib/public/properties";
import { buildPageMetadata } from "@/lib/public/seo";
import TrustBadge from "@/components/site/TrustBadge";
import AnalyticsBeacon from "@/components/site/AnalyticsBeacon";

interface PageSearchParams {
  property?: string | string[];
}

export function generateMetadata(): Metadata {
  // A filter/utility surface built from a visitor's own selection, not
  // unique editorial content — never indexed, same treatment as /search,
  // /property/[slug]/claim and /property/[slug]/enquire.
  return buildPageMetadata({
    title: "Compare listings",
    description: "Compare properties on ResortInRanchi.",
    path: "/compare",
    noindex: true,
  });
}

interface CompareRow {
  label: string;
  render: (property: PublicProperty) => React.ReactNode;
}

const ROWS: CompareRow[] = [
  { label: "Category", render: (p) => p.category.name },
  { label: "Location", render: (p) => formatCompareValue(p.locality?.name ?? null) },
  { label: "Trust status", render: (p) => <TrustBadge verificationStatus={p.verificationStatus} /> },
  { label: "Description", render: (p) => formatCompareValue(p.shortDescription ?? p.fullDescription ?? null) },
  {
    label: "Facilities",
    render: (p) => (p.facilities.length > 0 ? p.facilities.map((f) => f.facility.name).join(", ") : "Not provided"),
  },
  {
    label: "Venue spaces",
    render: (p) => (p.venueSpaces.length > 0 ? p.venueSpaces.map((v) => v.name).join(", ") : "Not provided"),
  },
  {
    label: "Capacity",
    render: (p) => {
      const capacity =
        p.eventCapacityMin || p.eventCapacityMax
          ? `${p.eventCapacityMin ?? "?"}–${p.eventCapacityMax ?? "?"} guests`
          : p.rooms
            ? `${p.rooms} rooms`
            : null;
      return formatCompareValue(capacity);
    },
  },
  { label: "Price", render: (p) => formatCompareValue(p.priceLabel) },
  {
    label: "Rating",
    render: (p) => formatCompareValue(p.googleRating ? `★ ${p.googleRating.toFixed(1)}${p.reviewCount ? ` (${p.reviewCount})` : ""}` : null),
  },
];

interface CompareSuggestionProperty {
  slug: string;
  name: string;
  verificationStatus: string;
  category: { name: string };
  locality: { name: string } | null;
}

/**
 * Prominent but strictly additive — following the link appends the
 * suggestion to whatever the visitor already picked (see
 * buildAddToCompareHref); nothing here changes the current selection on its
 * own. Shows the real TrustBadge — never a fabricated top-rank or superlative claim.
 */
function CompareSuggestionBanner({
  suggestion,
  selectedSlugs,
}: {
  suggestion: CompareSuggestionProperty;
  selectedSlugs: string[];
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand-gold/30 bg-brand-gold/5 px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="shrink-0 rounded-full bg-brand-gold/20 px-2 py-0.5 text-xs font-medium text-brand-gold">Featured</span>
        <div>
          <p className="text-sm font-medium text-brand-dark">Also compare {suggestion.name}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-brand/60">
            {suggestion.category.name}
            {suggestion.locality ? ` · ${suggestion.locality.name}` : ""}
            <TrustBadge verificationStatus={suggestion.verificationStatus} />
          </p>
        </div>
      </div>
      <Link
        href={buildAddToCompareHref(selectedSlugs, suggestion.slug)}
        className="shrink-0 rounded-md border border-brand-gold/50 px-3 py-1.5 text-xs font-semibold text-brand-gold hover:bg-brand-gold/10"
      >
        Add to compare
      </Link>
    </div>
  );
}

export default async function ComparePage({ searchParams }: { searchParams: Promise<PageSearchParams> }) {
  const sp = await searchParams;
  const slugs = sanitizeCompareSlugs(sp.property);
  const [properties, suggestion] = await Promise.all([getComparableProperties(slugs), getCompareSuggestion(slugs)]);
  const suggestionEligible = compareSuggestionEligible({ suggestionSlug: suggestion?.slug ?? null, selectedSlugs: slugs });

  if (properties.length < MIN_COMPARE_PROPERTIES) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="font-serif text-2xl font-semibold text-brand-dark">Compare listings</h1>
        <p className="mt-3 text-sm text-brand/70">
          {properties.length === 0
            ? "Select at least 2 properties to compare — browse listings and use the Compare checkbox on each card."
            : "Select at least one more property to compare."}
        </p>
        <Link
          href="/search"
          className="mt-6 inline-block rounded-md bg-brand-orange px-4 py-2 text-sm font-semibold text-white hover:brightness-95"
        >
          Browse listings
        </Link>
        {suggestionEligible && suggestion && <CompareSuggestionBanner suggestion={suggestion} selectedSlugs={slugs} />}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <AnalyticsBeacon type="COMPARE" path="/compare" />
      <h1 className="font-serif text-2xl font-semibold text-brand-dark">Compare listings</h1>
      <p className="mt-1 max-w-2xl text-sm text-brand/70">
        Comparing {properties.length} {properties.length === 1 ? "listing" : "listings"}. &ldquo;Not provided&rdquo;
        means that information hasn&apos;t been added yet — the business owner can fill it in after claiming their
        listing.
      </p>

      {suggestionEligible && suggestion && <CompareSuggestionBanner suggestion={suggestion} selectedSlugs={slugs} />}

      <div className="mt-6 overflow-x-auto rounded-lg border border-brand/10 bg-white">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 bg-white px-4 py-3 text-left text-xs font-medium tracking-wide text-brand/50 uppercase">
                Property
              </th>
              {properties.map((p) => (
                <th key={p.id} scope="col" className="min-w-[200px] px-4 py-3 text-left align-top">
                  <Link href={`/property/${p.slug}`} className="font-serif text-base font-semibold text-brand-dark hover:underline">
                    {p.name}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand/10">
            {ROWS.map((row) => (
              <tr key={row.label}>
                <th
                  scope="row"
                  className="sticky left-0 bg-white px-4 py-3 text-left align-top text-xs font-medium tracking-wide text-brand/50 uppercase"
                >
                  {row.label}
                </th>
                {properties.map((p) => (
                  <td key={p.id} className="px-4 py-3 align-top text-brand-dark/80">
                    {row.render(p)}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <th
                scope="row"
                className="sticky left-0 bg-white px-4 py-3 text-left align-top text-xs font-medium tracking-wide text-brand/50 uppercase"
              >
                Enquire
              </th>
              {properties.map((p) => (
                <td key={p.id} className="px-4 py-3 align-top">
                  <Link
                    href={`/property/${p.slug}/enquire`}
                    className="inline-block rounded-md bg-brand-orange px-3 py-1.5 text-xs font-semibold text-white hover:brightness-95"
                  >
                    Enquire
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
