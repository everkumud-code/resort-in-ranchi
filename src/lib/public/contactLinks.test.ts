import { describe, expect, it } from "vitest";
import { buildTelHref, buildWhatsAppHref } from "./contactLinks";

describe("buildTelHref", () => {
  it("keeps digits and a leading + exactly as stored", () => {
    expect(buildTelHref("+91 97804 95495")).toBe("tel:+919780495495");
  });

  it("strips spaces, hyphens, and parentheses", () => {
    expect(buildTelHref("(651) 222-1234")).toBe("tel:6512221234");
  });

  it("never invents or reformats digits — output is a strict subset of the input's characters", () => {
    const phone = "+91-9876543210";
    const href = buildTelHref(phone);
    for (const char of href.replace("tel:", "")) {
      expect(phone).toContain(char);
    }
  });
});

describe("buildWhatsAppHref", () => {
  it("builds a wa.me link from digits only, dropping the + and any formatting", () => {
    expect(buildWhatsAppHref("+91 97804 95495")).toBe("https://wa.me/919780495495");
  });

  it("strips hyphens and parentheses", () => {
    expect(buildWhatsAppHref("(651) 222-1234")).toBe("https://wa.me/6512221234");
  });

  it("never invents a country code or any digit not already present in the stored value", () => {
    const whatsapp = "9876543210";
    const href = buildWhatsAppHref(whatsapp);
    expect(href).toBe("https://wa.me/9876543210");
  });
});
