/**
 * Crée un admin dans la base de données.
 * Usage: npx tsx src/scripts/create-admin.ts <username> <password>
 */
import { db } from '../db/index.js';
import { adminUsers } from '../db/schema.js';
import { hashPassword } from '../middleware/adminAuth.js';
import { eq } from 'drizzle-orm';

async function main() {
  const username = process.argv[2];
  const password = process.argv[3];

  if (!username || !password) {
    console.error('Usage: npx tsx src/scripts/create-admin.ts <username> <password>');
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  // Upsert: update if exists, insert if not
  const [existing] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));

  if (existing) {
    await db.update(adminUsers).set({ passwordHash }).where(eq(adminUsers.username, username));
    console.log(`[admin] Password updated for '${username}'`);
  } else {
    await db.insert(adminUsers).values({ username, passwordHash });
    console.log(`[admin] Admin '${username}' created`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('[admin] Error:', err);
  process.exit(1);
});
