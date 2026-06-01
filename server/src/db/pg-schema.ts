import { pgTable, text, integer, serial, boolean, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role", { enum: ["admin","manager","bookkeeper","encoder"] }).notNull().default("encoder"),
  avatar: text("avatar"),
  createdAt: text("created_at").notNull().default(sql`now()`),
  updatedAt: text("updated_at").notNull().default(sql`now()`),
});

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`now()`),
  updatedAt: text("updated_at").notNull().default(sql`now()`),
});

export const clientAssignments = pgTable("client_assignments", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const birForms = pgTable("bir_forms", {
  id: serial("id").primaryKey(),
  formCode: text("form_code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  filingFrequency: text("filing_frequency", { enum: ["monthly","quarterly","annually","semi_annual"] }).notNull(),
  deadlineDay: integer("deadline_day").notNull(),
  deadlineMonthOffset: integer("deadline_month_offset").notNull().default(0),
  deadlineRule: text("deadline_rule"),
  category: text("category").notNull().default("general"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const customForms = pgTable("custom_forms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  filingFrequency: text("filing_frequency", { enum: ["monthly","quarterly","annually","semi_annual","one_time"] }).notNull(),
  deadlineDay: integer("deadline_day"),
  deadlineMonthOffset: integer("deadline_month_offset").notNull().default(0),
  requiredFields: jsonb("required_fields").notNull().default("[]"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`now()`),
  updatedAt: text("updated_at").notNull().default(sql`now()`),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  formType: text("form_type", { enum: ["bir","custom"] }).notNull(),
  formId: integer("form_id").notNull(),
  formCode: text("form_code"),
  formName: text("form_name").notNull(),
  status: text("status", { enum: ["pending","ready_to_file","submitted","completed","done"] }).notNull().default("pending"),
  statusSortOrder: integer("status_sort_order"),
  deadline: text("deadline").notNull(),
  assignedTo: integer("assigned_to").references(() => users.id),
  filingPeriod: text("filing_period"),
  taxYear: integer("tax_year"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`now()`),
  updatedAt: text("updated_at").notNull().default(sql`now()`),
});

export const taskHistory = pgTable("task_history", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull().references(() => tasks.id),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  changedBy: integer("changed_by").notNull().references(() => users.id),
  comment: text("comment"),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull().references(() => tasks.id),
  message: text("message").notNull(),
  bookkeeperName: text("bookkeeper_name").notNull(),
  formName: text("form_name").notNull(),
  clientName: text("client_name").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const formSubmissions = pgTable("form_submissions", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull().references(() => tasks.id),
  submittedBy: integer("submitted_by").notNull().references(() => users.id),
  submittedData: jsonb("submitted_data"),
  attachmentUrl: text("attachment_url"),
  submittedAt: text("submitted_at").notNull().default(sql`now()`),
});