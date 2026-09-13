"use client";

import { useActionState } from "react";
import type { Category } from "@prisma/client";
import { createCategory, updateCategory, type CategoryFormState } from "./actions";

const initialState: CategoryFormState = {};
const inputClass =
  "w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

export default function CategoryForm({
  category,
  parentOptions,
}: {
  category?: Category;
  parentOptions: Category[];
}) {
  const action = category ? updateCategory.bind(null, category.id) : createCategory;
  const [state, formAction, pending] = useActionState(action, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="name" className="block text-xs font-medium text-slate-500">
          Name
        </label>
        <input id="name" name="name" defaultValue={category?.name ?? ""} className={inputClass} required />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="slug" className="block text-xs font-medium text-slate-500">
          Slug
        </label>
        <input id="slug" name="slug" defaultValue={category?.slug ?? ""} className={inputClass} required />
        {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug}</p>}
      </div>

      <div>
        <label htmlFor="parentId" className="block text-xs font-medium text-slate-500">
          Parent category
        </label>
        <select id="parentId" name="parentId" defaultValue={category?.parentId ?? ""} className={inputClass}>
          <option value="">— None (top level) —</option>
          {parentOptions
            .filter((c) => c.id !== category?.id)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>
        {errors.parentId && <p className="mt-1 text-xs text-red-600">{errors.parentId}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-xs font-medium text-slate-500">
          Description
        </label>
        <textarea id="description" name="description" defaultValue={category?.description ?? ""} rows={3} className={inputClass} />
      </div>

      <div>
        <label htmlFor="seoTitle" className="block text-xs font-medium text-slate-500">
          SEO title
        </label>
        <input id="seoTitle" name="seoTitle" defaultValue={category?.seoTitle ?? ""} className={inputClass} />
      </div>

      <div>
        <label htmlFor="seoDescription" className="block text-xs font-medium text-slate-500">
          SEO description
        </label>
        <textarea id="seoDescription" name="seoDescription" defaultValue={category?.seoDescription ?? ""} rows={2} className={inputClass} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving…" : category ? "Save changes" : "Create category"}
      </button>
    </form>
  );
}
