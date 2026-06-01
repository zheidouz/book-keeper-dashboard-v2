<div align="center">

# Book Keeper Dashboard

**Team-based bookkeeping management system for BIR filing tasks, clients, and forms**

</div>

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![Drizzle](https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=flat-square&logo=drizzle&logoColor=black)](https://orm.drizzle.team)
[![Node.js](https://img.shields.io/badge/Node.js-20+-3c873a?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)

</div>

**Overview** • [Features](#features) • [Tech Stack](#tech-stack) • [Getting Started](#getting-started) • [Project Structure](#project-structure) • [Deployment](#deployment) • [Development](#development)

---

A cloud-based bookkeeping management dashboard that enables teams to efficiently manage BIR filing tasks, clients, and forms — from task assignment through completion — with role-based access controls and reporting. Built with a modern TypeScript stack, deployed on Vercel.

## Features

- **Kanban Task Board** — 5-status workflow (Pending → Ready to File → Submitted → Completed → Done) with drag-and-drop support
- **Client Management** — Client profiles with assigned forms, tasks, and user assignments
- **BIR Forms Integration** — Pre-defined BIR forms library with automatic deadline calculations based on filing frequency
- **Custom Form Builder** — Admin-defined forms with configurable fields, filing frequency, and deadlines
- **Role-Based Access** — 4-tier permission model (Admin, Manager, Bookkeeper, Encoder)
- **Dashboard & Reports** — KPI cards, status distribution charts, monthly trends, upcoming deadlines
- **Calendar View** — Deadline overview with task filtering by status
- **Notifications** — Real-time task status change notifications
- **Clerk Authentication** — Secure sign-in with JWT session management
- **Responsive Design** — Adaptive layout for desktop, tablet, and mobile

## Tech Stack

### Frontend

| Layer | Choice |
|---|---|
| **Framework** | React 18 with TypeScript |
| **Build Tool** | Vite 5 |
| **Styling** | Tailwind CSS 3 + shadcn/ui |
| **State** | Zustand (client state), TanStack Query (server state) |
| **Routing** | React Router v6 |
| **Forms** | React Hook Form + Zod |
| **Drag & Drop** | @hello-pangea/dnd |
| **Charts** | Recharts |
| **Animation** | Framer Motion + Lenis |
| **Icons** | Lucide React |

### Backend

| Layer | Choice |
|---|---|
| **Runtime** | Node.js 20+ |
| **Framework** | Express 5 |
| **Database** | SQLite (dev) / PostgreSQL via Neon (production) |
| **ORM** | Drizzle ORM |
| **Auth** | Clerk |
| **Validation** | Zod |

### Infrastructure

| Layer | Choice |
|---|---|
| **Hosting** | Vercel (frontend + serverless API) |
| **Database (prod)** | Neon (serverless PostgreSQL) |
| **Database (dev)** | SQLite via better-sqlite3 |
| **CI/CD** | Vercel Git Integration |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 20+
- npm (ships with Node.js)

### Local Setup

```bash
# Clone the repository
git clone <repo-url>
cd book-keeper-dashboard-v2

# Install all dependencies (client + server)
npm install

# Start the development server (backend + frontend proxy)
npm run dev
```

The API server starts on `http://localhost:3001` by default. The Vite dev server starts on `http://localhost:5173` and proxies `/api` requests to the backend.

> [!NOTE]
> In development mode, the app uses SQLite (`data/app.db`) and a mock login screen — no Clerk setup required. Select a role to explore all features.

### Production Auth Setup

To enable Clerk authentication:

1. Create an account at [clerk.com](https://clerk.com)
2. Create a new application and copy the publishable key
3. Set environment variables:

```bash
# client/.env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# server/.env
CLERK_SECRET_KEY=sk_test_...
DATABASE_URL=postgresql://...  # Neon connection string (optional for dev)
```

## Project Structure

```
├── client/                # React frontend (Vite)
│   ├── src/
│   │   ├── components/    # UI, layout, feature components
│   │   │   ├── ui/        # shadcn/ui primitives
│   │   │   ├── layout/    # AppShell, Sidebar, TopBar
│   │   │   ├── kanban/    # Kanban board components
│   │   │   ├── forms/     # Form builder components
│   │   │   ├── clients/   # Client-related components
│   │   │   ├── tasks/     # Task-related components
│   │   │   └── calendar/  # Calendar components
│   │   ├── pages/         # Route pages (lazy-loaded)
│   │   ├── stores/        # Zustand stores
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # API client, utilities
│   │   ├── types/         # TypeScript type definitions
│   │   └── providers/     # Context providers (Auth)
│   └── ...config files
│
├── server/                # Express API server
│   ├── src/
│   │   ├── db/            # Schema, migrations, seed data
│   │   │   ├── schema.ts    # SQLite schema
│   │   │   ├── pg-schema.ts # PostgreSQL schema
│   │   │   ├── migrate.ts   # SQLite migration
│   │   │   └── seed.ts      # BIR forms + admin seed
│   │   ├── routes/        # REST API route handlers
│   │   ├── middleware/    # Auth middleware
│   │   ├── lib/           # Deadline calculator, validation
│   │   └── types/         # Server-side types
│   └── ...config files
│
├── api/                   # Vercel serverless function entry point
├── vercel.json            # Vercel deployment configuration
└── package.json           # Root scripts (dev, build)
```

### Routes

| Path | Page | Access |
|---|---|---|
| `/` | Dashboard | All |
| `/tasks` | Kanban Task Board | All |
| `/tasks/:id` | Task Detail | All |
| `/clients` | Client List | Bookkeeper+ |
| `/clients/:id` | Client Profile | Bookkeeper+ |
| `/forms` | BIR Forms Library | Bookkeeper+ |
| `/forms/custom` | Custom Form Builder | Admin |
| `/calendar` | Calendar & Deadlines | All |
| `/reports` | Reports & Analytics | Manager+ |
| `/settings/users` | User Management | Admin/Manager |

### API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/health` | Health check |
| `GET/POST /api/clients` | Client CRUD |
| `GET /api/tasks` | Task listing with filters |
| `POST /api/tasks` | Create task with auto-deadline |
| `PATCH /api/tasks/:id/status` | Update task status |
| `GET /api/forms/bir` | BIR forms library |
| `GET/POST /api/forms/custom` | Custom forms CRUD |
| `GET /api/users` | User list and management |
| `GET /api/reports/dashboard` | Combined dashboard payload |
| `GET /api/reports/stats` | Task statistics |
| `GET /api/reports/monthly-trends` | Monthly task trends |
| `GET /api/calendar` | Calendar events |
| `GET /api/notifications` | Notifications |

## Deployment

The app is deployed on Vercel as a single project with the frontend served as static assets and the API running as a serverless function.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Environment Variables (Production)

Set these in your Vercel project dashboard:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `CLERK_SECRET_KEY` | Clerk API secret key |
| `CORS_ORIGIN` | Frontend URL for CORS |

```bash
# One-time DB setup (run locally or via Vercel CLI)
npm run vercel-build
```

## Development

```bash
# Start both client + server in dev mode
npm run dev

# Start client only (Vite dev server)
npm run dev:client

# Run tests
npm test              # Root
cd client && npm test # Client tests
cd server && npm test # Server tests

# Type checking
npm run typecheck     # Client
```

## Architecture Highlights

- **Dual Database Adapter** — The server abstracts SQLite (sync) and PostgreSQL (async) behind a Proxy-wrapped adapter, so all route handlers can `await` consistently regardless of the backend.
- **Auto-Deadline Calculation** — BIR forms define filing frequencies and deadline rules. The `calculateDeadline()` function computes the next valid deadline, filing period, and tax year.
- **Cold-Start Protection** — The Vercel serverless entry point initializes database tables and seeds data before any route handler runs, preventing race conditions.
- **Combined Dashboard API** — A single `/api/reports/dashboard` endpoint returns stats, status distribution, and monthly trends in one round-trip, cutting API calls by 66%.
- **Code Splitting** — All pages use React.lazy for route-based code splitting, reducing initial bundle size.
