import { describe, expect, it } from "vitest";
import { formatMissingFieldsSummary, groupNeedsReviewByName } from "./dataQuality";

describe("groupNeedsReviewByName", () => {
  it("groups properties with matching normalized names together", () => {
    const groups = groupNeedsReviewByName([
      { id: "1", name: "Focus Club and Resort", localityName: "Daladali" },
      { id: "2", name: "Focus Club And Resort", localityName: "Ring Road" },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].properties).toHaveLength(2);
  });

  it("keeps a lone NEEDS_REVIEW property in its own single-member group", () => {
    const groups = groupNeedsReviewByName([{ id: "1", name: "Solo Property", localityName: "Ranchi" }]);
    expect(groups).toHaveLength(1);
    expect(groups[0].properties).toHaveLength(1);
  });

  it("returns no groups for an empty list", () => {
    expect(groupNeedsReviewByName([])).toHaveLength(0);
  });

  it("sorts larger groups first", () => {
    const groups = groupNeedsReviewByName([
      { id: "1", name: "Solo", localityName: "Ranchi" },
      { id: "2", name: "Pair", localityName: "Ranchi" },
      { id: "3", name: "Pair", localityName: "Lalpur" },
    ]);
    expect(groups[0].properties).toHaveLength(2);
  });
});

describe("formatMissingFieldsSummary", () => {
  it("computes missing percentages against the total", () => {
    const rows = formatMissingFieldsSummary({ phone: 217, website: 217, address: 217, email: 217 }, 217);
    expect(rows).toHaveLength(4);
    for (const row of rows) {
      expect(row.missingCount).toBe(217);
      expect(row.totalCount).toBe(217);
      expect(row.missingPercent).toBe(100);
    }
  });

  it("handles a zero total without dividing by zero", () => {
    const rows = formatMissingFieldsSummary({ phone: 0, website: 0, address: 0, email: 0 }, 0);
    for (const row of rows) {
      expect(row.missingPercent).toBe(0);
    }
  });

  it("rounds partial percentages", () => {
    const rows = formatMissingFieldsSummary({ phone: 1, website: 0, address: 0, email: 0 }, 3);
    const phoneRow = rows.find((r) => r.field === "phone")!;
    expect(phoneRow.missingPercent).toBe(33); // 1/3 = 33.33... -> 33
  });

  it("includes a human-readable label for each field", () => {
    const rows = formatMissingFieldsSummary({ phone: 0, website: 0, address: 0, email: 0 }, 10);
    expect(rows.map((r) => r.label)).toEqual(["Phone", "Website", "Address", "Email"]);
  });
});
