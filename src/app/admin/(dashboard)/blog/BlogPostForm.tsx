"use client";

import { useActionState, useMemo, useState } from "react";
import type { BlogPost } from "@prisma/client";
import { createBlogPost, updateBlogPost, type BlogFormState } from "./actions";
import { buildSeoChecklist, parseList, readingTimeMinutes, slugify } from "@/lib/blog/blog";

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
            Content (Markdown) — about {readingTimeMinutes(content)} min read
          </label>
          <textarea
            id="content"
            name="content"
            rows={22}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`${inputClass} font-mono`}
            placeholder={"## Heading\n\nWrite in Markdown. **Bold**, *italic*, [links](/resorts), - lists, ![alt](https://image-url)."}
          />
          {errors.content && <p className="mt-1 text-xs text-red-600">{errors.content}</p>}
        </div>

        <fieldset className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
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
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
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

        <div className="rounded-lg border border-slate-200 bg-white p-4">
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
