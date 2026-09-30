import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/public/seo";
import { SITE_NAME } from "@/lib/public/site";
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_DISPLAY } from "@/lib/public/contact";
import Breadcrumbs from "@/components/site/Breadcrumbs";

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: "Contact",
    description: `Get in touch with ${SITE_NAME}.`,
    path: "/contact",
  });
}

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Breadcrumbs items={[{ name: "Contact", path: "/contact" }]} />
      <h1 className="mt-3 font-serif text-3xl font-semibold text-brand-dark">Contact us</h1>

      <div className="mt-6 space-y-5 text-sm leading-6 text-brand-dark/80">
        <p>
          For questions about {SITE_NAME} itself — corrections to a listing, general feedback, or anything else
          about the directory — email us directly:
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-block rounded-md bg-brand-orange px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-95"
          >
            {CONTACT_EMAIL}
          </a>
          <a
            href={`tel:+91${CONTACT_PHONE}`}
            className="inline-block rounded-md border border-brand-orange px-5 py-2.5 text-sm font-semibold text-brand-orange hover:bg-brand-orange/5"
          >
            {CONTACT_PHONE_DISPLAY}
          </a>
        </div>

        <div className="rounded-lg border border-brand/10 bg-white p-4">
          <p className="font-medium text-brand-dark">Looking to reach a specific business instead?</p>
          <p className="mt-1 text-brand-dark/70">
            We don&apos;t handle bookings or enquiries on a business&apos;s behalf — use the phone, WhatsApp, or
            enquiry option shown on that business&apos;s own listing page to contact them directly.
          </p>
          <Link href="/search" className="mt-3 inline-block font-medium text-brand-teal hover:underline">
            Find a listing &rarr;
          </Link>
        </div>

        <div className="rounded-lg border border-brand-teal/20 bg-brand-teal/5 p-4">
          <p className="font-medium text-brand-dark">Own a business listed here?</p>
          <p className="mt-1 text-brand-dark/70">
            If you believe your listing was claimed in error, or you need help with the claim process, email us
            at the address above and we&apos;ll help sort it out.
          </p>
        </div>

        <div className="rounded-lg border border-brand/10 bg-white p-4">
          <p className="font-medium text-brand-dark">Not listed yet?</p>
          <p className="mt-1 text-brand-dark/70">
            Tell us about your business and our team will review it before it goes live.
          </p>
          <Link href="/list-your-business" className="mt-3 inline-block font-medium text-brand-teal hover:underline">
            Add Your Property &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
