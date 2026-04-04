import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root (2 levels up from packages/server/)
dotenv.config({ path: path.resolve(import.meta.dirname, '../../../../.env') });

import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  console.error('[migrate] DATABASE_URL not set. Create a .env file at the project root.');
  process.exit(1);
}

const client = postgres(process.env.DATABASE_URL, { max: 1 });
const db = drizzle(client);

async function main() {
  console.log('[migrate] Running migrations...');
  console.log(`[migrate] Database: ${process.env.DATABASE_URL!.replace(/:[^:@]+@/, ':***@')}`);
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('[migrate] Done.');
  await client.end();
}

main().catch((err) => {
  console.error('[migrate] Error:', err);
  process.exit(1);
});
