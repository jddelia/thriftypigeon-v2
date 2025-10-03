import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";

import { getDbPool } from "./client";

let cachedDb: NodePgDatabase | null = null;

export function getDb(): NodePgDatabase | null {
  if (cachedDb) {
    return cachedDb;
  }

  const pool = getDbPool();

  if (!pool) {
    return null;
  }

  cachedDb = drizzle(pool);
  return cachedDb;
}
