import { describe, expect, it } from "vitest";
import {
  allPhotoUrlsValid,
  buildClaimRequestDataFromSubmission,
  buildPropertyCreateDataFromSubmission,
  buildPropertyImagesCreateDataFromSubmission,
  buildPropertySubmissionCreateData,
  findObviousDuplicate,
  normalizeNameForDuplicateMatch,
  parsePhotoUrls,
  propertySubmissionSchema,
} from "./propertySubmission";

describe("PHASE 6 — propertySubmissionSchema", () => {
  const validInput = {
    name: "New Cafe Ranchi",
    categoryId: "cat1",
    localityId: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    description: "",
    contactName: "Jane Doe",
    contactRole: "Owner",
    contactEmail: "jane@example.com",
    contactPhone: "9876543210",
    venueDetails: "",
    logoUrl: "",
    photoUrlsRaw: "",
    honeypot: "",
  };

  it("accepts a minimal valid submission with only required fields", () => {
    const result = propertySubmissionSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects a submission missing the business name", () => {
    const result = propertySubmissionSchema.safeParse({ ...validInput, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a submission missing contact details (never allows an anonymous submitter)", () => {
    const result = propertySubmissionSchema.safeParse({ ...validInput, contactName: "", contactEmail: "", contactPhone: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid contact phone number", () => {
    const result = propertySubmissionSchema.safeParse({ ...validInput, contactPhone: "not-a-phone" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid logo URL", () => {
    const result = propertySubmissionSchema.safeParse({ ...validInput, logoUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("accepts an empty logo URL as absent (nullable, not required)", () => {
    const result = propertySubmissionSchema.safeParse({ ...validInput, logoUrl: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.logoUrl).toBeNull();
  });
});

describe("PHASE 6 — parsePhotoUrls / allPhotoUrlsValid", () => {
  it("splits newline-separated URLs, trimming blank lines", () => {
    expect(parsePhotoUrls("https://a.com/1.jpg\n\nhttps://a.com/2.jpg\n")).toEqual([
      "https://a.com/1.jpg",
      "https://a.com/2.jpg",
    ]);
  });

  it("caps at MAX_SUBMISSION_PHOTOS (5) even if more are pasted", () => {
    const raw = Array.from({ length: 8 }, (_, i) => `https://a.com/${i}.jpg`).join("\n");
    expect(parsePhotoUrls(raw)).toHaveLength(5);
  });

  it("returns [] for null/empty input", () => {
    expect(parsePhotoUrls(null)).toEqual([]);
    expect(parsePhotoUrls("")).toEqual([]);
  });

  it("flags a non-URL line as invalid", () => {
    expect(allPhotoUrlsValid("https://a.com/1.jpg\nnot a url")).toBe(false);
  });

  it("accepts all-valid lines", () => {
    expect(allPhotoUrlsValid("https://a.com/1.jpg\nhttps://b.com/2.jpg")).toBe(true);
  });
});

describe("PHASE 6 — findObviousDuplicate", () => {
  const candidates = [
    { id: "p1", name: "Aangan Resort", localityId: "loc-ranchi" },
    { id: "p2", name: "Hotel Capitol Hill", localityId: "loc-doranda" },
  ];

  it("matches an exact (case/whitespace-insensitive) name with the same locality", () => {
    const match = findObviousDuplicate({ name: "  aangan   resort ", localityId: "loc-ranchi" }, candidates);
    expect(match?.id).toBe("p1");
  });

  it("does not match a same-named business in a different, both-known locality", () => {
    const match = findObviousDuplicate({ name: "Aangan Resort", localityId: "loc-doranda" }, candidates);
    expect(match).toBeNull();
  });

  it("still flags a same-named match when the submission's locality is unknown", () => {
    const match = findObviousDuplicate({ name: "Aangan Resort", localityId: null }, candidates);
    expect(match?.id).toBe("p1");
  });

  it("never fuzzy-matches a genuinely different name", () => {
    const match = findObviousDuplicate({ name: "Aangan Palace", localityId: "loc-ranchi" }, candidates);
    expect(match).toBeNull();
  });

  it("normalizeNameForDuplicateMatch collapses whitespace and case", () => {
    expect(normalizeNameForDuplicateMatch("  The   Aangan  Resort ")).toBe("the aangan resort");
  });
});

describe("PHASE 6 — buildPropertySubmissionCreateData", () => {
  it("never includes any Property-table field (status/verificationStatus/claimed/slug) — a submission never touches the live listing table", () => {
    const data = buildPropertySubmissionCreateData(
      {
        name: "Test",
        categoryId: "c1",
        localityId: null,
        address: null,
        phone: null,
        email: null,
        website: null,
        description: null,
        contactName: "A",
        contactRole: "Owner",
        contactEmail: "a@b.com",
        contactPhone: "9999999999",
        venueDetails: null,
        logoUrl: null,
        photoUrlsRaw: null,
        honeypot: null,
      },
      { facilityIds: ["f1"], photoUrls: ["https://a.com/1.jpg"], duplicateOfPropertyId: null }
    );
    expect(data).not.toHaveProperty("status");
    expect(data).not.toHaveProperty("verificationStatus");
    expect(data).not.toHaveProperty("claimed");
    expect(data).not.toHaveProperty("slug");
    expect(data.facilityIds).toEqual(["f1"]);
    expect(data.photoUrls).toEqual(["https://a.com/1.jpg"]);
  });
});

describe("PHASE 6 — buildPropertyCreateDataFromSubmission (approval)", () => {
  const submission = {
    name: "New Cafe",
    categoryId: "cat1",
    localityId: "loc1",
    address: "Main Road",
    phone: "1234567890",
    email: "cafe@example.com",
    website: "https://cafe.example.com",
    description: "A cozy cafe.",
  };

  it("publishes the property (status PUBLISHED) and marks it claimed by the submitter", () => {
    const data = buildPropertyCreateDataFromSubmission(submission, "new-cafe");
    expect(data.status).toBe("PUBLISHED");
    expect(data.claimed).toBe(true);
  });

  it("never sets verificationStatus to anything but DISCOVERED — verification always stays a separate, later, explicit decision", () => {
    const data = buildPropertyCreateDataFromSubmission(submission, "new-cafe");
    expect(data.verificationStatus).toBe("DISCOVERED");
  });

  it("records provenance as a vendor self-submission, distinct from research-sourced listings", () => {
    const data = buildPropertyCreateDataFromSubmission(submission, "new-cafe");
    expect(data.source).toBe("Vendor self-submission");
  });

  it("uses the slug given by the caller, never invents its own", () => {
    const data = buildPropertyCreateDataFromSubmission(submission, "a-specific-slug");
    expect(data.slug).toBe("a-specific-slug");
  });
});

describe("PHASE 6 — buildClaimRequestDataFromSubmission (approval)", () => {
  it("creates an already-APPROVED claim so the submitter gets the same owner-access mechanism a claimed listing's owner would", () => {
    const data = buildClaimRequestDataFromSubmission(
      { contactName: "Jane", contactRole: "Owner", contactEmail: "jane@example.com", contactPhone: "9876543210" },
      { propertyId: "prop1", adminId: "admin1", now: new Date("2026-01-01") }
    );
    expect(data.status).toBe("APPROVED");
    expect(data.ownerName).toBe("Jane");
    expect(data.email).toBe("jane@example.com");
    expect(data.phone).toBe("9876543210");
    expect(data.businessRole).toBe("Owner");
    expect(data.propertyId).toBe("prop1");
    expect(data.reviewedById).toBe("admin1");
  });
});

describe("PHASE 6 — buildPropertyImagesCreateDataFromSubmission", () => {
  it("puts the logo first, then photos, in stable sortOrder", () => {
    const images = buildPropertyImagesCreateDataFromSubmission({
      logoUrl: "https://a.com/logo.jpg",
      photoUrls: ["https://a.com/1.jpg", "https://a.com/2.jpg"],
    });
    expect(images).toEqual([
      { url: "https://a.com/logo.jpg", sortOrder: 0 },
      { url: "https://a.com/1.jpg", sortOrder: 1 },
      { url: "https://a.com/2.jpg", sortOrder: 2 },
    ]);
  });

  it("returns an empty array when neither logo nor photos were supplied — never fabricates an image", () => {
    expect(buildPropertyImagesCreateDataFromSubmission({ logoUrl: null, photoUrls: [] })).toEqual([]);
  });
});
