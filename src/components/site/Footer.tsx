import Link from "next/link";
import BrandLogo from "./BrandLogo";
import { SITE_POSITIONING, SITE_TAGLINE } from "@/lib/public/site";

const FOOTER_CATEGORY_LINKS = [
  { href: "/resorts", label: "Resorts" },
  { href: "/hotels", label: "Hotels" },
  { href: "/restaurants", label: "Restaurants" },
  { href: "/banquet-halls", label: "Banquet Halls" },
  { href: "/wedding-venues", label: "Wedding Venues" },
  { href: "/picnic-spots", label: "Picnic Spots" },
  { href: "/experiences", label: "Experiences" },
];

const FOOTER_LOCATION_LINKS = [
  { href: "/locations/ranchi", label: "Ranchi" },
  { href: "/locations/ormanjhi", label: "Ormanjhi" },
  { href: "/locations/kanke", label: "Kanke" },
];

const FOOTER_ABOUT_LINKS = [
  { href: "/about", label: "About" },
  { href: "/events", label: "Events" },
  { href: "/influencers", label: "Influencers" },
  { href: "/blog", label: "Blog" },
  { href: "/list-your-business", label: "Add Your Business" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/owner", label: "Vendor Login" },
  { href: "/admin/login", label: "Admin Login" },
];

export default function Footer() {
  return (
    <footer className="mt-16 bg-brand-dark text-brand-cream">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            {/* The logo's own dark-green linework needs a light backdrop to
             * stay legible here — a plain background patch behind the
             * unaltered artwork, not a filter on the artwork itself. */}
            <div className="inline-block rounded-lg bg-brand-cream p-2">
              <BrandLogo variant="vertical" className="h-24 w-auto" />
            </div>
            <p className="mt-3 text-sm text-brand-cream/80">{SITE_POSITIONING}</p>
            <p className="mt-2 font-serif text-sm italic text-brand-gold">{SITE_TAGLINE}</p>
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide text-white uppercase">Browse categories</p>
            <ul className="mt-3 space-y-1.5 text-sm text-brand-cream/80">
              {FOOTER_CATEGORY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide text-white uppercase">Popular locations</p>
            <ul className="mt-3 space-y-1.5 text-sm text-brand-cream/80">
              {FOOTER_LOCATION_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide text-white uppercase">About</p>
            <ul className="mt-3 space-y-1.5 text-sm text-brand-cream/80">
              {FOOTER_ABOUT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-10 border-t border-brand-cream/15 pt-6 text-xs text-brand-cream/60">
          Listings are compiled from public research and are being progressively verified. Information shown is only
          what has been confirmed — if a detail isn&apos;t listed, it isn&apos;t known yet.
        </p>
      </div>
    </footer>
  );
}
