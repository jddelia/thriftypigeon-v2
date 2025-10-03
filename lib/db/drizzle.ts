import { drizzle } from "drizzle-orm/node-postgres";

import { getDbPool } from "./client";

export const db = drizzle(getDbPool());
