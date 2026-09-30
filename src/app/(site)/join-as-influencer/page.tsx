import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/public/seo";
import Breadcrumbs from "@/components/site/Breadcrumbs";
import JoinAsInfluencerForm from "./JoinAsInfluencerForm";

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: "Join as a Creator",
    description: "Add your influencer/creator profile to ResortInRanchi if you aren't listed yet.",
    path: "/join-as-influencer",
  });
}

export default async function JoinAsInfluencerPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { submitted } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Breadcrumbs items={[{ name: "Join as a Creator", path: "/join-as-influencer" }]} />
      <h1 className="mt-3 font-serif text-3xl font-semibold text-brand-dark">Join as a Creator</h1>
      <p className="mt-2 text-sm text-brand/70">
        Not listed on ResortInRanchi yet? Tell us about yourself below and our team will review it before your
        profile goes live.
      </p>

      {submitted === "1" ? (
        <div className="mt-8 rounded-lg border border-brand/10 bg-brand-cream/60 p-6 text-center">
          <h2 className="font-serif text-xl font-semibold text-brand-dark">Thanks — we&apos;ve got it!</h2>
          <p className="mt-2 text-sm text-brand-dark/70">
            Our team will review your submission and reach out if we need anything else. Once approved, your
            profile goes live and you&apos;ll get access to manage it.
          </p>
          <Link href="/influencers" className="mt-4 inline-block text-sm font-medium text-brand-teal hover:underline">
            &larr; Back to Creators &amp; Influencers
          </Link>
        </div>
      ) : (
        <div className="mt-8 rounded-lg border border-brand/10 bg-white p-5">
          <JoinAsInfluencerForm />
        </div>
      )}

      <p className="mt-6 text-xs text-brand/50">
        Already have a profile and want to manage it instead?{" "}
        <Link href="/influencers" className="font-medium text-brand-teal hover:underline">
          Find your profile
        </Link>{" "}
        and use &quot;Claim this profile&quot;.
      </p>
    </div>
  );
}
