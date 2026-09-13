import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buildPageMetadata } from "@/lib/public/seo";
import { CLAIM_VALUE_PROP_COPY } from "@/lib/validation/claim";
import ClaimListingForm from "./ClaimListingForm";
import AnalyticsBeacon from "@/components/site/AnalyticsBeacon";

interface PageParams {
  slug: string;
}

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { slug } = await params;
  return buildPageMetadata({
    title: "Claim this listing",
    description: "Claim your business listing on ResortInRanchi.",
    path: `/property/${slug}/claim`,
    noindex: true,
  });
}

export default async function ClaimListingPage({ params }: { params: Promise<PageParams> }) {
  const { slug } = await params;
  const property = await prisma.property.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { id: true, name: true, slug: true, claimed: true },
  });
  if (!property) notFound();

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <Link href={`/property/${slug}`} className="text-sm text-brand-teal hover:underline">
        &larr; Back to {property.name}
      </Link>
      <h1 className="mt-3 font-serif text-2xl font-semibold text-brand-dark">
        Are you the owner or authorized representative?
      </h1>
      <p className="mt-1 text-sm text-brand/70">
        {CLAIM_VALUE_PROP_COPY} Claiming{" "}
        <span className="font-medium text-brand-dark">{property.name}</span> lets you add contact details,
        photos, and a description once your claim is approved.
      </p>

      {property.claimed ? (
        <p className="mt-6 rounded-md bg-brand-cream/60 px-3 py-2 text-sm text-brand-dark/70">
          This listing has already been claimed. If you believe this is a mistake,{" "}
          <Link href="/contact" className="font-medium text-brand-teal hover:underline">
            contact us
          </Link>{" "}
          for help.
        </p>
      ) : (
        <div className="mt-6 rounded-lg border border-brand/10 bg-white p-5">
          <AnalyticsBeacon type="CLAIM_START" propertyId={property.id} path={`/property/${slug}/claim`} />
          <ClaimListingForm propertySlug={property.slug} />
        </div>
      )}
    </div>
  );
}
