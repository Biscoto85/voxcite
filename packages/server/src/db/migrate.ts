import 'dotenv/config';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(client);

async function main() {
  console.log('[migrate] Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('[migrate] Done.');
  await client.end();
}

main().catch((err) => {
  console.error('[migrate] Error:', err);
  process.exit(1);
});
