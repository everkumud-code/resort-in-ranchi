import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buildPageMetadata } from "@/lib/public/seo";
import Breadcrumbs from "@/components/site/Breadcrumbs";
import CreateEventForm from "./CreateEventForm";

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: "Create Your Event",
    description: "Apply to feature your event in Ranchi — weddings, fairs, concerts and more — on ResortInRanchi.",
    path: "/events/create",
  });
}

export default async function CreateEventPage({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) {
  const { submitted } = await searchParams;
  const locations = await prisma.location.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Breadcrumbs items={[{ name: "Events", path: "/events" }, { name: "Create Your Event", path: "/events/create" }]} />
      <h1 className="mt-3 font-serif text-3xl font-semibold text-brand-dark">Create Your Event</h1>
      <p className="mt-2 text-sm text-brand/70">
        Hosting something in or around Ranchi? Apply to have it featured on ResortInRanchi. Our team reviews every
        submission before it goes live.
      </p>

      {submitted === "1" ? (
        <div className="mt-8 rounded-lg border border-brand/10 bg-brand-cream/60 p-6 text-center">
          <h2 className="font-serif text-xl font-semibold text-brand-dark">Thanks — we&apos;ve got it!</h2>
          <p className="mt-2 text-sm text-brand-dark/70">
            Our team will review your event and publish it once approved. We may reach out if we need anything else.
          </p>
          <Link href="/events" className="mt-4 inline-block text-sm font-medium text-brand-teal hover:underline">
            &larr; Back to Events
          </Link>
        </div>
      ) : (
        <div className="mt-8 rounded-lg border border-brand/10 bg-white p-5">
          <CreateEventForm locations={locations} />
        </div>
      )}
    </div>
  );
}
