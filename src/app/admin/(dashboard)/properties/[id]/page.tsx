import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PropertyEditForm from "./PropertyEditForm";
import PublishPanel from "./PublishPanel";
import PropertyFacilitiesPanel from "./PropertyFacilitiesPanel";
import PropertyImagesPanel from "./PropertyImagesPanel";
import PropertyVenueSpacesPanel from "./PropertyVenueSpacesPanel";
import CommercialTierSelect from "./CommercialTierSelect";
import PaidPlanPanel from "./PaidPlanPanel";
import { StatusBadge, VerificationBadge, CommercialTierBadge } from "@/components/admin/LifecycleBadges";
import ConfirmForm from "@/components/admin/ConfirmForm";
import { markNeedsReview, markVerified, unpublishProperty, closeListing } from "../lifecycleActions";
import { IDENTITY_CONFLICT_PROPERTY_IDS } from "@/lib/validation/propertyLifecycle";

export const dynamic = "force-dynamic";

function ProvenanceRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-1.5 last:border-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right text-slate-900">{value ?? <span className="text-slate-400">—</span>}</dd>
    </div>
  );
}

const LIFECYCLE_MESSAGES: Record<string, string> = {
  "needs-review": "Marked for review.",
  verified: "Marked as verified.",
  published: "Property published.",
  unpublished: "Property unpublished — it no longer appears on the public site.",
  closed: "Listing marked as closed.",
};

export default async function AdminPropertyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; created?: string; lifecycle?: string }>;
}) {
  const { id } = await params;
  const { saved, created, lifecycle } = await searchParams;

  const [property, categories, locations, allFacilities] = await Promise.all([
    prisma.property.findUnique({
      where: { id },
      include: {
        category: true,
        locality: true,
        venueSpaces: { orderBy: { name: "asc" } },
        facilities: { include: { facility: true } },
        images: { orderBy: [{ isHero: "desc" }, { sortOrder: "asc" }] },
        leadPartner: { select: { id: true, enabled: true } },
        extraCategories: { select: { categoryId: true } },
        sponsoredPlacement: true,
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.location.findMany({ orderBy: { name: "asc" } }),
    prisma.facility.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!property) {
    notFound();
  }

  const markNeedsReviewAction = markNeedsReview.bind(null, property.id);
  const markVerifiedAction = markVerified.bind(null, property.id);
  const unpublishAction = unpublishProperty.bind(null, property.id);
  const closeListingAction = closeListing.bind(null, property.id);

  const lifecycleMessage = lifecycle ? LIFECYCLE_MESSAGES[lifecycle] : null;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/properties" className="text-sm text-slate-500 hover:underline">
          ← Back to properties
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">{property.name}</h1>
        <p className="text-sm text-slate-500">Source record ID: {property.sourceRecordId ?? "—"}</p>
      </div>

      {saved === "1" && <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">Changes saved.</p>}
      {created === "1" && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          Listing created as a Draft — publish and verify it below when you&apos;re ready.
        </p>
      )}
      {lifecycleMessage && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{lifecycleMessage}</p>
      )}
      {IDENTITY_CONFLICT_PROPERTY_IDS.has(property.id) && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          This record is flagged as a duplicate/identity conflict with another property (see the data-quality
          research). It cannot be published until an admin resolves the relationship.
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-900">Lifecycle</h2>
              <div className="flex items-center gap-2">
                <StatusBadge status={property.status} />
                <VerificationBadge verificationStatus={property.verificationStatus} />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <form action={markNeedsReviewAction}>
                <button
                  type="submit"
                  className="rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100"
                >
                  Mark for Review
                </button>
              </form>
              <form action={markVerifiedAction}>
                <button
                  type="submit"
                  className="rounded-md border border-green-300 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-800 hover:bg-green-100"
                >
                  Mark Verified
                </button>
              </form>

              {property.status === "PUBLISHED" ? (
                <form action={unpublishAction}>
                  <button
                    type="submit"
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Unpublish
                  </button>
                </form>
              ) : property.status !== "CLOSED" ? (
                <PublishPanel
                  propertyId={property.id}
                  property={{
                    name: property.name,
                    categoryName: property.category.name,
                    localityName: property.locality?.name ?? null,
                    address: property.address,
                    phone: property.phone,
                    website: property.website,
                    shortDescription: property.shortDescription,
                    fullDescription: property.fullDescription,
                    facilityNames: property.facilities.map((pf) => pf.facility.name),
                    venueSpaceNames: property.venueSpaces.map((vs) => vs.name),
                    verificationStatus: property.verificationStatus,
                    blockedByIdentityConflict: IDENTITY_CONFLICT_PROPERTY_IDS.has(property.id),
                  }}
                />
              ) : null}

              {property.status !== "CLOSED" && (
                <ConfirmForm
                  action={closeListingAction}
                  confirmMessage={`Mark "${property.name}" as closed? This sets both its status and verification status to CLOSED and removes it from the public site if published.`}
                  label="Close Listing"
                  className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
                />
              )}
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Publishing requires Verified/Owner Verified status plus at least one of address, phone or website.
              lastVerifiedAt is only updated by &quot;Mark Verified&quot;.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-900">Commercial status</h2>
              <CommercialTierBadge commercialTier={property.commercialTier} />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              A plain label for this vendor&apos;s commercial relationship — foundation for a future paid-plan
              system, no billing yet. Never changes automatically; independent of Featured (edited below) and of
              whether this property has an actual Lead Partner configuration.
            </p>
            <div className="mt-3">
              <CommercialTierSelect propertyId={property.id} commercialTier={property.commercialTier} />
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Featured: {property.featured ? "Yes" : "No"} (edit below) &middot; Lead Partner configuration:{" "}
              {property.leadPartner ? (
                <Link href="/admin/partners" className="text-slate-600 hover:underline">
                  configured ({property.leadPartner.enabled ? "enabled" : "disabled"})
                </Link>
              ) : (
                <Link href="/admin/partners" className="text-slate-600 hover:underline">
                  not configured
                </Link>
              )}
            </p>
          </div>

          <PaidPlanPanel
            propertyId={property.id}
            tier={property.commercialTier}
            primaryCategoryId={property.categoryId}
            categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
            extraCategoryIds={property.extraCategories.map((e) => e.categoryId)}
            placement={property.sponsoredPlacement}
          />

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <PropertyEditForm property={property} categories={categories} locations={locations} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Source / provenance</h2>
            <p className="mt-1 text-xs text-slate-400">
              Preserved from the research spreadsheet import. Read-only — never shown on public routes.
            </p>
            <dl className="mt-3 text-sm">
              <ProvenanceRow label="Source record ID" value={property.sourceRecordId} />
              <ProvenanceRow label="Source" value={property.source} />
              <ProvenanceRow label="Source URL" value={property.sourceUrl} />
              <ProvenanceRow
                label="Source last checked"
                value={property.sourceLastCheckedAt ? new Date(property.sourceLastCheckedAt).toLocaleDateString() : null}
              />
              <ProvenanceRow label="Raw category" value={property.rawCategory} />
              <ProvenanceRow label="Raw locality" value={property.rawLocality} />
              <ProvenanceRow
                label="Merged from source IDs"
                value={property.mergedFromSourceRecordIds.length > 0 ? property.mergedFromSourceRecordIds.join(", ") : null}
              />
              <ProvenanceRow
                label="Last verified"
                value={property.lastVerifiedAt ? new Date(property.lastVerifiedAt).toLocaleString() : null}
              />
              <ProvenanceRow label="Created" value={new Date(property.createdAt).toLocaleString()} />
              <ProvenanceRow label="Updated" value={new Date(property.updatedAt).toLocaleString()} />
            </dl>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <PropertyFacilitiesPanel
          propertyId={property.id}
          allFacilities={allFacilities}
          selectedFacilityIds={property.facilities.map((pf) => pf.facilityId)}
        />
        <PropertyImagesPanel propertyId={property.id} images={property.images} />
        <PropertyVenueSpacesPanel propertyId={property.id} venueSpaces={property.venueSpaces} />
      </div>
    </div>
  );
}
