import { describe, expect, it } from "vitest";
import { absoluteUrl, SITE_URL } from "./site";

describe("absoluteUrl", () => {
  it("prepends SITE_URL to a site-relative path", () => {
    expect(absoluteUrl("/resorts")).toBe(`${SITE_URL}/resorts`);
  });

  it("adds a leading slash if the path is missing one", () => {
    expect(absoluteUrl("resorts")).toBe(`${SITE_URL}/resorts`);
  });

  it("passes an already-absolute http(s) URL through unchanged — e.g. a property's own externally-hosted photo used as an Open Graph image", () => {
    expect(absoluteUrl("https://www.aanganresort.in/images/hero.webp")).toBe("https://www.aanganresort.in/images/hero.webp");
    expect(absoluteUrl("http://example.com/x.jpg")).toBe("http://example.com/x.jpg");
  });
});
