import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buildPageMetadata } from "@/lib/public/seo";
import ClaimCreatorForm from "./ClaimCreatorForm";

interface PageParams {
  slug: string;
}

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { slug } = await params;
  return buildPageMetadata({ title: "Claim this profile", description: "Claim your creator profile on ResortInRanchi.", path: `/influencers/${slug}/claim`, noindex: true });
}

export default async function ClaimCreatorPage({ params }: { params: Promise<PageParams> }) {
  const { slug } = await params;
  const influencer = await prisma.influencer.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { id: true, name: true, slug: true, claimed: true },
  });
  if (!influencer) notFound();

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <Link href={`/influencers/${slug}`} className="text-sm text-brand-teal hover:underline">
        &larr; Back to {influencer.name}
      </Link>
      <h1 className="mt-3 font-serif text-2xl font-semibold text-brand-dark">Is this your creator profile?</h1>
      <p className="mt-1 text-sm text-brand/70">
        Claiming <span className="font-medium text-brand-dark">{influencer.name}</span> lets you add your own
        photo, a feature video, your bio, social links and contact details, and reply to people who reach out —
        once your claim is approved.
      </p>

      {influencer.claimed ? (
        <p className="mt-6 rounded-md bg-brand-cream/60 px-3 py-2 text-sm text-brand-dark/70">
          This profile has already been claimed. If you believe this is a mistake,{" "}
          <Link href="/contact" className="font-medium text-brand-teal hover:underline">
            contact us
          </Link>{" "}
          for help.
        </p>
      ) : (
        <div className="mt-6 rounded-lg border border-brand/10 bg-white p-5">
          <ClaimCreatorForm influencerSlug={influencer.slug} />
        </div>
      )}
    </div>
  );
}
