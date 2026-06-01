import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, "../../data/app.db");

export function createTables() {
  const sqlite = new Database(dbPath);

  sqlite.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clerk_id TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'encoder' CHECK(role IN ('admin','manager','bookkeeper','encoder')),
    avatar TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  sqlite.exec(`CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, contact_person TEXT, email TEXT, phone TEXT, address TEXT, notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  sqlite.exec(`CREATE TABLE IF NOT EXISTS client_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  sqlite.exec(`CREATE TABLE IF NOT EXISTS bir_forms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    form_code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, description TEXT,
    filing_frequency TEXT NOT NULL CHECK(filing_frequency IN ('monthly','quarterly','annually','semi_annual')),
    deadline_day INTEGER NOT NULL, deadline_month_offset INTEGER NOT NULL DEFAULT 0,
    deadline_rule TEXT, category TEXT NOT NULL DEFAULT 'general', is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  sqlite.exec(`CREATE TABLE IF NOT EXISTS custom_forms (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT,
    filing_frequency TEXT NOT NULL CHECK(filing_frequency IN ('monthly','quarterly','annually','semi_annual','one_time')),
    deadline_day INTEGER, deadline_month_offset INTEGER NOT NULL DEFAULT 0, deadline_rule TEXT,
    required_fields TEXT NOT NULL DEFAULT '[]',
    created_by INTEGER NOT NULL REFERENCES users(id), is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  sqlite.exec(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    form_type TEXT NOT NULL CHECK(form_type IN ('bir','custom')), form_id INTEGER NOT NULL,
    form_code TEXT, form_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','ready_to_file','submitted','completed','done')),
    deadline TEXT NOT NULL, assigned_to INTEGER REFERENCES users(id),
    filing_period TEXT, tax_year INTEGER, notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  sqlite.exec(`CREATE TABLE IF NOT EXISTS task_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL REFERENCES tasks(id), from_status TEXT, to_status TEXT NOT NULL,
    changed_by INTEGER NOT NULL REFERENCES users(id), comment TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  sqlite.exec(`CREATE TABLE IF NOT EXISTS form_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL REFERENCES tasks(id), submitted_by INTEGER NOT NULL REFERENCES users(id),
    submitted_data TEXT, attachment_url TEXT,
    submitted_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  sqlite.exec(`CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL REFERENCES tasks(id),
    message TEXT NOT NULL,
    bookkeeper_name TEXT NOT NULL,
    form_name TEXT NOT NULL,
    client_name TEXT NOT NULL,
    read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // ── Add columns that were added after initial table creation ──
  try { sqlite.exec(`ALTER TABLE tasks ADD COLUMN status_sort_order INTEGER`); } catch {}
  try { sqlite.exec(`ALTER TABLE custom_forms ADD COLUMN deadline_rule TEXT`); } catch {}

  // ── Performance indexes for frequent queries ──
  sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`);
  sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id)`);
  sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to)`);
  sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline)`);
  sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_status_deadline ON tasks(status, deadline)`);
  // Composite index for recurring task lookup: (client_id, form_type, form_id, filing_period)
  sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_client_form_period ON tasks(client_id, form_type, form_id, filing_period)`);
  // Composite index for dashboard/reports: (assigned_to, status, deadline)
  sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_assigned_status_deadline ON tasks(assigned_to, status, deadline)`);
  sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id)`);
  sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_task_history_status ON task_history(task_id, to_status, created_at)`);
  sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)`);
  sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_client_assignments_client_id ON client_assignments(client_id)`);
  sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_client_assignments_user_id ON client_assignments(user_id)`);

  sqlite.close();
  console.log("Tables and indexes created successfully");
}