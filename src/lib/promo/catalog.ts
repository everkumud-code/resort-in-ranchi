import { z } from "zod";

/**
 * Sponsored cards for Next Resource's own services and products.
 *
 * Two rules keep them from spoiling the site:
 *  - the SPOTS below are fixed places in the page layouts and each holds at
 *    most one ad, and no page has more than one spot, so two promos can never
 *    sit side by side or compete with each other;
 *  - none of the spots is on a page that already carries the Aangan Resort ad
 *    (blog posts, search, locations), on a listing's enquiry/claim flow, or on
 *    the legal pages.
 *
 * What the ads SAY, where they LINK and which ad sits in which spot are all
 * editable in Admin -> Promos. The starter set below is only what the owner
 * sees until they save something there. Every claim in it is taken from the
 * product pages on nextresource.in; it quotes no prices and none of the
 * unverified numbers from the agency home page.
 */

export const PROMO_SPOTS = [
  { key: "home", label: "Home page", where: "Between Featured listings and Explore by area" },
  { key: "category", label: "Category pages", where: "Resorts, Hotels, Restaurants, Banquet Halls and the like: below the listings" },
  { key: "umbrella", label: "Experiences and Picnic Spots", where: "Below the listings on both pages" },
  { key: "events", label: "Events page", where: "Below the event lists" },
  { key: "influencers", label: "Creators and influencers page", where: "Below the creator grid" },
  { key: "blog", label: "Blog index", where: "Below the post grid (not on individual posts)" },
  { key: "list-business", label: "Add Your Business page", where: "Below the form" },
] as const;

export type PromoSpotKey = (typeof PROMO_SPOTS)[number]["key"];

export function isPromoSpot(value: string): value is PromoSpotKey {
  return PROMO_SPOTS.some((s) => s.key === value);
}

/** Colour looks an ad can use. Full literal class strings so Tailwind keeps them. */
export const PROMO_ACCENTS = {
  teal: { label: "Teal (Next Resource)", surface: "from-teal-950 via-teal-900 to-teal-700", chip: "bg-teal-300/20 text-teal-50", button: "text-teal-950" },
  indigo: { label: "Indigo", surface: "from-indigo-950 via-indigo-900 to-indigo-700", chip: "bg-indigo-300/20 text-indigo-50", button: "text-indigo-950" },
  sky: { label: "Sky blue", surface: "from-sky-950 via-sky-800 to-sky-600", chip: "bg-sky-300/20 text-sky-50", button: "text-sky-950" },
  emerald: { label: "Green", surface: "from-emerald-950 via-emerald-800 to-emerald-600", chip: "bg-emerald-300/20 text-emerald-50", button: "text-emerald-950" },
  rose: { label: "Rose", surface: "from-rose-950 via-rose-800 to-rose-600", chip: "bg-rose-300/20 text-rose-50", button: "text-rose-950" },
  violet: { label: "Violet", surface: "from-violet-950 via-violet-800 to-violet-600", chip: "bg-violet-300/20 text-violet-50", button: "text-violet-950" },
  amber: { label: "Amber", surface: "from-amber-950 via-amber-800 to-amber-600", chip: "bg-amber-300/20 text-amber-50", button: "text-amber-950" },
} as const;

export type PromoAccent = keyof typeof PROMO_ACCENTS;

export function isPromoAccent(value: string): value is PromoAccent {
  return Object.prototype.hasOwnProperty.call(PROMO_ACCENTS, value);
}

export interface PromoAdData {
  id: string;
  key: string;
  brand: string;
  tag: string;
  headline: string;
  body: string;
  points: string[];
  ctaLabel: string;
  href: string;
  accent: string;
  active: boolean;
  sortOrder: number;
}

export type PromoAdInput = Omit<PromoAdData, "id">;

const NEXT_RESOURCE = "https://www.nextresource.in";

export const DEFAULT_PROMO_ADS: PromoAdInput[] = [
  {
    key: "next-resource",
    brand: "Next Resource",
    tag: "Digital marketing & brand management",
    headline: "Get found. Get chosen. Get enquiries.",
    body: "Social media, Meta and Google ads, SEO and Google Business Profile, branding and design, websites and WhatsApp outreach: one connected team for your business in Ranchi.",
    points: ["Social media management", "Meta & Google ads", "SEO & local search", "Branding & design"],
    ctaLabel: "Get a free consultation",
    href: `${NEXT_RESOURCE}/digital-marketing-agency-ranchi`,
    accent: "teal",
    active: true,
    sortOrder: 1,
  },
  {
    key: "next-era",
    brand: "Next Era",
    tag: "Hotel management software · Hotels & resorts",
    headline: "Hotel management software built for the floor.",
    body: "Front desk, housekeeping, restaurant, banquet, stores and accounts, plus your team's attendance, tasks and approvals, in one system on Android, iPhone and the web.",
    points: ["Live room board", "GST invoices", "Banquet hall diary", "Owner dashboard on a phone"],
    ctaLabel: "See Next Era",
    href: `${NEXT_RESOURCE}/next-era`,
    accent: "indigo",
    active: true,
    sortOrder: 2,
  },
  {
    key: "next-edge",
    brand: "Next Edge",
    tag: "School & coaching ERP · Early access",
    headline: "School and coaching ERP with parents in the loop.",
    body: "Admissions, attendance, fees, tests, homework and notices from one admin panel, with an app for students, parents and faculty branded with your centre's name.",
    points: ["QR attendance and parent alerts", "Fee dues and reminders", "Online tests, auto-marked", "Notices with a seen-by report"],
    ctaLabel: "See Next Edge",
    href: `${NEXT_RESOURCE}/next-edge`,
    accent: "sky",
    active: true,
    sortOrder: 3,
  },
  {
    key: "nextfit",
    brand: "NextFit",
    tag: "Gym & fitness studio software · Free plan available",
    headline: "Members renew on WhatsApp, not on paper.",
    body: "Memberships, check-in, class booking and reminders in one app, in Hindi and English, with no commission on bookings.",
    points: ["QR / biometric check-in", "7, 3 and 1-day expiry reminders", "PT sessions and class booking", "Workout and diet plans"],
    ctaLabel: "Explore NextFit",
    href: `${NEXT_RESOURCE}/nextserve/fit`,
    accent: "emerald",
    active: true,
    sortOrder: 4,
  },
  {
    key: "nextglow",
    brand: "NextGlow",
    tag: "Salon & spa software · Free plan available",
    headline: "India-first salon software, with zero marketplace commission.",
    body: "Stylist calendar, online booking, loyalty and billing in one app, in Hindi and English.",
    points: ["Stylist calendar", "Booking link for Instagram and Google", "Loyalty points and prepaid wallet", "Bridal packages"],
    ctaLabel: "Explore NextGlow",
    href: `${NEXT_RESOURCE}/nextserve/glow`,
    accent: "rose",
    active: true,
    sortOrder: 5,
  },
  {
    key: "nextcare",
    brand: "NextCare",
    tag: "Clinic & lab software · Free plan available",
    headline: "Prescription, lab and ABHA in one app.",
    body: "OPD queue, prescriptions, lab and pharmacy for clinics, dental, physio and diagnostics centres, in Hindi and English.",
    points: ["OPD queue with token display", "Prescription PDF sent on WhatsApp", "Lab results with reference ranges", "ABHA-ready records"],
    ctaLabel: "Explore NextCare",
    href: `${NEXT_RESOURCE}/nextserve/care`,
    accent: "violet",
    active: true,
    sortOrder: 6,
  },
];

/** Which starter ad sits in which spot. Seven spots, six ads; the agency ad has two because it suits both the home page and the page business owners read. */
export const DEFAULT_PLACEMENTS: Record<PromoSpotKey, string> = {
  home: "next-resource",
  category: "next-era",
  umbrella: "nextfit",
  events: "next-edge",
  influencers: "nextglow",
  blog: "nextcare",
  "list-business": "next-resource",
};

// ---------------------------------------------------------------------------
// Validation (used by the admin screen)
// ---------------------------------------------------------------------------

function cleanLine(max: number, label: string, required = true) {
  const base = z.string().trim().max(max, `Keep ${label} under ${max} characters.`);
  return required ? base.min(1, `Enter ${label}.`) : base;
}

/** Only https links (or WhatsApp's own https link) can be an ad's target: never javascript:, data: or plain http. */
export function parseAdHref(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  const text = raw.trim();
  if (!text) return { ok: false, error: "Enter the link the button should open." };
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return { ok: false, error: "The link must be a full web address starting with https://" };
  }
  if (url.protocol !== "https:") return { ok: false, error: "The link must start with https://" };
  if (url.username || url.password) return { ok: false, error: "The link must not contain a user name or password." };
  return { ok: true, value: url.toString() };
}

export const promoAdSchema = z.object({
  brand: cleanLine(40, "a brand name"),
  tag: cleanLine(90, "a short line under the brand"),
  headline: cleanLine(100, "a headline"),
  body: cleanLine(260, "the description"),
  ctaLabel: cleanLine(40, "the button text"),
  accent: z.string().refine(isPromoAccent, "Pick one of the colours."),
  points: z.array(z.string().trim().min(1).max(50, "Keep each highlight under 50 characters.")).max(4, "Use at most 4 highlights."),
});

/** One highlight per line; blanks are dropped. */
export function parsePointsText(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

export function slugifyKey(brand: string): string {
  return brand
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

// ---------------------------------------------------------------------------
// Rendering helpers
// ---------------------------------------------------------------------------

/**
 * The outgoing link carries a tracking tag so Next Resource can see which ad
 * and which spot sent the visit. Only added for nextresource.in links and only
 * when the owner has not put their own tag there.
 */
export function buildAdHref(href: string, adKey: string, spot: string): string {
  try {
    const url = new URL(href);
    const host = url.hostname.replace(/^www\./, "");
    if (host !== "nextresource.in" || url.searchParams.has("utm_source")) return href;
    url.searchParams.set("utm_source", "resortinranchi");
    url.searchParams.set("utm_medium", "sponsored");
    url.searchParams.set("utm_campaign", adKey);
    url.searchParams.set("utm_content", spot);
    return url.toString();
  } catch {
    return href;
  }
}

/** The ad that belongs in a spot, or null. Pure so the rules are tested directly. */
export function pickAdForSpot(
  spot: PromoSpotKey,
  placements: { slot: string; adId: string | null }[],
  ads: PromoAdData[]
): PromoAdData | null {
  const placement = placements.find((p) => p.slot === spot);
  if (!placement?.adId) return null;
  const ad = ads.find((a) => a.id === placement.adId);
  return ad && ad.active ? ad : null;
}
