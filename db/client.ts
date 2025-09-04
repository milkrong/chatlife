import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  throw new Error('SUPABASE_DB_URL is not set');
}

const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client);

export * from './schema';
