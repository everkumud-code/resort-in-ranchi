export const SITE_NAME = "ResortInRanchi";
export const SITE_POSITIONING = "Ranchi's Hospitality, Dining & Events Discovery Platform";
export const SITE_TAGLINE = "Discover. Compare. Experience Ranchi.";
export const SITE_DESCRIPTION =
  "Discover resorts, hotels, restaurants, cafes, banquet halls, wedding venues and experiences in Ranchi and nearby areas. Compare verified business information, facilities, photos, contact details and locations on ResortInRanchi.";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const DEFAULT_OG_IMAGE_PATH = "/brand/horizontal.png";

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
