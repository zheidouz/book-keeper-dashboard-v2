import "dotenv/config";
import express from "express";
import cors from "cors";
import { createTables } from "./db/migrate.js";
import { seedBIRForms, seedDefaultAdmin } from "./db/seed.js";
import { clerkAuth } from "./middleware/auth.js";
import clientsRouter from "./routes/clients.js";
import tasksRouter from "./routes/tasks.js";
import formsRouter from "./routes/forms.js";
import usersRouter from "./routes/users.js";
import reportsRouter from "./routes/reports.js";
import calendarRouter from "./routes/calendar.js";
import notificationsRouter from "./routes/notifications.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(clerkAuth);

app.use("/api/clients", clientsRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/forms", formsRouter);
app.use("/api/users", usersRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/calendar", calendarRouter);
app.use("/api/notifications", notificationsRouter);

app.get("/api/health", (_req, res) => { res.json({ success: true, message: "Bookkeeping Dashboard API is running" }); });

// Initialize DB (with serialized mutex for safety)
createTables();
await seedBIRForms();
await seedDefaultAdmin();
console.log("Database initialized successfully");

app.listen(PORT, () => { console.log("Server running on http://localhost:" + PORT); });
