# Bookkeeping Management Dashboard — Project Design

---

## Phase 1: Product Vision (Approved)

### Product Vision
A cloud-based bookkeeping management dashboard that enables a team of bookkeepers to efficiently manage BIR filing tasks, clients, and forms — from task assignment through completion — with role-based access controls and reporting.

### Target Users
- **Admins** — Full system control, user management, custom form builder
- **Managers** — Team oversight, task assignment, performance reports
- **Bookkeepers** — Day-to-day client and task management
- **Encoders** — Data entry with limited editing permissions

### Core Features (MVP)
| Feature | Description |
|---|---|
| Task Management | 5-status Kanban workflow (Pending → Ready to File → Submitted → Completed → Done) |
| Client Management | Client profiles with assigned forms/tasks |
| BIR Forms Integration | Auto-generated filing tasks with BIR deadline calculation |
| Custom Forms Builder | Admin-defined forms with frequency, deadlines, and required fields |
| Role-Based Permissions | 4-tier access control (Admin/Manager/Bookkeeper/Encoder) |
| Dashboard & Reports | Task board, calendar, analytics, user management |

### Non-Functional Requirements
- **Scale**: 10–50 users initially
- **Timeline**: 3–4 months to MVP
- **Budget**: Minimal / Cost-effective (open-source stack)
- **Hosting**: Cloud-based SaaS (internal tool, not monetized)

### Success Metrics
- Task completion rate
- On-time filing percentage
- Average task cycle time
- User adoption rate

### Monetization Strategy
Internal tool — no monetization.

### MVP Scope
- Task board with 5-status workflow
- Client profiles with assigned forms
- BIR forms library with auto-deadline calculation
- Custom form builder (Admin only)
- Role-based user management
- Basic reports dashboard

---

## Phase 2: UI/UX Design (Approved)

### Design System
| Element | Direction |
|---|---|
| **Style** | Modern & Bold — dark sidebar, bold typography, rich UI |
| **Primary Color** | Blue (#2563EB / #3B82F6) — professional, trustworthy |
| **Neutrals** | Dark grays (#1E293B, #334155) for sidebar, light (#F8FAFC) for content area |
| **Typography** | Inter or Plus Jakarta Sans — modern, clean, highly readable |
| **Icons** | Lucide Icons — consistent, open-source icon library |
| **Corner Radius** | Rounded corners (8px–12px) for a polished feel |

### Layout — Hybrid
- **Left Sidebar** (collapsible) — navigation menu, collapsed to icons on smaller screens
- **Top Bar** — search, notifications, user profile
- **Main Content Area** — full-width when sidebar is collapsed

### Responsive Plan
- **Desktop (1200px+)** — Full layout with expanded sidebar
- **Tablet (768–1199px)** — Sidebar collapsed to icons, adjusted grid
- **Mobile (<768px)** — Bottom navigation or hamburger menu, stacked layouts

### Page Sitemap
| Page | Description |
|---|---|
| `/dashboard` | Main overview — KPIs, task summary, upcoming deadlines |
| `/tasks` | Kanban board + task list view |
| `/tasks/:id` | Individual task detail |
| `/clients` | Client list with search/filter |
| `/clients/:id` | Client profile with assigned forms/tasks |
| `/forms` | BIR Forms Library |
| `/forms/custom` | Custom Form Builder (Admin only) |
| `/calendar` | Calendar & deadlines view |
| `/reports` | Reports & analytics |
| `/settings/users` | User & role management (Admin/Manager) |
| `/settings/profile` | User profile settings |

### User Flow (Key Scenario)
1. **Bookkeeper logs in** → `/dashboard` sees upcoming deadlines
2. Navigates to `/clients` → selects a client
3. Adds a BIR form → system auto-generates filing tasks with deadlines
4. Tasks appear on `/tasks` Kanban board
5. Bookkeeper moves tasks through statuses: Pending → Ready to File → Submitted → Completed → Done

### Accessibility Considerations
- WCAG 2.1 AA compliance
- Keyboard-navigable Kanban board
- Sufficient color contrast ratios
- Screen reader support for form elements
- Focus indicators on all interactive elements

### UI Component Inventory
- Data Tables (sortable, filterable, paginated)
- Kanban Board (drag-and-drop)
- Calendar component
- Form builder (drag-and-drop fields)
- Charts & KPIs (bar, line, donut)
- Modal dialogs & slide-out panels
- Toast notifications
- Breadcrumbs
- Search & filter bars
- Status badges & progress indicators

---

## Phase 3: Frontend Development (Approved)

### Frontend Stack
| Layer | Choice | Why |
|---|---|---|
| **Framework** | Vite + React (SPA) | Lightweight, fast HMR, perfect for dashboard apps |
| **Language** | TypeScript | Type safety, better DX, fewer runtime errors |
| **Styling** | Tailwind CSS | Utility-first, rapid UI development, small bundle |
| **UI Library** | shadcn/ui | Beautiful, accessible, fully customizable components |
| **State** | Zustand | Lightweight, minimal boilerplate, great for dashboards |
| **Data Fetching** | TanStack Query | Caching, pagination, auto-refetch for server state |
| **Routing** | React Router v6 | Standard SPA routing with nested layouts |
| **Forms** | React Hook Form + Zod | Performant forms with schema validation |
| **Drag & Drop** | @hello-pangea/dnd | Kanban board drag-and-drop |
| **Charts** | Recharts | React-native charting, customizable |

### Folder Structure
```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── layout/          # Sidebar, TopBar, Shell
│   ├── kanban/          # Kanban board components
│   ├── forms/           # Form builder components
│   ├── clients/         # Client-related components
│   ├── tasks/           # Task-related components
│   └── calendar/        # Calendar components
├── hooks/               # Custom React hooks
├── stores/              # Zustand stores
├── lib/                 # Utilities, constants, API client
├── types/               # TypeScript types/interfaces
├── pages/               # Route pages
├── providers/           # Context providers
├── styles/              # Global CSS
└── App.tsx
```

### Routing Plan (React Router)
| Path | Page | Access |
|---|---|---|
| `/` | Dashboard | All |
| `/tasks` | Task Board (Kanban) | All |
| `/tasks/:id` | Task Detail | All |
| `/clients` | Client List | Bookkeeper+ |
| `/clients/:id` | Client Profile | Bookkeeper+ |
| `/forms` | BIR Forms Library | Bookkeeper+ |
| `/forms/custom` | Custom Form Builder | Admin only |
| `/calendar` | Calendar & Deadlines | All |
| `/reports` | Reports & Analytics | Manager+ |
| `/settings/users` | User Management | Admin/Manager |
| `/settings/profile` | Profile Settings | All |

### Component Architecture
- **Layout Shell** — Sidebar (collapsible) + TopBar + Content area
- **Page-level components** — One per route
- **Feature components** — Kanban, ClientCard, TaskItem, FormBuilder
- **Shared UI** — DataTable, Modal, Badge, Calendar, Charts (via shadcn/ui)

---

## Phase 4: Backend Development (Approved)

### Backend Stack
| Layer | Choice | Why |
|---|---|---|
| **Runtime** | Node.js + Express | Lightweight, familiar, vast ecosystem |
| **Database** | SQLite (via better-sqlite3) | Zero-config, file-based, perfect for small teams |
| **ORM** | Drizzle ORM | Type-safe, lightweight, SQLite-first support |
| **Auth** | Clerk | Pre-built UI, role-based access, generous free tier |
| **API** | REST | Simple, predictable, standard for dashboards |
| **Validation** | Zod (shared with frontend) | End-to-end type safety |
| **File Storage** | Local filesystem / S3-compatible | For form attachments |

### Database Schema Strategy
```
Users ──┐
         ├── Roles (Admin, Manager, Bookkeeper, Encoder)
         │
Clients ─┤
         ├── AssignedUsers (many-to-many with Users)
         │
Forms ───┤
         ├── BIRForms (pre-defined library)
         ├── CustomForms (admin-created)
         │
Tasks ───┤
         ├── Status: Pending → Ready to File → Submitted → Completed → Done
         ├── Deadline (auto-calculated from form schedule)
         └── AssignedUser
```

### Key Entities
| Entity | Fields |
|---|---|
| **User** | id, name, email, role, clerkId, createdAt |
| **Client** | id, name, contactInfo, notes, assignedTo, createdAt |
| **BIRForm** | id, formCode, name, filingFrequency, deadlineRules, description |
| **CustomForm** | id, name, filingFrequency, deadlineRules, requiredFields (JSON), createdBy |
| **Task** | id, clientId, formId, formType (bir/custom), status, deadline, assignedTo, createdAt, updatedAt |
| **TaskHistory** | id, taskId, fromStatus, toStatus, changedBy, timestamp |

### Authentication Design (Clerk)
- **Sign-in** — Email/password via Clerk UI
- **Roles** — Mapped from Clerk metadata to app roles
- **Middleware** — Route protection based on role metadata
- **User creation** — Webhook on user signup to sync with local DB

### API Routes
```
GET    /api/clients          — List clients (role-filtered)
POST   /api/clients          — Create client
GET    /api/clients/:id      — Get client details
PUT    /api/clients/:id      — Update client

GET    /api/tasks            — List tasks (with filters/status)
POST   /api/tasks            — Create task (auto-calculates deadline)
PATCH  /api/tasks/:id/status — Update task status (validates flow order)

GET    /api/forms/bir        — List BIR forms from library
GET    /api/forms/custom     — List custom forms
POST   /api/forms/custom     — Create custom form (Admin)
PUT    /api/forms/custom/:id — Edit custom form (Admin)

GET    /api/users            — List users (Admin/Manager)
PATCH  /api/users/:id/role   — Update user role (Admin)

GET    /api/reports          — Aggregated stats & analytics
GET    /api/calendar         — Calendar deadlines view
```

### Backend Folder Structure
```
server/
├── src/
│   ├── routes/          # Express route handlers
│   ├── middleware/      # Auth, role check, validation
│   ├── db/              # Drizzle schema + migrations
│   ├── services/        # Business logic
│   ├── lib/             # Utilities (deadline calculator, etc.)
│   └── types/           # Shared types
├── package.json
└── tsconfig.json
```

---

## Phase 5: QA Testing (Approved)

### QA Strategy
| Area | Tool | Scope |
|---|---|---|
| **Unit Testing** | Vitest | Functions, hooks, utilities, stores |
| **Component Testing** | Vitest + React Testing Library | UI components, forms, Kanban |
| **API Testing** | Vitest + Supertest | Express route handlers, middleware |
| **E2E Testing** | Playwright | Critical user flows, role-based access |
| **Coverage Target** | ~70% | All features, happy + error paths |

### Automated Testing Plan
| Test Suite | What It Covers |
|---|---|
| **Auth & Roles** | Login flow, route guards, role-based API access |
| **Task Workflow** | Status transitions, validation (Completed → Done only), deadline logic |
| **Client Management** | CRUD operations, assign/unassign bookkeepers |
| **Form Builder** | Create/edit custom forms, field validation, auto-task generation |
| **API Routes** | All endpoints — valid requests, 401/403 errors, edge cases |
| **Kanban Board** | Drag-and-drop state changes, status-based filtering |

### Manual Testing Checklist
- [ ] User registration & role assignment via Clerk
- [ ] Task status flow: Pending → Ready to File → Submitted → Completed → Done
- [ ] Drag-and-drop on Kanban board
- [ ] BIR form library display and task generation
- [ ] Custom form creation and editing (Admin)
- [ ] Calendar view with correct deadlines
- [ ] Reports data accuracy
- [ ] Responsive layout on desktop, tablet, mobile
- [ ] Sidebar collapse/expand behavior
- [ ] Search and filter functionality on all list pages

### CI Validation Rules (GitHub Actions)
| Check | Command |
|---|---|
| Lint | `npm run lint` |
| Type Check | `npx tsc --noEmit` |
| Unit Tests | `npm run test` |
| Build | `npm run build` |

### Release Checklist
- [ ] All automated tests pass
- [ ] No TypeScript errors
- [ ] Manual smoke test on staging
- [ ] Role permission matrix verified
- [ ] No console errors on any page

---

## Phase 6: DevOps Deployment (Approved)

### Deployment Architecture
```
GitHub Repo
    ├── client/  ───→ Vercel (Static SPA)
    └── server/  ───→ Railway / VPS (Express + SQLite)
```

*Note: SQLite requires a persistent filesystem, so the backend runs on Railway (or a cheap VPS), while the frontend SPA is served for free on Vercel.*

### Hosting Strategy
| Service | Hosts | Estimated Cost |
|---|---|---|
| **Vercel** (frontend) | Vite + React SPA | **Free** (100GB bandwidth) |
| **Railway** (backend) | Express + SQLite | **~$5/mo** (starter plan) |
| **Clerk** (auth) | Authentication | **Free** (up to 500 users) |
| **Total** | | **~$5/mo** |

### CI/CD Pipeline (GitHub Actions)
| Stage | Trigger | Action |
|---|---|---|
| Lint & Type Check | Any push | ESLint + tsc --noEmit |
| Run Tests | Any push | Vitest |
| Deploy Frontend | Push to `main` (client/) | Vercel CLI |
| Deploy Backend | Push to `main` (server/) | Railway CLI / Vercel Functions |

### Environment Variables
```
# Frontend (Vercel)
VITE_API_URL=https://api.your-app.com
VITE_CLERK_PUBLISHABLE_KEY=pk_...

# Backend (Railway)
CLERK_SECRET_KEY=sk_...
DATABASE_PATH=./data/app.db
CORS_ORIGIN=https://your-app.vercel.app
```

### Monitoring & Logging
- **MVP**: No external monitoring (cost-saving)
- **Post-MVP**: Add Sentry free tier for error tracking
- **Logging**: Structured JSON logging via Express middleware

### Backup & Recovery
- **Database**: Automated daily SQLite backup (Railway cron or simple script)
- **Source**: GitHub (always recoverable)
- **Recovery**: Restore latest `.db` backup + redeploy from GitHub

### Production Readiness Checklist
- [ ] Database backups configured
- [ ] Environment variables set on both platforms
- [ ] CORS configured for frontend → backend
- [ ] Clerk JWT verification on all protected routes
- [ ] Rate limiting on API endpoints
- [ ] Proper JSON error responses (no stack traces in production)

---

## Finalization — Executive Summary

### Tech Stack Summary
| Layer | Technology |
|---|---|
| **Frontend** | Vite + React + TypeScript |
| **Styling** | Tailwind CSS + shadcn/ui |
| **State** | Zustand + TanStack Query |
| **Routing** | React Router v6 |
| **Backend** | Node.js + Express |
| **Database** | SQLite + Drizzle ORM |
| **Auth** | Clerk |
| **Testing** | Vitest + Playwright |
| **CI/CD** | GitHub Actions |
| **Hosting** | Vercel (frontend) + Railway (backend) |

### Implementation Roadmap (3–4 Months)

| Milestone | Tasks | Estimated Time |
|---|---|---|
| **M1: Foundation** | Project scaffolding, Clerk auth, DB schema, layout shell | Weeks 1–2 |
| **M2: Core API** | Express routes, CRUD for clients/tasks/forms, role middleware | Weeks 3–4 |
| **M3: Frontend Core** | Dashboard, Client management, Task list/board | Weeks 5–7 |
| **M4: BIR Forms** | BIR library data, auto-deadline calculation, task generation | Weeks 8–9 |
| **M5: Advanced Features** | Custom form builder, Kanban drag-and-drop, Calendar view | Weeks 10–11 |
| **M6: Reports & Polish** | Reports/analytics, responsive polish, testing, deploy | Weeks 12–14 |

### Estimated Infrastructure Costs (Monthly)
| Item | Cost |
|---|---|
| Vercel (frontend) | Free |
| Railway (backend + DB) | ~$5 |
| Clerk (auth) | Free |
| Domain (optional) | ~$1–$2/mo |
| **Total** | **~$5–$7/mo** |

### Recommended AI Coding Workflow
1. **Start with DB schema** — Define Drizzle tables for Users, Clients, Forms, Tasks, TaskHistory
2. **Build Express routes** — One by one, with Clerk auth middleware
3. **Build frontend in parallel** — Layout → Pages → Features → Polish
4. **Test as you go** — Vitest for units, Playwright for E2E flows
5. **Deploy early** — Vercel + Railway on day one with a "hello world"

### Recommended Prompts for AI Coding Agents

**Frontend Agent Prompt:**
> "Scaffold a Vite + React + TypeScript project with Tailwind CSS and shadcn/ui. Set up React Router v6 with the pages: /dashboard, /tasks, /tasks/:id, /clients, /clients/:id, /forms, /forms/custom, /calendar, /reports, /settings/users, /settings/profile. Create a collapsible sidebar layout with a top bar. Use Zustand for auth state and TanStack Query for API calls."

**Backend Agent Prompt:**
> "Create a Node.js + Express + TypeScript backend with Drizzle ORM and SQLite. Define schemas for User, Client, BIRForm, CustomForm, Task, and TaskHistory. Set up Clerk JWT verification middleware and role-based access control (Admin/Manager/Bookkeeper/Encoder). Create REST API routes for clients, tasks, forms, users, reports, and calendar."

**QA Agent Prompt:**
> "Set up Vitest + React Testing Library for the frontend and Vitest + Supertest for the backend API. Create test suites for: auth/role guards, task status flow validation (enforcing Pending→Ready→Submitted→Completed→Done order), client CRUD, and form builder. Add Playwright E2E tests for the complete bookkeeper workflow."

**DevOps Agent Prompt:**
> "Set up GitHub Actions CI/CD with linting, type-checking, testing, and auto-deploy. Frontend deploys to Vercel on push to main. Backend deploys to Railway (or Vercel serverless with SQLite workaround). Configure environment variables and CORS."

---

## Project planning completed successfully.

### Final Summary
| Category | Decision |
|---|---|
| **Stack** | Vite + React / Express + SQLite / Clerk Auth |
| **Deployment** | Vercel (frontend) + Railway (backend) |
| **Scalability** | 10–50 users (can scale to 200+ with PostgreSQL migration) |
| **Complexity** | Medium |
| **Estimated MVP Build Time** | 3–4 months |
| **Monthly Cost** | ~$5–$7/mo |