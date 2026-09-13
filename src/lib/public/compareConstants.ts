/**
 * Shared by both the server-side compare page/data layer (compare.ts) and
 * the client-side CompareProvider — kept in its own file with zero imports
 * so the client bundle never pulls in compare.ts's Prisma dependency.
 */
export const MAX_COMPARE_PROPERTIES = 4;
export const MIN_COMPARE_PROPERTIES = 2;
