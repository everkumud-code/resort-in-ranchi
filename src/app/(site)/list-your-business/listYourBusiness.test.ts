import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const actionsSrc = read("src/app/(site)/list-your-business/actions.ts");
const pageSrc = read("src/app/(site)/list-your-business/page.tsx");

describe("PHASE 6 — Add Your Property submission is public, never auto-published", () => {
  it("never calls requireAdmin/requireOwnerAccessAdmin — any visitor can submit", () => {
    expect(actionsSrc).not.toMatch(/requireAdmin|requireOwnerAccessAdmin/);
  });

  it("only ever writes to propertySubmission, never to the live property table", () => {
    expect(actionsSrc).toMatch(/prisma\.propertySubmission\.create/);
    expect(actionsSrc).not.toMatch(/prisma\.property\.create/);
  });

  it("re-validates category/locality ids against the live tables server-side, never trusting the submitted id blindly", () => {
    expect(actionsSrc).toMatch(/prisma\.category\.findUnique/);
    expect(actionsSrc).toMatch(/prisma\.location\.findUnique/);
  });
});

describe("PHASE 6 — duplicate detection is a soft flag, never a hard block", () => {
  it("still calls propertySubmission.create in the same code path that computes a duplicate match", () => {
    const duplicateCallIndex = actionsSrc.indexOf("findObviousDuplicate(");
    const createCallIndex = actionsSrc.indexOf("prisma.propertySubmission.create(");
    expect(duplicateCallIndex).toBeGreaterThan(-1);
    expect(createCallIndex).toBeGreaterThan(duplicateCallIndex);
  });

  it("passes the detected duplicate id straight through to the create call, for later admin review", () => {
    expect(actionsSrc).toMatch(/duplicateOfPropertyId:\s*duplicate\?\.id\s*\?\?\s*null/);
  });

  it("only searches a bounded candidate set (never a full-table scan) — no manual external verification", () => {
    expect(actionsSrc).toMatch(/take:\s*20/);
  });
});

describe("PHASE 6 — honeypot never tips off a bot", () => {
  it("redirects to the same success URL when the honeypot is filled, instead of surfacing an error", () => {
    const honeypotBlock = actionsSrc.slice(actionsSrc.indexOf("parsed.data.honeypot"), actionsSrc.indexOf("parsed.data.honeypot") + 150);
    expect(honeypotBlock).toMatch(/redirect\("\/list-your-business\?submitted=1"\)/);
  });
});

describe("PHASE 6 — the public form is fed real dropdown data, never hardcoded lists", () => {
  it("fetches categories, locations, and facilities live from the database", () => {
    expect(pageSrc).toMatch(/prisma\.category\.findMany/);
    expect(pageSrc).toMatch(/prisma\.location\.findMany/);
    expect(pageSrc).toMatch(/prisma\.facility\.findMany/);
  });
});
