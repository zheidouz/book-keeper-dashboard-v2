import { sql } from "./pg-index.js";

export async function createTables() {
  // Users table
  await sql`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    clerk_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'encoder' CHECK(role IN ('admin','manager','bookkeeper','encoder')),
    avatar TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`;

  // Clients table
  await sql`CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`;

  // Client assignments table
  await sql`CREATE TABLE IF NOT EXISTS client_assignments (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
  )`;

  // BIR Forms table
  await sql`CREATE TABLE IF NOT EXISTS bir_forms (
    id SERIAL PRIMARY KEY,
    form_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    filing_frequency TEXT NOT NULL CHECK(filing_frequency IN ('monthly','quarterly','annually','semi_annual')),
    deadline_day INTEGER NOT NULL,
    deadline_month_offset INTEGER NOT NULL DEFAULT 0,
    deadline_rule TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
  )`;

  // Custom Forms table
  await sql`CREATE TABLE IF NOT EXISTS custom_forms (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    filing_frequency TEXT NOT NULL CHECK(filing_frequency IN ('monthly','quarterly','annually','semi_annual','one_time')),
    deadline_day INTEGER,
    deadline_month_offset INTEGER NOT NULL DEFAULT 0,
    required_fields JSONB NOT NULL DEFAULT '[]',
    created_by INTEGER NOT NULL REFERENCES users(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`;

  // Tasks table
  await sql`CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    form_type TEXT NOT NULL CHECK(form_type IN ('bir','custom')),
    form_id INTEGER NOT NULL,
    form_code TEXT,
    form_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','ready_to_file','submitted','completed','done')),
    status_sort_order INTEGER,
    deadline TEXT NOT NULL,
    assigned_to INTEGER REFERENCES users(id),
    filing_period TEXT,
    tax_year INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`;

  // Task history table
  await sql`CREATE TABLE IF NOT EXISTS task_history (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id),
    from_status TEXT,
    to_status TEXT NOT NULL,
    changed_by INTEGER NOT NULL REFERENCES users(id),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  )`;

  // Form submissions table
  await sql`CREATE TABLE IF NOT EXISTS form_submissions (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id),
    submitted_by INTEGER NOT NULL REFERENCES users(id),
    submitted_data JSONB,
    attachment_url TEXT,
    submitted_at TIMESTAMP DEFAULT NOW()
  )`;

  // Notifications table
  await sql`CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id),
    message TEXT NOT NULL,
    bookkeeper_name TEXT NOT NULL,
    form_name TEXT NOT NULL,
    client_name TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
  )`;

  // ── Add columns that may not exist in existing databases ──
  // status_sort_order must be a GENERATED column so it stays in sync with status.
  // Drop the plain column first in case a previous migration added it, then recreate as generated.
  await sql`ALTER TABLE tasks DROP COLUMN IF EXISTS status_sort_order`.catch(() => {});
  await sql`ALTER TABLE tasks ADD COLUMN status_sort_order INTEGER GENERATED ALWAYS AS (
    CASE status WHEN 'pending' THEN 1 WHEN 'ready_to_file' THEN 2
                WHEN 'submitted' THEN 3 WHEN 'completed' THEN 4 ELSE 5 END
  ) STORED`;
  await sql`ALTER TABLE custom_forms ADD COLUMN IF NOT EXISTS deadline_rule TEXT`.catch(() => {});

  // ── Performance indexes for frequent queries ──
  await sql`CREATE INDEX IF NOT EXISTS idx_tasks_status_deadline ON tasks(status, deadline)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline)`;
  await sql`DROP INDEX IF EXISTS idx_tasks_status`;
  await sql`DROP INDEX IF EXISTS idx_tasks_client_id`;
  await sql`DROP INDEX IF EXISTS idx_tasks_assigned_to`;
  await sql`CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_task_history_status ON task_history(task_id, to_status, created_at)`;
  // Covering index for task detail page: history ordered by created_at DESC
  await sql`CREATE INDEX IF NOT EXISTS idx_task_history_task_created ON task_history(task_id, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_client_assignments_client_id ON client_assignments(client_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_client_assignments_user_id ON client_assignments(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_tasks_status_sort ON tasks(status_sort_order)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_tasks_month ON tasks(date_trunc('month', created_at))`;
  await sql`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_tasks_recurring ON tasks(client_id, form_type, form_id, status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_tasks_client_deadline ON tasks(client_id, deadline DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_tasks_client_form_period ON tasks(client_id, form_type, form_id, filing_period)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_tasks_assigned_status_deadline ON tasks(assigned_to, status, deadline)`;

  console.log("PostgreSQL tables and indexes created successfully");
}