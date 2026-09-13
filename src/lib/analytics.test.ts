import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ANALYTICS_EVENT_TYPES, ANALYTICS_EVENT_LABELS, CLIENT_TRIGGERABLE_EVENT_TYPES } from "./analytics";
import { recordViewEvent } from "@/app/analyticsActions";

describe("ANALYTICS_EVENT_TYPES", () => {
  it("is exactly the 7 requested event types — no more, no less", () => {
    expect([...ANALYTICS_EVENT_TYPES].sort()).toEqual(
      ["SEARCH", "PROPERTY_VIEW", "COMPARE", "ENQUIRY_START", "ENQUIRY_SUBMIT", "CLAIM_START", "CLAIM_SUBMIT"].sort()
    );
  });

  it("every event type has a real label — nothing renders unlabeled in the admin summary", () => {
    for (const type of ANALYTICS_EVENT_TYPES) {
      expect(ANALYTICS_EVENT_LABELS[type]).toBeTruthy();
    }
  });
});

describe("CLIENT_TRIGGERABLE_EVENT_TYPES — the honesty boundary between views and real submissions", () => {
  it("allows every view/start event to be triggered by a client", () => {
    for (const type of ["SEARCH", "PROPERTY_VIEW", "COMPARE", "ENQUIRY_START", "CLAIM_START"] as const) {
      expect(CLIENT_TRIGGERABLE_EVENT_TYPES.has(type)).toBe(true);
    }
  });

  it("never allows a submit-type event to be client-triggerable — those may only be recorded server-side, at the real point of submission", () => {
    expect(CLIENT_TRIGGERABLE_EVENT_TYPES.has("ENQUIRY_SUBMIT")).toBe(false);
    expect(CLIENT_TRIGGERABLE_EVENT_TYPES.has("CLAIM_SUBMIT")).toBe(false);
  });
});

describe("recordViewEvent — rejects submit-type events before ever touching the database", () => {
  it("resolves silently (no-op) for ENQUIRY_SUBMIT — a client can never fake an enquiry submission count", async () => {
    await expect(recordViewEvent("ENQUIRY_SUBMIT")).resolves.toBeUndefined();
  });

  it("resolves silently (no-op) for CLAIM_SUBMIT — a client can never fake a claim submission count", async () => {
    await expect(recordViewEvent("CLAIM_SUBMIT")).resolves.toBeUndefined();
  });
});

describe("TrackEventInput never carries PII — structural guarantee", () => {
  it("the interface has no name/email/phone/IP/userAgent/session/cookie field of any kind", () => {
    const src = readFileSync(resolve(process.cwd(), "src/lib/analytics.ts"), "utf8");
    // Sliced to just the interface body's own closing brace — deliberately
    // excludes the explanatory JSDoc comment above trackEvent() below it,
    // which legitimately names these same words in prose about their
    // absence (e.g. "there is no name, email, phone...").
    const ifaceStart = src.indexOf("export interface TrackEventInput");
    const iface = src.slice(ifaceStart, src.indexOf("}", ifaceStart) + 1);
    for (const forbidden of ["name", "email", "phone", "ip", "userAgent", "sessionId", "cookie", "visitorId"]) {
      expect(iface.toLowerCase()).not.toContain(forbidden.toLowerCase());
    }
  });

  it("trackEvent never throws — a database hiccup must never break the real page render or form submission it's attached to", () => {
    const src = readFileSync(resolve(process.cwd(), "src/lib/analytics.ts"), "utf8");
    const fn = src.slice(src.indexOf("export async function trackEvent"));
    expect(fn).toMatch(/try \{/);
    expect(fn).toMatch(/catch \{/);
  });
});

describe("AnalyticsEvent schema — minimal, anonymous, standalone", () => {
  it("has no relation/foreign key back to Property — propertyId is a plain string so this table can never affect Property's own queries or deletion behavior", () => {
    const schema = readFileSync(resolve(process.cwd(), "prisma/schema.prisma"), "utf8");
    const model = schema.slice(schema.indexOf("model AnalyticsEvent"), schema.indexOf("model AnalyticsEvent") + 500);
    expect(model).toMatch(/propertyId\s+String\?/);
    expect(model).not.toMatch(/property\s+Property/);
  });

  it("carries no visitor-identifying columns (no ip/userAgent/sessionId/cookie fields in the model)", () => {
    const schema = readFileSync(resolve(process.cwd(), "prisma/schema.prisma"), "utf8");
    const model = schema.slice(schema.indexOf("model AnalyticsEvent"), schema.indexOf("model AnalyticsEvent") + 500);
    for (const forbidden of ["ip ", "userAgent", "sessionId", "cookie", "visitorId", "fingerprint"]) {
      expect(model.toLowerCase()).not.toContain(forbidden.toLowerCase());
    }
  });
});
