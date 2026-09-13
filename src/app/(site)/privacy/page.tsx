import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/public/seo";
import { SITE_NAME } from "@/lib/public/site";
import { CONTACT_EMAIL, SITE_OPERATOR_NAME } from "@/lib/public/contact";
import Breadcrumbs from "@/components/site/Breadcrumbs";

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: "Privacy Policy",
    description: `How ${SITE_NAME} handles the information you share.`,
    path: "/privacy",
  });
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-serif text-lg font-semibold text-brand-dark">{title}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Breadcrumbs items={[{ name: "Privacy Policy", path: "/privacy" }]} />
      <h1 className="mt-3 font-serif text-3xl font-semibold text-brand-dark">Privacy Policy</h1>
      <p className="mt-2 text-xs text-brand/50">This describes exactly what {SITE_OPERATOR_NAME} collects and why — nothing more.</p>

      <div className="mt-6 space-y-6 text-sm leading-6 text-brand-dark/80">
        <Section title="What we collect">
          <p>We only collect information you choose to submit through a form on this site:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <span className="font-medium text-brand-dark">Enquiries</span> — your name, phone number, and
              optionally email, event date, guest count, budget, and requirements, when you send an enquiry to a
              listed business.
            </li>
            <li>
              <span className="font-medium text-brand-dark">Listing claims</span> — your name, email, phone, and
              relationship to the business, when you claim a listing on behalf of a business.
            </li>
            <li>
              <span className="font-medium text-brand-dark">Add Your Property submissions</span> — your business
              details and your own name, role, email, and phone as the submitter, when you add a business that
              isn&apos;t yet listed.
            </li>
          </ul>
          <p>We never ask for payment details, passwords, or government ID through any form on this site.</p>
        </Section>

        <Section title="How it's used">
          <p>
            Enquiry details are shown to the specific business you enquired about (or to our team, until that
            business claims and can view its own listing), solely so they can respond to you. Claim details are
            reviewed by our team to verify the claim, and — once approved — used to grant that person access to
            edit the listing. Add Your Property submissions are reviewed by our team before anything is published.
          </p>
          <p>
            For a small number of categories, we work with one or more partner venues that can also help with your
            enquiry. When that applies, the enquiry page tells you before you submit, and your enquiry details are
            shared with that specific partner venue as well as the business you enquired about — never with anyone
            else, and never for advertising. Outside of that one, disclosed case, we do not sell, rent, or share
            this information with any third party.
          </p>
        </Section>

        <Section title="Cookies">
          <p>
            This site uses functional cookies only: a session cookie for signed-in admins, and a separate session
            cookie for an owner who has claimed a listing. Both are required for those features to work and are
            not used for tracking or advertising. We don&apos;t run any analytics or advertising scripts.
          </p>
          <p>
            The Compare feature stores your selected listings in your browser&apos;s local storage only — that
            selection is never sent to us or seen by anyone else.
          </p>
        </Section>

        <Section title="Data retention and requests">
          <p>
            We keep enquiry and claim records for as long as they&apos;re useful to the business and our team. If
            you&apos;d like your submitted information corrected or removed, email us and we&apos;ll act on it.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about this policy or your data:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-brand-teal hover:underline">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>
      </div>
    </div>
  );
}
