import { describe, expect, it } from "vitest";
import { influencerEnquirySchema, buildInfluencerEnquiryCreateData } from "./influencerEnquiry";

describe("influencerEnquirySchema", () => {
  it("requires a name and phone; email and message are optional", () => {
    const parsed = influencerEnquirySchema.parse({ name: "Rahul", phone: "9876543210" });
    expect(parsed.email).toBeNull();
    expect(parsed.message).toBeNull();
  });

  it("rejects a missing name or phone", () => {
    expect(influencerEnquirySchema.safeParse({ name: "", phone: "9876543210" }).success).toBe(false);
    expect(influencerEnquirySchema.safeParse({ name: "Rahul", phone: "" }).success).toBe(false);
  });
});

describe("buildInfluencerEnquiryCreateData", () => {
  it("attaches the server-resolved influencerId and always starts NEW", () => {
    const data = buildInfluencerEnquiryCreateData({ name: "Rahul", phone: "9876543210", email: null, message: null, honeypot: null }, "inf-1");
    expect(data).toEqual({ influencerId: "inf-1", name: "Rahul", phone: "9876543210", email: null, message: null, status: "NEW" });
  });
});
