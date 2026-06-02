# Pass 2 — Requirement Verification

> Date: 2026-06-01 · Project: book-keeper-dashboard-v2

| REQ | Description | Verdict | Code Evidence |
|-----|-------------|---------|---------------|
| REQ-001 | SSE error events must be visible to user | **VIOLATED** | `api.ts:175-178`: `throw new Error(data.error)` is caught by inner catch block and silently discarded |
| REQ-002 | SSE fetch must have a timeout | **VIOLATED** | `api.ts:137-194`: No AbortController, no timeout parameter |
| REQ-003 | Failed sends must not leave ghost messages | **VIOLATED** | `useChat.ts:34-40`: Empty assistant message added before API call, never removed on error |
| REQ-004 | Chat endpoint must reject unauthenticated | **VIOLATED** | `routes/chat.ts:13`: Falls back to "anonymous" rate limit bucket instead of returning 401 |
| REQ-005 | Missing DEEPSEEK_API_KEY must fail at startup | **VIOLATED** | `deepseek-client.ts:6`: `|| ""` silently initializes with empty key, no startup check |
| REQ-006 | Transient DeepSeek failures must retry | **VIOLATED** | `deepseek-client.ts:15-40`: No retry logic, no exponential backoff |
| REQ-007 | Server must validate history array structure | **VIOLATED** | `routes/chat.ts:25-36`: Only `message` validated, `history` items passed through unchecked |
| REQ-008 | Client must handle connection drop mid-stream | **VIOLATED** | `api.ts:137-194`: No abort signal, no connection-drop handling |
