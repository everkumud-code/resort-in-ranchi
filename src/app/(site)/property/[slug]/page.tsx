import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  buildFallbackDescription,
  getPublishedPropertyBySlug,
  getRelatedProperties,
  isThinPublicListing,
} from "@/lib/public/properties";
import { getPublicTrustTier } from "@/lib/validation/propertyLifecycle";
import { getEnquiryCtaCopy, propertyEligibleForEnquiry } from "@/lib/validation/enquiry";
import { CLAIM_VALUE_PROP_COPY, propertyEligibleForClaimCta } from "@/lib/validation/claim";
import { buildTelHref, buildWhatsAppHref } from "@/lib/public/contactLinks";
import { buildPageMetadata } from "@/lib/public/seo";
import { localBusinessJsonLd } from "@/lib/public/structuredData";
import Breadcrumbs from "@/components/site/Breadcrumbs";
import PropertyCard from "@/components/site/PropertyCard";
import TrustBadge from "@/components/site/TrustBadge";
import PropertyHeroFallback from "@/components/site/PropertyHeroFallback";
import { getImageTagLabel } from "@/lib/validation/propertyImage";
import JsonLd from "@/components/site/JsonLd";
import AnalyticsBeacon from "@/components/site/AnalyticsBeacon";

interface PageParams {
  slug: string;
}

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPublishedPropertyBySlug(slug);
  if (!property) {
    return buildPageMetadata({ title: "Not found", description: "Listing not found.", path: `/property/${slug}`, noindex: true });
  }

  const descriptionParts = [
    property.shortDescription,
    `${property.name} — ${property.category.name}${property.locality ? ` in ${property.locality.name}` : ""}, Ranchi.`,
  ].filter(Boolean);
  // A real first-party photo makes a far better social-share card than the
  // generic site logo — an ILLUSTRATIVE (generated, non-property-specific)
  // image is never used here, for the same reason it's never mixed in with
  // genuine photos on the page itself.
  const ogPhoto = property.images.find((image) => image.kind === "PHOTO");

  return buildPageMetadata({
    title: `${property.name} — ${property.category.name}${property.locality ? ` in ${property.locality.name}` : ""}`,
    description: descriptionParts[0] ?? descriptionParts[1] ?? `${property.name} on ResortInRanchi.`,
    path: `/property/${slug}`,
    ...(ogPhoto ? { ogImage: ogPhoto.url } : {}),
    // Scaled discovery directory: a Discovery listing with no real contact
    // info and no admin-written description is too thin to index — it stays
    // publicly viewable (an honest, minimal page) but isn't offered to
    // search engines as unique content. Verified/Owner Verified listings
    // are never this thin in practice (canPublish requires contact info).
    noindex: isThinPublicListing(property),
  });
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 border-b border-brand/10 py-2 last:border-0">
      <dt className="text-brand/60">{label}</dt>
      <dd className="text-right text-brand-dark">{value}</dd>
    </div>
  );
}

export default async function PropertyPage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams: Promise<{ claimed?: string; enquiry?: string }>;
}) {
  const { slug } = await params;
  const { claimed: justClaimed, enquiry: enquirySent } = await searchParams;
  const property = await getPublishedPropertyBySlug(slug);
  if (!property) notFound();

  const related = await getRelatedProperties(property, 3);
  const jsonLd = localBusinessJsonLd(property, `/property/${slug}`);
  const fullAddress = [property.address, property.locality?.name, property.city, property.pincode]
    .filter(Boolean)
    .join(", ");
  const trustTier = getPublicTrustTier(property.verificationStatus);
  const isDiscoveryTier = trustTier === "discovery";
  // getPublishedPropertyBySlug's own where clause already guarantees
  // status === PUBLISHED for any property that reaches this line (its
  // public select doesn't even carry `status`, by design — see the
  // data-safety boundary comment in properties.ts) — so that fact is passed
  // through explicitly here rather than re-querying it, keeping
  // propertyEligibleForEnquiry as the single, independently-tested source
  // of truth for the eligibility rule instead of duplicating it inline.
  const enquiryEligible = propertyEligibleForEnquiry({ status: "PUBLISHED" });
  const enquiryCtaCopy = getEnquiryCtaCopy(property.category.slug);
  // Same reasoning as enquiryEligible above — status is passed explicitly
  // since this page's public select never carries it.
  const claimEligible = propertyEligibleForClaimCta({
    status: "PUBLISHED",
    verificationStatus: property.verificationStatus,
    claimed: property.claimed,
  });
  const description =
    property.shortDescription ||
    property.fullDescription ||
    buildFallbackDescription(property.name, property.category.name, property.locality?.name ?? null);

  // Real, first-party photographs only — an ILLUSTRATIVE (generated,
  // non-property-specific) image must never appear mixed in with genuine
  // photos, since a reader would reasonably assume every gallery image is a
  // real photo of this specific property.
  const photoImages = property.images.filter((image) => image.kind === "PHOTO");
  const illustrativeImage = property.images.find((image) => image.kind === "ILLUSTRATIVE");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {jsonLd && <JsonLd data={jsonLd} />}
      <AnalyticsBeacon type="PROPERTY_VIEW" propertyId={property.id} path={`/property/${slug}`} />
      {justClaimed && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3" role="status">
          <p className="text-sm font-medium text-green-900">Your claim is under review.</p>
          <p className="mt-0.5 text-xs text-green-800">
            We&apos;ll review your details and get in touch once a decision is made.
          </p>
        </div>
      )}
      {enquirySent && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3" role="status">
          <p className="text-sm font-medium text-green-900">Thanks — your enquiry has been sent.</p>
          <p className="mt-0.5 text-xs text-green-800">{property.name} has received your details and will get back to you directly.</p>
        </div>
      )}
      <Breadcrumbs
        items={[
          { name: property.category.name, path: `/${property.category.slug}` },
          { name: property.name, path: `/property/${slug}` },
        ]}
      />

      <div className="mt-3 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {property.generatedIdentityMarkUrl && (
            /* eslint-disable-next-line @next/next/no-img-element -- generated identity mark, not an official logo, not a Next-optimized local asset */
            <img
              src={property.generatedIdentityMarkUrl}
              alt=""
              aria-hidden="true"
              className="mt-1 h-12 w-12 shrink-0 rounded-full border border-brand/10 object-cover"
            />
          )}
          <div>
            <h1 className="font-serif text-3xl font-semibold text-brand-dark">{property.name}</h1>
            <p className="mt-1 text-sm text-brand/70">
              <Link href={`/${property.category.slug}`} className="hover:underline">
                {property.category.name}
              </Link>
              {property.locality && (
                <>
                  {" · "}
                  <Link href={`/locations/${property.locality.slug}`} className="hover:underline">
                    {property.locality.name}
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>
        {property.featured && (
          <span className="shrink-0 rounded-full bg-brand-gold/20 px-3 py-1 text-xs font-medium text-brand-gold">
            Featured
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <TrustBadge verificationStatus={property.verificationStatus} />
        {isDiscoveryTier && (
          <span className="text-xs text-brand/60">Discovery listing · Information may require confirmation.</span>
        )}
      </div>

      {property.googleRating && (
        <p className="mt-2 text-sm text-brand-gold">
          ★ {property.googleRating.toFixed(1)}
          {property.reviewCount ? ` (${property.reviewCount} reviews)` : ""}
        </p>
      )}

      {(enquiryEligible || property.phone) && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          {enquiryEligible && (
            <Link
              href={`/property/${slug}/enquire`}
              className="block w-full rounded-md bg-brand-orange px-5 py-3 text-center text-base font-semibold text-white shadow-sm hover:brightness-95 sm:inline-block sm:w-auto"
            >
              {enquiryCtaCopy}
            </Link>
          )}
          {property.phone && (
            <a
              href={buildTelHref(property.phone)}
              className="block w-full rounded-md border border-brand-teal px-5 py-3 text-center text-base font-semibold text-brand-teal hover:bg-brand-teal/5 sm:inline-block sm:w-auto"
            >
              Call {property.phone}
            </a>
          )}
        </div>
      )}

      {photoImages.length > 0 ? (
        <div className="mt-6">
          {/* eslint-disable-next-line @next/next/no-img-element -- first-party external URL, not a Next-optimized local asset */}
          <img
            src={photoImages[0].url}
            alt={photoImages[0].altText ?? property.name}
            className="aspect-video w-full rounded-lg object-cover"
          />
          {(photoImages[0].caption || getImageTagLabel(photoImages[0].tag)) && (
            <p className="mt-1 text-xs text-brand/60">
              {getImageTagLabel(photoImages[0].tag) && (
                <span className="mr-2 rounded-full bg-brand/10 px-2 py-0.5 font-medium text-brand-dark/70">
                  {getImageTagLabel(photoImages[0].tag)}
                </span>
              )}
              {photoImages[0].caption}
            </p>
          )}

          {photoImages.length > 1 && (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {photoImages.slice(1).map((image) => (
                <div key={image.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- first-party external URL, not a Next-optimized local asset */}
                  <img
                    src={image.url}
                    alt={image.altText ?? property.name}
                    className="aspect-square w-full rounded-md object-cover"
                  />
                  {(image.caption || getImageTagLabel(image.tag)) && (
                    <p className="mt-1 text-xs text-brand/60">
                      {getImageTagLabel(image.tag) && (
                        <span className="mr-1 rounded-full bg-brand/10 px-2 py-0.5 font-medium text-brand-dark/70">
                          {getImageTagLabel(image.tag)}
                        </span>
                      )}
                      {image.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        !illustrativeImage ? (
          <PropertyHeroFallback name={property.name} categorySlug={property.category.slug} />
        ) : (
          <div className="mt-6">
            {/* eslint-disable-next-line @next/next/no-img-element -- generated placeholder, not a Next-optimized local asset */}
            <img
              src={illustrativeImage.url}
              alt={illustrativeImage.altText ?? `Illustrative image for ${property.category.name.toLowerCase()} listings`}
              className="aspect-video w-full rounded-lg object-cover"
            />
            <p className="mt-1 text-xs text-brand/60">
              Illustrative image — not an actual photo of this property.
            </p>
          </div>
        )
      )}

      <div className="mt-6 space-y-3 text-sm leading-6 text-brand-dark/80">
        {property.shortDescription ? (
          <p className="font-medium">{property.shortDescription}</p>
        ) : (
          <p className="font-medium">{description}</p>
        )}
        {property.fullDescription && <p>{property.fullDescription}</p>}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
        {/* Contact/enquiry surfaces first on mobile (order-1) so it's easy to find without scrolling past facilities; desktop keeps the original two-column layout (sm:order-2, right sidebar). */}
        <div className="order-1 sm:order-2">
          <div className="rounded-lg border border-brand/10 bg-white p-4">
            <h2 className="text-sm font-semibold tracking-wide text-brand-dark uppercase">Details</h2>
            {enquiryEligible && (
              <Link
                href={`/property/${slug}/enquire`}
                className="mt-3 block w-full rounded-md bg-brand-orange px-4 py-2 text-center text-sm font-semibold text-white shadow-sm hover:brightness-95"
              >
                {enquiryCtaCopy}
              </Link>
            )}
            <dl className="mt-4 text-sm">
              <InfoRow label="Address" value={fullAddress || null} />
              <InfoRow
                label="Phone"
                value={
                  property.phone ? (
                    <a href={buildTelHref(property.phone)} className="text-brand-teal hover:underline">
                      {property.phone}
                    </a>
                  ) : null
                }
              />
              <InfoRow
                label="WhatsApp"
                value={
                  property.whatsapp ? (
                    <a
                      href={buildWhatsAppHref(property.whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="text-brand-teal hover:underline"
                    >
                      {property.whatsapp}
                    </a>
                  ) : null
                }
              />
              <InfoRow
                label="Website"
                value={
                  property.website ? (
                    <a href={property.website} target="_blank" rel="noopener noreferrer nofollow" className="text-brand-teal hover:underline">
                      Visit site
                    </a>
                  ) : null
                }
              />
              <InfoRow
                label="Directions"
                value={
                  property.googleMapsUrl ? (
                    <a href={property.googleMapsUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-brand-teal hover:underline">
                      Google Maps
                    </a>
                  ) : null
                }
              />
              <InfoRow label="Price" value={property.priceLabel} />
              <InfoRow label="Rooms" value={property.rooms} />
              <InfoRow
                label="Event capacity"
                value={
                  property.eventCapacityMin || property.eventCapacityMax
                    ? `${property.eventCapacityMin ?? "?"}–${property.eventCapacityMax ?? "?"}`
                    : null
                }
              />
            </dl>
            {!property.phone && !property.website && !property.address && !isDiscoveryTier && (
              <p className="mt-3 text-xs text-brand/50">
                Contact details for this listing haven&apos;t been verified yet.
              </p>
            )}
          </div>

          {claimEligible && (
            <div className="mt-4 rounded-lg border border-brand-teal/20 bg-brand-teal/5 p-4">
              <p className="text-sm font-medium text-brand-dark">Is this your business?</p>
              <p className="mt-1 text-xs text-brand/60">{CLAIM_VALUE_PROP_COPY}</p>
              <Link
                href={`/property/${slug}/claim`}
                className="mt-3 inline-block rounded-md bg-brand-teal px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-teal/90"
              >
                Claim this listing
              </Link>
            </div>
          )}
        </div>

        <div className="order-2 sm:order-1 sm:col-span-2">
          {property.facilities.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold tracking-wide text-brand-dark uppercase">Facilities</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {property.facilities.map((pf) => (
                  <span
                    key={pf.facility.slug}
                    className="rounded-full border border-brand-olive/30 bg-brand-olive/10 px-3 py-1 text-xs text-brand-olive"
                  >
                    {pf.facility.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {property.venueSpaces.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold tracking-wide text-brand-dark uppercase">Venue spaces</h2>
              <ul className="mt-3 space-y-3">
                {property.venueSpaces.map((vs) => (
                  <li key={vs.id} className="rounded-lg border border-brand/10 bg-white p-3">
                    <p className="font-medium text-brand-dark">{vs.name}</p>
                    {(vs.capacityMin || vs.capacityMax) && (
                      <p className="mt-0.5 text-xs text-brand/60">
                        Capacity: {vs.capacityMin ?? "?"}–{vs.capacityMax ?? "?"}
                      </p>
                    )}
                    {vs.description && <p className="mt-1 text-sm text-brand-dark/70">{vs.description}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {isDiscoveryTier && (
        <div className="mt-8 rounded-lg border border-brand/10 bg-brand-cream/40 p-4 text-xs text-brand-dark/60">
          <p className="font-semibold tracking-wide text-brand-dark/70 uppercase">About this listing</p>
          <p className="mt-1">
            Information compiled from available discovery sources. This listing has not yet been independently
            verified.
          </p>
        </div>
      )}

      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="font-serif text-lg font-semibold text-brand-dark">More {property.category.name.toLowerCase()}</h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {related.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </div>
      )}

      {enquiryEligible && (
        <div className="mt-12 rounded-lg border border-brand/10 bg-brand-cream/40 p-6 text-center">
          <p className="font-serif text-lg font-semibold text-brand-dark">Interested in {property.name}?</p>
          <p className="mt-1 text-sm text-brand-dark/70">Send an enquiry and {property.name} will get back to you directly.</p>
          <Link
            href={`/property/${slug}/enquire`}
            className="mt-4 inline-block rounded-md bg-brand-orange px-6 py-3 text-sm font-semibold text-white shadow-sm hover:brightness-95"
          >
            {enquiryCtaCopy}
          </Link>
        </div>
      )}
    </div>
  );
}
