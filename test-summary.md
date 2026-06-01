# Test Summary — Book Keeper Dashboard v2

**109 tests total** — 50 server, 59 client — all passing.

---

## Server Tests (50)

| File | Tests | Type |
|------|-------|------|
| `src/lib/deadline-calculator.test.ts` | 17 | Unit — pure logic |
| `src/middleware/auth.test.ts` | 3 | Unit — requireRole |
| `src/routes/tasks.status-flow.test.ts` | 20 | Unit — status transition validation |
| `src/routes/tasks.test.ts` | 10 | Integration — HTTP + SQLite |

## Client Tests (59)

| File | Tests | Type |
|------|-------|------|
| `src/lib/utils.test.ts` | 17 | Unit — formatting, overdue, upcoming |
| `src/lib/api.test.ts` | 29 | Unit — fetch mocking for all API modules |
| `src/stores/auth-store.test.ts` | 13 | Unit — Zustand store state + can() permissions |

---

## Bugs Found & Fixed

### 🔴 CRITICAL — `pg-migrate.ts` duplicate status_sort_order column
**Problem:** First added `status_sort_order` as plain `INTEGER`, then tried to add it as `GENERATED ALWAYS AS`. The second `ALTER TABLE` was silently skipped by `IF NOT EXISTS`, leaving a NULL plain column instead of a computed one.
**Fix:** Drop the plain column first (`DROP COLUMN IF EXISTS`), then create as generated column.

### 🔴 CRITICAL — `deadline-calculator.ts` timezone off-by-one
**Problem:** Used `toISOString().split("T")[0]` which returns UTC date. Date constructors use local time. In UTC+8 (Philippines), all deadlines appeared 1 day early.
**Fix:** Format dates using local time components (`getFullYear`, `getMonth`, `getDate`) instead of `toISOString`.

### 🔴 CRITICAL — `deadline-calculator.ts` annual month off-by-one
**Problem:** Annually case used `deadlineMonthOffset` directly as 0-indexed month (4 = May), but BIR seed data treats it as 1-indexed (4 = April).
**Fix:** `deadlineMonth = Math.max(0, deadlineMonthOffset - 1)`.

### 🟡 IMPORTANT — Missing `parseInt` validation on route params
**Problem:** 10+ route handlers called `parseInt(req.params.id)` without checking `isNaN`. Non-numeric IDs silently matched nothing.
**Fix:** Added `parseIdParam()` helper returning `number | null`, with `400 Bad Request` on invalid input. Applied to all route files: tasks, clients, forms, users, notifications.

### 🟡 IMPORTANT — `notifications.ts` inefficient unread count
**Problem:** Used `db.select({ count: id })` fetching all unread IDs from DB just to count them in JS array length.
**Fix:** Replaced with proper SQL `count(*)` aggregate.

---

## New Dependencies Added

- **Server:** `vitest`, `supertest`, `@types/supertest`
- **Client:** `vitest`, `@testing-library/jest-dom`, `@testing-library/react`, `jsdom`

Run `npm test` in either `server/` or `client/` to execute.
