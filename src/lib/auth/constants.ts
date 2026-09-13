// Kept dependency-free (no Node builtins, no Prisma) so it's safe to import
// from Edge-runtime code like middleware.ts.
export const SESSION_COOKIE_NAME = "admin_session";
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
