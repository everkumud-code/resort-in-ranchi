export const SITE_NAME = "ResortInRanchi";
export const SITE_POSITIONING = "Ranchi's Hospitality, Dining & Events Discovery Platform";
export const SITE_TAGLINE = "Discover. Compare. Experience Ranchi.";
export const SITE_DESCRIPTION =
  "Find and compare resorts, hotels, restaurants, banquet halls and event venues across Ranchi — a research-backed local directory, not a booking engine.";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** The real brand mark already used in the header/footer — used as the fallback Open Graph/Twitter card image for any page that doesn't supply its own, so a social share is never a blank card. */
export const DEFAULT_OG_IMAGE_PATH = "/brand/horizontal.png";

/** Already-absolute URLs (e.g. a property's own externally-hosted photo, used as an Open Graph image) pass through unchanged — only a site-relative path gets SITE_URL prepended. */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
