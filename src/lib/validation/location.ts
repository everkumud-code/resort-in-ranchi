import { z } from "zod";
import { optionalText, requiredText, slugField } from "./shared";

export const locationSchema = z.object({
  name: requiredText("Name"),
  slug: slugField,
  parentId: optionalText,
  description: optionalText,
  seoTitle: optionalText,
  seoDescription: optionalText,
});

export type LocationInput = z.infer<typeof locationSchema>;

/** A location can't be its own parent. (Same reasoning as isValidParent for Category.) */
export function isValidParent(id: string | null, parentId: string | null): boolean {
  if (!parentId) return true;
  if (!id) return true;
  return id !== parentId;
}
