---
name: chatbot-prompt-optimizer
description: 'Optimizes the AI chatbot system prompt, BIR form context injection, and LLM response quality for the Book Keeper Dashboard. Use when improving chatbot answer accuracy, reducing hallucinations, tuning prompt structure, or auditing BIR form context retrieval. Covers DeepSeek V4 Flash prompt engineering, temperature/prompt length tuning, and multi-turn conversation quality.'
---

# Chatbot Prompt Optimizer

Optimizes the AI Bookkeeper Chatbot's prompt structure, BIR form context injection, and response quality. Helps reduce hallucinations, improve accuracy, and control token costs.

## When to Use This Skill

- Chatbot gives inaccurate BIR form information
- Need to improve the system prompt structure
- BIR form context retrieval returns irrelevant matches
- Token costs are too high per query
- Chatbot hallucinates form codes, deadlines, or frequencies
- Multi-turn conversation quality degrades
- Need to add new BIR form categories to the knowledge base

## Prerequisites

- Access to the deployed chatbot (Vercel) or local dev server
- Basic understanding of BIR form codes and filing frequencies
- `DEEPSEEK_API_KEY` set in environment

## Step-by-Step Workflows

### Audit Current Prompt Quality

1. Read `server/src/lib/chat/prompt-builder.ts` — understand the current system prompt structure
2. Read `server/src/lib/chat/form-retriever.ts` — understand how BIR forms are matched
3. Send 5 test queries to `/api/chat` and capture responses:
   - Exact form code: "What is BIR Form 2550M?"
   - Partial match: "Monthly withholding tax deadline"
   - Ambiguous: "When is the deadline?"
   - Out-of-scope: "What stocks should I buy?"
   - Multi-turn: Ask a form question, then follow up with "tell me more"
4. Evaluate each response for: accuracy, conciseness, hallucination, relevance

### Optimize BIR Form Context Retrieval

1. Review the SQL query in `form-retriever.ts` — it uses `LIKE` on formCode and name
2. Check if the top-5 results are relevant for typical queries
3. If relevance is low, consider:
   - Adding category filtering (e.g., "income" vs "withholding")
   - Adding full-text search with PostgreSQL `tsvector`/`tsquery`
   - Expanding the LIMIT from 5 to 8 for ambiguous queries
4. Test the optimized query with the same 5 queries

### Tune Prompt Engineering Parameters

1. In `prompt-builder.ts`, review:
   - System prompt length (target: < 500 tokens including form context)
   - Instruction clarity (are boundaries explicit enough?)
   - Role definition (is the assistant's persona clear?)
2. In `deepseek-client.ts`, review:
   - Temperature (default: 0.3 — lower = more factual, higher = more creative)
   - Max tokens (default: 500 — adjust based on typical response length)
3. Test temperature values: 0.1 (strict factual), 0.3 (balanced), 0.5 (slightly creative)

### Add New BIR Form Knowledge

1. Read the existing form data pattern from `server/src/db/pg-schema.ts` or `server/src/db/pg-seed.ts`
2. Add new forms following the same pattern
3. Update the system prompt in `prompt-builder.ts` if new form categories are added
4. Test with a query targeting the new forms

## Gotchas

- **Never hardcode BIR form data in the prompt** — always use `form-retriever.ts` to query the DB. Hardcoded data goes stale when forms are updated.
- **Temperature 0.3 is the sweet spot** for factual BIR form answers. Below 0.1 increases repetition risk. Above 0.5 increases hallucination risk.
- **The `deepseek-chat` model identifier** may change. Check DeepSeek's current API docs if the chatbot stops responding.
- **Form context is limited to 5 matches.** If a query is too broad ("all BIR forms"), the top-5 may miss relevant results. The system prompt says "No matching forms found" when forms is empty — this fallback works but is unhelpful for broad queries.
- **Multi-turn context can grow large.** The history is limited to 10 turns (`slice(-10)` in routes/chat.ts). Beyond that, older context is silently dropped.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Chatbot hallucinates form codes | Check `form-retriever.ts` query — forms not matching. Add `category` to the SELECT. Increase temperature to 0.4 for more diverse matches. |
| Responses are too verbose | Lower `max_tokens` in `deepseek-client.ts`. Add "2-3 sentences max" to system prompt. |
| Responses are too short | Raise `max_tokens`. Remove "Be concise" from system prompt for detailed queries. |
| Wrong filing frequency returned | Check the BIR form seed data in `pg-seed.ts` — the data may be incorrect for that form. |
| Prompt injection succeeds | Add input sanitization: strip known injection patterns from user messages before passing to prompt builder. |
| Token costs too high | Reduce system prompt length. Limit history to 5 turns instead of 10. Lower max_tokens to 300. |

## References

- `server/src/lib/chat/prompt-builder.ts` — system prompt
- `server/src/lib/chat/form-retriever.ts` — form retrieval
- `server/src/lib/chat/deepseek-client.ts` — LLM client
- `server/src/routes/chat.ts` — request handler
- `docs/prd-ai-chatbot.md` — PRD with prompt template
- `server/src/db/pg-seed.ts` — BIR form seed data
- `server/src/db/pg-schema.ts` — database schema
