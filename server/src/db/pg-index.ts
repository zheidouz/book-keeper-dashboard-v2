import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./pg-schema.js";

const connectionString = process.env.DATABASE_URL || "";
if (!connectionString) {
  console.error("DATABASE_URL environment variable is required for PostgreSQL mode");
}

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
export { schema };
export { sql };