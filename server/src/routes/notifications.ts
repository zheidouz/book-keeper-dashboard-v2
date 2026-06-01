import { Router } from "express";
import { db, schema } from "../db/adapter.js";
import { eq, desc, sql } from "drizzle-orm";
import { parseIdParam } from "../lib/validate.js";

const router = Router();

// GET /api/notifications - latest 10 unread-first
router.get("/", async (req, res) => {
  try {
    const data = await db.select().from(schema.notifications)
      .orderBy(desc(schema.notifications.createdAt))
      .limit(10).all();
    const [unreadRow] = await db.select({ count: sql<number>`count(*)` })
      .from(schema.notifications)
      .where(eq(schema.notifications.read, false)).all();
    res.json({ success: true, data: { items: data, unreadCount: Number(unreadRow?.count ?? 0) } });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

// PUT /api/notifications/read-all
router.put("/read-all", async (req, res) => {
  try {
    await db.update(schema.notifications).set({ read: true }).where(eq(schema.notifications.read, false)).run();
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

// PATCH /api/notifications/:id/read
router.patch("/:id/read", async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: "Invalid notification ID" });
    await db.update(schema.notifications).set({ read: true }).where(eq(schema.notifications.id, id)).run();
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

export default router;
