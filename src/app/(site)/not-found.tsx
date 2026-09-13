import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/public/seo";

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: "Page not found",
    description: "This page doesn't exist on ResortInRanchi.",
    path: "/404",
    noindex: true,
  });
}

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <p className="text-xs font-semibold tracking-[0.15em] text-brand-teal uppercase">404</p>
      <h1 className="mt-3 font-serif text-3xl font-semibold text-brand-dark">We couldn&apos;t find that page</h1>
      <p className="mt-3 text-sm text-brand-dark/70">
        The listing or page you&apos;re looking for may have moved, been renamed, or never existed. Here are a few
        places to pick back up:
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-block rounded-md bg-brand-orange px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-95"
        >
          Back to homepage
        </Link>
        <Link
          href="/search"
          className="inline-block rounded-md border border-brand/20 px-5 py-2.5 text-sm font-semibold text-brand-dark hover:bg-brand-cream"
        >
          Search listings
        </Link>
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
        <Link href="/resorts" className="text-brand-teal hover:underline">
          Resorts
        </Link>
        <Link href="/hotels" className="text-brand-teal hover:underline">
          Hotels
        </Link>
        <Link href="/restaurants" className="text-brand-teal hover:underline">
          Restaurants
        </Link>
        <Link href="/wedding-venues" className="text-brand-teal hover:underline">
          Wedding Venues
        </Link>
        <Link href="/contact" className="text-brand-teal hover:underline">
          Contact us
        </Link>
      </div>
    </div>
  );
}
