import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/public/seo";
import { SITE_DESCRIPTION, SITE_NAME, SITE_POSITIONING } from "@/lib/public/site";
import Breadcrumbs from "@/components/site/Breadcrumbs";

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: "About",
    description: `About ${SITE_NAME} — ${SITE_DESCRIPTION}`,
    path: "/about",
  });
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Breadcrumbs items={[{ name: "About", path: "/about" }]} />
      <h1 className="mt-3 font-serif text-3xl font-semibold text-brand-dark">About {SITE_NAME}</h1>
      <p className="mt-2 text-sm text-brand/70">{SITE_POSITIONING}</p>

      <div className="mt-6 space-y-5 text-sm leading-6 text-brand-dark/80">
        <p>
          {SITE_NAME} is an independent directory covering resorts, hotels, restaurants, cafés, banquet halls,
          wedding venues, and other places to stay, eat, and celebrate across Ranchi and the surrounding area.
          It&apos;s a discovery and comparison tool, not a booking engine — we don&apos;t take reservations or
          payments on any listing&apos;s behalf.
        </p>

        <div>
          <h2 className="font-serif text-lg font-semibold text-brand-dark">How listings work</h2>
          <p className="mt-2">
            Listings start from public research and carry one of three honest trust labels, shown on every
            listing:
          </p>
          <ul className="mt-3 space-y-2">
            <li>
              <span className="font-medium text-brand-dark">Discovery Listing</span> — compiled from available
              public sources and not yet independently confirmed. A listing only shows the details that have
              actually been found; if something isn&apos;t listed, it isn&apos;t known yet.
            </li>
            <li>
              <span className="font-medium text-brand-dark">Verified Listing</span> — checked by our team against
              a real source.
            </li>
            <li>
              <span className="font-medium text-brand-dark">Owner Verified</span> — the business owner has claimed
              the listing and confirmed its details themselves.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-serif text-lg font-semibold text-brand-dark">For business owners</h2>
          <p className="mt-2">
            If your business is already listed, you can claim it to add photos, correct details, and keep your
            information current. Search for your business, open its listing page, and use the claim option
            there.
          </p>
          <Link href="/search" className="mt-3 inline-block text-sm font-medium text-brand-teal hover:underline">
            Find your listing &rarr;
          </Link>
          <p className="mt-4">
            Not listed at all yet? Tell us about your business and our team will review it before it goes live —
            nothing is published automatically.
          </p>
          <Link href="/list-your-business" className="mt-3 inline-block text-sm font-medium text-brand-teal hover:underline">
            Add Your Property &rarr;
          </Link>
        </div>

        <p>
          We never invent ratings, prices, capacity, amenities, or availability — a detail is either confirmed
          and shown, or left out.
        </p>
      </div>
    </div>
  );
}
