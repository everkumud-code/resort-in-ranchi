"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { categorySchema, isValidParent } from "@/lib/validation/category";

export interface CategoryFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

function parseForm(formData: FormData) {
  return categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    parentId: formData.get("parentId"),
    description: formData.get("description"),
    seoTitle: formData.get("seoTitle"),
    seoDescription: formData.get("seoDescription"),
  });
}

function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export async function createCategory(_prevState: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
  await requireAdmin();

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  if (!isValidParent(null, parsed.data.parentId)) {
    return { error: "Please fix the errors below.", fieldErrors: { parentId: "A category can't be its own parent." } };
  }

  const existing = await prisma.category.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return { error: "Please fix the errors below.", fieldErrors: { slug: "This slug is already in use." } };
  }

  const created = await prisma.category.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      parentId: parsed.data.parentId,
      description: parsed.data.description,
      seoTitle: parsed.data.seoTitle,
      seoDescription: parsed.data.seoDescription,
    },
  });

  revalidatePath("/admin/categories");
  redirect(`/admin/categories/${created.id}?saved=1`);
}

export async function updateCategory(
  categoryId: string,
  _prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  await requireAdmin();

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  if (!isValidParent(categoryId, parsed.data.parentId)) {
    return { error: "Please fix the errors below.", fieldErrors: { parentId: "A category can't be its own parent." } };
  }

  const slugOwner = await prisma.category.findUnique({ where: { slug: parsed.data.slug } });
  if (slugOwner && slugOwner.id !== categoryId) {
    return { error: "Please fix the errors below.", fieldErrors: { slug: "This slug is already in use." } };
  }

  try {
    await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        parentId: parsed.data.parentId,
        description: parsed.data.description,
        seoTitle: parsed.data.seoTitle,
        seoDescription: parsed.data.seoDescription,
      },
    });
  } catch {
    return { error: "Could not save changes." };
  }

  revalidatePath("/admin/categories");
  revalidatePath(`/admin/categories/${categoryId}`);
  redirect(`/admin/categories/${categoryId}?saved=1`);
}
