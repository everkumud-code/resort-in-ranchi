import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/public/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // /admin, /owner, /creator: never public — all three are
      // authentication-gated areas with no content a visitor without a
      // valid session could see anyway. /search: a filter surface, not
      // unique indexable content — matches the product spec's "exclude
      // ... private/search/filter pages not intentionally indexable" rule.
      disallow: ["/admin", "/owner", "/creator", "/search"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
