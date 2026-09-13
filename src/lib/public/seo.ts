import type { Metadata } from "next";
import { absoluteUrl, DEFAULT_OG_IMAGE_PATH, SITE_NAME } from "./site";

export interface PageMetadataInput {
  title: string;
  description: string;
  path: string;
  /** Set true for thin/utility pages (search results, empty listings) that
   * shouldn't be indexed — per the product spec's SEO rules. */
  noindex?: boolean;
  ogImage?: string;
}

/**
 * Builds a consistent Metadata object: title, description, canonical, Open
 * Graph. `title` is returned RAW (not suffixed) because the root layout
 * already defines a `%s | ResortInRanchi` title template that Next applies
 * to every page's <title> automatically — suffixing here too would double
 * it up. Open Graph / Twitter titles don't inherit that template, so they
 * get the suffix applied explicitly.
 */
export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const canonical = absoluteUrl(input.path);
  const fullTitle = input.title.includes(SITE_NAME) ? input.title : `${input.title} | ${SITE_NAME}`;
  // Every page gets a real image on its social card — the brand mark already
  // used in the header/footer — rather than a blank one when a page doesn't
  // supply its own (e.g. a property's own photo).
  const ogImageUrl = absoluteUrl(input.ogImage ?? DEFAULT_OG_IMAGE_PATH);

  return {
    title: input.title,
    description: input.description,
    alternates: { canonical },
    robots: input.noindex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title: fullTitle,
      description: input.description,
      url: canonical,
      siteName: SITE_NAME,
      type: "website",
      images: [{ url: ogImageUrl }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: input.description,
      images: [ogImageUrl],
    },
  };
}
