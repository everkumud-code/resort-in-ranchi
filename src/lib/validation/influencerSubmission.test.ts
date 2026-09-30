import { describe, expect, it } from "vitest";
import {
  buildInfluencerClaimRequestDataFromSubmission,
  buildInfluencerCreateDataFromSubmission,
  buildInfluencerSubmissionCreateData,
  findObviousInfluencerDuplicate,
  influencerSubmissionSchema,
  normalizeNameForDuplicateMatch,
} from "./influencerSubmission";

describe("influencerSubmissionSchema", () => {
  const validInput = {
    name: "Ranchi Foodie",
    category: "Food",
    bio: "",
    instagramUrl: "",
    youtubeUrl: "",
    websiteUrl: "",
    photoUrl: "",
    contactName: "Jane Doe",
    contactEmail: "jane@example.com",
    contactPhone: "9876543210",
    honeypot: "",
  };

  it("accepts a minimal valid submission with only required fields", () => {
    const result = influencerSubmissionSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects a submission missing the name", () => {
    const result = influencerSubmissionSchema.safeParse({ ...validInput, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a submission missing contact details (never allows an anonymous submitter)", () => {
    const result = influencerSubmissionSchema.safeParse({ ...validInput, contactName: "", contactEmail: "", contactPhone: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid contact phone number", () => {
    const result = influencerSubmissionSchema.safeParse({ ...validInput, contactPhone: "not-a-phone" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid Instagram URL", () => {
    const result = influencerSubmissionSchema.safeParse({ ...validInput, instagramUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("accepts an empty Instagram URL as absent (nullable, not required)", () => {
    const result = influencerSubmissionSchema.safeParse({ ...validInput, instagramUrl: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.instagramUrl).toBeNull();
  });
});

describe("findObviousInfluencerDuplicate", () => {
  const candidates = [
    { id: "i1", name: "Ranchi Foodie" },
    { id: "i2", name: "Travel With Priya" },
  ];

  it("matches an exact (case/whitespace-insensitive) name", () => {
    const match = findObviousInfluencerDuplicate({ name: "  ranchi   foodie " }, candidates);
    expect(match?.id).toBe("i1");
  });

  it("never fuzzy-matches a genuinely different name", () => {
    const match = findObviousInfluencerDuplicate({ name: "Ranchi Foods" }, candidates);
    expect(match).toBeNull();
  });

  it("normalizeNameForDuplicateMatch collapses whitespace and case", () => {
    expect(normalizeNameForDuplicateMatch("  Ranchi   Foodie ")).toBe("ranchi foodie");
  });
});

describe("buildInfluencerSubmissionCreateData", () => {
  it("never includes any Influencer-table field (status/claimed/slug/featured) — a submission never touches the live profile table", () => {
    const data = buildInfluencerSubmissionCreateData(
      {
        name: "Test Creator",
        category: "Food",
        bio: null,
        instagramUrl: null,
        youtubeUrl: null,
        websiteUrl: null,
        photoUrl: null,
        contactName: "A",
        contactEmail: "a@b.com",
        contactPhone: "9999999999",
        honeypot: null,
      },
      { duplicateOfInfluencerId: null }
    );
    expect(data).not.toHaveProperty("status");
    expect(data).not.toHaveProperty("claimed");
    expect(data).not.toHaveProperty("slug");
    expect(data).not.toHaveProperty("featured");
  });
});

describe("buildInfluencerCreateDataFromSubmission (approval)", () => {
  const submission = {
    name: "New Creator",
    category: "Travel",
    bio: "A local travel creator.",
    instagramUrl: "https://instagram.com/newcreator",
    youtubeUrl: null,
    websiteUrl: null,
    photoUrl: null,
    contactName: "Creator Name",
    contactEmail: "creator@example.com",
    contactPhone: "9876543210",
  };

  it("publishes the profile (status PUBLISHED) and marks it claimed by the submitter", () => {
    const data = buildInfluencerCreateDataFromSubmission(submission, "new-creator");
    expect(data.status).toBe("PUBLISHED");
    expect(data.claimed).toBe(true);
  });

  it("uses the slug given by the caller, never invents its own", () => {
    const data = buildInfluencerCreateDataFromSubmission(submission, "a-specific-slug");
    expect(data.slug).toBe("a-specific-slug");
  });
});

describe("buildInfluencerClaimRequestDataFromSubmission (approval)", () => {
  it("creates an already-APPROVED claim so the submitter gets the same owner-access mechanism a claimed profile's owner would", () => {
    const data = buildInfluencerClaimRequestDataFromSubmission(
      { contactName: "Jane", contactEmail: "jane@example.com", contactPhone: "9876543210" },
      { influencerId: "inf1", adminId: "admin1", now: new Date("2026-01-01") }
    );
    expect(data.status).toBe("APPROVED");
    expect(data.claimantName).toBe("Jane");
    expect(data.email).toBe("jane@example.com");
    expect(data.phone).toBe("9876543210");
    expect(data.influencerId).toBe("inf1");
    expect(data.reviewedById).toBe("admin1");
  });
});
