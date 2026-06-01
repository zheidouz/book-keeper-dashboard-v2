import { db, schema } from "../../db/adapter.js";
import { and, eq, or, sql } from "drizzle-orm";
import type { FormMatch } from "./types.js";

// Map common query keywords to BIR form categories
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  withholding: ["withholding_tax"],
  vat: ["vat"],
  income: ["income_tax"],
  percentage: ["percentage_tax"],
  "percentage tax": ["percentage_tax"],
  dst: ["dst"],
  documentary: ["dst"],
  donor: ["donor_estate"],
  estate: ["donor_estate"],
  gift: ["donor_estate"],
  registration: ["registration"],
  register: ["registration"],
  payment: ["payments"],
};

export async function findRelevantForms(query: string, limit = 5): Promise<FormMatch[]> {
  const lower = query.toLowerCase().slice(0, 100);
  const term = `%${lower}%`;

  // Build conditions: match by formCode/name keyword, and optionally by category
  const conditions: any[] = [eq(schema.birForms.isActive, true)];

  // Extract potential form code patterns like "2550M", "1701", "0619-E"
  const formCodePatterns = query.match(/\b\d{3,4}[A-Z]?(?:-[A-Z]+)?\b/g);
  const formCodeConds: any[] = [];
  if (formCodePatterns && formCodePatterns.length > 0) {
    for (const code of formCodePatterns) {
      formCodeConds.push(
        sql`${schema.birForms.formCode} = ${code.toUpperCase()}`
      );
    }
  }

  const keywordCond = sql`(lower(${schema.birForms.formCode}) like ${term} or lower(${schema.birForms.name}) like ${term})`;

  // Check if query mentions a known category
  let categoryMatch: string | null = null;
  for (const [keyword, categories] of Object.entries(CATEGORY_KEYWORDS)) {
    if (lower.includes(keyword)) {
      categoryMatch = categories[0];
      break;
    }
  }

  // Combine keyword match with any exact form code matches and optional category
  const matchConds: any[] = [keywordCond];
  if (formCodeConds.length > 0) {
    matchConds.push(or(...formCodeConds));
  }
  if (categoryMatch) {
    matchConds.push(eq(schema.birForms.category, categoryMatch));
    limit = Math.max(limit, 10);
  }
  conditions.push(matchConds.length > 1 ? or(...matchConds) : matchConds[0]);

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
    .where(and(...conditions))
    .limit(limit)
    .all();
}
