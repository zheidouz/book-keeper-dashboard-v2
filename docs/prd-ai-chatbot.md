# PRD: AI Bookkeeper Chatbot

> **Status**: Draft  
> **Date**: 2026-06-01  
> **Project**: Book Keeper Dashboard v2  

---

## 1. Executive Summary

**Problem**: Bookkeepers waste time switching between apps and searching scattered resources for BIR form rules, deadlines, filing frequencies, and basic accounting guidance while managing daily tasks in the dashboard.

**Proposed Solution**: An AI-powered chat assistant embedded directly in the dashboard — accessible from any page — that answers BIR form questions, provides accounting guidance, and offers task-specific suggestions based on the current task context.

**Success Criteria**:
- Chatbot answers BIR form queries (form code, deadline, frequency, category) with ≥ 95% accuracy against the seed data.
- Chatbot resolves a user's question within 3 turns or fewer for ≥ 80% of sessions.
- Chatbot response time (first token) ≤ 2s on Vercel serverless (cold start ≤ 5s).
- ≥ 70% of users rate the chatbot as "Helpful" or "Very Helpful" in post-interaction feedback.

---

## 2. User Experience & Functionality

### User Personas

| Persona | Role | Typical Question |
|---------|------|------------------|
| Maria | Bookkeeper | "What's the deadline for 2550M this month?" |
| Jose | Encoder | "Which BIR form do I use for rental income?" |
| Ana | Manager | "How many overdue tasks does Client X have?" |
| Carlos | Admin | "Walk me through the required fields for 1701." |

### User Stories

| ID | Story |
|----|-------|
| US-01 | As a bookkeeper, I want to ask about any BIR form (deadline, frequency, category) so I don't have to memorize 50+ form rules. |
| US-02 | As a bookkeeper, I want the chatbot to understand my current task context so it can suggest the next action (e.g., "This task needs the client's gross sales — ask them.") |
| US-03 | As a bookkeeper, I want general accounting Q&A (debit/credit rules, VAT vs non-VAT, percentage tax) so I can resolve doubts without leaving the dashboard. |
| US-04 | As a manager, I want to ask dashboard-level questions ("How many pending tasks?") so I get quick status without navigating. |
| US-05 | As any user, I want the chatbot accessible from every page as a floating bubble so I don't lose my place. |
| US-06 | As any user, I want conversation history persisted across page navigations so I can resume where I left off. |

### Acceptance Criteria

**US-01 (BIR Form Queries)**:
- Chatbot responds with accurate formCode, name, filingFrequency, deadlineDay, deadlineMonthOffset, and category.
- Supports fuzzy matching on form names (e.g., "2550" matches "2550M" and "2550Q").
- Falls back gracefully: "I couldn't find that form. Try searching by form code (e.g., 1701) or name."

**US-02 (Task Context Awareness)**:
- When opened on the Tasks page or TaskDetail page, the chatbot receives the current task ID/status as context.
- Chatbot tailors suggestions based on task status (pending → "Gather client documents"; ready_to_file → "Fill out the form fields").
- User can ask "What should I do next?" and get a status-specific response.

**US-03 (General Accounting Q&A)**:
- Supports basic Philippine tax questions: VAT thresholds, percentage tax, withholding tax rates.
- Supports accounting fundamentals: journal entries, debits/credits, reconciliation steps.
- Clearly states when it cannot answer: "That's beyond my scope — consult a CPA for this."

**US-05 (Floating Bubble UI)**:
- Floating action button (FAB) in bottom-right corner on all pages.
- Click opens a chat panel (380px wide, 500px max-height) with a message input.
- Panel is draggable/resizable via handles.
- Minimized state persists the unread indicator.

**US-06 (Conversation Persistence)**:
- Messages stored in Zustand store (in-memory for session).
- History persists across route navigations within the same browser tab.
- Clearing conversation or refreshing the page resets the history.

### Non-Goals

- **Not a replacement for professional tax advice**: Chatbot explicitly disclaims it is not a CPA and defers complex tax structuring questions.
- **No file upload / document analysis**: v1.0 is text-only Q&A. Form image upload and OCR are v2.0.
- **No multi-turn deep research**: Limits to 10-turn conversations before suggesting a fresh session.
- **No fine-tuning**: v1.0 uses prompt engineering + RAG over BIR form data; no model fine-tuning.
- **No integration with external accounting software (QuickBooks, Xero)**: v1.0 is scoped to this dashboard's data.

---

## 3. AI System Requirements

### Architecture

```
User types question
       ↓
  Floating Chat UI (React component)
       ↓
  POST /api/chat  ← Express route
       ↓
  Server constructs augmented prompt:
    - System prompt (role, scope, disclaimers)
    - BIR form context (vector / SQL lookup of relevant forms)
    - Task context (if on task detail page)
    - Conversation history (last N turns)
       ↓
  OpenAI GPT-4o-mini Chat Completion API
       ↓
  Stream response back via SSE (Server-Sent Events)
       ↓
  UI renders streaming tokens in real-time
```

### Tool & API Requirements

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| LLM | Deepseek v4 flash | Cost-effective (~$0.15/1M input, $0.60/1M output), fast, good at structured data reasoning |
| Streaming | Server-Sent Events (SSE) | Native browser API, no extra deps, real-time token rendering |
| BIR Form Retrieval | SQL query via Drizzle | Only 50+ forms — direct DB query suffices; no vector DB needed |
| Conversation State | Zustand store (client) + in-memory (server per request) | No DB persistence for v1; history sent with each request |
| API Key | `OPENAI_API_KEY` env var | Set in Vercel dashboard, excluded from git |

### Evaluation Strategy

| Test | Method | Pass Threshold |
|------|--------|---------------|
| BIR Form Accuracy | Run 50 test queries covering all categories | ≥ 95% correct formCode + deadline |
| Relevance | 3 human raters score 20 responses on a 1-5 scale | Mean ≥ 4.0 |
| Latency | Measure TTFB + total response time for 100 requests | p95 TTFB ≤ 3s (cold), ≤ 1.5s (warm) |
| Hallucination Rate | Manual audit of 50 responses for fabricated info | ≤ 5% hallucination rate |

### Prompt Template (System)

```
You are an AI bookkeeping assistant for a Philippine accounting dashboard.
You help bookkeepers with:

1. **BIR Form Information** — You have access to the BIR forms database.
   Know their form codes, names, filing frequencies, deadlines, and categories.
2. **Task Guidance** — You can see the user's current task status and suggest next steps.
3. **General Accounting** — Basic Philippine tax and accounting Q&A.

Rules:
- Be concise — 2-3 sentences max unless asked for detail.
- If you don't know, say "I'm not sure — consult a CPA for this."
- Never fabricate BIR form data. Only use the context provided.
- Never give investment or legal advice.
- Always prefix BIR form codes with "BIR Form " (e.g., "BIR Form 2550M").

Current BIR Forms Context (top matches):
{form_context}

User Role: {role}
Current Task (if on task page): status={task_status}, form={task_form_name}, client={client_name}
```

---

## 4. Technical Specifications

### Architecture Overview

```
┌────────────────────────────────────────────────────────────────────┐
│  Frontend (React + Tailwind)                                       │
│                                                                    │
│  ┌─────────────┐  ┌─────────────────────────────────────────────┐  │
│  │ AppShell.tsx │  │ ChatBubble.tsx (floating FAB + panel)      │  │
│  │             │  │                                             │  │
│  │  <Sidebar />│  │  ┌─────────────────────────────────────┐   │  │
│  │  <main>     │  │  │ ChatPanel                           │   │  │
│  │   <Outlet/> │  │  │ ┌─────────────────────────────────┐ │   │  │
│  │             │  │  │ │ MessageList (streaming)          │ │   │  │
│  │             │  │  │ ├─────────────────────────────────┤ │   │  │
│  │             │  │  │ │ InputBar + Send button          │ │   │  │
│  │             │  │  │ └─────────────────────────────────┘ │   │  │
│  │             │  │  └─────────────────────────────────────┘   │  │
│  └─────────────┘  └─────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
                                  │ POST /api/chat (SSE stream)
                                  ▼
┌────────────────────────────────────────────────────────────────────┐
│  Server (Express + Vercel Serverless)                              │
│                                                                    │
│  routes/chat.ts ──▶ chatService.ts ──▶ OpenAI API                   │
│       │                   │                                         │
│       ▼                   ▼                                         │
│  DB (Drizzle)      SQL query: match BIR forms                     │
│  schema.birForms    by formCode/keyword                            │
└────────────────────────────────────────────────────────────────────┘
```

### Integration Points

| Integration | Direction | Notes |
|-------------|-----------|-------|
| OpenAI Chat Completions API | Server → External | POST https://api.openai.com/v1/chat/completions with streaming |
| BIR Forms DB | Server → PostgreSQL | `SELECT * FROM birForms WHERE ...` via Drizzle |
| Task Context | Client → Server | Sent as `{ taskId, taskStatus, clientName }` in request body |
| Auth Middleware | Reuse existing | Clerk JWT verification — same as all other routes |
| Rate Limiting | New | 30 requests/min per user via express-rate-limit |

### API Specification

**`POST /api/chat`**

Request:
```json
{
  "message": "What's the deadline for BIR Form 2550M?",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "context": {
    "page": "/tasks/42",
    "taskId": 42,
    "taskStatus": "pending",
    "taskFormName": "Monthly Withholding Tax",
    "clientName": "Acme Corp"
  }
}
```

Response (SSE stream):
```
event: token
data: {"token": "BIR"}

event: token
data: {"token": " Form"}

event: token
data: {"token": " 2550M"}

event: token
data: {"token": " is"}

...

event: done
data: {"usage": {"promptTokens": 450, "completionTokens": 120}}
```

Error response:
```json
{
  "success": false,
  "error": "Rate limit exceeded. Try again in 2 seconds."
}
```

### Security & Privacy

- `OPENAI_API_KEY` stored in Vercel env vars — never sent to client.
- Chat history is ephemeral (Zustand in-memory only) — no chat logs stored in DB.
- User messages are sent to OpenAI but contain no PII beyond what the user types.
- Rate-limited per user (30 req/min) to control cost and abuse.
- Standard Clerk auth gate — only authenticated users can call `/api/chat`.
- Disclaimers appended to every response: "AI-generated — verify with a qualified professional."

### Data Flow

1. User clicks FAB → ChatPanel mounts, loads empty state.
2. User types question → Sent to `/api/chat` with history + optional task context.
3. Server queries BIR forms DB for relevant matches (top 5 by keyword/formCode).
4. Server constructs system prompt with matched forms + task context.
5. Server calls OpenAI Chat Completions API with `stream: true`.
6. Server pipes SSE events back to client.
7. Client renders tokens progressively in a chat bubble.
8. On completion, adds assistant message to Zustand history.

---

## 5. Risks & Roadmap

### Phased Rollout

| Phase | Scope | Estimated Effort |
|-------|-------|-----------------|
| **MVP** | Floating chat bubble UI + `/api/chat` route + BIR form Q&A + streaming response | 3-4 days |
| **v1.1** | Task context awareness (status-specific suggestions) | 1-2 days |
| **v1.2** | Conversation history persistence + "New Chat" button | 1 day |
| **v2.0** | Document upload / OCR for form fields, QuickBooks integration | TBD |

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| OpenAI API latency on cold start | Medium | High | Keep function warm via cron ping; use 30s maxDuration on Vercel |
| Hallucination on BIR form data | Low | High | Ground prompt with actual DB rows; system prompt bans fabrication |
| Token cost overrun | Low | Medium | Cap tokens (max 500 output); rate limit 30 req/min/user; track in logging |
| SSE compatibility with Vercel Edge | Low | Medium | Use Node.js runtime (not Edge); SSE works on serverless functions |
| User prompt injection | Medium | Medium | Filter system prompt override keywords; use role separation in API call |

### Monitoring & Observability

- Log every chat request: userId, token count, latency, error flag.
- Track daily token usage per user — alert if any user exceeds $0.50/day.
- Record user feedback ("Helpful?" thumbs up/down after each response).
- Dashboard for admins: total chats, average satisfaction, top questions asked.
