import { Pool, type PoolConfig } from "pg";

let pool: Pool | null = null;

function parsePoolSize(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getDbPool(): Pool | null {
  if (pool) {
    return pool;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("DATABASE_URL is required");
    }

    console.warn(
      "DATABASE_URL is not configured. Skipping database connection; data-dependent features will be disabled.",
    );
    return null;
  }

  const poolSize = parsePoolSize(process.env.DB_POOL_MAX, 10);
  const config: PoolConfig = {
    connectionString,
    max: poolSize,
    idleTimeoutMillis: 30_000,
  };

  const shouldUseSSL = process.env.DB_SSL === "true" || connectionString.includes("neon.tech");

  if (shouldUseSSL) {
    config.ssl = {
      rejectUnauthorized: false,
    };
  }

  pool = new Pool(config);
  pool.on("error", (error) => {
    console.error("Unexpected database error", error);
  });

  return pool;
}
