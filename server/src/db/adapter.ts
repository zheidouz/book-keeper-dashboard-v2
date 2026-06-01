/**
 * Database adapter - unifies SQLite (sync) and PostgreSQL (async) APIs.
 * Uses Proxy to auto-wrap sync `.all()` / `.run()` calls into Promises.
 * Routes can `await` every database call regardless of backend.
 */

let rawDb: any;
let schema: any;

export const usePg = !!process.env.DATABASE_URL;

if (usePg) {
  // ── PostgreSQL (Vercel / production) ──
  const { neon } = await import("@neondatabase/serverless");
  const { drizzle } = await import("drizzle-orm/neon-http");
  const pgSchema = await import("./pg-schema.js");
  const sql = neon(process.env.DATABASE_URL!);
  rawDb = drizzle(sql, { schema: pgSchema });
  schema = pgSchema;
} else {
  // ── SQLite (local dev) ──
  const Database = (await import("better-sqlite3")).default;
  const { drizzle } = await import("drizzle-orm/better-sqlite3");
  const sqliteSchema = await import("./schema.js");
  const path = (await import("path")).default;
  const { fileURLToPath } = await import("url");
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const dbPath = process.env.DATABASE_PATH || path.join(__dirname, "../../data/app.db");
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  rawDb = drizzle(sqlite, { schema: sqliteSchema });
  schema = sqliteSchema;
}

/**
 * Proxy wrapper that makes every terminal method (.all, .run, .execute)
 * return a Promise, so routes can consistently `await` database calls.
 * Handles PostgreSQL driver (no .all/.run methods) transparently.
 */
function wrapQueryBuilder(target: any): any {
  if (target === null || target === undefined || typeof target !== "object") return target;
  if (target instanceof Promise) return target;

  return new Proxy(target, {
    get(obj: any, prop: string | symbol) {
      const value = obj[prop];

      // ── Handle .all() ──
      if (prop === "all") {
        if (typeof obj.all === "function") {
          return (...args: any[]) => Promise.resolve(obj.all(...args));
        }
        // PostgreSQL: obj itself is thenable (no .all())
        return () => Promise.resolve(obj);
      }

      // ── Handle .run() ──
      if (prop === "run") {
        if (typeof obj.run === "function") {
          return (...args: any[]) => Promise.resolve(obj.run(...args));
        }
        // PostgreSQL: obj itself is the query/promise
        return (...args: any[]) => Promise.resolve(obj);
      }

      // ── Handle regular methods ──
      if (typeof value !== "function") return value;

      return (...args: any[]) => {
        const result = Reflect.apply(value, obj, args);
        if (result && typeof result === "object" && !(result instanceof Promise)) {
          return wrapQueryBuilder(result);
        }
        return result instanceof Promise ? result : Promise.resolve(result);
      };
    },
  });
}

/** Wrapped db — all terminal calls return Promises */
const db = wrapQueryBuilder(rawDb);

export { db, schema };