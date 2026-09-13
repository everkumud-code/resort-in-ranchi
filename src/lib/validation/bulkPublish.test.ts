import { describe, expect, it } from "vitest";
import { computeBulkPublishPlan, BULK_PUBLISH_EXCLUDED_RED_IDS, BULK_PUBLISH_CONFIRM_PHRASE } from "./bulkPublish";
import { IDENTITY_CONFLICT_PROPERTY_IDS } from "./propertyLifecycle";

const AANGAN_RESORT_ID = "cmtsc3n2w009duzekl2tr6t24";
const AANGAN_PALACE_ID = "cmtsc3my4003fuzek83k22zl7";
const SOME_CONFLICT_ID = [...IDENTITY_CONFLICT_PROPERTY_IDS][0];
const SOME_RED_ID = [...BULK_PUBLISH_EXCLUDED_RED_IDS][0];

describe("computeBulkPublishPlan", () => {
  it("selects a plain DRAFT/DISCOVERED property as eligible", () => {
    const plan = computeBulkPublishPlan([{ id: "p1", status: "DRAFT", verificationStatus: "DISCOVERED" }]);
    expect(plan.eligibleIds).toEqual(["p1"]);
  });

  it("excludes an already-PUBLISHED property (e.g. Aangan Resort) without needing its id hardcoded", () => {
    const plan = computeBulkPublishPlan([
      { id: AANGAN_RESORT_ID, status: "PUBLISHED", verificationStatus: "VERIFIED" },
    ]);
    expect(plan.eligibleIds).toEqual([]);
    expect(plan.excludedAlreadyPublished).toEqual([AANGAN_RESORT_ID]);
  });

  it("excludes NEEDS_REVIEW properties (not DISCOVERED)", () => {
    const plan = computeBulkPublishPlan([{ id: "p2", status: "DRAFT", verificationStatus: "NEEDS_REVIEW" }]);
    expect(plan.eligibleIds).toEqual([]);
    expect(plan.excludedNotDiscovered).toEqual(["p2"]);
  });

  it("excludes CLOSED properties (not DISCOVERED)", () => {
    const plan = computeBulkPublishPlan([{ id: "p3", status: "CLOSED", verificationStatus: "CLOSED" }]);
    expect(plan.excludedNotDiscovered).toEqual(["p3"]);
  });

  it("excludes every known identity-conflict record", () => {
    const plan = computeBulkPublishPlan([
      { id: SOME_CONFLICT_ID, status: "DRAFT", verificationStatus: "DISCOVERED" },
    ]);
    expect(plan.eligibleIds).toEqual([]);
    expect(plan.excludedIdentityConflict).toEqual([SOME_CONFLICT_ID]);
  });

  it("excludes Aangan Palace even though it is a plain DRAFT/DISCOVERED record", () => {
    const plan = computeBulkPublishPlan([
      { id: AANGAN_PALACE_ID, status: "DRAFT", verificationStatus: "DISCOVERED" },
    ]);
    expect(plan.eligibleIds).toEqual([]);
    expect(plan.excludedProtected).toEqual([AANGAN_PALACE_ID]);
  });

  it("excludes every Batch 2A RED-held record", () => {
    const plan = computeBulkPublishPlan([{ id: SOME_RED_ID, status: "DRAFT", verificationStatus: "DISCOVERED" }]);
    expect(plan.eligibleIds).toEqual([]);
    expect(plan.excludedRed).toEqual([SOME_RED_ID]);
  });

  it("classifies a realistic mixed batch correctly and accounts for every input row exactly once", () => {
    const input = [
      { id: "eligible-1", status: "DRAFT", verificationStatus: "DISCOVERED" },
      { id: "eligible-2", status: "DRAFT", verificationStatus: "DISCOVERED" },
      { id: AANGAN_RESORT_ID, status: "PUBLISHED", verificationStatus: "VERIFIED" },
      { id: AANGAN_PALACE_ID, status: "DRAFT", verificationStatus: "DISCOVERED" },
      { id: SOME_CONFLICT_ID, status: "DRAFT", verificationStatus: "DISCOVERED" },
      { id: SOME_RED_ID, status: "DRAFT", verificationStatus: "DISCOVERED" },
      { id: "needs-review-1", status: "DRAFT", verificationStatus: "NEEDS_REVIEW" },
    ];
    const plan = computeBulkPublishPlan(input);
    expect(plan.eligibleIds.sort()).toEqual(["eligible-1", "eligible-2"]);

    const allClassified = [
      ...plan.eligibleIds,
      ...plan.excludedAlreadyPublished,
      ...plan.excludedNotDiscovered,
      ...plan.excludedIdentityConflict,
      ...plan.excludedProtected,
      ...plan.excludedRed,
    ];
    expect(allClassified.sort()).toEqual(input.map((p) => p.id).sort());
  });
});

describe("BULK_PUBLISH_CONFIRM_PHRASE", () => {
  it("is a non-trivial phrase, not something a stray click could type", () => {
    expect(BULK_PUBLISH_CONFIRM_PHRASE.length).toBeGreaterThan(10);
  });
});
