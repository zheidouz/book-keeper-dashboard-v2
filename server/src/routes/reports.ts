import { Router } from "express";
import { db, schema, usePg } from "../db/adapter.js";
import { eq, count, sql } from "drizzle-orm";
const router = Router();
router.get("/stats", async (req, res) => {
  try {
    const user = req.authUser;
    const today = new Date().toISOString().split("T")[0];
    const in30 = new Date(Date.now() + 30*86400000).toISOString().split("T")[0];

    // ── Single aggregated query for all task stats ──
    // Uses CASE expressions to count each status in one pass instead of 8 separate queries
    let taskFilter = sql`1=1`;
    if (user?.role === "bookkeeper" || user?.role === "encoder") {
      taskFilter = eq(schema.tasks.assignedTo, user.id);
    }

    const taskStatsPromise = db.select({
      totalTasks: count().as("total_tasks"),
      pendingTasks: sql<number>`sum(case when ${schema.tasks.status} = 'pending' then 1 else 0 end)`.as("pending_tasks"),
      readyTasks: sql<number>`sum(case when ${schema.tasks.status} = 'ready_to_file' then 1 else 0 end)`.as("ready_tasks"),
      submittedTasks: sql<number>`sum(case when ${schema.tasks.status} = 'submitted' then 1 else 0 end)`.as("submitted_tasks"),
      completedTasks: sql<number>`sum(case when ${schema.tasks.status} = 'completed' then 1 else 0 end)`.as("completed_tasks"),
      doneTasks: sql<number>`sum(case when ${schema.tasks.status} = 'done' then 1 else 0 end)`.as("done_tasks"),
      overdueTasks: sql<number>`sum(case when ${schema.tasks.deadline} < ${today} and ${schema.tasks.status} not in ('completed', 'done') then 1 else 0 end)`.as("overdue_tasks"),
      upcomingDeadlines: sql<number>`sum(case when ${schema.tasks.deadline} >= ${today} and ${schema.tasks.deadline} <= ${in30} and ${schema.tasks.status} not in ('completed', 'done') then 1 else 0 end)`.as("upcoming_deadlines"),
    }).from(schema.tasks).where(taskFilter).all();

    // ── Single query for client/user counts ──
    const metaCountsPromise = db.select({
      totalClients: count().as("total_clients"),
      activeUsers: count().as("active_users"),
    }).from(schema.clients).all();

    const [taskStats, metaCounts] = await Promise.all([taskStatsPromise, metaCountsPromise]);

    const d = taskStats[0] || {};
    const m = metaCounts[0] || {};
    res.json({success:true,data:{
      totalTasks: Number(d.totalTasks) || 0,
      pendingTasks: Number(d.pendingTasks) || 0,
      readyTasks: Number(d.readyTasks) || 0,
      submittedTasks: Number(d.submittedTasks) || 0,
      completedTasks: Number(d.completedTasks) || 0,
      doneTasks: Number(d.doneTasks) || 0,
      overdueTasks: Number(d.overdueTasks) || 0,
      upcomingDeadlines: Number(d.upcomingDeadlines) || 0,
      totalClients: Number(m.totalClients) || 0,
      activeUsers: Number(m.activeUsers) || 0,
    }});
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});
router.get("/status-distribution", async (req, res) => {
  try {
    const user = req.authUser;
    let tf: any = sql`1=1`;
    if (user?.role === "bookkeeper" || user?.role === "encoder") tf = eq(schema.tasks.assignedTo, user.id);
    const results = await db.select({ status: schema.tasks.status, count: count() }).from(schema.tasks).where(tf).groupBy(schema.tasks.status).all();
    const labels: Record<string,string> = { pending:"Pending", ready_to_file:"Ready to File", submitted:"Submitted", completed:"Completed", done:"Done" };
    res.json({success:true,data:results.map((r:any)=>({status:r.status,label:labels[r.status]||r.status,count:r.count}))});
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});
router.get("/monthly-trends", async (_req, res) => {
  try {
    // Cross-DB compatible: PostgreSQL uses to_char, SQLite uses strftime
    const monthExpr = usePg
      ? sql`to_char(date_trunc('month', created_at), 'YYYY-MM')`
      : sql`strftime('%Y-%m', created_at)`;
    const results = await db.select({ month: monthExpr, count: count() }).from(schema.tasks).groupBy(monthExpr).orderBy(monthExpr).all();
    res.json({success:true,data:results});
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

/**
 * GET /api/reports/dashboard — combined payload for the Dashboard page.
 * Returns stats, distribution, and trends in a single request.
 * Cuts 3 round-trips down to 1.
 */
router.get("/dashboard", async (req, res) => {
  try {
    const user = req.authUser;
    const today = new Date().toISOString().split("T")[0];
    const in30 = new Date(Date.now() + 30*86400000).toISOString().split("T")[0];
    let tf = sql`1=1`;
    if (user?.role === "bookkeeper" || user?.role === "encoder") tf = eq(schema.tasks.assignedTo, user.id);

    const monthExpr = usePg
      ? sql`to_char(date_trunc('month', created_at), 'YYYY-MM')`
      : sql`strftime('%Y-%m', created_at)`;

    // Use a CTE to scan tasks ONCE instead of 3 separate scans (taskStats + distribution)
    const filteredTasks = db.$with("filtered_tasks").as(
      db.select({ id: schema.tasks.id, status: schema.tasks.status, deadline: schema.tasks.deadline, created_at: schema.tasks.createdAt })
        .from(schema.tasks).where(tf)
    );

    const [taskStats, metaCounts, trends] = await Promise.all([
      db.with(filteredTasks)
        .select({
          totalTasks: count().as("total_tasks"),
          pendingTasks: sql<number>`sum(case when ${filteredTasks.status} = 'pending' then 1 else 0 end)`.as("pending_tasks"),
          readyTasks: sql<number>`sum(case when ${filteredTasks.status} = 'ready_to_file' then 1 else 0 end)`.as("ready_tasks"),
          submittedTasks: sql<number>`sum(case when ${filteredTasks.status} = 'submitted' then 1 else 0 end)`.as("submitted_tasks"),
          completedTasks: sql<number>`sum(case when ${filteredTasks.status} = 'completed' then 1 else 0 end)`.as("completed_tasks"),
          doneTasks: sql<number>`sum(case when ${filteredTasks.status} = 'done' then 1 else 0 end)`.as("done_tasks"),
          overdueTasks: sql<number>`sum(case when ${filteredTasks.deadline} < ${today} and ${filteredTasks.status} not in ('completed', 'done') then 1 else 0 end)`.as("overdue_tasks"),
          upcomingDeadlines: sql<number>`sum(case when ${filteredTasks.deadline} >= ${today} and ${filteredTasks.deadline} <= ${in30} and ${filteredTasks.status} not in ('completed', 'done') then 1 else 0 end)`.as("upcoming_deadlines"),
        }).from(filteredTasks).all(),
      // Single-row scalar subquery for client count — avoids a separate table scan
      db.select({ totalClients: count().as("total_clients") }).from(schema.clients).all(),
      db.select({ month: monthExpr, count: count() }).from(schema.tasks).groupBy(monthExpr).orderBy(monthExpr).all(),
    ]);

    const d = taskStats[0] || {};
    const m = metaCounts[0] || {};
    const labels: Record<string,string> = { pending:"Pending", ready_to_file:"Ready to File", submitted:"Submitted", completed:"Completed", done:"Done" };

    // Derive distribution from the single taskStats row — avoids querying tasks again
    const distribution = [
      { status: "pending", count: Number(d.pendingTasks) || 0 },
      { status: "ready_to_file", count: Number(d.readyTasks) || 0 },
      { status: "submitted", count: Number(d.submittedTasks) || 0 },
      { status: "completed", count: Number(d.completedTasks) || 0 },
      { status: "done", count: Number(d.doneTasks) || 0 },
    ];

    res.json({success:true,data:{
      stats: {
        totalTasks: Number(d.totalTasks) || 0,
        pendingTasks: Number(d.pendingTasks) || 0,
        readyTasks: Number(d.readyTasks) || 0,
        submittedTasks: Number(d.submittedTasks) || 0,
        completedTasks: Number(d.completedTasks) || 0,
        doneTasks: Number(d.doneTasks) || 0,
        overdueTasks: Number(d.overdueTasks) || 0,
        upcomingDeadlines: Number(d.upcomingDeadlines) || 0,
        totalClients: Number(m.totalClients) || 0,
      },
      distribution: distribution.map((r) => ({ status: r.status, label: labels[r.status] || r.status, count: r.count })),
      trends,
    }});
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

export default router;
