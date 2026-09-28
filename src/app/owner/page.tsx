import Link from "next/link";
import { getOwnerAccessPropertyId } from "@/lib/auth/ownerAccess";
import { logoutOwner } from "./actions";
import { prisma } from "@/lib/prisma";
import TrustBadge from "@/components/site/TrustBadge";
import { calculateListingQuality, type ListingQualityFieldId } from "@/lib/validation/listingQuality";
import { computeOwnerLifecycleStages } from "@/lib/validation/ownerLifecycle";
import { computeOwnerFreshness, type OwnerFreshness } from "@/lib/validation/ownerFreshness";
import { computeConversionRate, formatConversionRate } from "@/lib/analyticsInsights";
import { COMMERCIAL_TIER_LABELS, type CommercialTierValue } from "@/lib/validation/commercial";

/** Nudges the vendor to keep the listing current: how long since its last update, and a direct edit link once it is stale. */
function UpdateReminder({ freshness, editHref }: { freshness: OwnerFreshness; editHref: string }) {
  const { days, stale } = freshness;
  return (
    <div
      className={`mt-6 rounded-lg border p-4 shadow-sm ${stale ? "border-brand-orange/40 bg-brand-orange/5" : "border-brand/10 bg-white"}`}
    >
      <p className="font-medium text-brand-dark">{stale ? "Time to refresh your listing" : "Your listing is up to date"}</p>
      <p className="mt-1 text-sm text-brand-dark/70">
        Last updated {days === 0 ? "today" : `${days} day${days === 1 ? "" : "s"} ago`}. Visitors trust listings with current
        prices, photos, contact details and facilities
        {stale ? " — please review yours." : "; check back regularly to keep it that way."}
      </p>
      <Link href={editHref} className="mt-2 inline-block text-sm font-medium text-brand-teal hover:underline">
        {stale ? "Update my listing" : "Edit listing"} &rarr;
      </Link>
    </div>
  );
}

function LifecycleStepper({ stages }: { stages: ReturnType<typeof computeOwnerLifecycleStages> }) {
  return (
    <div className="mt-6 rounded-lg border border-brand/10 bg-white p-4 shadow-sm">
      <p className="font-medium text-brand-dark">Your listing&apos;s journey</p>
      <ol className="mt-3 flex flex-wrap gap-x-1 gap-y-2 text-xs">
        {stages.map((stage, i) => (
          <li key={stage.id} className="flex items-center gap-1">
            <span
              className={
                stage.status === "complete"
                  ? "rounded-full bg-brand-olive/15 px-2 py-1 font-medium text-brand-olive"
                  : stage.status === "current"
                    ? "rounded-full bg-brand-orange/15 px-2 py-1 font-semibold text-brand-orange"
                    : "rounded-full bg-brand/5 px-2 py-1 text-brand-dark/40"
              }
            >
              {stage.status === "complete" ? "✓ " : ""}
              {stage.label}
            </span>
            {i < stages.length - 1 && (
              <span aria-hidden="true" className="text-brand/30">
                &rarr;
              </span>
            )}
          </li>
        ))}
      </ol>
      <p className="mt-2 text-xs text-brand/50">
        Owner Verified is a separate decision our team makes after reviewing your updated listing — it never
        happens automatically.
      </p>
    </div>
  );
}

/** Where the "fix this" link for each missing checklist item points — always an anchor on the owner's own listing edit page, keyed by the section ids already present there. */
const QUALITY_ITEM_ANCHOR: Record<ListingQualityFieldId, string> = {
  description: "details",
  phone: "contact",
  email: "contact",
  website: "contact",
  pricing: "pricing",
  rooms: "capacity",
  capacity: "capacity",
  photos: "photos",
  facilities: "facilities",
  venueSpaces: "venue-spaces",
};

function ListingQualitySection({
  propertyId,
  quality,
}: {
  propertyId: string;
  quality: ReturnType<typeof calculateListingQuality>;
}) {
  const missingItems = quality.items.filter((item) => !item.complete);

  return (
    <div className="mt-6 rounded-lg border border-brand/10 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium text-brand-dark">Listing quality</p>
        <span
          className={
            quality.isComplete
              ? "rounded-full bg-brand-olive/15 px-2.5 py-0.5 text-xs font-semibold text-brand-olive"
              : "rounded-full bg-brand-orange/15 px-2.5 py-0.5 text-xs font-semibold text-brand-orange"
          }
        >
          {quality.isComplete ? "Complete" : "Needs attention"}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-brand/10">
          <div
            className="h-full rounded-full bg-brand-teal transition-[width]"
            style={{ width: `${quality.percent}%` }}
          />
        </div>
        <span className="shrink-0 text-sm font-semibold text-brand-dark">{quality.percent}%</span>
      </div>
      <p className="mt-1 text-xs text-brand/50">
        {quality.completedCount} of {quality.totalCount} listing details complete.
      </p>

      {missingItems.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {missingItems.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-brand-dark/70">
                <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-orange" />
                {item.label}
              </span>
              <Link
                href={`/owner/listing/${propertyId}#${QUALITY_ITEM_ANCHOR[item.id]}`}
                className="shrink-0 text-xs font-medium text-brand-teal hover:underline"
              >
                Add
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Real counts only, strictly scoped to this owner's own property (every
 * query the caller passes in is already filtered by the session-derived
 * propertyId — this component never re-queries anything itself). Shows
 * "Not enough data" rather than a fabricated 0% conversion rate when there
 * have been no enquiries yet.
 */
function LeadsSummary({
  viewCount,
  totalEnquiries,
  convertedCount,
}: {
  viewCount: number;
  totalEnquiries: number;
  convertedCount: number;
}) {
  const conversionRate = computeConversionRate(convertedCount, totalEnquiries);
  return (
    <div className="mt-6 rounded-lg border border-brand/10 bg-white p-4 shadow-sm">
      <p className="font-medium text-brand-dark">Leads</p>
      <div className="mt-3 grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xl font-semibold text-brand-dark">{viewCount}</p>
          <p className="text-xs text-brand/50">Listing views</p>
        </div>
        <div>
          <p className="text-xl font-semibold text-brand-dark">{totalEnquiries}</p>
          <p className="text-xs text-brand/50">Enquiries</p>
        </div>
        <div>
          <p className="text-xl font-semibold text-brand-dark">{formatConversionRate(conversionRate)}</p>
          <p className="text-xs text-brand/50">Converted</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Real counts only, scoped by the caller to this owner's own LeadPartner
 * (see the propertyId-scoped query in OwnerHomePage). Only rendered at all
 * when a LeadPartner row actually exists for this property — never implied
 * or fabricated from the commercial tier label alone.
 */
function ReferredLeadsSummary({ totalLeads, convertedLeads }: { totalLeads: number; convertedLeads: number }) {
  const conversionRate = computeConversionRate(convertedLeads, totalLeads);
  return (
    <div className="mt-6 rounded-lg border border-brand/10 bg-white p-4 shadow-sm">
      <p className="font-medium text-brand-dark">Referred leads</p>
      {totalLeads === 0 ? (
        <p className="mt-2 text-sm text-brand/50">No referred opportunities yet.</p>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3 text-center">
          <div>
            <p className="text-xl font-semibold text-brand-dark">{totalLeads}</p>
            <p className="text-xs text-brand/50">Received</p>
          </div>
          <div>
            <p className="text-xl font-semibold text-brand-dark">{formatConversionRate(conversionRate)}</p>
            <p className="text-xs text-brand/50">Converted</p>
          </div>
        </div>
      )}
      <Link href="/owner/referred" className="mt-3 inline-block text-xs font-medium text-brand-teal hover:underline">
        View all referred leads &rarr;
      </Link>
    </div>
  );
}

const COMMERCIAL_TIER_BADGE_CLASS: Record<CommercialTierValue, string> = {
  FREE: "bg-brand/10 text-brand-dark/60",
  PREMIUM: "bg-brand-orange/15 text-brand-orange",
  LEAD_PARTNER: "bg-brand-olive/15 text-brand-olive",
};

/**
 * Plan/visibility status — commercialTier is a plain label an admin sets
 * (see its own schema doc comment); it never changes on its own and never
 * implies featured/verification status, which are shown as their own real
 * facts alongside it. The CTA is deliberately just a contact link — there is
 * no payment flow or self-serve upgrade yet.
 */
function CommercialStatusSection({
  commercialTier,
  featured,
  isLeadPartner,
}: {
  commercialTier: CommercialTierValue;
  featured: boolean;
  isLeadPartner: boolean;
}) {
  return (
    <div className="mt-6 rounded-lg border border-brand/10 bg-white p-4 shadow-sm">
      <p className="font-medium text-brand-dark">Plan &amp; visibility</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${COMMERCIAL_TIER_BADGE_CLASS[commercialTier]}`}>
          {COMMERCIAL_TIER_LABELS[commercialTier]}
        </span>
        <span
          className={
            featured
              ? "rounded-full bg-brand-orange/15 px-2.5 py-0.5 text-xs font-semibold text-brand-orange"
              : "rounded-full bg-brand/5 px-2.5 py-0.5 text-xs font-medium text-brand-dark/40"
          }
        >
          {featured ? "Featured" : "Not featured"}
        </span>
      </div>
      {commercialTier === "FREE" && (
        <p className="mt-3 text-xs leading-5 text-brand-dark/60">
          Interested in Premium placement{!isLeadPartner ? " or becoming a Lead Partner" : ""}?{" "}
          <Link href="/contact" className="font-medium text-brand-teal hover:underline">
            Contact us
          </Link>{" "}
          to learn more — nothing on your listing changes unless you ask us to.
        </p>
      )}
    </div>
  );
}

interface PageSearchParams {
  error?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  "missing-token": "That link is missing its access code. Please use the full link exactly as it was shared with you.",
  "invalid-token": "That link has already been used, has expired, or is no longer valid. Ask us to approve a fresh claim to get a new one.",
};

function DashboardCard({
  href,
  title,
  description,
  badge,
}: {
  href: string;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-lg border border-brand/10 bg-white p-4 shadow-sm transition hover:border-brand-teal/40 hover:shadow"
    >
      <div>
        <p className="font-medium text-brand-dark">{title}</p>
        <p className="mt-0.5 text-xs text-brand/60">{description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {badge && (
          <span className="rounded-full bg-brand-orange/15 px-2 py-0.5 text-xs font-semibold text-brand-orange">
            {badge}
          </span>
        )}
        <span aria-hidden="true" className="text-brand/40">
          &rarr;
        </span>
      </div>
    </Link>
  );
}

/**
 * Unauthenticated view — unchanged from the prior display fix: /owner/access
 * already redirects here with ?error=missing-token / ?error=invalid-token,
 * mapped to a specific message rather than a generic one.
 */
function AccessInstructions({ errorMessage }: { errorMessage?: string }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-center font-serif text-2xl font-semibold text-brand-dark">Vendor login</h1>
      {errorMessage ? (
        <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-center text-sm text-amber-800" role="alert">
          {errorMessage}
        </p>
      ) : (
        <p className="mt-3 text-center text-sm text-brand/70">
          Use the one-time access link sent to you after your listing claim was approved. If your link has
          expired, ask us to approve a fresh claim to get a new one.
        </p>
      )}

      <div className="mt-8 rounded-lg border border-brand/10 bg-white p-5 shadow-sm">
        <p className="font-medium text-brand-dark">How vendor access works</p>
        <ol className="mt-3 space-y-3 text-sm leading-6 text-brand-dark/75">
          <li>
            <span className="font-semibold text-brand-dark">1. Find your listing</span> — search for your business on{" "}
            <Link href="/search" className="text-brand-teal hover:underline">
              ResortInRanchi
            </Link>{" "}
            and open its page. Not listed yet?{" "}
            <Link href="/list-your-business" className="text-brand-teal hover:underline">
              Add your business
            </Link>
            .
          </li>
          <li>
            <span className="font-semibold text-brand-dark">2. Claim it</span> — use &quot;Claim this listing&quot; on the
            listing page and tell us how you are connected to the business.
          </li>
          <li>
            <span className="font-semibold text-brand-dark">3. We review your claim</span> — once approved, we send you a
            private access link. It works once, so keep the browser you open it in.
          </li>
          <li>
            <span className="font-semibold text-brand-dark">4. Keep your listing fresh</span> — from your dashboard you can
            update details, pricing, capacity, facilities and photos, and see your enquiries. You stay signed in for
            about 3 months.
          </li>
        </ol>
        <p className="mt-4 text-xs text-brand/60">
          Lost your link or signed out?{" "}
          <Link href="/contact" className="text-brand-teal hover:underline">
            Contact us
          </Link>{" "}
          and we will send a fresh one.
        </p>
      </div>
    </div>
  );
}

export default async function OwnerHomePage({ searchParams }: { searchParams: Promise<PageSearchParams> }) {
  const propertyId = await getOwnerAccessPropertyId();
  if (!propertyId) {
    const { error } = await searchParams;
    return <AccessInstructions errorMessage={error ? ERROR_MESSAGES[error] : undefined} />;
  }

  // Re-derived from the authenticated session's propertyId only — never from
  // a URL param or client input, so a signed-in owner can only ever see
  // their own property here.
  const [property, totalEnquiries, newEnquiries, convertedEnquiries, viewCount, leadPartner] = await Promise.all([
    prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        verificationStatus: true,
        claimed: true,
        featured: true,
        commercialTier: true,
        updatedAt: true,
        shortDescription: true,
        fullDescription: true,
        phone: true,
        email: true,
        website: true,
        priceMin: true,
        priceMax: true,
        priceLabel: true,
        rooms: true,
        eventCapacityMin: true,
        eventCapacityMax: true,
        category: { select: { slug: true } },
        _count: { select: { facilities: true, venueSpaces: true, images: { where: { kind: "PHOTO" } } } },
      },
    }),
    prisma.enquiry.count({ where: { propertyId } }),
    prisma.enquiry.count({ where: { propertyId, status: "NEW" } }),
    prisma.enquiry.count({ where: { propertyId, status: "CONVERTED" } }),
    prisma.analyticsEvent.count({ where: { type: "PROPERTY_VIEW", propertyId } }),
    // Only present when an admin has explicitly configured this property as a
    // Lead Partner — never assumed. Scoped to this session's own propertyId,
    // exactly like every other query on this page.
    prisma.leadPartner.findUnique({ where: { propertyId }, select: { id: true, enabled: true, _count: { select: { leads: true } } } }),
  ]);
  if (!property) return <AccessInstructions />;

  // Only queried when this property actually has a LeadPartner row — scoped
  // strictly to that partner's own id, never any other property's leads.
  const convertedReferredLeads = leadPartner
    ? await prisma.partnerLead.count({ where: { partnerId: leadPartner.id, status: "CONVERTED" } })
    : 0;

  const lifecycleStages = computeOwnerLifecycleStages(property.verificationStatus);

  // Completeness is derived only from what's actually stored — no field here
  // is inferred, guessed, or defaulted. photoCount deliberately counts only
  // PHOTO-kind images (an owner's own real photos), never an
  // admin-seeded ILLUSTRATIVE placeholder or the generated LOGO mark.
  const quality = calculateListingQuality({
    shortDescription: property.shortDescription,
    fullDescription: property.fullDescription,
    phone: property.phone,
    email: property.email,
    website: property.website,
    priceMin: property.priceMin,
    priceMax: property.priceMax,
    priceLabel: property.priceLabel,
    rooms: property.rooms,
    eventCapacityMin: property.eventCapacityMin,
    eventCapacityMax: property.eventCapacityMax,
    categorySlug: property.category.slug,
    photoCount: property._count.images,
    facilityCount: property._count.facilities,
    venueSpaceCount: property._count.venueSpaces,
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-xs font-medium uppercase tracking-wide text-brand-teal">Owner dashboard</p>
      <h1 className="mt-1 font-serif text-2xl font-semibold text-brand-dark sm:text-3xl">{property.name}</h1>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <TrustBadge verificationStatus={property.verificationStatus} />
        <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand-dark/60">
          {property.status === "PUBLISHED" ? "Live on the public site" : "Not currently live"}
        </span>
        {property.claimed && (
          <span className="rounded-full bg-brand-teal/15 px-2.5 py-0.5 text-xs font-medium text-brand-teal">
            Owner access active
          </span>
        )}
      </div>

      <p className="mt-4 text-sm leading-6 text-brand-dark/70">
        From here you can update your listing details, manage photos, and see enquiries from people who&apos;ve
        found your business on ResortInRanchi. Changes to trust/verification status stay a separate decision made
        by our team.
      </p>

      <UpdateReminder freshness={computeOwnerFreshness(property.updatedAt)} editHref={`/owner/listing/${property.id}`} />

      <LifecycleStepper stages={lifecycleStages} />

      <CommercialStatusSection
        commercialTier={property.commercialTier}
        featured={property.featured}
        isLeadPartner={Boolean(leadPartner)}
      />

      <LeadsSummary viewCount={viewCount} totalEnquiries={totalEnquiries} convertedCount={convertedEnquiries} />

      {leadPartner && (
        <ReferredLeadsSummary totalLeads={leadPartner._count.leads} convertedLeads={convertedReferredLeads} />
      )}

      <ListingQualitySection propertyId={property.id} quality={quality} />

      <div className="mt-6 space-y-3">
        <DashboardCard
          href={`/owner/listing/${property.id}`}
          title="Edit listing"
          description="Update your description, contact details, pricing, and capacity."
        />
        <DashboardCard
          href={`/owner/listing/${property.id}#photos`}
          title="Manage photos"
          description="Add or remove photos and your logo."
        />
        <DashboardCard
          href="/owner/enquiries"
          title="View enquiries"
          description={totalEnquiries > 0 ? `${totalEnquiries} received so far.` : "No enquiries yet."}
          badge={newEnquiries > 0 ? `${newEnquiries} new` : undefined}
        />
        {leadPartner && (
          <DashboardCard
            href="/owner/referred"
            title="Referred opportunities"
            description={
              leadPartner.enabled
                ? "Enquiries shared with you as a partner venue for relevant categories."
                : "Partner sharing is currently paused by our team."
            }
            badge={leadPartner._count.leads > 0 ? `${leadPartner._count.leads}` : undefined}
          />
        )}
        <DashboardCard
          href={`/property/${property.slug}`}
          title="View public listing"
          description="See your listing exactly as visitors see it."
        />
      </div>

      <form action={logoutOwner} className="mt-8 text-center">
        <button type="submit" className="text-sm text-brand/60 hover:text-brand-dark hover:underline">
          Sign out
        </button>
      </form>
    </div>
  );
}
