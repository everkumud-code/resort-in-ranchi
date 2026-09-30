"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import type { BlogPost } from "@prisma/client";
import { createBlogPost, updateBlogPost, type BlogFormState } from "./actions";
import { buildSeoChecklist, parseList, readingTimeMinutes, renderMarkdown, slugify } from "@/lib/blog/blog";
import { applyFormat, type EditorFormat } from "@/lib/blog/editorActions";
import { BLOG_PROSE_CLASS } from "@/components/site/blogProse";

const TOOLBAR: { label: string; title: string; format: EditorFormat; className?: string }[] = [
  { label: "B", title: "Bold", format: { kind: "bold" }, className: "font-bold" },
  { label: "I", title: "Italic", format: { kind: "italic" }, className: "italic" },
  { label: "H2", title: "Big heading", format: { kind: "heading", level: 2 } },
  { label: "H3", title: "Small heading", format: { kind: "heading", level: 3 } },
  { label: "• List", title: "Bulleted list", format: { kind: "ul" } },
  { label: "1. List", title: "Numbered list", format: { kind: "ol" } },
  { label: "Quote", title: "Quote", format: { kind: "quote" } },
];

/** Shows the cover image as visitors will get it, and says so when the link is not a direct image file. */
function CoverPreview({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  if (!/^https?:\/\//i.test(url.trim())) return null;
  return (
    <div className="mt-2">
      {failed ? (
        <p className="rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
          This link doesn&apos;t load as an image. Use the picture&apos;s direct image address (right-click the image → Copy image address). Page links
          such as pin.it or Google Drive/Pinterest share links are web pages, not images.
        </p>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- admin-supplied external URL preview
        <img key={url} src={url} alt="Cover preview" onError={() => setFailed(true)} className="max-h-40 rounded-md border border-slate-200" />
      )}
    </div>
  );
}

const initialState: BlogFormState = {};
const inputClass =
  "w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";
const labelClass = "block text-xs font-medium text-slate-500";

function Counter({ value, min, max }: { value: string; min: number; max: number }) {
  const n = value.trim().length;
  const ok = n >= min && n <= max;
  return (
    <span className={`text-xs ${ok ? "text-green-600" : "text-slate-400"}`}>
      {n} / {min}–{max} characters
    </span>
  );
}

export default function BlogPostForm({ post }: { post?: BlogPost }) {
  const action = post ? updateBlogPost.bind(null, post.id) : createBlogPost;
  const [state, formAction, pending] = useActionState(action, initialState);
  const errors = state.fieldErrors ?? {};

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [focusKeyword, setFocusKeyword] = useState(post?.focusKeyword ?? "");
  const [tags, setTags] = useState((post?.tags ?? []).join(", "));
  const [metaTitle, setMetaTitle] = useState(post?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(post?.metaDescription ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(post?.coverImageUrl ?? "");
  const [coverImageAlt, setCoverImageAlt] = useState(post?.coverImageAlt ?? "");

  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);

  /** Applies a toolbar action to the current selection in the content box, then restores the selection. */
  function format(action: EditorFormat) {
    const el = contentRef.current;
    if (!el) return;
    const result = applyFormat(content, el.selectionStart, el.selectionEnd, action);
    setContent(result.text);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(result.start, result.end);
    });
  }

  function addLink() {
    const url = window.prompt("Link address — a full URL (https://…) or a site page like /resorts");
    if (!url || !url.trim()) return;
    format({ kind: "link", url: url.trim() });
  }

  function addImage() {
    const url = window.prompt("Direct image URL (must end in .jpg / .png / .webp — right-click the picture → Copy image address)");
    if (!url || !url.trim()) return;
    const alt = window.prompt("Describe the image (alt text)") ?? "";
    format({ kind: "image", url: url.trim(), alt: alt.trim() });
  }

  const checks = useMemo(
    () =>
      buildSeoChecklist({
        title,
        slug,
        content,
        excerpt,
        metaTitle,
        metaDescription,
        focusKeyword,
        tags: parseList(tags),
        coverImageUrl,
        coverImageAlt,
      }),
    [title, slug, content, excerpt, metaTitle, metaDescription, focusKeyword, tags, coverImageUrl, coverImageAlt]
  );
  const passed = checks.filter((c) => c.ok).length;

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-4">
        {state.error && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <div>
          <label htmlFor="title" className={labelClass}>
            Title (H1)
          </label>
          <input
            id="title"
            name="title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            className={inputClass}
            required
          />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
        </div>

        <div>
          <label htmlFor="slug" className={labelClass}>
            Slug (URL: /blog/<span className="font-mono">{slug || "your-slug"}</span>)
          </label>
          <input
            id="slug"
            name="slug"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            className={inputClass}
            required
          />
          {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug}</p>}
        </div>

        <div>
          <label htmlFor="excerpt" className={labelClass}>
            Excerpt (shown on the blog list; used as the meta description if that is blank)
          </label>
          <textarea id="excerpt" name="excerpt" rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className={inputClass} />
        </div>

        <div>
          <label htmlFor="content" className={labelClass}>
            Content — about {readingTimeMinutes(content)} min read
          </label>

          <div className="mb-1 flex flex-wrap items-center gap-1 rounded-md border border-slate-300 bg-slate-50 p-1">
            {TOOLBAR.map((item) => (
              <button
                key={item.label}
                type="button"
                title={item.title}
                onClick={() => format(item.format)}
                className={`rounded px-2 py-1 text-sm hover:bg-slate-200 ${item.className ?? ""}`}
              >
                {item.label}
              </button>
            ))}
            <button type="button" title="Link the selected words to a page or website" onClick={addLink} className="rounded px-2 py-1 text-sm underline hover:bg-slate-200">
              Link
            </button>
            <button type="button" title="Insert an image from its direct image URL" onClick={addImage} className="rounded px-2 py-1 text-sm hover:bg-slate-200">
              Image
            </button>
            <label title="Colour the selected words" className="flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-sm hover:bg-slate-200">
              Colour
              <input
                type="color"
                defaultValue="#c0392b"
                onChange={(e) => format({ kind: "color", hex: e.target.value })}
                className="h-5 w-6 cursor-pointer border-0 bg-transparent p-0"
              />
            </label>
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className={`ml-auto rounded px-2 py-1 text-sm ${showPreview ? "bg-slate-900 text-white" : "hover:bg-slate-200"}`}
            >
              {showPreview ? "Back to editing" : "Preview"}
            </button>
          </div>

          <textarea
            id="content"
            name="content"
            ref={contentRef}
            rows={22}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`${inputClass} font-mono ${showPreview ? "hidden" : ""}`}
            placeholder={"Select some words and use the buttons above — Bold, Italic, Link, Colour, headings, lists.\n\nTip: Preview shows exactly how it will look."}
          />
          {showPreview && (
            <div className="rounded-md border border-slate-300 bg-brand-cream p-4">
              {content.trim() ? (
                <div className={BLOG_PROSE_CLASS} dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
              ) : (
                <p className="text-sm text-slate-400">Nothing to preview yet.</p>
              )}
            </div>
          )}
          {errors.content && <p className="mt-1 text-xs text-red-600">{errors.content}</p>}
        </div>

        <fieldset className="space-y-4 rounded-lg border border-slate-200 bg-panel-green p-4">
          <legend className="px-1 text-sm font-semibold text-slate-700">SEO</legend>

          <div>
            <label htmlFor="focusKeyword" className={labelClass}>
              Focus keyword (the one phrase this post should rank for)
            </label>
            <input id="focusKeyword" name="focusKeyword" value={focusKeyword} onChange={(e) => setFocusKeyword(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label htmlFor="keywords" className={labelClass}>
              Other keywords (comma separated)
            </label>
            <input id="keywords" name="keywords" defaultValue={(post?.keywords ?? []).join(", ")} className={inputClass} />
            {errors.keywords && <p className="mt-1 text-xs text-red-600">{errors.keywords}</p>}
          </div>

          <div>
            <label htmlFor="tags" className={labelClass}>
              Tags (comma separated — each tag gets its own page at /blog/tag/…)
            </label>
            <input id="tags" name="tags" value={tags} onChange={(e) => setTags(e.target.value)} className={inputClass} />
            {errors.tags && <p className="mt-1 text-xs text-red-600">{errors.tags}</p>}
          </div>

          <div>
            <label htmlFor="metaTitle" className={labelClass}>
              SEO title (blank = use the title) <Counter value={metaTitle || title} min={30} max={60} />
            </label>
            <input id="metaTitle" name="metaTitle" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label htmlFor="metaDescription" className={labelClass}>
              Meta description (blank = use the excerpt) <Counter value={metaDescription || excerpt} min={70} max={160} />
            </label>
            <textarea
              id="metaDescription"
              name="metaDescription"
              rows={2}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="canonicalUrl" className={labelClass}>
              Canonical URL (leave blank unless this post was first published elsewhere)
            </label>
            <input id="canonicalUrl" name="canonicalUrl" defaultValue={post?.canonicalUrl ?? ""} className={inputClass} placeholder="https://" />
            {errors.canonicalUrl && <p className="mt-1 text-xs text-red-600">{errors.canonicalUrl}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="coverImageUrl" className={labelClass}>
                Cover / social image URL (https)
              </label>
              <input
                id="coverImageUrl"
                name="coverImageUrl"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                className={inputClass}
                placeholder="https://"
              />
              {errors.coverImageUrl && <p className="mt-1 text-xs text-red-600">{errors.coverImageUrl}</p>}
              <CoverPreview key={coverImageUrl} url={coverImageUrl} />
            </div>
            <div>
              <label htmlFor="coverImageAlt" className={labelClass}>
                Cover image alt text
              </label>
              <input id="coverImageAlt" name="coverImageAlt" value={coverImageAlt} onChange={(e) => setCoverImageAlt(e.target.value)} className={inputClass} />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" name="noindex" defaultChecked={post?.noindex ?? false} />
            Hide from search engines (noindex)
          </label>
        </fieldset>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <div className="space-y-3 rounded-lg border border-slate-200 bg-panel-green p-4">
          <div>
            <label htmlFor="status" className={labelClass}>
              Status
            </label>
            <select id="status" name="status" defaultValue={post?.status ?? "DRAFT"} className={inputClass}>
              <option value="DRAFT">Draft (not public)</option>
              <option value="PUBLISHED">Published (live on /blog)</option>
            </select>
          </div>
          <div>
            <label htmlFor="authorName" className={labelClass}>
              Author name
            </label>
            <input id="authorName" name="authorName" defaultValue={post?.authorName ?? ""} className={inputClass} />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Saving…" : post ? "Save changes" : "Create post"}
          </button>
        </div>

        <div className="rounded-lg border border-slate-200 bg-panel-green p-4">
          <p className="text-sm font-semibold text-slate-700">
            SEO checklist — {passed}/{checks.length}
          </p>
          <ul className="mt-2 space-y-1.5">
            {checks.map((c) => (
              <li key={c.id} className="text-xs">
                <span className={c.ok ? "text-green-700" : "text-amber-700"}>
                  {c.ok ? "✓" : "•"} {c.label}
                </span>
                {!c.ok && <span className="block pl-4 text-slate-400">{c.hint}</span>}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </form>
  );
}
