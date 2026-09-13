# ResortInRanchi.com

Ranchi's hospitality, dining, weddings, events and experiences discovery platform.

This repository currently contains **Step 1 of the build only**: the technical
foundation — Next.js + TypeScript app shell, the Prisma/PostgreSQL schema, and
a safe importer for the 400-record research spreadsheet. There is no
homepage, property pages, or public UI yet — see
[`RESORTINRANCHI_PRODUCT_SPEC_v1.md`](./RESORTINRANCHI_PRODUCT_SPEC_v1.md) for
the full product spec and the rest of the build sequence.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4
- PostgreSQL + Prisma ORM 6

## 1. Install

```bash
npm install
```

## 2. Configure PostgreSQL

Copy the example env file and point it at a PostgreSQL database:

```bash
cp .env.example .env
```

`.env`:

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

If you don't already have a local PostgreSQL server, install one (e.g. via
[postgresql.org downloads](https://www.postgresql.org/download/) or, on
Windows, `winget install PostgreSQL.PostgreSQL.16`), then create the
database:

```bash
psql -U postgres -c "CREATE DATABASE resort_in_ranchi;"
```

## 3. Run Prisma

Generate the client and apply the schema:

```bash
npm run prisma:generate   # generate the Prisma Client
npm run prisma:migrate    # create/apply migrations (dev)
npm run prisma:studio     # optional: browse the DB in a GUI
```

The schema lives in [`prisma/schema.prisma`](./prisma/schema.prisma). See
**Database schema** below for an overview of the models.

## 4. Run the Excel importer

The source dataset is
[`data/ResortInRanchi_400_Record_Master_Database.xlsx`](./data/ResortInRanchi_400_Record_Master_Database.xlsx),
a 400-record research workbook. **Always dry-run before committing.**

```bash
npm run import:dry-run     # validates + reports, writes NO data to the DB
npm run import:commit      # writes the validated plan to the DB (upserts)
```

Both commands print a summary to the console and write the full machine-readable
report to `data/import-report.json`. See **Import pipeline** below for exactly
what the importer does and does not do.

## 5. Run validation

```bash
npm run typecheck   # tsc --noEmit
npm run lint         # eslint
```

## 6. Run tests

```bash
npm run test         # vitest run (single pass)
npm run test:watch   # vitest, watch mode
```

## Database schema

Defined in `prisma/schema.prisma`, implementing the entities from the product
spec:

| Model | Purpose |
|---|---|
| `Property` | A resort/hotel/restaurant/venue/etc. listing. |
| `Category` | Listing taxonomy (Resorts, Hotels, Banquet Halls, ...). Self-referential for subcategories. |
| `Location` | Locality/area taxonomy (Ranchi, Lalpur, Kanke, ...). Self-referential for hierarchy. |
| `Facility` | Amenities (Swimming Pool, Parking, Wi-Fi, ...), many-to-many with `Property` via `PropertyFacility`. |
| `PropertyImage` | Gallery images for a property. |
| `VenueSpace` | A sub-venue/outlet belonging to a property (e.g. "Lawn — Aangan Palace"). |
| `Enquiry` | A visitor lead submitted against a property. |
| `ClaimRequest` | An owner's request to claim/verify a listing. |
| `Guide` | Editorial content pages. |
| `AdminUser` | Admin/editor accounts. |

Key design points:

- **`PropertyStatus`** (`DRAFT`/`PUBLISHED`/`ARCHIVED`/`CLOSED`) gates public
  visibility. Every imported record starts as `DRAFT` — nothing from the
  research spreadsheet is public until an admin explicitly publishes it.
- **`VerificationStatus`** (`DISCOVERED`/`VERIFIED`/`OWNER_CLAIMED`/
  `OWNER_VERIFIED`/`CLOSED`/`NEEDS_REVIEW`) tracks how trustworthy a listing's
  data is, independent of publish status.
- **Provenance fields** on `Property` (`sourceRecordId`, `source`, `sourceUrl`,
  `sourceLastCheckedAt`, `rawCategory`, `rawLocality`) preserve exactly what
  the research spreadsheet said, even after the data is normalized into
  `Category`/`Location` relations. `lastVerifiedAt` is separate and stays
  `null` until an admin actually verifies the listing — it is never inferred
  from the spreadsheet's "Last Checked" (research) date.

## Import pipeline

Code: `src/lib/import/*.ts` (pure, unit-tested logic) + `scripts/import-xlsx.ts`
(CLI orchestration + DB writes).

### What the source workbook actually contains

The workbook has 5 sheets. Only **`400 Record Master`** is read — it's the
union of the other two data sheets (`Discovered Records` + `Verification
Queue` = 400 rows); `Category Summary` and `Status Summary` are pivot views,
not source data.

Each row's `Record Type` column puts it into one of three buckets:

| Record Type | Count | Handling |
|---|---|---|
| `Property/Business` | 219 | Imported as a `Property` (status `DRAFT`). |
| `Venue Space / Outlet` | 73 | Imported as a `VenueSpace`, linked to its parent `Property` by matching the `Parent Property` column against listing names. |
| `Verification Queue` | 108 | **Never imported as a `Property`.** These rows have placeholder names like `"Verification Queue 070"` — not real businesses. Creating listings from them would fabricate businesses, which the product spec explicitly forbids. They are only counted/categorized in the import report. |

The spreadsheet is genuinely sparse: only ID, Listing Name, Record Type,
Category, Locality, Status, Source and Last Checked are populated for any
row. Every other column (address, phone, website, rating, price, facilities,
etc.) is blank throughout. **The importer never fills in a blank field with a
guess** — it imports exactly what's there and leaves the rest `null` for a
human to research and verify later.

### Pipeline steps

1. **Read** — `readWorkbook.ts` loads the `400 Record Master` sheet and maps
   its headers to typed fields.
2. **Validate** — `validate.ts` requires ID, Listing Name, a recognized
   Record Type, Category and Locality; Venue Space rows additionally require
   a Parent Property. Rows that fail are rejected (not imported) and listed
   individually in the report with reasons.
3. **Normalize** — `categories.ts` maps each raw Category (e.g.
   `"Hotel/Banquet"`, `"Club/Wedding Venue"`) onto one of the 15 core
   categories from the product spec by trying each `/`-separated segment
   against a synonym table; if nothing matches confidently, it **auto-creates**
   a category from the raw text instead of forcing a wrong classification, and
   flags it in the report for human review. `locations.ts` does the
   equivalent for Locality (Location has no fixed core list in the spec, so
   every distinct primary locality becomes its own `Location`).
4. **Duplicate detection** — `duplicates.ts` groups properties by
   whitespace/punctuation/case-normalized name. A group sharing the same
   locality is flagged `high` confidence; a same-name-different-locality group
   is flagged `medium`. Flagged properties are imported with
   `verificationStatus = NEEDS_REVIEW` — **never auto-merged or dropped**.
5. **Venue space linking** — each Venue Space's `Parent Property` text is
   matched against normalized Property/Business names. Unresolved ones (no
   confident match) are **held out of the DB write entirely** and listed in
   the report — they are not linked to a wrong parent or silently dropped.
6. **Report** — `report.ts` produces both a console summary and
   `data/import-report.json`, covering: valid/rejected counts, category
   breakdown (core vs. auto-created), duplicate candidate groups, unresolved
   venue spaces, and a private summary of excluded Verification Queue records
   (counts by category/locality only — never their placeholder names).
7. **Commit (optional, `--commit` only)** — upserts Categories and Locations
   by slug, then Properties by `sourceRecordId` (so re-running the importer
   is idempotent), then resolved Venue Spaces by `sourceRecordId`. Runs inside
   a single Prisma transaction.

### Import rules enforced

Per the product spec's "Import rules" section:

- Blank values are preserved as `null`, never fabricated.
- Phone, website, rating, price and facilities are never invented — this
  dataset has none populated, so none are set.
- `sourceRecordId`, `source`, raw category/locality text are preserved
  on every imported record.
- Verification Queue records never become public — they're excluded from
  `Property` creation entirely, not just hidden behind a status flag.
- Duplicates are flagged, not merged.
- Venue spaces are linked to parent properties where a confident name match
  exists; the rest are reported, not guessed at.
- The original spreadsheet `ID` is preserved as `sourceRecordId` on every
  record, keeping the import idempotent and traceable back to source.

## Known issues / follow-ups

- `npm audit` reports two upstream findings with no clean fix at this stage:
  - `deepmerge-ts` (via Prisma CLI's `@prisma/config`, a dev-time-only
    dependency) — no supported Prisma version resolves this at time of
    writing without dropping to an unsupported/older release.
  - `xlsx` (SheetJS) — the npm-published package has known ReDoS/prototype-
    pollution advisories with no npm-registry fix. It is only used by the
    build-time import script against a trusted local file, not by the running
    web app or on untrusted/user-uploaded input, which limits real exposure.
    Revisit before ever accepting user-uploaded spreadsheets.
- 5 Venue Space rows and the `133`/`151` ("Focus Club and/And Resort")
  duplicate pair need a human decision — see `data/import-report.json` after
  running the importer.
