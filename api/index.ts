import express, { Router } from "express";
import cors from "cors";
import type { Request, Response, NextFunction } from "express";

// Use PostgreSQL for Vercel (requires DATABASE_URL env var)
if (!process.env.DATABASE_URL) {
  console.error("WARNING: DATABASE_URL is not set — API will fail at runtime. Set it in Vercel dashboard.");
}

import { createTables } from "../server/src/db/pg-migrate.js";
import { seedBIRForms, seedDefaultAdmin } from "../server/src/db/pg-seed.js";
import { clerkAuth } from "../server/src/middleware/auth.js";
import clientsRouter from "../server/src/routes/clients.js";
import tasksRouter from "../server/src/routes/tasks.js";
import formsRouter from "../server/src/routes/forms.js";
import usersRouter from "../server/src/routes/users.js";
import reportsRouter from "../server/src/routes/reports.js";
import calendarRouter from "../server/src/routes/calendar.js";
import notificationsRouter from "../server/src/routes/notifications.js";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: true }));
app.use(express.json({ limit: "10mb" }));

// ── Database initialization middleware ──
// Ensures DB tables exist BEFORE any route handler runs,
// preventing cold-start race conditions where a request arrives
// before initDb() completes.
let initialized = false;
let initPromise: Promise<void> | null = null;

async function initDb() {
  if (initialized) return;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      // Always run createTables (uses IF NOT EXISTS — safe to call multiple times)
      await createTables();
      await seedBIRForms();
      await seedDefaultAdmin();
      initialized = true;
      console.log("Database initialized successfully");
    } catch (err) {
      console.error("Database init error:", err);
      initialized = false;
      initPromise = null;
      throw err;
    }
  })();
  return initPromise;
}

// Middleware that blocks requests until DB is ready
app.use(async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await initDb();
  } catch (err: any) {
    console.error("DB init failed:", err?.message || err);
    initialized = false;
    initPromise = null;
    res.status(500).json({ success: false, error: "Database init failed: " + (err?.message || err) });
    return;
  }
  next();
});

app.use(clerkAuth);

app.use("/api/clients", clientsRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/forms", formsRouter);
app.use("/api/users", usersRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/calendar", calendarRouter);
app.use("/api/notifications", notificationsRouter);

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Bookkeeping Dashboard API is running",
    dbInitialized: initialized,
    environment: process.env.VERCEL_ENV || "development",
  });
});

// Global error handler — always returns JSON, never HTML
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, error: err.message || "Internal server error" });
});

// Export for Vercel serverless
export default app;