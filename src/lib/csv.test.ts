import { describe, expect, it } from "vitest";
import { csvCell, toCsv } from "./csv";

describe("csvCell", () => {
  it("leaves plain text alone and blanks null/undefined", () => {
    expect(csvCell("hello")).toBe("hello");
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
    expect(csvCell(42)).toBe("42");
  });

  it("quotes commas, quotes and newlines, doubling embedded quotes", () => {
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("line1\nline2")).toBe('"line1\nline2"');
  });

  it("neutralises spreadsheet formulas", () => {
    expect(csvCell("=SUM(A1:A9)")).toBe("'=SUM(A1:A9)");
    expect(csvCell("+91 98765")).toBe("'+91 98765");
    expect(csvCell("@cmd")).toBe("'@cmd");
    expect(csvCell("-1")).toBe("'-1");
  });

  it("writes dates as ISO strings", () => {
    expect(csvCell(new Date("2026-09-28T10:00:00Z"))).toBe("2026-09-28T10:00:00.000Z");
  });
});

describe("toCsv", () => {
  it("writes a header row and CRLF-separated rows", () => {
    expect(toCsv(["a", "b"], [["1", "x,y"], [2, null]])).toBe('a,b\r\n1,"x,y"\r\n2,\r\n');
  });
});
