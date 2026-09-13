import * as XLSX from "xlsx";

export const MASTER_SHEET_NAME = "400 Record Master";

/** One row from the "400 Record Master" sheet, column names normalized to camelCase. */
export interface MasterRow {
  id: number | null;
  listingName: string | null;
  recordType: string | null;
  category: string | null;
  locality: string | null;
  parentProperty: string | null;
  status: string | null;
  source: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  googleMapsUrl: string | null;
  googleRating: number | null;
  reviewCount: number | null;
  priceRange: string | null;
  rooms: number | null;
  capacity: string | null;
  swimmingPool: string | null;
  restaurant: string | null;
  banquet: string | null;
  lawn: string | null;
  wedding: string | null;
  corporateEvents: string | null;
  dayOuting: string | null;
  parking: string | null;
  whatsapp: string | null;
  email: string | null;
  description: string | null;
  claimed: string | null;
  verified: string | null;
  sourceUrl: string | null;
  lastChecked: string | null;
  /** 1-based row number in the spreadsheet (header = row 1), for error messages. */
  rowNumber: number;
}

const COLUMN_MAP: Record<string, keyof MasterRow> = {
  ID: "id",
  "Listing Name": "listingName",
  "Record Type": "recordType",
  Category: "category",
  Locality: "locality",
  "Parent Property": "parentProperty",
  Status: "status",
  Source: "source",
  Address: "address",
  Phone: "phone",
  Website: "website",
  "Google Maps URL": "googleMapsUrl",
  "Google Rating": "googleRating",
  "Review Count": "reviewCount",
  "Price Range": "priceRange",
  Rooms: "rooms",
  Capacity: "capacity",
  "Swimming Pool": "swimmingPool",
  Restaurant: "restaurant",
  Banquet: "banquet",
  Lawn: "lawn",
  Wedding: "wedding",
  "Corporate Events": "corporateEvents",
  "Day Outing": "dayOuting",
  Parking: "parking",
  WhatsApp: "whatsapp",
  Email: "email",
  Description: "description",
  Claimed: "claimed",
  Verified: "verified",
  "Source URL": "sourceUrl",
  "Last Checked": "lastChecked",
};

export interface WorkbookReadResult {
  sheetName: string;
  allSheetNames: string[];
  rows: MasterRow[];
}

/**
 * Read the canonical "400 Record Master" sheet from the research workbook.
 * Throws if that sheet is missing (fail loudly rather than silently reading
 * the wrong data — the other sheets are subsets/summaries, not sources of truth).
 */
export function readMasterWorkbook(filePath: string): WorkbookReadResult {
  const wb = XLSX.readFile(filePath, { cellDates: false });

  if (!wb.SheetNames.includes(MASTER_SHEET_NAME)) {
    throw new Error(
      `Expected sheet "${MASTER_SHEET_NAME}" not found in ${filePath}. ` +
        `Sheets present: ${wb.SheetNames.join(", ")}`
    );
  }

  const ws = wb.Sheets[MASTER_SHEET_NAME];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: null,
    raw: true,
  });

  const rows: MasterRow[] = rawRows.map((raw, idx) => {
    const mapped: Record<string, unknown> = {};
    for (const [header, key] of Object.entries(COLUMN_MAP)) {
      const value = raw[header];
      mapped[key] = value === undefined ? null : value;
    }
    mapped.rowNumber = idx + 2;
    return mapped as unknown as MasterRow;
  });

  return { sheetName: MASTER_SHEET_NAME, allSheetNames: wb.SheetNames, rows };
}
