import { db, schema } from "../../db/adapter.js";
import { and, eq, sql } from "drizzle-orm";
import type { FormMatch } from "./types.js";

export async function findRelevantForms(query: string, limit = 5): Promise<FormMatch[]> {
  const term = `%${query.toLowerCase().slice(0, 100)}%`;
  return db
    .select({
      formCode: schema.birForms.formCode,
      name: schema.birForms.name,
      filingFrequency: schema.birForms.filingFrequency,
      deadlineDay: schema.birForms.deadlineDay,
      deadlineMonthOffset: schema.birForms.deadlineMonthOffset,
      category: schema.birForms.category,
    })
    .from(schema.birForms)
    .where(
      and(
        eq(schema.birForms.isActive, true),
        sql`(lower(${schema.birForms.formCode}) like ${term} or lower(${schema.birForms.name}) like ${term})`
      )
    )
    .limit(limit)
    .all();
}
