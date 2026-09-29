import Link from "next/link";
import BrandLogo from "./BrandLogo";
import MobileNav from "./MobileNav";

const NAV_LINKS = [
  { href: "/resorts", label: "Resorts" },
  { href: "/hotels", label: "Hotels" },
  { href: "/restaurants", label: "Restaurants" },
  { href: "/banquet-halls", label: "Banquet Halls" },
  { href: "/wedding-venues", label: "Wedding Venues" },
  { href: "/experiences", label: "Experiences" },
  { href: "/events", label: "Events" },
  { href: "/influencers", label: "Influencers" },
  { href: "/blog", label: "Blog" },
  { href: "/#explore-by-area", label: "Locations" },
];

/** Shown only in the mobile menu (not the desktop nav, which stays focused on discovery) — the desktop equivalent already lives in the footer. */
const MOBILE_ONLY_LINKS = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  return (
    <header className="relative border-b border-brand/10 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 sm:py-3">
        {/* The vertical logo is portrait (2:3) — sized by height so it keeps
         * its own proportions rather than being squeezed into a horizontal
         * lockup's shape; the header grows to fit it instead. */}
        <Link href="/" className="flex shrink-0 items-center">
          <BrandLogo variant="vertical" className="h-16 w-auto sm:h-24" priority />
          <span className="sr-only">Resort In Ranchi</span>
        </Link>

        <nav className="hidden flex-wrap items-center gap-x-5 gap-y-1 text-sm font-medium lg:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-brand hover:text-brand-dark">
              {link.label}
            </Link>
          ))}
          <Link
            href="/search"
            className="rounded-full bg-brand-orange px-4 py-1.5 text-white shadow-sm hover:brightness-95"
          >
            Search
          </Link>
        </nav>

        <MobileNav links={[...NAV_LINKS, { href: "/search", label: "Search" }, ...MOBILE_ONLY_LINKS]} />
      </div>
    </header>
  );
}
