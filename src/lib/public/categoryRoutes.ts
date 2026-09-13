/**
 * "Intent" category pages that don't map 1:1 onto a single database
 * Category row — they aggregate several core categories (see
 * RESORTINRANCHI_PRODUCT_SPEC_v1.md's 15-category list). If a listed
 * category slug doesn't exist in the database yet, the page simply shows
 * an honest empty state rather than a broken page or fabricated content.
 */
export interface UmbrellaCategoryRoute {
  slug: string;
  title: string;
  intro: string;
  categorySlugs: string[];
}

export const UMBRELLA_CATEGORY_ROUTES: Record<string, UmbrellaCategoryRoute> = {
  "picnic-spots": {
    slug: "picnic-spots",
    title: "Picnic Spots & Day Outings",
    intro:
      "Short getaways and day-outing spots in and around Ranchi — for a few hours away without a full overnight trip.",
    categorySlugs: ["picnic-day-outing"],
  },
  experiences: {
    slug: "experiences",
    title: "Experiences Near Ranchi",
    intro:
      "Adventure, camping, weekend getaways and farm stays around Ranchi — for something beyond a standard hotel stay.",
    categorySlugs: ["adventure-camping", "weekend-getaways", "homestays-farm-stays"],
  },
};
