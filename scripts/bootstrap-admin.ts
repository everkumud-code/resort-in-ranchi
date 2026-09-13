/**
 * Creates (or updates) the first admin user from environment variables.
 * Never hard-codes credentials — ADMIN_BOOTSTRAP_EMAIL / ADMIN_BOOTSTRAP_PASSWORD
 * must be set in .env (or the shell environment) before running this.
 *
 * Usage: npm run admin:bootstrap
 */
import { hashPassword } from "../src/lib/auth/password";

// tsx doesn't auto-load .env for plain process.env reads (only Prisma's own
// client does that internally) — load it explicitly so this script works
// the same way whether it's run directly or via npm.
try {
  process.loadEnvFile();
} catch {
  // No .env file present — fall back to whatever is already in the environment.
}

async function main() {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  const name = process.env.ADMIN_BOOTSTRAP_NAME?.trim() || "Admin";

  if (!email) {
    console.error("ADMIN_BOOTSTRAP_EMAIL is not set. Add it to .env and re-run.");
    process.exit(1);
  }
  if (!password || password.length < 8) {
    console.error("ADMIN_BOOTSTRAP_PASSWORD is not set (or is shorter than 8 characters). Add it to .env and re-run.");
    process.exit(1);
  }

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const passwordHash = await hashPassword(password);
    const admin = await prisma.adminUser.upsert({
      where: { email },
      update: { passwordHash, active: true },
      create: { email, name, passwordHash, role: "SUPER_ADMIN", active: true },
    });
    console.log(`Admin user ready: ${admin.email} (role: ${admin.role}, id: ${admin.id})`);
    console.log("Password was not logged. You can now log in at /admin/login.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
