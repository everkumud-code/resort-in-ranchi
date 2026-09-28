/**
 * Pure text transforms behind the blog editor's toolbar. Each takes the
 * textarea's text and selection and returns the new text and selection, so
 * the formatting rules can be tested without a browser.
 */
export type EditorFormat =
  | { kind: "bold" }
  | { kind: "italic" }
  | { kind: "heading"; level: 2 | 3 }
  | { kind: "ul" }
  | { kind: "ol" }
  | { kind: "quote" }
  | { kind: "link"; url: string }
  | { kind: "image"; url: string; alt: string }
  | { kind: "color"; hex: string };

export interface EditorResult {
  text: string;
  start: number;
  end: number;
}

const HEX = /^#[0-9a-fA-F]{6}$/;

function replaceRange(text: string, start: number, end: number, insert: string, selStart: number, selEnd: number): EditorResult {
  return { text: text.slice(0, start) + insert + text.slice(end), start: start + selStart, end: start + selEnd };
}

function wrap(text: string, start: number, end: number, open: string, close: string, placeholder: string): EditorResult {
  const selected = text.slice(start, end) || placeholder;
  return replaceRange(text, start, end, `${open}${selected}${close}`, open.length, open.length + selected.length);
}

function prefixLines(text: string, start: number, end: number, prefixFor: (index: number) => string): EditorResult {
  const lineStart = text.lastIndexOf("\n", start - 1) + 1;
  const nextBreak = text.indexOf("\n", end);
  const lineEnd = nextBreak === -1 ? text.length : nextBreak;
  const block = text.slice(lineStart, lineEnd);
  const changed = block
    .split("\n")
    .map((line, i) => `${prefixFor(i)}${line.replace(/^(#{1,6}\s+|[-*]\s+|\d+[.)]\s+|>\s?)/, "")}`)
    .join("\n");
  return replaceRange(text, lineStart, lineEnd, changed, 0, changed.length);
}

export function applyFormat(text: string, start: number, end: number, format: EditorFormat): EditorResult {
  switch (format.kind) {
    case "bold":
      return wrap(text, start, end, "**", "**", "bold text");
    case "italic":
      return wrap(text, start, end, "*", "*", "italic text");
    case "heading":
      return prefixLines(text, start, end, () => `${"#".repeat(format.level)} `);
    case "ul":
      return prefixLines(text, start, end, () => "- ");
    case "ol":
      return prefixLines(text, start, end, (i) => `${i + 1}. `);
    case "quote":
      return prefixLines(text, start, end, () => "> ");
    case "link": {
      const label = text.slice(start, end) || "link text";
      const insert = `[${label}](${format.url})`;
      return replaceRange(text, start, end, insert, 1, 1 + label.length);
    }
    case "image": {
      const insert = `![${format.alt}](${format.url})`;
      return replaceRange(text, start, end, insert, insert.length, insert.length);
    }
    case "color":
      if (!HEX.test(format.hex)) return { text, start, end };
      return wrap(text, start, end, `{color:${format.hex}}`, "{/color}", "coloured text");
  }
}
