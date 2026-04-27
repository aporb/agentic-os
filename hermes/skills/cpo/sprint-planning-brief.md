---
name: sprint-planning-brief
description: Select the top tickets for the current sprint, add context and acceptance criteria, and produce a brief the operator can execute without ambiguity.
version: 1.0.0
trigger:
  - "sprint planning"
  - "plan this sprint"
  - "what am I building this week"
  - "sprint brief"
  - "build the sprint plan"
  - "what are we working on this sprint"
  - "set up the sprint"
  - "weekly build plan"
integrations:
  - linear-api
  - vault-sqlite-fts5
inputs:
  - name: sprint_goal
    description: One-sentence goal for the sprint — what success looks like at the end
    required: true
  - name: team_size
    description: Number of people working the sprint (defaults to 1 for solo-operator mode)
    required: false
  - name: sprint_number
    description: Sprint number or identifier (e.g. "S24" or "2026-W18")
    required: false
  - name: capacity_notes
    description: Any known constraints on capacity — travel, meetings, partial availability
    required: false
output_artifact: "wiki/sprint-[sprint-number].md"
frequency: on-demand
pack: cpo
---

# Sprint Planning Brief

## When to run

Monday morning before you open your code editor. Or Sunday evening if you prefer to start the week already knowing exactly what you're building. The sprint brief replaces the paralysis of staring at a full backlog and deciding in real time what to pick up next.

This skill defaults to single-operator mode. One person, one sprint, 5–8 tickets maximum — more than that and you're not planning a sprint, you're writing a wish list. If your team grows, set `team_size` accordingly and the capacity math adjusts.

## What you'll get

A sprint page in your vault listing the selected tickets with full context: the problem each ticket solves, its acceptance criteria, any relevant prior pages linked by [[wikilink]], and a rough sequencing note. The page is the operating brief for the week. You come back to it when you lose the thread.

## Steps

1. Check if a prioritized backlog exists from the current week: `sqlite3 vault.db "SELECT path, updated FROM pages WHERE path LIKE 'wiki/backlog-prioritized%' ORDER BY updated DESC LIMIT 1;"`. If it exists and is less than 7 days old, use it as the starting point. If not, run a lightweight prioritization inline (skip the scoring; pull top Linear tickets by priority label or estimate).

2. If Linear API is configured: fetch open, unstarted issues for the current project. Filter to those with priority label "high" or "urgent" first, then "medium". If sprint_number maps to an existing Linear cycle, fetch tickets already assigned to that cycle.

3. Determine capacity. Default assumption: `team_size` = 1 (solo-operator mode).
   - Solo mode: cap at 5 tickets. Realistic delivery budget is ~4–5 meaningful items per week for a single operator, including context switching and review overhead.
   - Team mode (`team_size` > 1): cap at `team_size * 4` tickets. Note that team mode increases coordination overhead — factor it in.
   - If `capacity_notes` lists any partial availability (travel, calls, etc.), reduce cap by 1 ticket per major constraint.

4. Select tickets up to the capacity cap. Selection logic:
   - Tickets that directly serve the `sprint_goal` come first.
   - Break ties by priority score (from backlog-prioritization page if available) or Linear priority label.
   - Exclude any ticket with effort estimate > 3 days unless it's the single most important item. One large item can anchor a sprint; two large items means the sprint will not close.

5. For each selected ticket, collect full context:
   - Pull the Linear ticket description.
   - Search the vault for related spec or feedback pages: `sqlite3 vault.db "SELECT path, title FROM pages_fts WHERE pages_fts MATCH '<ticket_keywords>' LIMIT 3;"`.
   - Link related pages as [[wikilinks]].

6. For any ticket without acceptance criteria in Linear, write them now. Format: `Given [context], when [action], then [result].` Two to four criteria per ticket is the target. If you can't write the criteria, the ticket isn't ready for the sprint.

7. Write a sequencing note: which ticket should go first, and why? Usually the highest-risk or highest-dependency item goes first so blockers surface early, not on Friday.

8. If `team_size` > 1, assign tickets by name. Note: do not assign more than 3 tickets to any single person.

9. If Linear API is configured: add selected tickets to the current cycle, set status to "In Progress" for the first ticket in the sequence, and post a comment on each ticket with the sprint goal and sequencing context.

10. Save the brief to `wiki/sprint-[sprint-number].md`. Use the identifier from `sprint_number` if provided, or derive it from the current ISO week (`YYYY-WNN`).

## Output format

```yaml
---
type: wiki
title: "Sprint [sprint-number] — [YYYY-MM-DD]"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: draft
tags: [sprint, product, cpo, planning]
sources: [linear, vault]
sprint_goal: "[sprint_goal]"
team_size: N
ticket_count: N
---
```

```markdown
# Sprint [sprint-number] — [Start Date]

> Goal: [sprint_goal]
> Operator(s): [name(s) or "solo"]
> Capacity: [N tickets | N days]
> Sequence: build in the order listed — [Ticket 1] first; surface blockers early.

---

## [Rank 1] LIN-XX — [Ticket Title]

**Why this sprint:** [One sentence connecting this ticket to the sprint goal.]
**Related:** [[spec-feature-slug]], [[feedback-synthesis-YYYY-MM]] (if relevant)

### Acceptance Criteria
- Given [context], when [action], then [result].
- Given [context], when [action], then [result].

---

## [Rank 2] LIN-XX — [Ticket Title]
...

---

## Carry-over / Watch List

These tickets didn't make the cut but are candidates if a ticket closes early:
- LIN-XX [Title] — [one-line reason it was deprioritized]
```

## Example output (truncated)

```markdown
# Sprint 2026-W18 — April 28 2026

> Goal: Ship the onboarding fast path and reduce time-to-first-output to under 10 minutes.
> Operator(s): solo
> Capacity: 5 tickets | solo-operator mode
> Sequence: LIN-28 first (foundational, unblocks LIN-31), then LIN-44, LIN-31, LIN-19, LIN-22.

---

## [1] LIN-28 — Onboarding fast path (skip integrations)

**Why this sprint:** This is the sprint goal. Everything else is secondary.
**Related:** [[spec-onboarding-fast-path]], [[feedback-synthesis-2026-04]]

### Acceptance Criteria
- Given a new user signs up, when they reach the integration step, then they see
  a "Skip for now" option that routes them to a pre-configured demo vault.
- Given they choose the fast path, then a sample standup runs automatically and
  outputs to a journal note within 60 seconds.
- Given they complete the fast path, then the setup banner persists with
  "Connect your integrations" as a secondary CTA.

---

## [2] LIN-44 — Email digest for inactive users

**Why this sprint:** High retention impact, low effort. Builds on fast-path work
by re-engaging users who dropped during onboarding.
**Related:** [[feedback-synthesis-2026-04]]

### Acceptance Criteria
- Given a user has not logged in for 7 days, when the cron fires daily at 9am,
  then they receive a digest email listing 3 skills they haven't tried.
```
