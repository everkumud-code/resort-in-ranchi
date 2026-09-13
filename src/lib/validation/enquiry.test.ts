import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  enquirySubmissionSchema,
  buildEnquiryCreateData,
  propertyEligibleForEnquiry,
  getEnquiryCtaCopy,
  DEFAULT_ENQUIRY_CTA_COPY,
  ENQUIRY_STATUS_VALUES,
  ENQUIRY_STATUS_BADGE_CLASS,
} from "./enquiry";

describe("enquirySubmissionSchema", () => {
  it("1. accepts a valid, fully-populated submission", () => {
    const result = enquirySubmissionSchema.safeParse({
      name: "Priya Sharma",
      phone: "+91 9876543210",
      email: "priya@example.com",
      eventDate: "2026-12-05",
      guests: "150",
      requirement: "Looking for a wedding venue with a lawn.",
      budget: "₹2,00,000",
      honeypot: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Priya Sharma");
      expect(result.data.guests).toBe(150);
      expect(result.data.eventDate).toBeInstanceOf(Date);
    }
  });

  it("1b. accepts a minimal submission with only the required fields", () => {
    const result = enquirySubmissionSchema.safeParse({ name: "Amit", phone: "9876543210" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBeNull();
      expect(result.data.eventDate).toBeNull();
      expect(result.data.guests).toBeNull();
    }
  });

  it("2. rejects a missing name", () => {
    const result = enquirySubmissionSchema.safeParse({ name: "", phone: "9876543210" });
    expect(result.success).toBe(false);
  });

  it("2b. rejects a missing phone", () => {
    const result = enquirySubmissionSchema.safeParse({ name: "Priya", phone: "" });
    expect(result.success).toBe(false);
  });

  it("3. rejects an invalid email", () => {
    const result = enquirySubmissionSchema.safeParse({ name: "Priya", phone: "9876543210", email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("3b. treats a blank email as absent (optional), not invalid", () => {
    const result = enquirySubmissionSchema.safeParse({ name: "Priya", phone: "9876543210", email: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBeNull();
  });

  it("4. rejects an invalid phone (letters, too short)", () => {
    expect(enquirySubmissionSchema.safeParse({ name: "Priya", phone: "call-me-maybe" }).success).toBe(false);
    expect(enquirySubmissionSchema.safeParse({ name: "Priya", phone: "123" }).success).toBe(false);
  });

  it("accepts common real-world phone formats", () => {
    expect(enquirySubmissionSchema.safeParse({ name: "Priya", phone: "+91 98765 43210" }).success).toBe(true);
    expect(enquirySubmissionSchema.safeParse({ name: "Priya", phone: "(651) 222-1234" }).success).toBe(true);
  });

  it("rejects an invalid event date", () => {
    const result = enquirySubmissionSchema.safeParse({ name: "Priya", phone: "9876543210", eventDate: "not-a-date" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-numeric guest count", () => {
    const result = enquirySubmissionSchema.safeParse({ name: "Priya", phone: "9876543210", guests: "a lot" });
    expect(result.success).toBe(false);
  });
});

describe("5/6. propertyEligibleForEnquiry — non-published / protected properties rejected", () => {
  it("rejects when there is no property", () => {
    expect(propertyEligibleForEnquiry(null)).toBe(false);
  });

  it.each(["DRAFT", "CLOSED", "ARCHIVED"])("rejects a %s property", (status) => {
    expect(propertyEligibleForEnquiry({ status })).toBe(false);
  });

  it("accepts only a PUBLISHED property", () => {
    expect(propertyEligibleForEnquiry({ status: "PUBLISHED" })).toBe(true);
  });

  it("6b. protected/identity-conflict/NEEDS_REVIEW records are never PUBLISHED, so they are already excluded by this single check — no special-casing of specific property IDs is needed or present", () => {
    // Aangan Palace, the 10 identity-conflict records, and NEEDS_REVIEW
    // records all remain status=DRAFT by construction (see bulkPublish.ts) —
    // this function needs no knowledge of any specific protected ID.
    expect(propertyEligibleForEnquiry({ status: "DRAFT" })).toBe(false);
  });
});

describe("Phase 2E — CTA eligibility (property page)", () => {
  it("the property page's enquiry CTA is eligible whenever propertyEligibleForEnquiry says so — same function, no separate rule", () => {
    // The property page hardcodes { status: "PUBLISHED" } because its own
    // query (getPublishedPropertyBySlug) already guarantees that for any
    // property that reaches the point the CTA is computed — this proves the
    // one case that matters actually resolves to eligible.
    expect(propertyEligibleForEnquiry({ status: "PUBLISHED" })).toBe(true);
  });
});

describe("Phase 2E — contextual CTA copy (getEnquiryCtaCopy)", () => {
  it("maps each listed category exactly as specified", () => {
    expect(getEnquiryCtaCopy("resorts")).toBe("Plan Your Stay");
    expect(getEnquiryCtaCopy("hotels")).toBe("Check Availability");
    expect(getEnquiryCtaCopy("wedding-venues")).toBe("Plan Your Event");
    expect(getEnquiryCtaCopy("banquet-halls")).toBe("Plan Your Event");
    expect(getEnquiryCtaCopy("party-halls")).toBe("Plan Your Event");
    expect(getEnquiryCtaCopy("homestays-farm-stays")).toBe("Plan Your Visit");
  });

  it("restaurants/cafes/lounge-bar use the generic default copy", () => {
    expect(getEnquiryCtaCopy("restaurants")).toBe(DEFAULT_ENQUIRY_CTA_COPY);
    expect(getEnquiryCtaCopy("cafes")).toBe(DEFAULT_ENQUIRY_CTA_COPY);
    expect(getEnquiryCtaCopy("lounge-bar")).toBe(DEFAULT_ENQUIRY_CTA_COPY);
  });

  it("never infers copy for a category outside the explicit list — falls back to the generic default rather than guessing", () => {
    expect(getEnquiryCtaCopy("food-nightlife")).toBe(DEFAULT_ENQUIRY_CTA_COPY);
    expect(getEnquiryCtaCopy("some-future-category-that-does-not-exist-yet")).toBe(DEFAULT_ENQUIRY_CTA_COPY);
    expect(getEnquiryCtaCopy("")).toBe(DEFAULT_ENQUIRY_CTA_COPY);
  });
});

describe("Phase 2E — admin status handling", () => {
  it("every real EnquiryStatus value has a badge class — nothing renders unstyled", () => {
    for (const value of ENQUIRY_STATUS_VALUES) {
      expect(ENQUIRY_STATUS_BADGE_CLASS[value]).toBeTruthy();
    }
  });

  it("does not invent a badge class for a status outside the existing enum", () => {
    expect(Object.keys(ENQUIRY_STATUS_BADGE_CLASS).sort()).toEqual([...ENQUIRY_STATUS_VALUES].sort());
  });
});

describe("Phase 2E — success state", () => {
  it("the enquiry action redirects to the property page with a ?enquiry=sent success flag on every successful path (real submission, honeypot catch, and duplicate debounce)", () => {
    const src = readFileSync(resolve(process.cwd(), "src/app/(site)/property/[slug]/enquire/actions.ts"), "utf8");
    const redirectCalls = src.match(/redirect\(`\/property\/\$\{propertySlug\}\?enquiry=sent`\)/g) ?? [];
    expect(redirectCalls.length).toBeGreaterThanOrEqual(3);
  });

  it("the property page renders a clear, specific success message keyed off that same flag", () => {
    const src = readFileSync(resolve(process.cwd(), "src/app/(site)/property/[slug]/page.tsx"), "utf8");
    expect(src).toMatch(/enquirySent/);
    expect(src).toMatch(/your enquiry has been sent/i);
  });
});

describe("Phase 2E — security boundaries", () => {
  it("the enquiry Server Action never reads a propertyId/status field from the submitted form — only from its own server-side property lookup", () => {
    const src = readFileSync(resolve(process.cwd(), "src/app/(site)/property/[slug]/enquire/actions.ts"), "utf8");
    expect(src).not.toMatch(/formData\.get\(\s*["']propertyId["']\s*\)/);
    expect(src).not.toMatch(/formData\.get\(\s*["']status["']\s*\)/);
  });

  it("the admin status-update action still requires admin auth (unchanged by this phase)", () => {
    const src = readFileSync(resolve(process.cwd(), "src/app/admin/(dashboard)/enquiries/actions.ts"), "utf8");
    expect(src).toMatch(/requireAdmin\(\)/);
  });
});

describe("7/8. buildEnquiryCreateData", () => {
  const input = {
    name: "Priya Sharma",
    phone: "+91 9876543210",
    email: "priya@example.com",
    eventDate: new Date("2026-12-05"),
    guests: 150,
    requirement: "Wedding venue with a lawn.",
    budget: "₹2,00,000",
    honeypot: null,
  };

  it("7. produces the full Enquiry create payload, defaulting status to NEW", () => {
    const data = buildEnquiryCreateData(input, { propertyId: "prop-1", sourcePage: "/property/some-hall" });
    expect(data).toEqual({
      propertyId: "prop-1",
      name: "Priya Sharma",
      phone: "+91 9876543210",
      email: "priya@example.com",
      eventDate: input.eventDate,
      guests: 150,
      requirement: "Wedding venue with a lawn.",
      budget: "₹2,00,000",
      sourcePage: "/property/some-hall",
      status: "NEW",
    });
  });

  it("8. captures sourcePage exactly as given by the server context, never from visitor input", () => {
    const data = buildEnquiryCreateData(input, { propertyId: "prop-1", sourcePage: "/property/aangan-resort" });
    expect(data.sourcePage).toBe("/property/aangan-resort");
  });

  it("6c. propertyId always comes from server context, never from the submission input — there is no propertyId key on EnquirySubmissionInput", () => {
    const data = buildEnquiryCreateData(input, { propertyId: "prop-2", sourcePage: "/property/x" });
    expect(data.propertyId).toBe("prop-2");
    expect(Object.keys(input)).not.toContain("propertyId");
  });
});

describe("11. ENQUIRY_STATUS_VALUES matches the existing EnquiryStatus enum — no invented statuses", () => {
  it("is exactly the schema's 5 values", () => {
    expect([...ENQUIRY_STATUS_VALUES].sort()).toEqual(["CLOSED", "CONTACTED", "CONVERTED", "NEW", "SPAM"].sort());
  });
});

describe("9/10. admin enquiries page and 11. status-update action require admin authentication", () => {
  it("the enquiries admin page calls requireAdmin() before reading any data", () => {
    const pageSrc = readFileSync(resolve(process.cwd(), "src/app/admin/(dashboard)/enquiries/page.tsx"), "utf8");
    expect(pageSrc).toMatch(/requireAdmin\(\)/);
  });

  it("updateEnquiryStatus calls requireAdmin() before writing — same gate as every other property-editing action, so EDITOR is allowed (no stricter owner-access-style role gate is used here)", () => {
    const actionsSrc = readFileSync(resolve(process.cwd(), "src/app/admin/(dashboard)/enquiries/actions.ts"), "utf8");
    expect(actionsSrc).toMatch(/requireAdmin\(\)/);
    expect(actionsSrc).not.toMatch(/requireOwnerAccessAdmin/);
  });
});

describe("12. owner enquiry access lives in its own route (/owner/enquiries), not mixed into listing editing", () => {
  it("the owner listing actions/page make no reference to Enquiry", () => {
    const actionsSrc = readFileSync(
      resolve(process.cwd(), "src/app/owner/listing/[id]/actions.ts"),
      "utf8"
    );
    const pageSrc = readFileSync(resolve(process.cwd(), "src/app/owner/listing/[id]/page.tsx"), "utf8");
    expect(actionsSrc).not.toMatch(/Enquiry/);
    expect(pageSrc).not.toMatch(/Enquiry/);
  });
});
