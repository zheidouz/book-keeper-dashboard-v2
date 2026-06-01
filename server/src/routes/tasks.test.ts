import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import request from "supertest";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import os from "os";

describe("Tasks API", () => {
  let app: express.Application;
  let sqlite: Database.Database;
  let tmpPath: string;

  beforeAll(async () => {
    // Use a temp file DB so the adapter picks it up
    tmpPath = path.join(os.tmpdir(), `tasks-test-${Date.now()}.db`);
    process.env.DATABASE_PATH = tmpPath;

    // Now import & initialize the real adapter (reads DATABASE_PATH)
    const adapter = await import("../db/adapter.js");
    const { createTables } = await import("../db/migrate.js");

    createTables();

    const s = adapter.schema;
    const db = adapter.db;

    // Seed: admin user, BIR form, client
    const [user] = await db.insert(s.users).values({
      clerkId: "admin_test", name: "Test Admin",
      email: "admin@test.com", role: "admin",
    }).returning();

    await db.insert(s.birForms).values({
      formCode: "2550M", name: "Monthly VAT Declaration",
      filingFrequency: "monthly", deadlineDay: 20, deadlineMonthOffset: 0,
      category: "vat", isActive: true,
    });

    await db.insert(s.clients).values({
      name: "Test Client", email: "client@test.com",
    });

    // Build express app
    app = express();
    app.use(express.json());
    app.use((req: any, _res: any, next: any) => {
      req.authUser = user;
      next();
    });

    // Import router after adapter is initialized
    const { default: tasksRouter } = await import("./tasks.js");
    app.use("/api/tasks", tasksRouter);

    // Open sqlite for cleanup
    sqlite = new Database(tmpPath);
  });

  afterAll(() => {
    sqlite.close();
    try { fs.unlinkSync(tmpPath); } catch {}
  });

  it("GET /api/tasks returns empty list initially", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  it("POST /api/tasks creates a new task", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ clientId: 1, formType: "bir", formId: 1 });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.clientId).toBe(1);
    expect(res.body.data.formType).toBe("bir");
    expect(res.body.data.status).toBe("pending");
    expect(res.body.data.deadline).toBeDefined();
  });

  it("POST /api/tasks rejects missing required fields", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ clientId: 1 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain("required");
  });

  it("GET /api/tasks/:id returns a single task", async () => {
    const res = await request(app).get("/api/tasks/1");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(1);
    expect(res.body.data.history).toEqual([]);
  });

  it("GET /api/tasks/:id returns 404 for nonexistent task", async () => {
    const res = await request(app).get("/api/tasks/999");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("PATCH /api/tasks/:id/status transitions pending→ready_to_file", async () => {
    const res = await request(app)
      .patch("/api/tasks/1/status")
      .send({ status: "ready_to_file" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("ready_to_file");
  });

  it("PATCH /api/tasks/:id/status rejects invalid transition (pending→done)", async () => {
    await request(app)
      .patch("/api/tasks/1/status")
      .send({ status: "pending" });

    const res = await request(app)
      .patch("/api/tasks/1/status")
      .send({ status: "done" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain("Cannot move");
  });

  it("allows completed→done transition for admin role", async () => {
    // Walk through valid chain: pending→ready_to_file→submitted→completed→done
    await request(app)
      .patch("/api/tasks/1/status")
      .send({ status: "pending" });
    await request(app)
      .patch("/api/tasks/1/status")
      .send({ status: "ready_to_file" });
    await request(app)
      .patch("/api/tasks/1/status")
      .send({ status: "submitted" });
    await request(app)
      .patch("/api/tasks/1/status")
      .send({ status: "completed" });

    const res = await request(app)
      .patch("/api/tasks/1/status")
      .send({ status: "done" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("done");
  });

  it("records history on status transitions", async () => {
    const res = await request(app).get("/api/tasks/1");
    expect(res.body.data.history.length).toBeGreaterThanOrEqual(4);
  });

  it("DELETE /api/tasks/:id deletes task and related data", async () => {
    const res = await request(app).delete("/api/tasks/1");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const getRes = await request(app).get("/api/tasks/1");
    expect(getRes.status).toBe(404);
  });
});
