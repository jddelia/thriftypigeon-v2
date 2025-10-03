import { Pool } from "pg";

let pool: Pool | null = null;

export function getDbPool() {
  if (pool) {
    return pool;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("DATABASE_URL is required");
    }

    console.warn("DATABASE_URL is not set. Database calls will fail in production.");
    pool = new Pool({ connectionString: "postgres://user:pass@localhost:5432/dev" });
    return pool;
  }

  pool = new Pool({ connectionString, max: 10 });
  return pool;
}
