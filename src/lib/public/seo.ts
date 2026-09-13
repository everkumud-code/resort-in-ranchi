import type { Metadata } from "next";
import { absoluteUrl, DEFAULT_OG_IMAGE_PATH, SITE_NAME } from "./site";

export interface PageMetadataInput {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  ogImage?: string;
}

export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const canonical = absoluteUrl(input.path);
  const fullTitle = input.title.includes(SITE_NAME) ? input.title : `${input.title} | ${SITE_NAME}`;
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
      locale: "en_IN",
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
