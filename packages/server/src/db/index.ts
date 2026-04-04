import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root before creating the DB connection
dotenv.config({ path: path.resolve(import.meta.dirname, '../../../../.env') });
dotenv.config(); // fallback: CWD

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL not set. Create a .env file at the project root.');
}

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
