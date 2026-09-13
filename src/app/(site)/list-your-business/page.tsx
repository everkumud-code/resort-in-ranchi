import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buildPageMetadata } from "@/lib/public/seo";
import Breadcrumbs from "@/components/site/Breadcrumbs";
import AddYourPropertyForm from "./AddYourPropertyForm";

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: "Add Your Business",
    description: "Add your property or business to ResortInRanchi if it isn't listed yet.",
    path: "/list-your-business",
  });
}

export default async function ListYourBusinessPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { submitted } = await searchParams;

  const [categories, locations, facilities] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.location.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.facility.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Breadcrumbs items={[{ name: "Add Your Business", path: "/list-your-business" }]} />
      <h1 className="mt-3 font-serif text-3xl font-semibold text-brand-dark">Add Your Business</h1>
      <p className="mt-2 text-sm text-brand/70">
        Can&apos;t find your property or business on ResortInRanchi? Tell us about it below and our team will
        review it before it goes live.
      </p>

      {submitted === "1" ? (
        <div className="mt-8 rounded-lg border border-brand/10 bg-brand-cream/60 p-6 text-center">
          <h2 className="font-serif text-xl font-semibold text-brand-dark">Thanks — we&apos;ve got it!</h2>
          <p className="mt-2 text-sm text-brand-dark/70">
            Our team will review your submission and reach out if we need anything else. Approved listings are
            added to the directory and you&apos;ll get access to manage it.
          </p>
          <Link href="/" className="mt-4 inline-block text-sm font-medium text-brand-teal hover:underline">
            &larr; Back to homepage
          </Link>
        </div>
      ) : (
        <div className="mt-8 rounded-lg border border-brand/10 bg-white p-5">
          <AddYourPropertyForm categories={categories} locations={locations} facilities={facilities} />
        </div>
      )}

      <p className="mt-6 text-xs text-brand/50">
        Already listed and want to manage it instead?{" "}
        <Link href="/contact" className="font-medium text-brand-teal hover:underline">
          Contact us
        </Link>{" "}
        and we&apos;ll help you find and claim your existing listing.
      </p>
    </div>
  );
}
