import { normalizeCategory, type NormalizedCategory } from "./categories";
import {
  PROPERTY_CATEGORY_OVERRIDES,
  PROPERTY_MERGES,
  VENUE_SPACE_PARENT_OVERRIDES,
  VENUE_SPACE_PINNED_UNRESOLVED,
} from "./curatedDecisions";
import { normalizeLocation, type NormalizedLocation } from "./locations";
import { findDuplicateCandidates, normalizeNameForComparison, type DuplicateCandidate } from "./duplicates";
import type { MasterRow } from "./readWorkbook";
import { uniqueSlug } from "./slugify";
import { RECORD_TYPES, validateRow } from "./validate";

export interface PropertyImportInput {
  sourceRecordId: string;
  name: string;
  slug: string;
  categorySlug: string;
  categoryName: string;
  categoryIsCore: boolean;
  categoryParentSlug: string | null;
  categoryParentName: string | null;
  rawCategory: string;
  localitySlug: string;
  localityName: string;
  rawLocality: string;
  status: "DRAFT";
  verificationStatus: "DISCOVERED" | "NEEDS_REVIEW";
  source: string | null;
  sourceLastCheckedAt: string | null;
  duplicateOfSourceRecordIds: string[];
  /** sourceRecordIds of other rows merged into this one as confirmed duplicates. */
  mergedFromSourceRecordIds: string[];
}

export interface VenueSpaceImportInput {
  sourceRecordId: string;
  name: string;
  rawParentName: string;
  parentSourceRecordId: string | null;
  resolvedVia: "auto-match" | "manual-override" | null;
  unresolvedReason: string | null;
}

export interface ExcludedVerificationQueueRecord {
  sourceRecordId: string;
  rawCategory: string;
  rawLocality: string;
  note: string;
}

export interface RejectedRecord {
  rowNumber: number;
  sourceRecordId: string | null;
  listingName: string | null;
  reasons: string[];
}

export interface AppliedMerge {
  mergeSourceRecordId: string;
  intoSourceRecordId: string;
  reason: string;
}

export interface ImportPlan {
  properties: PropertyImportInput[];
  venueSpacesResolved: VenueSpaceImportInput[];
  venueSpacesUnresolved: VenueSpaceImportInput[];
  excludedVerificationQueue: ExcludedVerificationQueueRecord[];
  rejected: RejectedRecord[];
  duplicateGroups: DuplicateCandidate<PropertyImportInput>[];
  categoriesUsed: Map<string, NormalizedCategory & { parentSlug?: string; parentName?: string }>;
  locationsUsed: Map<string, NormalizedLocation>;
  appliedMerges: AppliedMerge[];
}

function parseLastChecked(raw: string | null): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function buildImportPlan(rows: MasterRow[]): ImportPlan {
  const rejected: RejectedRecord[] = [];
  const validRows: MasterRow[] = [];

  for (const row of rows) {
    const { valid, reasons } = validateRow(row);
    if (!valid) {
      rejected.push({
        rowNumber: row.rowNumber,
        sourceRecordId: row.id !== null ? String(row.id) : null,
        listingName: row.listingName,
        reasons,
      });
      continue;
    }
    validRows.push(row);
  }

  const propertyRows = validRows.filter((r) => r.recordType === RECORD_TYPES.PROPERTY);
  const venueSpaceRows = validRows.filter((r) => r.recordType === RECORD_TYPES.VENUE_SPACE);
  const verificationQueueRows = validRows.filter((r) => r.recordType === RECORD_TYPES.VERIFICATION_QUEUE);

  const categoriesUsed = new Map<string, NormalizedCategory & { parentSlug?: string; parentName?: string }>();
  const locationsUsed = new Map<string, NormalizedLocation>();

  // --- Build raw property inputs (no slug yet — assigned after merging). ---
  const categoryOverrideBySourceId = new Map(PROPERTY_CATEGORY_OVERRIDES.map((o) => [o.sourceRecordId, o]));

  let properties: PropertyImportInput[] = propertyRows.map((row) => {
    const sourceRecordId = String(row.id);
    const override = categoryOverrideBySourceId.get(sourceRecordId);
    const location = normalizeLocation(String(row.locality));
    locationsUsed.set(location.slug, location);

    let categorySlug: string;
    let categoryName: string;
    let categoryIsCore: boolean;
    let categoryParentSlug: string | null = null;
    let categoryParentName: string | null = null;

    if (override) {
      categorySlug = override.categorySlug;
      categoryName = override.categoryName;
      categoryIsCore = false;
      categoryParentSlug = override.parentCategorySlug ?? null;
      categoryParentName = override.parentCategoryName ?? null;
      categoriesUsed.set(categorySlug, {
        name: categoryName,
        slug: categorySlug,
        isCore: false,
        rawSegments: [String(row.category)],
        matchedSegment: String(row.category),
        parentSlug: categoryParentSlug ?? undefined,
        parentName: categoryParentName ?? undefined,
      });
      if (categoryParentSlug && categoryParentName && !categoriesUsed.has(categoryParentSlug)) {
        categoriesUsed.set(categoryParentSlug, {
          name: categoryParentName,
          slug: categoryParentSlug,
          isCore: false,
          rawSegments: [],
          matchedSegment: "",
        });
      }
    } else {
      const category = normalizeCategory(String(row.category));
      categorySlug = category.slug;
      categoryName = category.name;
      categoryIsCore = category.isCore;
      categoriesUsed.set(category.slug, category);
    }

    return {
      sourceRecordId,
      name: String(row.listingName).trim(),
      slug: "", // assigned after merge resolution
      categorySlug,
      categoryName,
      categoryIsCore,
      categoryParentSlug,
      categoryParentName,
      rawCategory: String(row.category),
      localitySlug: location.slug,
      localityName: location.name,
      rawLocality: String(row.locality),
      status: "DRAFT",
      verificationStatus: "DISCOVERED",
      source: row.source,
      sourceLastCheckedAt: parseLastChecked(row.lastChecked),
      duplicateOfSourceRecordIds: [],
      mergedFromSourceRecordIds: [],
    };
  });

  // --- Apply curated merge decisions (human-confirmed duplicates only). ---
  const appliedMerges: AppliedMerge[] = [];
  const propertyBySourceId = new Map(properties.map((p) => [p.sourceRecordId, p]));
  const mergedAwayIds = new Set<string>();

  for (const rule of PROPERTY_MERGES) {
    const canonical = propertyBySourceId.get(rule.intoSourceRecordId);
    const merged = propertyBySourceId.get(rule.mergeSourceRecordId);
    if (!canonical || !merged) continue; // rule doesn't apply to this dataset — skip silently
    canonical.mergedFromSourceRecordIds.push(rule.mergeSourceRecordId, ...merged.mergedFromSourceRecordIds);
    mergedAwayIds.add(rule.mergeSourceRecordId);
    appliedMerges.push({ ...rule });
  }

  properties = properties.filter((p) => !mergedAwayIds.has(p.sourceRecordId));

  // --- Assign slugs now that the final property set is known. ---
  const slugsTaken = new Set<string>();
  for (const p of properties) {
    p.slug = uniqueSlug(p.name, slugsTaken);
  }

  // --- Duplicate detection on the post-merge set: flag, never merge/drop. ---
  const duplicateGroups = findDuplicateCandidates(
    properties,
    (p) => p.name,
    (p) => p.localityName
  );
  for (const group of duplicateGroups) {
    const ids = group.records.map((p) => p.sourceRecordId);
    for (const record of group.records) {
      record.verificationStatus = "NEEDS_REVIEW";
      record.duplicateOfSourceRecordIds = ids.filter((id) => id !== record.sourceRecordId);
    }
  }

  // --- Resolve Venue Space -> parent Property. ---
  const nameToSourceId = new Map<string, string>();
  for (const p of properties) {
    nameToSourceId.set(normalizeNameForComparison(p.name), p.sourceRecordId);
  }

  const pinnedUnresolvedById = new Map(VENUE_SPACE_PINNED_UNRESOLVED.map((o) => [o.venueSpaceSourceRecordId, o]));
  const parentOverrideById = new Map(VENUE_SPACE_PARENT_OVERRIDES.map((o) => [o.venueSpaceSourceRecordId, o]));

  const venueSpacesResolved: VenueSpaceImportInput[] = [];
  const venueSpacesUnresolved: VenueSpaceImportInput[] = [];

  for (const row of venueSpaceRows) {
    const sourceRecordId = String(row.id);
    const fullName = String(row.listingName).trim();
    const parentRaw = String(row.parentProperty).trim();
    const emDashIndex = fullName.indexOf("—");
    const spaceName = emDashIndex >= 0 ? fullName.slice(0, emDashIndex).trim() : fullName;

    const pinned = pinnedUnresolvedById.get(sourceRecordId);
    if (pinned) {
      venueSpacesUnresolved.push({
        sourceRecordId,
        name: spaceName || fullName,
        rawParentName: parentRaw,
        parentSourceRecordId: null,
        resolvedVia: null,
        unresolvedReason: pinned.reason,
      });
      continue;
    }

    const override = parentOverrideById.get(sourceRecordId);
    if (override) {
      const parentId = nameToSourceId.get(normalizeNameForComparison(override.parentPropertyName));
      if (parentId) {
        venueSpacesResolved.push({
          sourceRecordId,
          name: spaceName || fullName,
          rawParentName: parentRaw,
          parentSourceRecordId: parentId,
          resolvedVia: "manual-override",
          unresolvedReason: null,
        });
        continue;
      }
      // Override target not found in this dataset — fall through to reporting as unresolved
      // rather than silently failing.
      venueSpacesUnresolved.push({
        sourceRecordId,
        name: spaceName || fullName,
        rawParentName: parentRaw,
        parentSourceRecordId: null,
        resolvedVia: null,
        unresolvedReason: `Manual override target "${override.parentPropertyName}" was not found among imported properties.`,
      });
      continue;
    }

    const autoMatchId = nameToSourceId.get(normalizeNameForComparison(parentRaw));
    if (autoMatchId) {
      venueSpacesResolved.push({
        sourceRecordId,
        name: spaceName || fullName,
        rawParentName: parentRaw,
        parentSourceRecordId: autoMatchId,
        resolvedVia: "auto-match",
        unresolvedReason: null,
      });
    } else {
      venueSpacesUnresolved.push({
        sourceRecordId,
        name: spaceName || fullName,
        rawParentName: parentRaw,
        parentSourceRecordId: null,
        resolvedVia: null,
        unresolvedReason: `No property named "${parentRaw}" (or a normalized match) found among imported Property/Business rows.`,
      });
    }
  }

  const excludedVerificationQueue: ExcludedVerificationQueueRecord[] = verificationQueueRows.map((row) => ({
    sourceRecordId: String(row.id),
    rawCategory: String(row.category),
    rawLocality: String(row.locality),
    note:
      "Verification Queue placeholder — no real business name yet. " +
      "Excluded from Property import per product spec (never fabricate businesses from queue records).",
  }));

  return {
    properties,
    venueSpacesResolved,
    venueSpacesUnresolved,
    excludedVerificationQueue,
    rejected,
    duplicateGroups,
    categoriesUsed,
    locationsUsed,
    appliedMerges,
  };
}
