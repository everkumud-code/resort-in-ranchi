/**
 * Pure helpers for the blog: slugs, tag/keyword parsing, reading time, a
 * small HTML-safe Markdown renderer, and the SEO checklist shown in the
 * admin editor. Nothing here touches the database.
 */

export function slugify(input: string, maxLength = 80): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
}

/** Comma- or newline-separated list -> trimmed, de-duplicated (case-insensitive) values, first spelling kept. */
export function parseList(input: string | null | undefined, max = 30): string[] {
  if (!input) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of input.split(/[,\n]/)) {
    const value = part.trim().replace(/\s+/g, " ");
    if (!value || seen.has(value.toLowerCase())) continue;
    seen.add(value.toLowerCase());
    out.push(value);
    if (out.length >= max) break;
  }
  return out;
}

/** A tag's URL segment — the same slug rules as post slugs. */
export function tagSlug(tag: string): string {
  return slugify(tag, 60);
}

export function countWords(text: string): number {
  const words = text.trim().match(/\S+/g);
  return words ? words.length : 0;
}

export function readingTimeMinutes(content: string, wordsPerMinute = 200): number {
  return Math.max(1, Math.ceil(countWords(content) / wordsPerMinute));
}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const SAFE_URL = /^(https?:\/\/|\/(?!\/)|mailto:)/i;

function renderInline(escaped: string): string {
  // Code spans first so their contents are never touched by the other rules.
  return escaped
    .split(/(`[^`]+`)/g)
    .map((segment) => {
      if (segment.length > 1 && segment.startsWith("`") && segment.endsWith("`")) {
        return `<code>${segment.slice(1, -1)}</code>`;
      }
      return segment
        .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (match, alt: string, url: string) =>
          SAFE_URL.test(url) ? `<img src="${url}" alt="${alt}" loading="lazy" />` : match
        )
        .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label: string, url: string) => {
          if (!SAFE_URL.test(url)) return match;
          const external = /^https?:\/\//i.test(url);
          return `<a href="${url}"${external ? ' rel="noopener noreferrer"' : ""}>${label}</a>`;
        })
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
    })
    .join("");
}

/**
 * Markdown -> HTML. The whole input is HTML-escaped BEFORE any formatting is
 * applied, so raw HTML/script in a post can never reach the page; links and
 * images only accept http(s), site-relative or mailto URLs. Supports
 * headings (# is rendered as h2 because the page title is the h1), bold,
 * italic, links, images, inline code, fenced code, bullet/numbered lists,
 * blockquotes and horizontal rules.
 */
export function renderMarkdown(markdown: string): string {
  const lines = escapeHtml(markdown.replace(/\r\n?/g, "\n")).split("\n");
  const html: string[] = [];
  let paragraph: string[] = [];
  let list: { tag: "ul" | "ol"; items: string[] } | null = null;
  let quote: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) html.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (list) html.push(`<${list.tag}>${list.items.map((i) => `<li>${renderInline(i)}</li>`).join("")}</${list.tag}>`);
    list = null;
  };
  const flushQuote = () => {
    if (quote.length > 0) html.push(`<blockquote><p>${renderInline(quote.join(" "))}</p></blockquote>`);
    quote = [];
  };
  const flushAll = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith("```")) {
      flushAll();
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) code.push(lines[i++]);
      html.push(`<pre><code>${code.join("\n")}</code></pre>`);
      continue;
    }

    if (line.trim() === "") {
      flushAll();
      continue;
    }

    const heading = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (heading) {
      flushAll();
      const level = Math.min(heading[1].length + 1, 4);
      html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    if (/^(-{3,}|\*{3,})\s*$/.test(line.trim())) {
      flushAll();
      html.push("<hr />");
      continue;
    }

    const bullet = /^\s*[-*]\s+(.+)$/.exec(line);
    const numbered = /^\s*\d+[.)]\s+(.+)$/.exec(line);
    if (bullet || numbered) {
      flushParagraph();
      flushQuote();
      const tag = bullet ? "ul" : "ol";
      if (list && list.tag !== tag) flushList();
      if (!list) list = { tag, items: [] };
      list.items.push((bullet ?? numbered)![1]);
      continue;
    }

    const quoted = /^&gt;\s?(.*)$/.exec(line);
    if (quoted) {
      flushParagraph();
      flushList();
      quote.push(quoted[1]);
      continue;
    }

    flushList();
    flushQuote();
    paragraph.push(line.trim());
  }
  flushAll();
  return html.join("\n");
}

export interface SeoCheckInput {
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  focusKeyword?: string | null;
  tags?: string[];
  coverImageUrl?: string | null;
  coverImageAlt?: string | null;
}

export interface SeoCheck {
  id: string;
  label: string;
  ok: boolean;
  hint: string;
}

const containsPhrase = (haystack: string, phrase: string) => haystack.toLowerCase().includes(phrase.toLowerCase());

/** Pure — the on-page SEO checklist for a post; every item says what to fix when it fails. */
export function buildSeoChecklist(post: SeoCheckInput): SeoCheck[] {
  const seoTitle = (post.metaTitle?.trim() || post.title).trim();
  const description = (post.metaDescription?.trim() || post.excerpt?.trim() || "").trim();
  const keyword = post.focusKeyword?.trim() ?? "";
  const firstWords = post.content.trim().split(/\s+/).slice(0, 100).join(" ");
  const keywordSlug = slugify(keyword);

  const checks: SeoCheck[] = [
    {
      id: "title-length",
      label: "SEO title is 30–60 characters",
      ok: seoTitle.length >= 30 && seoTitle.length <= 60,
      hint: `Currently ${seoTitle.length}. Search results cut titles after about 60 characters.`,
    },
    {
      id: "description-length",
      label: "Meta description is 70–160 characters",
      ok: description.length >= 70 && description.length <= 160,
      hint: `Currently ${description.length}. Write a clear summary that makes people want to click.`,
    },
    { id: "keyword-set", label: "Focus keyword is set", ok: keyword.length > 0, hint: "Pick the one phrase this post should rank for." },
  ];

  if (keyword) {
    checks.push(
      { id: "keyword-title", label: "Focus keyword is in the title", ok: containsPhrase(seoTitle, keyword), hint: "Use the keyword naturally near the start of the SEO title." },
      { id: "keyword-slug", label: "Focus keyword is in the slug", ok: keywordSlug.length > 0 && post.slug.includes(keywordSlug), hint: `Try a slug containing "${keywordSlug}".` },
      { id: "keyword-description", label: "Focus keyword is in the meta description", ok: containsPhrase(description, keyword), hint: "Mention the keyword once in the description." },
      { id: "keyword-intro", label: "Focus keyword is in the first 100 words", ok: containsPhrase(firstWords, keyword), hint: "Mention the keyword in the opening paragraph." }
    );
  }

  checks.push(
    { id: "word-count", label: "Post has at least 300 words", ok: countWords(post.content) >= 300, hint: `Currently ${countWords(post.content)} words.` },
    { id: "internal-link", label: "Links to at least one page on this site", ok: /\]\(\/[^)\s]/.test(post.content), hint: "Add a link like [Resorts in Ranchi](/resorts) to help visitors and crawlers." },
    { id: "tags", label: "Has at least one tag", ok: (post.tags?.length ?? 0) > 0, hint: "Tags group related posts and create tag pages." },
    {
      id: "cover-alt",
      label: "Cover image has alt text",
      ok: !post.coverImageUrl || Boolean(post.coverImageAlt?.trim()),
      hint: "Describe the cover image for accessibility and image search.",
    }
  );
  return checks;
}
