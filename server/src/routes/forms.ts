import { Router } from "express";
import { db, schema } from "../db/adapter.js";
import { eq } from "drizzle-orm";
import { requireRole } from "../middleware/auth.js";
import { parseIdParam } from "../lib/validate.js";
const router = Router();
router.get("/bir", async (_req, res) => {
  try {
    const data = await db.select().from(schema.birForms).where(eq(schema.birForms.isActive, true)).all();
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});
router.get("/custom", async (_req, res) => {
  try {
    const data = await db.select({ id: schema.customForms.id, name: schema.customForms.name, description: schema.customForms.description, filingFrequency: schema.customForms.filingFrequency, deadlineDay: schema.customForms.deadlineDay, deadlineMonthOffset: schema.customForms.deadlineMonthOffset, requiredFields: schema.customForms.requiredFields, createdBy: schema.customForms.createdBy, creatorName: schema.users.name, isActive: schema.customForms.isActive, createdAt: schema.customForms.createdAt }).from(schema.customForms).leftJoin(schema.users, eq(schema.customForms.createdBy, schema.users.id)).where(eq(schema.customForms.isActive, true)).all();
    res.json({ success: true, data });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});
router.post("/custom", requireRole("admin"), async (req, res) => {
  try {
    const user = req.authUser;
    const { name, description, filingFrequency, deadlineDay, deadlineMonthOffset, requiredFields } = req.body;
    if (!name) return res.status(400).json({ success: false, error: "Form name required" });
    const [inserted] = await db.insert(schema.customForms).values({ name, description: description || null, filingFrequency, deadlineDay: deadlineDay || 15, deadlineMonthOffset: deadlineMonthOffset || 0, requiredFields: requiredFields || [], createdBy: user?.id }).returning();
    res.status(201).json({ success: true, data: inserted });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});
router.put("/custom/:id", requireRole("admin"), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: "Invalid form ID" });
    const { name, description, filingFrequency, deadlineDay, deadlineMonthOffset, requiredFields, isActive } = req.body;
    await db.update(schema.customForms).set({ name, description, filingFrequency, deadlineDay, deadlineMonthOffset, requiredFields: requiredFields || [], isActive }).where(eq(schema.customForms.id, id)).run();
    const [updated] = await db.select().from(schema.customForms).where(eq(schema.customForms.id, id)).all();
    res.json({ success: true, data: updated });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete("/custom/:id", requireRole("admin"), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: "Invalid form ID" });
    await db.update(schema.customForms).set({ isActive: false }).where(eq(schema.customForms.id, id)).run();
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

export default router;
