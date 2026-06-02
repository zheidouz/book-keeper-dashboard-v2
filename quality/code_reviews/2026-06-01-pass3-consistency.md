# Pass 3 — Cross-Requirement Consistency

> Date: 2026-06-01 · Project: book-keeper-dashboard-v2

## Pair: REQ-001 (SSE error visibility) × REQ-003 (ghost messages)

**Overlap**: Mid-stream failure scenario. If the server writes an SSE error event mid-stream (after sending partial tokens), the client must:
1. Show the error to the user (REQ-001)
2. Not leave a ghost assistant message (REQ-003)

**Current code**: Both violated. The SSE error is silently swallowed (api.ts catch block), leaving the partial assistant message with no error indication. The user sees an incomplete response with no feedback.

**Interaction gap**: Even if REQ-001 were fixed (error visible), the empty/partial assistant message would remain. REQ-003 requires removing or marking the failed message. Two separate fixes needed.

## Pair: REQ-006 (retry) × REQ-002 (timeout)

**Overlap**: If a request times out, should it retry? If it retries, what's the total time budget?

**Current code**: Neither implemented. A timeout fix (REQ-002) and retry logic (REQ-006) must be coordinated: the total timeout should include retry attempts (e.g., 30s total = 1 initial + 2 retries with backoff). Implementing one without the other creates inconsistencies.

## Pair: REQ-004 (auth required) × REQ-005 (startup validation)

**Overlap**: Two enforcement points for the same security boundary.

**Current code**: Neither implemented. Consistent gap — both are missing, so no contradiction, but both need to be implemented together.
