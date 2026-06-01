---
name: meeting-minutes
description: 'Generate concise, actionable meeting minutes for internal meetings. Includes metadata, attendees, agenda, decisions, action items (owner + due date), and follow-up steps.'
---

# Meeting Minutes Skill — Short Internal Meetings

## Purpose / Overview

This Skill produces high-quality, consistent meeting minutes for internal meetings that are 60 minutes or shorter. Output is designed to be clear, actionable, and easy to convert into task trackers (e.g., GitHub Issues, Jira). The generated minutes prioritize decisions and action items so teams can move quickly from discussion to execution.

## When to Use

Use this skill when:

- Internal syncs, standups, design reviews, triage, planning or ad-hoc meetings with short duration
- Situations that require a concise record of decisions, assigned action items, and follow-ups
- Creating a standardized minutes document from a live meeting, transcript, recording, or notes

---

## Operational Workflow

### Phase 1: Intake (before drafting)

- Obtain meeting metadata: title, date, start/end time (or duration), organizer, and intended audience.
- Confirm available inputs: agenda, slides, recording, transcript, or raw notes.
- If key details are missing, ask up to 3 clarifying questions before producing minutes (see "Discovery" below).

### Phase 2: Capture (during / immediately after meeting)

- Record attendees and absentees.
- Capture brief notes per agenda item with time markers if available.
- Record explicit decisions, rationale summary (1–2 sentences), and action items (owner + due date).

### Phase 3: Drafting

- Generate minutes following the **Strict Minutes Schema** (below).
- Ensure every action item includes owner, due date (or timeframe), and acceptance criteria when applicable.
- Mark unresolved issues or items requiring follow-up in the Parking Lot.

### Phase 4: Review & Publish

- If possible, send draft to meeting organizer or a designated reviewer for quick verification (within 24 hours).
- Publish final minutes to the agreed channel (shared drive, repo, ticket, or email) and optionally create tasks in the team's tracker.

---

## Discovery (required clarifying questions)

Before generating minutes, the agent **MUST** ask up to three clarifying questions if any of these are missing:

- What is the meeting title, date, start time (or duration), and organizer?
- Is there an agenda or transcript/recording to reference? If yes, please provide.
- Who should be assigned as the reviewer or approver for the minutes?

If the user responds "no transcript" or "no agenda," proceed but mark source material as "ad-hoc notes" and flag potential gaps.

---

## Strict Minutes Schema (Output Structure)

You **MUST** produce me