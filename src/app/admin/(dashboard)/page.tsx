import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AdminSectionBlocks from "@/components/admin/AdminSectionBlocks";
import { ANALYTICS_EVENT_TYPES, ANALYTICS_EVENT_LABELS } from "@/lib/analytics";
import {
  ANALYTICS_PERIODS,
  ANALYTICS_PERIOD_LABELS,
  resolveAnalyticsPeriod,
  periodStartDate,
  computeConversionRate,
  formatConversionRate,
  aggregateSearchPaths,
} from "@/lib/analyticsInsights";
import { ENQUIRY_STATUS_LABELS } from "@/lib/validation/enquiry";
import { COMMERCIAL_TIER_LABELS, COMMERCIAL_TIER_VALUES } from "@/lib/validation/commercial";

export const dynamic = "force-dynamic";

interface PageSearchParams {
  period?: string;
}

function StatCard({ label, value, href }: { label: string; value: number | string; href?: string }) {
  const content = (
    <div className="rounded-lg border border-slate-200 bg-panel-green p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
  return href ? (
    <Link href={href} className="block transition hover:border-slate-400 hover:shadow">
      {content}
    </Link>
  ) : (
    content
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-md border border-slate-300 bg-panel-green px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50"
    >
      {label} &rarr;
    </Link>
  );
}

/** One step of a funnel: a real count plus the conversion rate from the previous step — "Not enough data" rather than a fabricated 0% when the previous step's count is 0. */
function FunnelRow({ label, count, rateFromPrevious }: { label: string; count: number; rateFromPrevious?: number | null }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2 text-sm last:border-0">
      <span className="text-slate-600">{label}</span>
      <span className="flex items-center gap-3">
        <span className="font-semibold text-slate-900">{count}</span>
        {rateFromPrevious !== undefined && (
          <span className="w-28 text-right text-xs text-slate-400">{formatConversionRate(rateFromPrevious)}</span>
        )}
      </span>
    </div>
  );
}

function TopList({ title, items, emptyLabel }: { title: string; items: Array<{ label: string; count: number; href?: string }>; emptyLabel: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-panel-green p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-slate-400">{emptyLabel}</p>
      ) : (
        <ol className="mt-2 space-y-1.5 text-sm">
          {items.map((item, i) => (
            <li key={item.label} className="flex items-center justify-between gap-2">
              <span className="text-slate-600">
                {i + 1}. {item.href ? <Link href={item.href} className="hover:underline">{item.label}</Link> : item.label}
              </span>
              <span className="font-medium text-slate-900">{item.count}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default async function AdminDashboardPage({ searchParams }: { searchParams: Promise<PageSearchParams> }) {
  const sp = await searchParams;
  const period = resolveAnalyticsPeriod(sp.period);
  const since = periodStartDate(period);
  const createdAtFilter = since ? { createdAt: { gte: since } } : undefined;

  const [
    totalProperties,
    verificationCounts,
    publishStatusCounts,
    totalCategories,
    totalLocations,
    totalVenueSpaces,
    needsReviewCount,
    unresolvedVenueSpaceCount,
    claimedCount,
    featuredCount,
    pendingClaimsCount,
    pendingSubmissionsCount,
    newEnquiriesCount,
    analyticsCounts,
    topViewedRaw,
    searchPathRows,
    enquiryStatusCounts,
    commercialTierCounts,
    leadPartnerCount,
    totalPartnerLeadCount,
    pendingEventsCount,
  ] = await Promise.all([
    prisma.property.count(),
    prisma.property.groupBy({ by: ["verificationStatus"], _count: { _all: true } }),
    prisma.property.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.category.count(),
    prisma.location.count(),
    prisma.venueSpace.count(),
    prisma.property.count({ where: { verificationStatus: "NEEDS_REVIEW" } }),
    prisma.unresolvedVenueSpace.count(),
    prisma.property.count({ where: { claimed: true } }),
    prisma.property.count({ where: { featured: true } }),
    prisma.claimRequest.count({ where: { status: "PENDING" } }),
    prisma.propertySubmission.count({ where: { status: "PENDING" } }),
    prisma.enquiry.count({ where: { status: "NEW" } }),
    prisma.analyticsEvent.groupBy({ by: ["type"], where: createdAtFilter, _count: { _all: true } }),
    prisma.analyticsEvent.groupBy({
      by: ["propertyId"],
      where: { type: "PROPERTY_VIEW", propertyId: { not: null }, ...createdAtFilter },
      _count: { _all: true },
      orderBy: { _count: { propertyId: "desc" } },
      take: 5,
    }),
    prisma.analyticsEvent.findMany({
      where: { type: "SEARCH", ...createdAtFilter },
      select: { path: true },
      take: 5000,
    }),
    prisma.enquiry.groupBy({ by: ["status"], where: since ? { createdAt: { gte: since } } : undefined, _count: { _all: true } }),
    prisma.property.groupBy({ by: ["commercialTier"], _count: { _all: true } }),
    prisma.leadPartner.count(),
    prisma.partnerLead.count(),
    prisma.event.count({ where: { status: "PENDING" } }).catch(() => 0),
  ]);

  const countsByStatus = Object.fromEntries(verificationCounts.map((g) => [g.verificationStatus, g._count._all]));
  const countsByPublishStatus = Object.fromEntries(publishStatusCounts.map((g) => [g.status, g._count._all]));
  const unresolvedDataCount = unresolvedVenueSpaceCount + needsReviewCount;
  const countsByEventType = Object.fromEntries(analyticsCounts.map((g) => [g.type, g._count._all])) as Partial<
    Record<(typeof ANALYTICS_EVENT_TYPES)[number], number>
  >;
  const countsByEnquiryStatus = Object.fromEntries(enquiryStatusCounts.map((g) => [g.status, g._count._all]));
  const countsByCommercialTier = Object.fromEntries(commercialTierCounts.map((g) => [g.commercialTier, g._count._all]));

  const topViewedPropertyIds = topViewedRaw.map((g) => g.propertyId).filter((id): id is string => Boolean(id));
  const topViewedProperties = topViewedPropertyIds.length
    ? await prisma.property.findMany({ where: { id: { in: topViewedPropertyIds } }, select: { id: true, name: true } })
    : [];
  const topViewedNameById = Object.fromEntries(topViewedProperties.map((p) => [p.id, p.name]));
  const topViewedList = topViewedRaw.map((g) => ({
    label: (g.propertyId && topViewedNameById[g.propertyId]) || "(deleted listing)",
    count: g._count._all,
  }));

  const searchBreakdown = aggregateSearchPaths(searchPathRows.map((r) => r.path));
  const topCategorySlugs = searchBreakdown.categories.slice(0, 5).map((c) => c.slug);
  const topLocationSlugs = searchBreakdown.locations.slice(0, 5).map((l) => l.slug);
  const [topCategoryNames, topLocationNames] = await Promise.all([
    topCategorySlugs.length
      ? prisma.category.findMany({ where: { slug: { in: topCategorySlugs } }, select: { slug: true, name: true } })
      : Promise.resolve([]),
    topLocationSlugs.length
      ? prisma.location.findMany({ where: { slug: { in: topLocationSlugs } }, select: { slug: true, name: true } })
      : Promise.resolve([]),
  ]);
  const categoryNameBySlug = Object.fromEntries(topCategoryNames.map((c) => [c.slug, c.name]));
  const locationNameBySlug = Object.fromEntries(topLocationNames.map((l) => [l.slug, l.name]));
  const topSearchedCategories = searchBreakdown.categories
    .slice(0, 5)
    .map((c) => ({ label: categoryNameBySlug[c.slug] ?? c.slug, count: c.count, href: `/${c.slug}` }));
  const topSearchedLocations = searchBreakdown.locations
    .slice(0, 5)
    .map((l) => ({ label: locationNameBySlug[l.slug] ?? l.slug, count: l.count, href: `/locations/${l.slug}` }));

  const enquiryViews = countsByEventType.PROPERTY_VIEW ?? 0;
  const enquiryStarts = countsByEventType.ENQUIRY_START ?? 0;
  const enquirySubmits = countsByEventType.ENQUIRY_SUBMIT ?? 0;
  const claimStarts = countsByEventType.CLAIM_START ?? 0;
  const claimSubmits = countsByEventType.CLAIM_SUBMIT ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Every section, one tap away — open a block for its full list and detail pages.</p>
      </div>

      <AdminSectionBlocks
        pendingClaims={pendingClaimsCount}
        pendingSubmissions={pendingSubmissionsCount}
        newEnquiries={newEnquiriesCount}
        pendingEvents={pendingEventsCount}
      />

      <div className="flex flex-wrap gap-2">
        <QuickLink href="/admin/partners/leads" label="Partner Leads" />
        <QuickLink href="/admin/properties?featured=true" label="Featured properties" />
      </div>

      <div className="border-t border-slate-200 pt-8">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide text-slate-500">Analytics &amp; stats</h2>
        <p className="mt-1 text-sm text-slate-500">Overview of the directory dataset — every number here is a live count, nothing estimated.</p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-900">Needs attention</h2>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <StatCard label="Pending claims" value={pendingClaimsCount} href="/admin/claims" />
          <StatCard label="Pending submissions" value={pendingSubmissionsCount} href="/admin/submissions" />
          <StatCard label="New enquiries" value={newEnquiriesCount} href="/admin/enquiries" />
          <StatCard label="Needs review" value={needsReviewCount} href="/admin/data-quality" />
          <StatCard label="Unresolved data" value={unresolvedDataCount} href="/admin/data-quality" />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-900">Directory overview</h2>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard label="Total properties" value={totalProperties} href="/admin/properties" />
          <StatCard label="Published" value={countsByPublishStatus.PUBLISHED ?? 0} href="/admin/properties?status=PUBLISHED" />
          <StatCard label="Claimed" value={claimedCount} href="/admin/properties?claimed=true" />
          <StatCard label="Featured" value={featuredCount} href="/admin/properties?featured=true" />
          <StatCard label="Total categories" value={totalCategories} href="/admin/categories" />
          <StatCard label="Total locations" value={totalLocations} href="/admin/locations" />
          <StatCard label="Total venue spaces" value={totalVenueSpaces} />
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Vendor commercial status</h2>
          <Link href="/admin/vendors" className="text-sm font-medium text-slate-700 hover:underline">
            Manage vendors &rarr;
          </Link>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          A plain, admin-set label — FREE is the default and nothing here ever changes automatically.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {COMMERCIAL_TIER_VALUES.map((tier) => (
            <StatCard
              key={tier}
              label={COMMERCIAL_TIER_LABELS[tier]}
              value={countsByCommercialTier[tier] ?? 0}
              href={`/admin/vendors?tier=${tier}`}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Lead marketplace</h2>
          <Link href="/admin/partners/leads" className="text-sm font-medium text-slate-700 hover:underline">
            View all partner leads &rarr;
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="Configured partners" value={leadPartnerCount} href="/admin/partners" />
          <StatCard label="Partner leads (all time)" value={totalPartnerLeadCount} href="/admin/partners/leads" />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-900">Properties by publish status</h2>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(["DRAFT", "PUBLISHED", "ARCHIVED", "CLOSED"] as const).map((status) => (
            <StatCard
              key={status}
              label={status}
              value={countsByPublishStatus[status] ?? 0}
              href={`/admin/properties?status=${status}`}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Activity</h2>
          <div className="flex gap-1 text-xs">
            {ANALYTICS_PERIODS.map((p) => (
              <Link
                key={p}
                href={p === "all" ? "/admin" : `/admin?period=${p}`}
                className={
                  period === p
                    ? "rounded-full bg-slate-900 px-2.5 py-1 text-white"
                    : "rounded-full border border-slate-300 px-2.5 py-1 text-slate-600 hover:bg-slate-50"
                }
              >
                {ANALYTICS_PERIOD_LABELS[p]}
              </Link>
            ))}
          </div>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Anonymous, on-site event counts — no visitor is ever identified. {ANALYTICS_PERIOD_LABELS[period]}.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {ANALYTICS_EVENT_TYPES.map((type) => (
            <StatCard key={type} label={ANALYTICS_EVENT_LABELS[type]} value={countsByEventType[type] ?? 0} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-900">Conversion funnels</h2>
        <p className="mt-1 text-xs text-slate-500">
          Each rate is against the step above it — shown as &ldquo;Not enough data&rdquo; rather than a fabricated 0% when there&apos;s nothing to divide by yet.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-panel-green p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Enquiry funnel</p>
            <div className="mt-2">
              <FunnelRow label="Property views" count={enquiryViews} />
              <FunnelRow label="Enquiry starts" count={enquiryStarts} rateFromPrevious={computeConversionRate(enquiryStarts, enquiryViews)} />
              <FunnelRow label="Enquiry submits" count={enquirySubmits} rateFromPrevious={computeConversionRate(enquirySubmits, enquiryStarts)} />
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-panel-green p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Claim funnel</p>
            <div className="mt-2">
              <FunnelRow label="Property views" count={enquiryViews} />
              <FunnelRow label="Claim starts" count={claimStarts} rateFromPrevious={computeConversionRate(claimStarts, enquiryViews)} />
              <FunnelRow label="Claim submits" count={claimSubmits} rateFromPrevious={computeConversionRate(claimSubmits, claimStarts)} />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-900">What visitors are looking at</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TopList title="Top viewed properties" items={topViewedList} emptyLabel="No views recorded yet." />
          <TopList title="Top searched categories" items={topSearchedCategories} emptyLabel="No category searches recorded yet." />
          <TopList title="Top searched locations" items={topSearchedLocations} emptyLabel="No location searches recorded yet." />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-900">Enquiry funnel by status</h2>
        <p className="mt-1 text-xs text-slate-500">Every enquiry starts NEW — this shows how many have moved further.</p>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {(["NEW", "CONTACTED", "CONVERTED"] as const).map((status) => (
            <StatCard
              key={status}
              label={ENQUIRY_STATUS_LABELS[status]}
              value={countsByEnquiryStatus[status] ?? 0}
              href={`/admin/enquiries?status=${status}`}
            />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-900">Properties by verification status</h2>
        <p className="mt-1 text-xs text-slate-500">Discovery, Verified, and Owner Verified are the same tiers shown publicly on TrustBadge.</p>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {(["DISCOVERED", "VERIFIED", "OWNER_CLAIMED", "OWNER_VERIFIED", "CLOSED", "NEEDS_REVIEW"] as const).map(
            (status) => (
              <StatCard
                key={status}
                label={status.replace(/_/g, " ")}
                value={countsByStatus[status] ?? 0}
                href={`/admin/properties?verificationStatus=${status}`}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}
