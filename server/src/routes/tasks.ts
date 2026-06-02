import { Router } from "express";
import { db, schema } from "../db/adapter.js";
import { eq, and, asc, desc, sql, inArray } from "drizzle-orm";
import { requireRole } from "../middleware/auth.js";
import { calculateDeadline } from "../lib/deadline-calculator.js";
import { parseIdParam } from "../lib/validate.js";
const router = Router();
const STATUS_FLOW: Record<string, string[]> = {
  pending: ["ready_to_file"],
  ready_to_file: ["pending", "submitted"],
  submitted: ["ready_to_file", "completed"],
  completed: ["submitted", "done"],
  done: ["pending"],
};
router.get("/", async (req, res) => {
  try {
    const user = req.authUser;
    const { status, clientId, search, limit, offset } = req.query;
    const conditions: any[] = [];
    if (user?.role === "bookkeeper" || user?.role === "encoder") conditions.push(eq(schema.tasks.assignedTo, user.id));
    if (status) conditions.push(eq(schema.tasks.status, status as string));
    if (clientId) conditions.push(eq(schema.tasks.clientId, parseInt(clientId as string)));
    // Push search filter down to SQL level instead of filtering in-memory
    if (search && String(search).trim()) {
      const term = `%${String(search).trim().slice(0, 200).toLowerCase()}%`;
      conditions.push(
        sql`(lower(${schema.clients.name}) like ${term} or lower(${schema.tasks.formName}) like ${term} or lower(${schema.tasks.formCode}) like ${term})`
      );
    }
    const pageLimit = Math.min(Math.max(parseInt(limit as string) || 100, 1), 500);
    const pageOffset = Math.max(parseInt(offset as string) || 0, 0);
    const results = await db.select({ id: schema.tasks.id, clientId: schema.tasks.clientId, clientName: schema.clients.name, formType: schema.tasks.formType, formCode: schema.tasks.formCode, formName: schema.tasks.formName, status: schema.tasks.status, deadline: schema.tasks.deadline, filingPeriod: schema.tasks.filingPeriod, assignedTo: schema.tasks.assignedTo, assigneeName: schema.users.name, notes: schema.tasks.notes, createdAt: schema.tasks.createdAt, updatedAt: schema.tasks.updatedAt,
      submittedByName: sql<string>`(select u.name from task_history th left join users u on u.id = th.changed_by where th.task_id = tasks.id and th.to_status = 'submitted' order by th.created_at asc limit 1)`,
      submittedAt: sql<string>`(select th.created_at from task_history th where th.task_id = tasks.id and th.to_status = 'submitted' order by th.created_at asc limit 1)`,
    }).from(schema.tasks).leftJoin(schema.clients, eq(schema.tasks.clientId, schema.clients.id)).leftJoin(schema.users, eq(schema.tasks.assignedTo, schema.users.id)).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(asc(schema.tasks.statusSortOrder), asc(schema.tasks.deadline)).limit(pageLimit).offset(pageOffset).all();
    res.json({ success: true, data: results });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});
router.post("/", requireRole("admin","manager","bookkeeper"), async (req, res) => {
  try {
    const { clientId, formType, formId, assignedTo, notes } = req.body;
    if (!clientId || !formType || !formId) return res.status(400).json({ success: false, error: "clientId, formType, formId required" });
    let formName = "", formCode = "", filingFrequency = "monthly", deadlineDay = 15, deadlineMonthOffset = 0;
    if (formType === "bir") {
      const [form] = await db.select().from(schema.birForms).where(eq(schema.birForms.id, formId)).all();
      if (!form) return res.status(404).json({ success: false, error: "BIR form not found" });
      formName = form.name; formCode = form.formCode; filingFrequency = form.filingFrequency; deadlineDay = form.deadlineDay; deadlineMonthOffset = form.deadlineMonthOffset;
    } else {
      const [form] = await db.select().from(schema.customForms).where(eq(schema.customForms.id, formId)).all();
      if (!form) return res.status(404).json({ success: false, error: "Custom form not found" });
      formName = form.name; filingFrequency = form.filingFrequency; deadlineDay = form.deadlineDay || 15; deadlineMonthOffset = form.deadlineMonthOffset;
    }
    const dr = calculateDeadline({ filingFrequency, deadlineDay, deadlineMonthOffset });
    const creator = req.authUser;
    // Bookkeepers auto-assign tasks to themselves unless explicitly targeting someone else
    const taskAssignedTo = creator?.role === "bookkeeper" ? (assignedTo || creator.id) : (assignedTo || null);
    const [inserted] = await db.insert(schema.tasks).values({ clientId, formType, formId, formCode, formName, status: "pending", deadline: dr.deadline, filingPeriod: dr.filingPeriod, taxYear: dr.taxYear, assignedTo: taskAssignedTo, notes: notes || null }).returning();
    res.status(201).json({ success: true, data: inserted });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});
router.patch("/:id/status", async (req, res) => {
  try {
    const user = req.authUser;
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: "Invalid task ID" });
    const { status: newStatus, comment } = req.body;

    // Encoders cannot change task status (PRD: "data entry with limited editing")
    if (user?.role === "encoder") return res.status(403).json({ success: false, error: "Encoders cannot change task status" });

    const [task] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, id)).all();
    if (!task) return res.status(404).json({ success: false, error: "Task not found" });
    const allowed = STATUS_FLOW[task.status] || [];
    if (!allowed.includes(newStatus)) return res.status(400).json({ success: false, error: "Cannot move from " + task.status + " to " + newStatus });
    if (newStatus === "done" && task.status === "completed" && !["admin","manager","bookkeeper"].includes(user?.role || "")) return res.status(403).json({ success: false, error: "Only admin/manager/bookkeeper can mark as done" });

    // Atomic CAS: only update if status hasn't changed since we read it
    const result = await db.update(schema.tasks)
      .set({ status: newStatus, updatedAt: new Date().toISOString() })
      .where(and(eq(schema.tasks.id, id), eq(schema.tasks.status, task.status)))
      .run();
    if (result.changes === 0) return res.status(409).json({ success: false, error: "Task status changed by another request, retry" });

    await db.insert(schema.taskHistory).values({ taskId: id, fromStatus: task.status, toStatus: newStatus, changedBy: user?.id, comment: comment || null }).run();

    // Auto-generate next recurring task when marked done
    if (newStatus === "done") {
      let filingFreq = "one_time";
      let deadlineDay = 15;
      let deadlineMonthOffset = 0;
      let nextFormName = task.formName;
      let nextFormCode = task.formCode;

      if (task.formType === "bir") {
        const [form] = await db.select().from(schema.birForms).where(eq(schema.birForms.id, task.formId)).all();
        if (form) { filingFreq = form.filingFrequency; deadlineDay = form.deadlineDay; deadlineMonthOffset = form.deadlineMonthOffset; }
      } else {
        const [form] = await db.select().from(schema.customForms).where(eq(schema.customForms.id, task.formId)).all();
        if (form) { filingFreq = form.filingFrequency; deadlineDay = form.deadlineDay || 15; deadlineMonthOffset = form.deadlineMonthOffset; }
      }

      if (filingFreq !== "one_time") {
        // Check if this task was previously marked done (re-open → re-close)
        // If so, skip recurring generation — already handled on first close
        const [prevDone] = await db.select({ id: schema.taskHistory.id })
          .from(schema.taskHistory)
          .where(and(
            eq(schema.taskHistory.taskId, id),
            eq(schema.taskHistory.toStatus, "done"),
            eq(schema.taskHistory.fromStatus, "completed")
          ))
          .limit(1)
          .offset(1)
          .all();

        if (!prevDone) {
          // Collect all periods to insert, then batch-check + batch-insert
          const now = new Date();
          let refDate = new Date(task.deadline);
          refDate.setDate(refDate.getDate() + 1);

          const periods: Array<{ deadline: string; filingPeriod: string; taxYear: number }> = [];
          while (refDate <= now) {
            const dr = calculateDeadline({ filingFrequency: filingFreq, deadlineDay, deadlineMonthOffset, referenceDate: refDate });
            periods.push({ deadline: dr.deadline, filingPeriod: dr.filingPeriod, taxYear: dr.taxYear });
            refDate = new Date(dr.deadline);
            refDate.setDate(refDate.getDate() + 1);
          }

          // Single batch query: find existing filing periods for this client+form
          const existingPeriods = new Set(
            (await db.select({ filingPeriod: schema.tasks.filingPeriod }).from(schema.tasks)
              .where(and(
                eq(schema.tasks.clientId, task.clientId),
                eq(schema.tasks.formType, task.formType),
                eq(schema.tasks.formId, task.formId),
                inArray(schema.tasks.filingPeriod, periods.map(p => p.filingPeriod))
              )).all()
            ).map((r: any) => r.filingPeriod)
          );

          // Batch insert: only periods that don't already exist
          const toInsert = periods
            .filter(p => !existingPeriods.has(p.filingPeriod))
            .map(p => ({
              clientId: task.clientId, formType: task.formType, formId: task.formId,
              formCode: nextFormCode, formName: nextFormName, status: "pending" as const,
              deadline: p.deadline, filingPeriod: p.filingPeriod, taxYear: p.taxYear,
              assignedTo: task.assignedTo,
            }));

          if (toInsert.length > 0) {
            await db.insert(schema.tasks).values(toInsert).run();
          }
        }
      }

      // Create notification for task completion
      const [client] = await db.select({ name: schema.clients.name }).from(schema.clients).where(eq(schema.clients.id, task.clientId)).all();
      const changedByUser = user?.name || "Unknown user";
      await db.insert(schema.notifications).values({
        taskId: id,
        message: `${changedByUser} marked ${nextFormCode || nextFormName} as done for ${client?.name || "a client"}`,
        bookkeeperName: changedByUser,
        formName: nextFormName,
        clientName: client?.name || "Unknown",
      }).run();
    }
    const [updated] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, id)).all();
    res.json({ success: true, data: updated });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

/**
 * GET /api/tasks/overview — combined payload for the Tasks page.
 * Returns tasks, clients, and bookkeepers in a single request.
 * MUST be before /:id or Express matches "overview" as an :id param.
 */
router.get("/overview", async (req, res) => {
  try {
    const user = req.authUser;

    // Bookkeepers see only their assigned clients in the dropdown
    let clientsQuery;
    if (user?.role === "bookkeeper") {
      clientsQuery = db.select({
        id: schema.clients.id,
        name: schema.clients.name,
        contactPerson: schema.clients.contactPerson,
        email: schema.clients.email,
        phone: schema.clients.phone,
        address: schema.clients.address,
        notes: schema.clients.notes,
        createdAt: schema.clients.createdAt,
        updatedAt: schema.clients.updatedAt,
      })
        .from(schema.clients)
        .innerJoin(schema.clientAssignments, eq(schema.clients.id, schema.clientAssignments.clientId))
        .where(eq(schema.clientAssignments.userId, user.id))
        .orderBy(asc(schema.clients.name))
        .all();
    } else {
      clientsQuery = db.select().from(schema.clients).orderBy(asc(schema.clients.name)).all();
    }

    // Bookkeepers only see tasks assigned to them
    let tasksQuery = db.select({
      id: schema.tasks.id,
      clientId: schema.tasks.clientId,
      clientName: schema.clients.name,
      formType: schema.tasks.formType,
      formCode: schema.tasks.formCode,
      formName: schema.tasks.formName,
      status: schema.tasks.status,
      deadline: schema.tasks.deadline,
      filingPeriod: schema.tasks.filingPeriod,
      assignedTo: schema.tasks.assignedTo,
      assigneeName: schema.users.name,
      notes: schema.tasks.notes,
      createdAt: schema.tasks.createdAt,
      updatedAt: schema.tasks.updatedAt,
    })
      .from(schema.tasks)
      .leftJoin(schema.clients, eq(schema.tasks.clientId, schema.clients.id))
      .leftJoin(schema.users, eq(schema.tasks.assignedTo, schema.users.id))
      .orderBy(asc(schema.tasks.statusSortOrder), asc(schema.tasks.deadline));

    if (user?.role === "bookkeeper") {
      tasksQuery = tasksQuery.where(eq(schema.tasks.assignedTo, user.id));
    }

    const [tasks, clients, bookkeepers] = await Promise.all([
      tasksQuery.all(),
      clientsQuery,
      db.select().from(schema.users).where(sql`role IN ('bookkeeper','manager','admin')`).orderBy(asc(schema.users.name)).all(),
    ]);
    res.json({ success: true, data: { tasks, clients, bookkeepers } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: "Invalid task ID" });
    const [task] = await db.select({ id: schema.tasks.id, clientId: schema.tasks.clientId, clientName: schema.clients.name, formType: schema.tasks.formType, formCode: schema.tasks.formCode, formName: schema.tasks.formName, status: schema.tasks.status, deadline: schema.tasks.deadline, filingPeriod: schema.tasks.filingPeriod, taxYear: schema.tasks.taxYear, assignedTo: schema.tasks.assignedTo, assigneeName: schema.users.name, notes: schema.tasks.notes, createdAt: schema.tasks.createdAt, updatedAt: schema.tasks.updatedAt }).from(schema.tasks).leftJoin(schema.clients, eq(schema.tasks.clientId, schema.clients.id)).leftJoin(schema.users, eq(schema.tasks.assignedTo, schema.users.id)).where(eq(schema.tasks.id, id)).all();
    if (!task) return res.status(404).json({ success: false, error: "Task not found" });
    const history = await db.select({ id: schema.taskHistory.id, fromStatus: schema.taskHistory.fromStatus, toStatus: schema.taskHistory.toStatus, comment: schema.taskHistory.comment, changedByName: schema.users.name, createdAt: schema.taskHistory.createdAt }).from(schema.taskHistory).leftJoin(schema.users, eq(schema.taskHistory.changedBy, schema.users.id)).where(eq(schema.taskHistory.taskId, id)).orderBy(desc(schema.taskHistory.createdAt)).all();
    res.json({ success: true, data: { ...task, history } });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});
router.delete("/:id", async (req, res) => {
  try {
    const user = req.authUser;
    if (!user) return res.status(401).json({ success: false, error: "Authentication required" });
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: "Invalid task ID" });
    const [task] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, id)).all();
    if (!task) return res.status(404).json({ success: false, error: "Task not found" });
    // Admin/manager can delete any task; bookkeeper can only delete tasks assigned to them
    const isAdminOrManager = user.role === "admin" || user.role === "manager";
    const isOwnTask = user.role === "bookkeeper" && task.assignedTo === user.id;
    if (!isAdminOrManager && !isOwnTask) {
      return res.status(403).json({ success: false, error: "Insufficient permissions" });
    }
    await db.delete(schema.taskHistory).where(eq(schema.taskHistory.taskId, id)).run();
    await db.delete(schema.notifications).where(eq(schema.notifications.taskId, id)).run();
    await db.delete(schema.tasks).where(eq(schema.tasks.id, id)).run();
    res.json({ success: true, data: { id } });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

export default router;
