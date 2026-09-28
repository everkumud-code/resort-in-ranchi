import { describe, expect, it } from "vitest";
import { parseCsv, parsePhotoCsv, planPhotoImport } from "./photoImport";

const props = [
  { id: "p1", slug: "hotel-arya", imageCount: 0, existingUrls: [] },
  { id: "p2", slug: "aangan-resort", imageCount: 3, existingUrls: [] },
  { id: "p3", slug: "holiday-home", imageCount: 1, existingUrls: ["https://x.test/a.jpg"] },
];

describe("parseCsv", () => {
  it("handles quotes, escaped quotes, commas and CRLF", () => {
    expect(parseCsv('a,b\r\n"x, y","say ""hi"""\r\n')).toEqual([
      ["a", "b"],
      ["x, y", 'say "hi"'],
    ]);
  });
});

describe("parsePhotoCsv", () => {
  it("requires slug and url columns", () => {
    expect(parsePhotoCsv("name,link\na,b").error).toBeTruthy();
  });
  it("reads columns in any order with line numbers", () => {
    const { rows } = parsePhotoCsv("url,slug,altText\nhttps://x.test/1.jpg,hotel-arya,Front view");
    expect(rows).toEqual([{ line: 2, slug: "hotel-arya", url: "https://x.test/1.jpg", altText: "Front view", caption: "" }]);
  });
});

describe("planPhotoImport", () => {
  const row = (line: number, slug: string, url: string, altText = "") => ({ line, slug, url, altText, caption: "" });
  const plan = planPhotoImport(
    [
      row(2, "hotel-arya", "https://x.test/1.jpg"),
      row(3, "hotel-arya", "https://x.test/2.jpg"),
      row(4, "hotel-arya", "https://x.test/2.jpg"),
      row(5, "aangan-resort", "https://x.test/3.jpg"),
      row(6, "nope", "https://x.test/4.jpg"),
      row(7, "holiday-home", "https://x.test/a.jpg"),
      row(8, "holiday-home", "http://x.test/b.jpg"),
      row(9, "holiday-home", "not a url"),
      row(10, "holiday-home", "https://x.test/c.jpg", "Lawn"),
    ],
    props
  );

  it("appends new images with increasing sortOrder after existing ones", () => {
    expect(plan.toAdd.map((a) => [a.slug, a.url, a.sortOrder])).toEqual([
      ["hotel-arya", "https://x.test/1.jpg", 0],
      ["hotel-arya", "https://x.test/2.jpg", 1],
      ["holiday-home", "https://x.test/c.jpg", 1],
    ]);
  });

  it("never touches Aangan Resort, unknown slugs, duplicates, http or invalid urls", () => {
    expect(plan.skipped.map((s) => s.reason)).toEqual([
      "duplicate image",
      "protected listing",
      "unknown slug",
      "duplicate image",
      "url must be https",
      expect.stringContaining("invalid url"),
    ]);
  });
});
