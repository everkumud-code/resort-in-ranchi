/** Normalize a business name for duplicate comparison (not for display). */
export function normalizeNameForComparison(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N} ]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface DuplicateCandidate<T> {
  normalizedName: string;
  records: T[];
  /** "high" when every record in the group also shares a locality; "medium" otherwise. */
  confidence: "high" | "medium";
}

/**
 * Group records by normalized name and flag any group with more than one
 * member as a duplicate candidate. This only detects and reports — it
 * never auto-merges or deletes records.
 */
export function findDuplicateCandidates<T>(
  records: T[],
  getName: (r: T) => string,
  getLocality: (r: T) => string
): DuplicateCandidate<T>[] {
  const groups = new Map<string, T[]>();

  for (const record of records) {
    const key = normalizeNameForComparison(getName(record));
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(record);
  }

  const candidates: DuplicateCandidate<T>[] = [];
  for (const [normalizedName, group] of groups) {
    if (group.length < 2) continue;
    const localities = new Set(group.map((r) => getLocality(r).trim().toLowerCase()));
    candidates.push({
      normalizedName,
      records: group,
      confidence: localities.size === 1 ? "high" : "medium",
    });
  }

  return candidates.sort((a, b) => b.records.length - a.records.length);
}
