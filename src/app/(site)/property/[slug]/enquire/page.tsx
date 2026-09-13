import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buildPageMetadata } from "@/lib/public/seo";
import { getEnquiryCtaCopy, propertyEligibleForEnquiry } from "@/lib/validation/enquiry";
import { getEligiblePartnersForProperty } from "@/lib/leadPartner";
import EnquiryForm from "./EnquiryForm";
import AnalyticsBeacon from "@/components/site/AnalyticsBeacon";

interface PageParams {
  slug: string;
}

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { slug } = await params;
  // A lead-capture form, not unique content — never indexed, same treatment as /claim.
  return buildPageMetadata({
    title: "Send an enquiry",
    description: "Send an enquiry to a listed business on ResortInRanchi.",
    path: `/property/${slug}/enquire`,
    noindex: true,
  });
}

export default async function EnquirePage({ params }: { params: Promise<PageParams> }) {
  const { slug } = await params;
  const property = await prisma.property.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { id: true, name: true, slug: true, status: true, category: { select: { slug: true } }, locality: { select: { slug: true } } },
  });
  if (!property || !propertyEligibleForEnquiry(property)) notFound();

  const ctaCopy = getEnquiryCtaCopy(property.category.slug);
  // The same live eligibility check submitEnquiry uses to decide whether to
  // actually create a PartnerLead — this disclosure can never say "may be
  // shared" when nothing would actually be shared, or stay silent when it
  // would be. `guests` is intentionally omitted (unknown until the visitor
  // submits the form), which only ever widens this check relative to the
  // action's real one — see getEligiblePartnersForProperty's own doc comment.
  const eligiblePartners = await getEligiblePartnersForProperty({
    propertyId: property.id,
    categorySlug: property.category.slug,
    localitySlug: property.locality?.slug ?? null,
  });
  const mayBeSharedWithPartner = eligiblePartners.length > 0;

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <AnalyticsBeacon type="ENQUIRY_START" propertyId={property.id} path={`/property/${slug}/enquire`} />
      <Link href={`/property/${slug}`} className="text-sm text-brand-teal hover:underline">
        &larr; Back to {property.name}
      </Link>

      <h1 className="mt-3 font-serif text-2xl font-semibold text-brand-dark">{ctaCopy}</h1>
      <p className="mt-1 text-sm text-brand/70">
        Share a few details and <span className="font-medium text-brand-dark">{property.name}</span> will contact
        you directly.{" "}
        {mayBeSharedWithPartner
          ? "For this category, your enquiry may also be shared with a relevant partner venue so they can follow up if they can help too."
          : "We only pass along what you enter below, for this one enquiry."}
      </p>

      <div className="mt-6 rounded-lg border border-brand/10 bg-white p-5">
        <EnquiryForm
          propertySlug={property.slug}
          propertyName={property.name}
          ctaCopy={ctaCopy}
          mayBeSharedWithPartner={mayBeSharedWithPartner}
        />
      </div>
    </div>
  );
}
