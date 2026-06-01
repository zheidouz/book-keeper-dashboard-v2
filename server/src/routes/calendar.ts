import { Router } from "express";
import { db, schema } from "../db/adapter.js";
import { eq, and, gte, lte } from "drizzle-orm";
const router = Router();
router.get("/", async (req, res) => {
  try {
    const user = req.authUser;
    const { start, end } = req.query;
    const sd = String(start || new Date().toISOString().split("T")[0]);
    const ed = String(end || new Date(Date.now()+90*86400000).toISOString().split("T")[0]);
    const conditions: any[] = [gte(schema.tasks.deadline, sd), lte(schema.tasks.deadline, ed)];
    if (user?.role === "bookkeeper" || user?.role === "encoder") conditions.push(eq(schema.tasks.assignedTo, user.id));
    const events = await db.select({ id: schema.tasks.id, clientName: schema.clients.name, formName: schema.tasks.formName, formCode: schema.tasks.formCode, status: schema.tasks.status, deadline: schema.tasks.deadline, filingPeriod: schema.tasks.filingPeriod, assigneeName: schema.users.name }).from(schema.tasks).leftJoin(schema.clients, eq(schema.tasks.clientId, schema.clients.id)).leftJoin(schema.users, eq(schema.tasks.assignedTo, schema.users.id)).where(and(...conditions)).orderBy(schema.tasks.deadline).all();
    res.json({success:true,data:(events as any[]).map(e=>({id:e.id,title:(e.formCode||"")+" "+e.formName+" - "+e.clientName,date:e.deadline,status:e.status,client:e.clientName,form:e.formName,assignee:e.assigneeName,filingPeriod:e.filingPeriod}))});
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});
export default router;
