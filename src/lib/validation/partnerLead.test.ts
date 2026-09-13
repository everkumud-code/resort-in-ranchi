import { describe, expect, it } from "vitest";
import {
  PARTNER_LEAD_STATUS_BADGE_CLASS,
  PARTNER_LEAD_STATUS_LABELS,
  PARTNER_LEAD_STATUS_VALUES,
  isValidPartnerLeadStatus,
} from "./partnerLead";

describe("PHASE 7 — PartnerLead status constants", () => {
  it("every status value has a label", () => {
    for (const value of PARTNER_LEAD_STATUS_VALUES) {
      expect(PARTNER_LEAD_STATUS_LABELS[value]).toBeTruthy();
    }
  });

  it("every status value has a badge class", () => {
    for (const value of PARTNER_LEAD_STATUS_VALUES) {
      expect(PARTNER_LEAD_STATUS_BADGE_CLASS[value]).toBeTruthy();
    }
  });

  it("includes NEW, CONTACTED, CONVERTED and a closed/lost equivalent — nothing else", () => {
    expect(PARTNER_LEAD_STATUS_VALUES).toEqual(["NEW", "CONTACTED", "CONVERTED", "CLOSED_LOST"]);
  });
});

describe("PHASE 7 — isValidPartnerLeadStatus", () => {
  it("accepts every real status value", () => {
    for (const value of PARTNER_LEAD_STATUS_VALUES) {
      expect(isValidPartnerLeadStatus(value)).toBe(true);
    }
  });

  it("rejects an arbitrary/invented status — never trusts unchecked form input", () => {
    expect(isValidPartnerLeadStatus("APPROVED")).toBe(false);
    expect(isValidPartnerLeadStatus("")).toBe(false);
    expect(isValidPartnerLeadStatus("new")).toBe(false);
  });
});
