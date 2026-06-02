import { Router } from "express";
import { db, schema } from "../db/adapter.js";
import { eq, and, desc, count, sql, inArray } from "drizzle-orm";
import { requireRole } from "../middleware/auth.js";
import { parseIdParam } from "../lib/validate.js";
const router = Router();
router.get("/", async (req, res) => {
  try {
    const user = req.authUser;
    const search = req.query.search as string | undefined;

    // Use a single aggregated query with subquery (LEFT JOIN + GROUP BY) instead of N+1
    const taskCounts = db.$with("task_counts").as(
      db.select({
        clientId: schema.tasks.clientId,
        totalTasks: count().as("total_tasks"),
        pendingTasks: sql<number>`sum(case when ${schema.tasks.status} = 'pending' then 1 else 0 end)`.as("pending_tasks"),
      }).from(schema.tasks).groupBy(schema.tasks.clientId)
    );

    let query = db.with(taskCounts)
      .select({
        id: schema.clients.id,
        name: schema.clients.name,
        contactPerson: schema.clients.contactPerson,
        email: schema.clients.email,
        phone: schema.clients.phone,
        address: schema.clients.address,
        notes: schema.clients.notes,
        createdAt: schema.clients.createdAt,
        updatedAt: schema.clients.updatedAt,
        totalTasks: sql<number>`coalesce(${taskCounts.totalTasks}, 0)`,
        pendingTasks: sql<number>`coalesce(${taskCounts.pendingTasks}, 0)`,
        clientType: sql<string | null>`null`,
      })
      .from(schema.clients)
      .leftJoin(taskCounts, eq(schema.clients.id, taskCounts.clientId))
      .orderBy(desc(schema.clients.createdAt));

    if (user?.role === "bookkeeper" || user?.role === "encoder") {
      query = db.with(taskCounts)
        .select({
          id: schema.clients.id,
          name: schema.clients.name,
          contactPerson: schema.clients.contactPerson,
          email: schema.clients.email,
          phone: schema.clients.phone,
          address: schema.clients.address,
          notes: schema.clients.notes,
          createdAt: schema.clients.createdAt,
          updatedAt: schema.clients.updatedAt,
          totalTasks: sql<number>`coalesce(${taskCounts.totalTasks}, 0)`,
          pendingTasks: sql<number>`coalesce(${taskCounts.pendingTasks}, 0)`,
          clientType: sql<string | null>`null`,
        })
        .from(schema.clients)
        .leftJoin(taskCounts, eq(schema.clients.id, taskCounts.clientId))
        .innerJoin(schema.clientAssignments, eq(schema.clients.id, schema.clientAssignments.clientId))
        .where(eq(schema.clientAssignments.userId, user.id))
        .orderBy(desc(schema.clients.createdAt));
    }

    let results = await query.all();

    // In-memory filter as fallback if CTE pushdown is complex (search on name only)
    const clientIds = results.map((c: any) => c.id);

    // Enrich with assigned users per client — single query
    const assignments = clientIds.length > 0
      ? await db.select({
          clientId: schema.clientAssignments.clientId,
          userId: schema.users.id,
          name: schema.users.name,
          email: schema.users.email,
          role: schema.users.role,
        }).from(schema.clientAssignments)
          .innerJoin(schema.users, eq(schema.clientAssignments.userId, schema.users.id))
          .where(inArray(schema.clientAssignments.clientId, clientIds)).all()
      : [];

    // Enrich with latest task per client — fetch ordered, take first per client (O(n) map build)
    const latestTasks = clientIds.length > 0
      ? await db.select({
          clientId: schema.tasks.clientId,
          formName: schema.tasks.formName,
          status: schema.tasks.status,
          deadline: schema.tasks.deadline,
          updatedAt: schema.tasks.updatedAt,
        }).from(schema.tasks)
          .where(inArray(schema.tasks.clientId, clientIds))
          .orderBy(desc(schema.tasks.updatedAt))
          .all()
      : [];

    // Build latestTask map + nearestDeadline map from the same result set
    const latestTaskByClient = new Map();
    const nearestDeadlineByClient = new Map();
    for (const t of latestTasks) {
      if (!latestTaskByClient.has(t.clientId)) {
        latestTaskByClient.set(t.clientId, t);
      }
      // Track earliest deadline per client
      const cur = nearestDeadlineByClient.get(t.clientId);
      if (!cur || t.deadline < cur.deadline) {
        nearestDeadlineByClient.set(t.clientId, t);
      }
    }

    // Apply search filter after enrichment
    if (search && String(search).trim()) {
      const term = String(search).toLowerCase();
      results = results.filter((c: any) => c.name.toLowerCase().includes(term));
    }

    const resultsWithMeta = results.map((c: any) => ({
      ...c,
      assignedUsers: assignments.filter((a: any) => a.clientId === c.id).map((a: any) => ({ id: a.userId, name: a.name, email: a.email, role: a.role })),
      latestTask: latestTaskByClient.get(c.id) || null,
      nearestDeadline: nearestDeadlineByClient.get(c.id) || null,
    }));

    res.json({ success: true, data: resultsWithMeta });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});
router.post("/", requireRole("admin","manager","bookkeeper"), async (req, res) => {
  try {
    const { name, contactPerson, email, phone, address, notes, assignedTo } = req.body;
    if (!name) return res.status(400).json({ success: false, error: "Client name is required" });
    const [inserted] = await db.insert(schema.clients).values({ name, contactPerson, email, phone, address, notes }).returning();
    const id = inserted.id;
    const creator = req.authUser;
    if (creator?.role === "bookkeeper") {
      // Auto-assign the bookkeeper who created the client
      await db.insert(schema.clientAssignments).values({ clientId: id, userId: creator.id }).run();
    } else if (assignedTo) {
      await db.insert(schema.clientAssignments).values({ clientId: id, userId: assignedTo }).run();
    }
    const [client] = await db.select().from(schema.clients).where(eq(schema.clients.id, id)).all();
    res.status(201).json({ success: true, data: client });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});
router.get("/:id", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: "Invalid client ID" });
    const [client] = await db.select().from(schema.clients).where(eq(schema.clients.id, id)).all();
    if (!client) return res.status(404).json({ success: false, error: "Client not found" });
    const assignedUsers = await db.select({ id: schema.users.id, name: schema.users.name, email: schema.users.email, role: schema.users.role }).from(schema.clientAssignments).innerJoin(schema.users, eq(schema.clientAssignments.userId, schema.users.id)).where(eq(schema.clientAssignments.clientId, id)).all();
    const tasks = await db.select().from(schema.tasks).where(eq(schema.tasks.clientId, id)).orderBy(desc(schema.tasks.deadline)).all();
    res.json({ success: true, data: { ...client, assignedUsers, tasks } });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});
router.put("/:id", requireRole("admin","manager","bookkeeper"), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: "Invalid client ID" });
    const { name, contactPerson, email, phone, address, notes } = req.body;
    await db.update(schema.clients).set({ name, contactPerson, email, phone, address, notes, updatedAt: new Date().toISOString() }).where(eq(schema.clients.id, id)).run();
    const [client] = await db.select().from(schema.clients).where(eq(schema.clients.id, id)).all();
    res.json({ success: true, data: client });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/clients/:id/assign - Assign a user to a client
router.post("/:id/assign", requireRole("admin","manager"), async (req, res) => {
  try {
    const clientId = parseIdParam(req.params.id);
    if (!clientId) return res.status(400).json({ success: false, error: "Invalid client ID" });
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: "userId is required" });
    const existing = await db.select().from(schema.clientAssignments)
      .where(and(eq(schema.clientAssignments.clientId, clientId), eq(schema.clientAssignments.userId, userId))).all();
    if (existing.length > 0) return res.status(400).json({ success: false, error: "Already assigned" });
    await db.insert(schema.clientAssignments).values({ clientId, userId }).run();
    const [user] = await db.select({ id: schema.users.id, name: schema.users.name, email: schema.users.email, role: schema.users.role })
      .from(schema.users).where(eq(schema.users.id, userId)).all();
    res.status(201).json({ success: true, data: user });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE /api/clients/:id/assign/:userId - Unassign a user from a client
router.delete("/:id/assign/:userId", requireRole("admin","manager"), async (req, res) => {
  try {
    const clientId = parseIdParam(req.params.id);
    const userId = parseIdParam(req.params.userId);
    if (!clientId || !userId) return res.status(400).json({ success: false, error: "Invalid client ID or user ID" });
    await db.delete(schema.clientAssignments)
      .where(and(eq(schema.clientAssignments.clientId, clientId), eq(schema.clientAssignments.userId, userId))).run();
    res.json({ success: true, message: "Unassigned successfully" });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE /api/clients/:id - Delete a client (admin/manager only)
router.delete("/:id", requireRole("admin","manager"), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: "Invalid client ID" });
    // Delete in FK order: child tables first, then parents
    await db.delete(schema.clientAssignments).where(eq(schema.clientAssignments.clientId, id)).run();
    // Tasks depend on client — batch delete children first
    const taskIds = db.select({ id: schema.tasks.id }).from(schema.tasks).where(eq(schema.tasks.clientId, id));
    await db.delete(schema.taskHistory).where(
      inArray(schema.taskHistory.taskId, taskIds)
    ).run();
    await db.delete(schema.formSubmissions).where(
      inArray(schema.formSubmissions.taskId, taskIds)
    ).run();
    await db.delete(schema.tasks).where(eq(schema.tasks.clientId, id)).run();
    await db.delete(schema.clients).where(eq(schema.clients.id, id)).run();
    res.json({ success: true, message: "Client deleted successfully" });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});
export default router;
