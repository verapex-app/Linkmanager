import { db } from "./index";
import { users } from "./schema";
import { hashPassword } from "../lib/auth";
import { eq } from "drizzle-orm";

async function seed() {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
  const password = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    console.log(`Admin user already exists: ${email}`);
    process.exit(0);
  }

  const passwordHash = await hashPassword(password);

  await db.insert(users).values({
    email,
    passwordHash,
    role: "admin",
  });

  console.log("Admin user created:");
  console.log(`  Email: ${email}`);
  console.log(`  Password: ${password}`);
  console.log("Please log in and change the password if needed.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
