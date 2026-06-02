---
name: chatbot-sse-debugger
description: 'Debugs SSE (Server-Sent Events) streaming issues in the AI Bookkeeper Chatbot. Use when chatbot responses are slow, incomplete, not rendering, timing out, or showing connection errors. Covers AbortController timeout tuning, fetch stream parsing, token rendering, error event propagation, and mid-stream disconnection recovery.'
---

# Chatbot SSE Debugger

Debugs Server-Sent Events streaming issues in the AI Bookkeeper Chatbot. Helps diagnose slow responses, incomplete renders, timeouts, connection drops, and silent error swallowing.

## When to Use This Skill

- Chatbot response doesn't render (blank assistant bubble)
- Response starts but stops mid-stream
- "Request timed out" errors
- Loading indicator spins forever
- Error messages shown but no error actually occurred
- Chatbot works in dev but not in production
- Browser shows network connection errors to `/api/chat`

## Prerequisites

- Browser DevTools (Network tab for SSE request inspection)
- Access to Vercel logs (`vercel logs` or Vercel dashboard)
- `DEEPSEEK_API_KEY` set and valid

## Step-by-Step Workflows

### Diagnose SSE Connection Issues

1. Open browser DevTools → Network tab
2. Send a chat message and inspect the `/api/chat` POST request
3. Check response headers:
   - `Content-Type: text/event-stream` — must be present
   - `Cache-Control: no-cache` — must be present
4. Check response body for SSE events:
   - `data: {"token":"..."}` — tokens should arrive one per line
   - `data: {"error":"..."}` — error events on failure
   - `data: {"usage":...}` — final event with token counts
5. If no SSE events arrive, check Vercel server logs for the `/api/chat` route
6. If SSE events arrive but don't render, check the client-side parser

### Debug Client-Side SSE Parser

1. Read `client/src/lib/api.ts` — focus on `chatApi.sendStream`
2. Check these conditions:
   - `AbortController` timeout (default: 30s) — too short for long responses?
   - `finish` function — guard against double-fire
   - Error event handling — `data.error` calls `onError`
   - Stream reading — `reader.read()` loop with line buffering
3. Add temporary `console.log` to trace SSE event flow:
   - Log each `data:` line received
   - Log each parsed `data.token`
   - Log when `finish()` is called
4. Test with a simple query that should produce ~50 tokens

### Trace Error Event Flow

1. Simulate a server error (e.g., stop the DeepSeek API key or server)
2. Check the error path:
   - Server: `routes/chat.ts` catch block handles error
   - Server: `sse-responder.ts` writes `data: {"error":"..."}`
   - Client: `api.ts` SSE parser reads `data.error`
   - Client: `onError(err)` is called
   - Client: `useChat.ts` catch block handles remaining errors
3. Verify each step produces the correct output
4. Check that `onDone()` is NOT called after `onError()` (double-fire guard)

### Tune Timeout and Retry

1. Read `client/src/lib/api.ts` — find `AbortController` and 30s timeout
2. Read `server/src/lib/chat/deepseek-client.ts` — find `withRetry` exponential backoff
3. Evaluate whether timeout is appropriate:
   - 30s for Vercel serverless (maxDuration config)
   - Consider increasing to 55s for complex queries
4. Evaluate retry strategy:
   - 2 retries with 1s/2s backoff
   - Consider adding jitter (random delay between 0.5x and 1.5x)
5. Test timeout by setting a very low value (e.g., 100ms) and sending a query

## Gotchas

- **Function declarations inside `try` blocks are block-scoped in strict mode.** Always use `const fn = () => ...` or declare outside the try block. This was the root cause of the "finish is not defined" bug.
- **SSE error events from the server are silently swallowed** if the JSON parse catch block is too broad. Separate JSON parse errors from semantic error events.
- **`fetch()` without AbortSignal has no timeout.** The connection hangs forever if the server doesn't respond. Always use AbortController with a reasonable timeout.
- **The SSE parser uses line-by-line buffering.** If a single `data:` line is split across multiple `reader.read()` chunks, the buffer logic reassembles it. Test with chunked responses.
- **Vercel serverless functions have a 30s max duration.** The AbortController timeout should match or be slightly less than this.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Blank assistant bubble, no error | Check `useChat.ts` — the empty message is created before the API call. If the call fails immediately, the empty message persists. The `removeEmptyMessage` function on error was added as a fix. |
| Loading spinner never stops | `onDone()` never fired. Check the `finish()` guard in `api.ts` — if `finished` is already true, subsequent calls are no-ops. Also check that `reader.read()` eventually resolves. |
| "Request timed out after 30 seconds" | DeepSeek API took too long. Increase the AbortController timeout or optimize the prompt to reduce processing time. Confirm Vercel serverless maxDuration (`vercel.json` → `functions.api/index.ts.maxDuration`). |
| Partial response then stops | Mid-stream connection drop. The error path in the catch block should fire `onError`. Check Vercel function logs for timeout or memory errors. |
| Error shown but request succeeded | The `onError` path fired incorrectly. Check `api.ts` for false error triggers (e.g., JSON parse errors on legitimate SSE data). |
| Works in dev, not in production | Check minification issues with `dangerouslySetInnerHTML` and `__html` property name mangling. The fix was to render markdown as React elements instead. |
| "finish is not defined" in console | The `finish` function was declared inside a `try` block using `function finish()`. In strict mode (ES modules), this is block-scoped. Fix: use `const finish = () => ...` outside the try block. |

## References

- `client/src/lib/api.ts` — SSE fetch + stream parser
- `client/src/hooks/useChat.ts` — send + stream hook
- `server/src/lib/chat/sse-responder.ts` — SSE write utility
- `server/src/lib/chat/deepseek-client.ts` — DeepSeek streaming client
- `server/src/routes/chat.ts` — SSE headers + error handling
- `vercel.json` — maxDuration config
- `quality/BUGS.md` — bug reports (BUG-002: error swallowing, BUG-003: timeout, BUG-005: ghost messages)
