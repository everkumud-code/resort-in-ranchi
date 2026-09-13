import type { ImportPlan } from "./transform";

export interface ImportReport {
  generatedAt: string;
  sourceFile: string;
  totals: {
    rowsRead: number;
    propertiesValid: number;
    propertiesFlaggedForReview: number;
    propertiesMerged: number;
    venueSpacesResolved: number;
    venueSpacesUnresolved: number;
    verificationQueueExcluded: number;
    rejected: number;
  };
  categories: {
    core: { slug: string; name: string; count: number; parentName?: string }[];
    autoCreated: { slug: string; name: string; count: number; parentName?: string }[];
  };
  appliedMerges: {
    mergeSourceRecordId: string;
    intoSourceRecordId: string;
    reason: string;
  }[];
  duplicateGroups: {
    name: string;
    confidence: "high" | "medium";
    sourceRecordIds: string[];
    localities: string[];
  }[];
  unresolvedVenueSpaces: {
    sourceRecordId: string;
    name: string;
    rawParentName: string;
    reason: string;
  }[];
  resolvedVenueSpacesByOverride: {
    sourceRecordId: string;
    name: string;
    rawParentName: string;
    parentSourceRecordId: string;
  }[];
  rejected: {
    rowNumber: number;
    sourceRecordId: string | null;
    listingName: string | null;
    reasons: string[];
  }[];
  verificationQueueExcluded: {
    sourceRecordId: string;
    rawCategory: string;
    rawLocality: string;
  }[];
}

export function buildReport(plan: ImportPlan, sourceFile: string, rowsRead: number): ImportReport {
  const categoryCounts = new Map<string, number>();
  for (const p of plan.properties) {
    categoryCounts.set(p.categorySlug, (categoryCounts.get(p.categorySlug) ?? 0) + 1);
  }

  const core: ImportReport["categories"]["core"] = [];
  const autoCreated: ImportReport["categories"]["autoCreated"] = [];
  for (const [slug, cat] of plan.categoriesUsed) {
    const entry = { slug, name: cat.name, count: categoryCounts.get(slug) ?? 0, parentName: cat.parentName };
    if (cat.isCore) core.push(entry);
    else autoCreated.push(entry);
  }
  core.sort((a, b) => b.count - a.count);
  autoCreated.sort((a, b) => b.count - a.count);

  return {
    generatedAt: new Date().toISOString(),
    sourceFile,
    totals: {
      rowsRead,
      propertiesValid: plan.properties.length,
      propertiesFlaggedForReview: plan.properties.filter((p) => p.verificationStatus === "NEEDS_REVIEW").length,
      propertiesMerged: plan.appliedMerges.length,
      venueSpacesResolved: plan.venueSpacesResolved.length,
      venueSpacesUnresolved: plan.venueSpacesUnresolved.length,
      verificationQueueExcluded: plan.excludedVerificationQueue.length,
      rejected: plan.rejected.length,
    },
    categories: { core, autoCreated },
    appliedMerges: plan.appliedMerges,
    duplicateGroups: plan.duplicateGroups.map((g) => ({
      name: g.records[0]?.name ?? g.normalizedName,
      confidence: g.confidence,
      sourceRecordIds: g.records.map((r) => r.sourceRecordId),
      localities: [...new Set(g.records.map((r) => r.localityName))],
    })),
    unresolvedVenueSpaces: plan.venueSpacesUnresolved.map((v) => ({
      sourceRecordId: v.sourceRecordId,
      name: v.name,
      rawParentName: v.rawParentName,
      reason: v.unresolvedReason ?? "unknown",
    })),
    resolvedVenueSpacesByOverride: plan.venueSpacesResolved
      .filter((v) => v.resolvedVia === "manual-override")
      .map((v) => ({
        sourceRecordId: v.sourceRecordId,
        name: v.name,
        rawParentName: v.rawParentName,
        parentSourceRecordId: v.parentSourceRecordId!,
      })),
    rejected: plan.rejected,
    verificationQueueExcluded: plan.excludedVerificationQueue.map((v) => ({
      sourceRecordId: v.sourceRecordId,
      rawCategory: v.rawCategory,
      rawLocality: v.rawLocality,
    })),
  };
}

export function printReport(report: ImportReport): void {
  const t = report.totals;
  console.log("\n=== Import Report ===");
  console.log(`Source file: ${report.sourceFile}`);
  console.log(`Generated:   ${report.generatedAt}`);
  console.log(`\nRows read:                    ${t.rowsRead}`);
  console.log(`Properties valid:             ${t.propertiesValid}`);
  console.log(`  of which flagged for review: ${t.propertiesFlaggedForReview} (duplicate name candidates)`);
  console.log(`  of which merged away:        ${t.propertiesMerged} (curated duplicate merges)`);
  console.log(`Venue spaces resolved:        ${t.venueSpacesResolved}`);
  console.log(`Venue spaces UNRESOLVED:      ${t.venueSpacesUnresolved} (parent not found by name)`);
  console.log(`Verification Queue excluded:  ${t.verificationQueueExcluded} (never imported as businesses)`);
  console.log(`Rejected rows:                ${t.rejected}`);

  if (report.appliedMerges.length > 0) {
    console.log(`\n--- Curated merges applied (${report.appliedMerges.length}) ---`);
    for (const m of report.appliedMerges) {
      console.log(`  ID ${m.mergeSourceRecordId} merged into ID ${m.intoSourceRecordId}: ${m.reason}`);
    }
  }

  console.log(`\n--- Categories (core, matched to product spec) ---`);
  for (const c of report.categories.core) {
    console.log(`  ${c.name.padEnd(30)} ${c.count}`);
  }

  if (report.categories.autoCreated.length > 0) {
    console.log(`\n--- Categories (auto-created / curated, NOT in core spec list — review) ---`);
    for (const c of report.categories.autoCreated) {
      const parent = c.parentName ? ` (under "${c.parentName}")` : "";
      console.log(`  ${c.name.padEnd(30)} ${c.count}${parent}`);
    }
  }

  if (report.duplicateGroups.length > 0) {
    console.log(`\n--- Remaining duplicate candidates (${report.duplicateGroups.length} groups, flagged NEEDS_REVIEW, not merged) ---`);
    for (const g of report.duplicateGroups) {
      console.log(
        `  [${g.confidence.toUpperCase()}] "${g.name}" — source IDs ${g.sourceRecordIds.join(", ")} — localities: ${g.localities.join(", ")}`
      );
    }
  } else {
    console.log(`\n--- Remaining duplicate candidates: none ---`);
  }

  if (report.resolvedVenueSpacesByOverride.length > 0) {
    console.log(`\n--- Venue spaces resolved via manual override (${report.resolvedVenueSpacesByOverride.length}) ---`);
    for (const v of report.resolvedVenueSpacesByOverride) {
      console.log(`  ID ${v.sourceRecordId}: "${v.name}" -> parent source ID ${v.parentSourceRecordId} (raw parent text: "${v.rawParentName}")`);
    }
  }

  if (report.unresolvedVenueSpaces.length > 0) {
    console.log(`\n--- Remaining unresolved venue spaces (${report.unresolvedVenueSpaces.length}, held out of import) ---`);
    for (const v of report.unresolvedVenueSpaces) {
      console.log(`  ID ${v.sourceRecordId}: "${v.name}" -> parent "${v.rawParentName}": ${v.reason}`);
    }
  } else {
    console.log(`\n--- Remaining unresolved venue spaces: none ---`);
  }

  if (report.rejected.length > 0) {
    console.log(`\n--- Rejected rows (${report.rejected.length}) ---`);
    for (const r of report.rejected) {
      console.log(`  Row ${r.rowNumber} (ID ${r.sourceRecordId ?? "?"}, "${r.listingName ?? ""}"): ${r.reasons.join("; ")}`);
    }
  }

  console.log(
    `\n--- Verification Queue (${report.verificationQueueExcluded.length} records excluded — private, no fake businesses created) ---`
  );
  console.log("  (category/locality only — no names, since these have no real business name yet)");
  const byCategory = new Map<string, number>();
  for (const v of report.verificationQueueExcluded) {
    byCategory.set(v.rawCategory, (byCategory.get(v.rawCategory) ?? 0) + 1);
  }
  for (const [cat, count] of [...byCategory.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat.padEnd(30)} ${count}`);
  }

  console.log("\n=== End of report ===\n");
}
