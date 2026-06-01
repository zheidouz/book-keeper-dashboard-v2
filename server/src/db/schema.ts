import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clerkId: text("clerk_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role", { enum: ["admin","manager","bookkeeper","encoder"] }).notNull().default("encoder"),
  avatar: text("avatar"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});
export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(), contactPerson: text("contact_person"), email: text("email"),
  phone: text("phone"), address: text("address"), notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});
export const clientAssignments = sqliteTable("client_assignments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id").notNull().references(() => clients.id),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});
export const birForms = sqliteTable("bir_forms", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  formCode: text("form_code").notNull().unique(), name: text("name").notNull(), description: text("description"),
  filingFrequency: text("filing_frequency", { enum: ["monthly","quarterly","annually","semi_annual"] }).notNull(),
  deadlineDay: integer("deadline_day").notNull(), deadlineMonthOffset: integer("deadline_month_offset").notNull().default(0),
  deadlineRule: text("deadline_rule"), category: text("category").notNull().default("general"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});
export const customForms = sqliteTable("custom_forms", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(), description: text("description"),
  filingFrequency: text("filing_frequency", { enum: ["monthly","quarterly","annually","semi_annual","one_time"] }).notNull(),
  deadlineDay: integer("deadline_day"), deadlineMonthOffset: integer("deadline_month_offset").notNull().default(0),
  requiredFields: text("required_fields", { mode: "json" }).notNull().default("[]"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});
export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id").notNull().references(() => clients.id),
  formType: text("form_type", { enum: ["bir","custom"] }).notNull(),
  formId: integer("form_id").notNull(), formCode: text("form_code"), formName: text("form_name").notNull(),
  status: text("status", { enum: ["pending","ready_to_file","submitted","completed","done"] }).notNull().default("pending"),
  statusSortOrder: integer("status_sort_order"),
  deadline: text("deadline").notNull(), assignedTo: integer("assigned_to").references(() => users.id),
  filingPeriod: text("filing_period"), taxYear: integer("tax_year"), notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});
export const taskHistory = sqliteTable("task_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  taskId: integer("task_id").notNull().references(() => tasks.id),
  fromStatus: text("from_status"), toStatus: text("to_status").notNull(),
  changedBy: integer("changed_by").notNull().references(() => users.id), comment: text("comment"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  taskId: integer("task_id").notNull().references(() => tasks.id),
  message: text("message").notNull(),
  bookkeeperName: text("bookkeeper_name").notNull(),
  formName: text("form_name").notNull(),
  clientName: text("client_name").notNull(),
  read: integer("read", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const formSubmissions = sqliteTable("form_submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  taskId: integer("task_id").notNull().references(() => tasks.id),
  submittedBy: integer("submitted_by").notNull().references(() => users.id),
  submittedData: text("submitted_data", { mode: "json" }),
  attachmentUrl: text("attachment_url"),
  submittedAt: text("submitted_at").notNull().default(sql`(datetime('now'))`),
});
