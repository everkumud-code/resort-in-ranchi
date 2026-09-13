import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/site/Breadcrumbs";
import { buildPageMetadata } from "@/lib/public/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Ranchi Hospitality Guide — Resorts, Hotels, Restaurants & Venues",
  description: "A practical guide to finding resorts, hotels, restaurants, banquet halls, wedding venues and weekend experiences in Ranchi using ResortInRanchi.",
  path: "/guides/ranchi-hospitality",
});

const sections = [
  {
    title: "Choosing a place to stay",
    body: "Start with resorts, hotels or homestays depending on the kind of trip you are planning. Compare the published location, photos, rooms, facilities, price information and contact options on each profile before you decide.",
    href: "/resorts",
    label: "Browse resorts",
  },
  {
    title: "Finding restaurants and cafés",
    body: "For meals, celebrations or a casual outing, browse restaurants and cafés by category and locality. Individual business profiles can provide the address, phone, website, directions and other details that are available to the directory.",
    href: "/restaurants",
    label: "Browse restaurants",
  },
  {
    title: "Planning weddings and events",
    body: "For weddings, receptions, parties and corporate events, compare banquet halls, wedding venues and party halls. Look for published capacity, venue spaces, facilities, photographs and enquiry options where those details have been verified.",
    href: "/banquet-halls",
    label: "Browse banquet halls",
  },
  {
    title: "Exploring Ranchi and nearby areas",
    body: "If you are planning a day outing or weekend break, explore experiences and area pages to discover businesses near the part of Ranchi you plan to visit. Use the locality information on each listing to narrow your choices.",
    href: "/experiences",
    label: "Browse experiences",
  },
];

export default function RanchiHospitalityGuidePage() {
  return (
    <article className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <Breadcrumbs items={[{ name: "Guides", path: "/guides/ranchi-hospitality" }, { name: "Ranchi Hospitality Guide", path: "/guides/ranchi-hospitality" }]} />
      <header className="mt-5 max-w-3xl">
        <p className="text-xs font-semibold tracking-[0.15em] text-brand-teal uppercase">Ranchi travel &amp; hospitality guide</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight text-brand-dark">How to find the right resort, hotel, restaurant or event venue in Ranchi</h1>
        <p className="mt-4 text-base leading-7 text-brand-dark/70">Use ResortInRanchi to discover local businesses by category and area, then open the individual profile for the information currently available about that business.</p>
      </header>

      <div className="mt-10 grid gap-5">
        {sections.map((section) => (
          <section key={section.title} className="rounded-xl border border-brand/10 bg-white p-6">
            <h2 className="font-serif text-2xl font-semibold text-brand-dark">{section.title}</h2>
            <p className="mt-2 text-sm leading-6 text-brand-dark/70">{section.body}</p>
            <Link href={section.href} className="mt-4 inline-block text-sm font-semibold text-brand-teal hover:underline">{section.label} →</Link>
          </section>
        ))}
      </div>

      <section className="mt-10 border-t border-brand/10 pt-8">
        <h2 className="font-serif text-2xl font-semibold text-brand-dark">A directory built around useful information</h2>
        <p className="mt-3 text-sm leading-6 text-brand-dark/70">ResortInRanchi is designed as a discovery and comparison directory rather than a booking engine. Listings are progressively researched and verified. We do not create fake ratings, reviews, amenities or business claims to make a profile rank better.</p>
        <p className="mt-3 text-sm leading-6 text-brand-dark/70">If you own a Ranchi business and find an existing profile, you can claim it. If your business is missing, you can submit it for review.</p>
        <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold">
          <Link href="/search" className="text-brand-teal hover:underline">Search the directory →</Link>
          <Link href="/list-your-business" className="text-brand-teal hover:underline">List your business →</Link>
        </div>
      </section>
    </article>
  );
}
