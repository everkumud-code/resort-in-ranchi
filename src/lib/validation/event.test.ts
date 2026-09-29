import { describe, expect, it } from "vitest";
import { adminEventSchema, eventApplicationSchema } from "./event";

const base = { title: "Ranchi Wedding Fair", startAt: "2026-10-10T10:00" };

describe("eventApplicationSchema", () => {
  it("accepts a minimal valid application", () => {
    const parsed = eventApplicationSchema.parse({ ...base, submittedByName: "Asha", submittedByPhone: "9876543210" });
    expect(parsed.title).toBe("Ranchi Wedding Fair");
    expect(parsed.startAt).toBeInstanceOf(Date);
  });

  it("requires a title, a valid start date/time, name and phone", () => {
    expect(eventApplicationSchema.safeParse({ ...base, title: "", submittedByName: "A", submittedByPhone: "999" }).success).toBe(false);
    expect(eventApplicationSchema.safeParse({ ...base, startAt: "", submittedByName: "A", submittedByPhone: "9876543210" }).success).toBe(false);
    expect(eventApplicationSchema.safeParse({ title: "X", startAt: base.startAt, submittedByPhone: "9876543210" }).success).toBe(false);
  });

  it("interprets a datetime-local value as IST, not the server's own timezone", () => {
    const parsed = eventApplicationSchema.parse({
      ...base,
      startAt: "2026-10-16T17:00",
      submittedByName: "Asha",
      submittedByPhone: "9876543210",
    });
    // 17:00 IST = 11:30 UTC (UTC+5:30) — regardless of the process's local timezone.
    expect(parsed.startAt.toISOString()).toBe("2026-10-16T11:30:00.000Z");
  });

  it("rejects an end time before the start", () => {
    const result = eventApplicationSchema.safeParse({
      ...base,
      endAt: "2026-10-09T10:00",
      submittedByName: "Asha",
      submittedByPhone: "9876543210",
    });
    expect(result.success).toBe(false);
  });

  it("only accepts http(s) URLs for ticketUrl and coverImageUrl", () => {
    expect(
      eventApplicationSchema.safeParse({ ...base, ticketUrl: "javascript:alert(1)", submittedByName: "A", submittedByPhone: "9876543210" }).success
    ).toBe(false);
  });
});

describe("adminEventSchema", () => {
  it("defaults status to PENDING for an unknown value, and reads sponsored/priority", () => {
    const parsed = adminEventSchema.parse({ ...base, slug: "ranchi-wedding-fair", status: "nonsense", sponsored: "on", priority: "5" });
    expect(parsed.status).toBe("PENDING");
    expect(parsed.sponsored).toBe(true);
    expect(parsed.priority).toBe(5);
  });

  it("requires a valid slug", () => {
    expect(adminEventSchema.safeParse({ ...base, slug: "Not A Slug" }).success).toBe(false);
  });
});
