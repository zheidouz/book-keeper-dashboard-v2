import { Router } from "express";
import { db, schema } from "../db/adapter.js";
import { eq, desc } from "drizzle-orm";
import { requireRole } from "../middleware/auth.js";
import { parseIdParam } from "../lib/validate.js";
const router = Router();
router.post("/", requireRole("admin"), async (req, res) => {
  try {
    const { name, email, role } = req.body;
    if (!name || !email) return res.status(400).json({ success: false, error: "Name and email are required" });
    if (!["admin","manager","bookkeeper","encoder"].includes(role)) return res.status(400).json({ success: false, error: "Invalid role" });
    const existing = await db.select().from(schema.users).where(eq(schema.users.email, email)).all();
    if (existing.length > 0) return res.status(409).json({ success: false, error: "A user with this email already exists" });
    const [inserted] = await db.insert(schema.users).values({ clerkId: "manual_" + email, name, email, role }).returning();
    res.status(201).json({ success: true, data: inserted });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});
router.get("/", requireRole("admin","manager"), async (_req, res) => {
  try {
    const data = await db.select({ id: schema.users.id, name: schema.users.name, email: schema.users.email, role: schema.users.role, avatar: schema.users.avatar, createdAt: schema.users.createdAt }).from(schema.users).orderBy(desc(schema.users.createdAt)).all();
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});
router.patch("/:id/role", requireRole("admin"), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: "Invalid user ID" });
    const { role } = req.body;
    if (!["admin","manager","bookkeeper","encoder"].includes(role)) return res.status(400).json({ success: false, error: "Invalid role" });
    await db.update(schema.users).set({ role }).where(eq(schema.users.id, id)).run();
    const [updated] = await db.select().from(schema.users).where(eq(schema.users.id, id)).all();
    res.json({ success: true, data: updated });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});
router.get("/me", async (req, res) => {
  try {
    const authUser = req.authUser;
    if (!authUser) return res.status(401).json({ success: false, error: "Not authenticated" });
    res.json({ success: true, data: authUser });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

router.get("/bookkeepers", requireRole("admin","manager","bookkeeper"), async (_req, res) => {
  try {
    const data = await db.select({ id: schema.users.id, name: schema.users.name, email: schema.users.email }).from(schema.users).all();
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});
export default router;
