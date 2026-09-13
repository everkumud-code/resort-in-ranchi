import { z } from "zod";
import { optionalText, requiredText, slugField } from "./shared";

export const categorySchema = z.object({
  name: requiredText("Name"),
  slug: slugField,
  parentId: optionalText,
  description: optionalText,
  seoTitle: optionalText,
  seoDescription: optionalText,
});

export type CategoryInput = z.infer<typeof categorySchema>;

/** A category can't be its own parent. (Deeper cycles aren't guarded against —
 * only one level of nesting is used in practice and this is an admin-only,
 * trusted-operator tool.) */
export function isValidParent(id: string | null, parentId: string | null): boolean {
  if (!parentId) return true;
  if (!id) return true; // creating a new record — can't reference itself yet
  return id !== parentId;
}
