
## Full Route Performance Diagnosis

### Scope
- **App**: Vite + React 19 + TypeScript SPA (TanStack Query, Zustand, Tailwind, shadcn/ui)
- **Routes**: 10 pages, all lazy-loaded via `React.lazy()` + `<Suspense>`
- **Backend**: Express + SQLite (better-sqlite3) via Drizzle ORM
- **Analysis**: Code-level, no runtime trace available (no local server running)

---

## What's Already Done Well

| Practice | Where |
|---|---|
| Route-based code splitting | All 10 pages via `lazy()` |
| Suspense boundaries | `SuspenseWrapper` with `PageFallback` spinner |
| Aggressive vendor chunking | 8 manual chunks (react, query, motion, charts, dnd, form, ui, smooth) |
| CSS code splitting | `cssCodeSplit: true` |
| Combined API endpoint | `/api/reports/dashboard` — 1 round-trip vs 3 |
| Smart caching | `staleTime: 2min`, `gcTime: 10min` globally |
| Chart animations off | `isAnimationActive={false}` on charts |
| Memoized computed data | `useMemo` on filtered tasks, kanban columns, stat cards, calendar dates |
| `content-visibility: auto` | On chart sections in Dashboard |
| RAF-throttled cursor glow | Not in render cycle |
| Server single-pass queries | CASE expressions in SQL, concurrent `Promise.all` |
| React Router future flags | `v7_startTransition`, `v7_relativeSplatPath` |

---

## Issues by Route

### 1. `/` — Dashboard

| Issue | Severity | Detail |
|---|---|---|
| recharts bundle weight | **HIGH** | `vendor-charts` chunk loaded for PieChart + BarChart. Recharts is ~150KB+ minified. Only used here — correct split, but large payload on dashboard load. |
| Framer Motion stagger animation | **MEDIUM** | All 6 stat cards use `motion.div` with staggered entrance. This delays LCP paint of stat values by the stagger duration + calls into motion's JS animation engine for a simple CSS fade+translate. |
| No data prefetch on auth | **LOW** | Dashboard data only starts fetching after component mount. Could start during auth flow / shell mount. |

### 2. `/tasks` — Tasks (Kanban)

| Issue | Severity | Detail |
|---|---|---|
| 4 parallel queries on mount | **HIGH** | Fires `tasks`, `clients`, `birForms`, `bookkeepers` simultaneously. All 4 must resolve before the Kanban board is useful. Clients/BIRForms/Bookkeepers rarely change — could be preloaded or shared via longer `staleTime`. |
| @hello-pangea/dnd weight | **MEDIUM** | `vendor-dnd` chunk loaded on this page only (~40KB+). Acceptable since it's core UX, but drag-and-drop re-renders all cards on every status change. |
| Status mutation invalidates 3 keys | **MEDIUM** | `["tasks"]`, `["notifications"]`, `["clients"]` refetch on every drag. `["clients"]` invalidation triggers a full client list re-fetch even if unrelated. |
| Inline `onClick` on "Done" button | **LOW** | `onClick={(e) => { e.preventDefault(); ...}}` creates a new function every render. Minor, but prevents React Compiler optimizations. |

### 3. `/tasks/:id` — TaskDetail

| Issue | Severity | Detail |
|---|---|---|
| Single query is correct | ✅ | `queryKey: ["task", id]` with `enabled: !!id` — optimal. |
| Mutation invalidates 4 keys | **MEDIUM** | `["task", id]`, `["tasks"]`, `["notifications"]`, `["clients"]`. Status update triggers re-fetch of all tasks + all clients. Could scope to just `["tasks"]` + `["task", id]`. |
| No optimistic update | **LOW** | Status change waits for server response before updating UI. Optimistic update would make it feel instant. |

### 4. `/clients` — Clients

| Issue | Severity | Detail |
|---|---|---|
| Framer Motion entrance animations | **MEDIUM** | Uses `motion.div` for fade-in on client cards. Same pattern as Dashboard — CSS animation would suffice and avoid loading motion runtime if user navigates here first. (Motion is already loaded if Dashboard was visited.) |
| Search triggers full re-fetch | **LOW** | `queryKey: ["clients", search]` — every keystroke changes the key and refetches. Should debounce client-side or use `keepPreviousData`. |

### 5. `/clients/:id` — ClientDetail

| Issue | Severity | Detail |
|---|---|---|
| 3 serial data dependencies | **MEDIUM** | Loads client, `birForms`, `bookkeepers`. BIR forms and bookkeepers are static data — could be prefetched at app level or have longer `staleTime`. |
| Delete uses `window.location.href` | **LOW** | `window.location.href = "/clients"` causes full page reload instead of SPA navigation. |

### 6. `/forms` — Forms

| Issue | Severity | Detail |
|---|---|---|
| Clean | ✅ | Single query, static data. No performance concerns. |

### 7. `/forms/custom` — CustomForms

| Issue | Severity | Detail |
|---|---|---|
| Clean | ✅ | Single query, lightweight. No concerns. |

### 8. `/calendar` — Calendar

| Issue | Severity | Detail |
|---|---|---|
| Memoized date range | ✅ | Good — `useMemo` prevents recalculation. |
| Events slice on render | **LOW** | `events.slice(0, 10)` for upcoming list + per-day `slice(0, 3)`. Fine for realistic data volumes. |

### 9. `/finished-tasks` — FinishedTasks

| Issue | Severity | Detail |
|---|---|---|
| Client-side pagination | **MEDIUM** | Fetches ALL done tasks from server, then paginates client-side with `PAGE_SIZE=20`. If there are 500+ done tasks, the API payload is large. Server-side pagination would be better. |
| `/reports` file is a duplicate | **LOW** | Reports.tsx exports `FinishedTasks` — seems like a stale renamed copy. Unused import path. |

### 10. `/settings/users` — SettingsUsers

| Issue | Severity | Detail |
|---|---|---|
| Clean | ✅ | Admin-only page. Standard query + mutation pattern. |

---

## Cross-Cutting Issues

### CRITICAL

**Font loading breaks with strict CSP**
index.html uses `media="print" onload="this.media='all'"` to defer Google Fonts. If the app ever deploys with a CSP that blocks `'unsafe-inline'` event handlers, fonts never load → text renders in system default. The `<script type="module">` entry point is fine, but inline `onload` attributes are blocked by a strict CSP.

**Fix**: Load font via an external script that sets `media`, or use the browser's built-in `font-display: swap` with a preload link and a `<link rel="stylesheet">` that blocks briefly in the critical path.

### HIGH

**Framer Motion on 5 of 10 pages**
Dashboard, Tasks (via card links in Link component?), Clients, ClientDetail all import `framer-motion`. The motion chunk loads on any of these pages. Simple entrance animations (fade + translate) can be CSS-only via Tailwind's `animate-` utilities or custom keyframes, saving ~30KB+ from the critical path on first page load.

**NotificationPanel renders on every route**
`TopBar` is used on every page. `NotificationPanel` inside it uses `useQuery` for notifications — every route navigation triggers a notification re-fetch (unless cached). The API endpoint returns `unreadCount` which is cheap, but it's still a network round-trip on every page transition.

**No preconnect to API origin**
No `<link rel="preconnect" href="http://localhost:3001">` (dev) or production API URL. In production, the API will be on a different origin — missing preconnect adds ~300ms DNS+TCP+TLS handshake before the first API call.

**No `fetchpriority` on critical images**
The app uses SVG icons (lucide-react, inline SVGs) so no hero images to optimize — but if hero images are added later, `fetchpriority="high"` should be used.

### MEDIUM

**Mutation invalidation cascades**
Status mutations on Tasks and TaskDetail invalidate `["clients"]` — this triggers a full client list re-fetch. Clients rarely change when a task status changes. Narrowing invalidation to just `["tasks"]` + `["task", id]` + `["notifications"]` would reduce unnecessary fetches.

**Preloader runs fixed 900ms**
`AppShell` preloader shows for a hardcoded 900ms regardless of actual load progress. If the app loads faster, users wait. If slower, the preloader disappears before content is ready.

**No bundle analysis in CI**
`vite.config` has great manual chunks, but there's no `vite-plugin-visualizer` or `size-limit` config to catch bundle regressions in CI.

**Client-side pagination for `finished-tasks`**
Fetches all done tasks, paginates in JS. For growing datasets, this becomes slow. Server-side `LIMIT/OFFSET` pagination would scale better.

### LOW / SUGGESTION

| Issue | Detail |
|---|---|
| No `reportWebVitals` or analytics | No INP/LCP/CLS monitoring configured |
| No service worker | Could cache static assets + API responses in production |
| `window.location.href` on client delete | Should use `useNavigate()` for SPA navigation |
| `date-fns` in TopBar | `formatDistanceToNow` imported for notifications — fine, tree-shaken |

---

## Ranked Action Plan

| # | Fix | Impact | Route(s) | Effort |
|---|---|---|---|---|
| 1 | Replace `media="print" onload` with preload + `font-display: swap` | LCP, CSP compat | Global (index.html) | 10min |
| 2 | Add `<link rel="preconnect">` to API origin | LCP (TTFB) | Global (index.html) | 5min |
| 3 | Remove framer-motion from Clients page, use CSS animations | INP, bundle | `/clients` | 15min |
| 4 | Narrow mutation invalidation — stop invalidating `["clients"]` on task status change | INP, network | `/tasks`, `/tasks/:id` | 10min |
| 5 | Add `staleTime: 10min` to static reference data (birForms, bookkeepers) | LCP, waterfall | `/tasks`, `/clients/:id` | 10min |
| 6 | Server-side pagination for `/api/tasks?status=done` | LCP, INP | `/finished-tasks` | 30min |
| 7 | Add `vite-plugin-visualizer` + size-limit to CI | Prevention | Build config | 20min |
| 8 | Replace fixed 900ms preloader with load-complete signal | Perceived LCP | AppShell | 15min |
| 9 | Debounce search query in Clients page | INP, network | `/clients` | 10min |
| 10 | Replace `window.location.href` with `useNavigate()` | INP | `/clients/:id` | 5min |

---

## Validation Plan

Run these after implementing any fix:

1. **Lighthouse** — Run on each route, compare LCP/INP/CLS before/after
2. **Network tab** — Verify reduced waterfall depth, payload sizes, preconnect in headers
3. **Performance tab** — Record traces on route transitions, measure main thread blocking
4. **Bundle analysis** — Run `npx vite-bundle-analyzer` to check chunk sizes
5. **Console** — Verify no CSP violations from font loading changes










