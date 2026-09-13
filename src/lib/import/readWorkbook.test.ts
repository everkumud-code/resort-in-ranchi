import { afterAll, describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { readMasterWorkbook, MASTER_SHEET_NAME } from "./readWorkbook";

const HEADERS = [
  "ID",
  "Listing Name",
  "Record Type",
  "Category",
  "Locality",
  "Parent Property",
  "Status",
  "Source",
  "Address",
  "Phone",
  "Website",
  "Google Maps URL",
  "Google Rating",
  "Review Count",
  "Price Range",
  "Rooms",
  "Capacity",
  "Swimming Pool",
  "Restaurant",
  "Banquet",
  "Lawn",
  "Wedding",
  "Corporate Events",
  "Day Outing",
  "Parking",
  "WhatsApp",
  "Email",
  "Description",
  "Claimed",
  "Verified",
  "Source URL",
  "Last Checked",
];

function buildFixtureWorkbook(): string {
  const rows = [
    HEADERS,
    [
      1,
      "The Cake Shop Bakery",
      "Property/Business",
      "Bakery/Cafe",
      "Ranchi",
      null,
      "Discovered",
      "Current web research",
      ...Array(23).fill(null),
      "2026-09-08",
    ],
    [
      220,
      "Lawn — Celebration Banquet Hall",
      "Venue Space / Outlet",
      "Venue Space",
      "Ranchi",
      "Celebration Banquet Hall",
      "Discovered",
      "Venue directory / current web research",
      ...Array(23).fill(null),
      "2026-09-08",
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, MASTER_SHEET_NAME);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["unrelated"]]), "Category Summary");

  const filePath = path.join(os.tmpdir(), `resort-import-fixture-${Date.now()}.xlsx`);
  XLSX.writeFile(wb, filePath);
  return filePath;
}

describe("readMasterWorkbook", () => {
  const filePath = buildFixtureWorkbook();

  afterAll(() => {
    fs.rmSync(filePath, { force: true });
  });

  it("reads rows from the '400 Record Master' sheet", () => {
    const result = readMasterWorkbook(filePath);
    expect(result.sheetName).toBe(MASTER_SHEET_NAME);
    expect(result.allSheetNames).toContain("Category Summary");
    expect(result.rows).toHaveLength(2);
  });

  it("maps spreadsheet headers to camelCase fields correctly", () => {
    const result = readMasterWorkbook(filePath);
    const [first] = result.rows;
    expect(first.id).toBe(1);
    expect(first.listingName).toBe("The Cake Shop Bakery");
    expect(first.recordType).toBe("Property/Business");
    expect(first.category).toBe("Bakery/Cafe");
    expect(first.locality).toBe("Ranchi");
    expect(first.parentProperty).toBeNull();
    expect(first.source).toBe("Current web research");
    expect(first.lastChecked).toBe("2026-09-08");
  });

  it("maps Parent Property for Venue Space rows", () => {
    const result = readMasterWorkbook(filePath);
    const venueSpace = result.rows[1];
    expect(venueSpace.recordType).toBe("Venue Space / Outlet");
    expect(venueSpace.parentProperty).toBe("Celebration Banquet Hall");
  });

  it("assigns 1-based spreadsheet row numbers (header = row 1)", () => {
    const result = readMasterWorkbook(filePath);
    expect(result.rows[0].rowNumber).toBe(2);
    expect(result.rows[1].rowNumber).toBe(3);
  });

  it("throws a clear error when the master sheet is missing", () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["x"]]), "Some Other Sheet");
    const badPath = path.join(os.tmpdir(), `resort-import-bad-${Date.now()}.xlsx`);
    XLSX.writeFile(wb, badPath);
    try {
      expect(() => readMasterWorkbook(badPath)).toThrow(/400 Record Master/);
    } finally {
      fs.rmSync(badPath, { force: true });
    }
  });
});
