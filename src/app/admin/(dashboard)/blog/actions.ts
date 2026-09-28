"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { blogPostSchema, resolvePublishedAt } from "@/lib/validation/blogPost";

export interface BlogFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

function parseForm(formData: FormData) {
  return blogPostSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    content: formData.get("content"),
    authorName: formData.get("authorName"),
    coverImageUrl: formData.get("coverImageUrl"),
    coverImageAlt: formData.get("coverImageAlt"),
    focusKeyword: formData.get("focusKeyword"),
    keywords: formData.get("keywords"),
    tags: formData.get("tags"),
    metaTitle: formData.get("metaTitle"),
    metaDescription: formData.get("metaDescription"),
    canonicalUrl: formData.get("canonicalUrl"),
    noindex: formData.get("noindex"),
    status: formData.get("status"),
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

function revalidateBlog(slug: string) {
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/sitemap.xml");
}

export async function createBlogPost(_prevState: BlogFormState, formData: FormData): Promise<BlogFormState> {
  await requireAdmin();

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const existing = await prisma.blogPost.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return { error: "Please fix the errors below.", fieldErrors: { slug: "This slug is already in use." } };
  }

  const created = await prisma.blogPost.create({
    data: { ...parsed.data, publishedAt: resolvePublishedAt(parsed.data.status, null) },
  });

  revalidateBlog(created.slug);
  redirect(`/admin/blog/${created.id}?saved=1`);
}

export async function updateBlogPost(
  postId: string,
  _prevState: BlogFormState,
  formData: FormData
): Promise<BlogFormState> {
  await requireAdmin();

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const current = await prisma.blogPost.findUnique({ where: { id: postId }, select: { slug: true, publishedAt: true } });
  if (!current) return { error: "Post not found." };

  const slugOwner = await prisma.blogPost.findUnique({ where: { slug: parsed.data.slug } });
  if (slugOwner && slugOwner.id !== postId) {
    return { error: "Please fix the errors below.", fieldErrors: { slug: "This slug is already in use." } };
  }

  try {
    await prisma.blogPost.update({
      where: { id: postId },
      data: { ...parsed.data, publishedAt: resolvePublishedAt(parsed.data.status, current.publishedAt) },
    });
  } catch {
    return { error: "Could not save changes." };
  }

  revalidateBlog(current.slug);
  revalidateBlog(parsed.data.slug);
  redirect(`/admin/blog/${postId}?saved=1`);
}
