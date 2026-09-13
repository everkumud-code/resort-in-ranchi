import { describe, expect, it } from "vitest";
import { buildPageMetadata } from "./seo";
import { DEFAULT_OG_IMAGE_PATH, SITE_NAME } from "./site";

describe("buildPageMetadata", () => {
  it("returns the raw page title unsuffixed (the root layout's title template appends the site name once)", () => {
    const meta = buildPageMetadata({ title: "Resorts in Ranchi", description: "desc", path: "/resorts" });
    expect(meta.title).toBe("Resorts in Ranchi");
  });

  it("suffixes the Open Graph title with the site name", () => {
    const meta = buildPageMetadata({ title: "Resorts in Ranchi", description: "desc", path: "/resorts" });
    expect(meta.openGraph?.title).toBe(`Resorts in Ranchi | ${SITE_NAME}`);
  });

  it("does not double-suffix the Open Graph title if the site name is already present", () => {
    const meta = buildPageMetadata({ title: `Home | ${SITE_NAME}`, description: "desc", path: "/" });
    expect(meta.openGraph?.title).toBe(`Home | ${SITE_NAME}`);
  });

  it("builds an absolute canonical URL from the path", () => {
    const meta = buildPageMetadata({ title: "x", description: "desc", path: "/hotels" });
    expect(meta.alternates?.canonical).toMatch(/\/hotels$/);
    expect(meta.alternates?.canonical).toMatch(/^https?:\/\//);
  });

  it("defaults to indexable (index: true, follow: true)", () => {
    const meta = buildPageMetadata({ title: "x", description: "desc", path: "/hotels" });
    expect(meta.robots).toEqual({ index: true, follow: true });
  });

  it("marks a page noindex when requested (e.g. search, empty category pages)", () => {
    const meta = buildPageMetadata({ title: "x", description: "desc", path: "/search", noindex: true });
    expect(meta.robots).toEqual({ index: false, follow: true });
  });

  it("populates Open Graph title/description/url consistently", () => {
    const meta = buildPageMetadata({ title: "Resorts", description: "Find resorts", path: "/resorts" });
    expect(meta.openGraph).toMatchObject({
      title: `Resorts | ${SITE_NAME}`,
      description: "Find resorts",
      siteName: SITE_NAME,
      type: "website",
    });
  });

  it("passes the description through to twitter card metadata too, using the larger-image card style", () => {
    const meta = buildPageMetadata({ title: "x", description: "A description", path: "/x" });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image", description: "A description" });
  });

  it("falls back to the real brand mark for Open Graph/Twitter images when a page doesn't supply its own — a social share is never a blank card", () => {
    const meta = buildPageMetadata({ title: "x", description: "desc", path: "/x" });
    expect(meta.openGraph?.images).toEqual([{ url: expect.stringContaining(DEFAULT_OG_IMAGE_PATH) }]);
    expect(meta.twitter).toMatchObject({ images: [expect.stringContaining(DEFAULT_OG_IMAGE_PATH)] });
  });

  it("uses a page's own supplied image instead of the default when given one", () => {
    const meta = buildPageMetadata({ title: "x", description: "desc", path: "/x", ogImage: "/property/some-photo.jpg" });
    expect(meta.openGraph?.images).toEqual([{ url: expect.stringContaining("/property/some-photo.jpg") }]);
  });
});
