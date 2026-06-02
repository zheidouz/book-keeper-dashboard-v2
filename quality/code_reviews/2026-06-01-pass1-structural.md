# Pass 1 — Structural Review

> Date: 2026-06-01 · Project: book-keeper-dashboard-v2

## Scrutiny Area: Input Validation

**routes/chat.ts:25-34** — `message` field validated (required, string, non-empty, length-capped). ✅
**routes/chat.ts:36** — `history` NOT validated for item structure. History items passed directly to prompt-builder. ❌ BUG-001
**api.ts SSE parser** — `JSON.parse(line.slice(6))` wrapped in try/catch that swallows errors including `data.error` throw. ❌ BUG-002

## Scrutiny Area: Resource Lifecycle

**routes/chat.ts:42-44** — SSE headers set. ✅
**routes/chat.ts:47-51** — `streamFromDeepSeek` awaited, `res.end()` called on done. ✅
**api.ts:137** — No AbortController. No timeout on fetch. ❌ BUG-003
**deepseek-client.ts:15-40** — No timeout on OpenAI SDK call. No retry logic. ❌ BUG-004 (retry), CONCERN (timeout)

## Scrutiny Area: Concurrency and State Management

**chat-store.ts** — Zustand `appendToken` mutates a copy of the array. Operations are synchronous. ✅
**useChat.ts:34-40** — Empty assistant message created before API call. If call fails immediately, ghost message persists. ❌ BUG-005

## Scrutiny Area: Error Handling

**routes/chat.ts:53-58** — Catch block checks `res.headersSent` correctly. ✅
**api.ts:175-178** — `catch { // skip malformed lines }` swallows ALL errors including `data.error` throw. ❌ BUG-002
**deepseek-client.ts** — No error-specific handling for 401 vs 429 vs 500. All errors propagate as generic. CONCERN

## Scrutiny Area: Secret Management

**deepseek-client.ts:3-6** — `apiKey: process.env.DEEPSEEK_API_KEY || ""` — no startup validation. Empty key creates silent failures. ❌ BUG-006
