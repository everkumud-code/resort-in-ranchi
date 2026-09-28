import { describe, expect, it } from "vitest";
import { applyFormat } from "./editorActions";

describe("applyFormat", () => {
  it("wraps the selection in bold / italic", () => {
    const r = applyFormat("say hello now", 4, 9, { kind: "bold" });
    expect(r.text).toBe("say **hello** now");
    expect(r.text.slice(r.start, r.end)).toBe("hello");
    expect(applyFormat("a b c", 2, 3, { kind: "italic" }).text).toBe("a *b* c");
  });

  it("inserts a placeholder (selected) when nothing is selected", () => {
    const r = applyFormat("", 0, 0, { kind: "bold" });
    expect(r.text).toBe("**bold text**");
    expect(r.text.slice(r.start, r.end)).toBe("bold text");
  });

  it("turns the selection into a link, or a placeholder link", () => {
    expect(applyFormat("see our resorts page", 8, 15,{ kind: "link", url: "/resorts" }).text).toBe("see our [resorts](/resorts) page");
    expect(applyFormat("", 0, 0, { kind: "link", url: "https://x.test" }).text).toBe("[link text](https://x.test)");
  });

  it("inserts an image at the cursor", () => {
    expect(applyFormat("a\n", 2, 2, { kind: "image", url: "https://x.test/a.jpg", alt: "Lawn" }).text).toBe("a\n![Lawn](https://x.test/a.jpg)");
  });

  it("sets a heading on the current line, replacing an existing one", () => {
    expect(applyFormat("Title\nbody", 2, 2, { kind: "heading", level: 2 }).text).toBe("## Title\nbody");
    expect(applyFormat("# Old\nbody", 2, 2, { kind: "heading", level: 3 }).text).toBe("### Old\nbody");
  });

  it("prefixes every selected line for lists and quotes, numbering ordered lists", () => {
    expect(applyFormat("one\ntwo\nthree", 0, 7, { kind: "ul" }).text).toBe("- one\n- two\nthree");
    expect(applyFormat("one\ntwo", 0, 7, { kind: "ol" }).text).toBe("1. one\n2. two");
    expect(applyFormat("wise", 0, 4, { kind: "quote" }).text).toBe("> wise");
  });

  it("applies a colour only for a valid hex value", () => {
    expect(applyFormat("hot", 0, 3, { kind: "color", hex: "#C0392B" }).text).toBe("{color:#C0392B}hot{/color}");
    expect(applyFormat("hot", 0, 3, { kind: "color", hex: "red" }).text).toBe("hot");
  });
});
