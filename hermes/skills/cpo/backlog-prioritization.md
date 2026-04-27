---
name: backlog-prioritization
description: Score and rank your open backlog items by impact, effort, and urgency so you build in the right order, not the loudest-request order.
version: 1.0.0
trigger:
  - "prioritize the backlog"
  - "backlog prioritization"
  - "rank these features"
  - "what should I build next"
  - "score the backlog"
  - "help me decide what to build"
  - "order the backlog"
  - "which ticket should I work on"
integrations:
  - linear-api
  - vault-sqlite-fts5
inputs:
  - name: backlog_items
    description: The items to prioritize — either a list of Linear ticket IDs, a plain-text list, or "all" to pull from Linear
    required: true
  - name: scoring_weights
    description: Optional override for scoring weights as JSON, e.g. {"impact": 0.5, "effort": 0.3, "urgency": 0.2}. Defaults to equal thirds.
    required: false
  - name: context
    description: Any strategic context that should influence the ranking — e.g. "we're heads-down on retention this sprint" or "preparing for a demo next week"
    required: false
output_artifact: "wiki/backlog-prioritized-YYYY-MM-DD.md"
frequency: on-demand
pack: cpo
---

# Backlog Prioritization

## When to run

At the start of each week before you commit to anything. Before sprint planning when you need the backlog in order rather than in whatever sequence items were added. After a major round of user feedback lands and you need to re-rank against new signal.

The problem this skill solves: builders default to working on what's most familiar, most recently added, or most loudly requested — not what's most important. A scored list replaces gut feel with a repeatable frame you can defend.

## What you'll get

A ranked backlog table with each item scored on impact, effort, and urgency. The ranking is transparent — you can see why item 3 beat item 7, and you can challenge any score. The page saves to your vault so you can track how priorities shift over time. If Linear is configured, scores are written back as comments on each ticket.

## Steps

1. Retrieve backlog items:
   - If `backlog_items` is `"all"` and Linear API is configured: fetch all open issues in the current project that are not in a completed cycle. Pull title, description, labels, and estimate (if set).
   - If `backlog_items` is a list of Linear ticket IDs: fetch each ticket via Linear API.
   - If `backlog_items` is a plain-text list: parse each line as a separate item. Use the description as provided.

2. For each item, collect any existing context from the vault: `sqlite3 vault.db "SELECT path, title, snippet(pages_fts, 0, '', '', '...', 20) FROM pages_fts WHERE pages_fts MATCH '<item_title_keywords>' LIMIT 3;"`. Feedback synthesis pages, prior specs, and customer health notes all inform the scoring.

3. Score each item on three dimensions (1–5 scale each):
   - **Impact**: How much does shipping this move a metric that matters — retention, conversion, engagement, revenue? Score 5 if it directly reduces churn or closes a segment of the pipeline. Score 1 if it's polish with no measurable outcome.
   - **Effort**: How much build work is involved? Score 1 for a day or less, 5 for more than a week. Use Linear estimate if available; infer from description if not.
   - **Urgency**: Is there a time constraint — customer commitment, competitive pressure, launch date, dependency unlock? Score 5 if there's a hard deadline within 2 weeks. Score 1 if there's no time pressure.

4. Apply scoring weights. Default: Impact 40%, Effort 30% (inverted — high effort reduces score), Urgency 30%.
   - Formula: `Priority Score = (Impact × 0.4) + ((6 - Effort) × 0.3) + (Urgency × 0.3)`
   - If `scoring_weights` override is provided, use those weights instead.

5. If `context` is provided, apply a context modifier: +0.5 to items that directly serve the stated context, -0.5 to items that conflict with it.

6. Sort all items by Priority Score descending. Items with identical scores rank by Urgency first, then Impact.

7. Write a brief rationale for the top 5 items — one sentence each explaining why that item scored where it did. Keep the rationale evidence-based, not motivational.

8. Flag any item where Effort is 5 (more than a week). These are candidates for decomposition before they enter a sprint.

9. If Linear API is configured, post the score and rank as a comment on each ticket: `LIN-XXX: Priority Score 4.1 (Impact 4, Effort 2, Urgency 3). Ranked #2 of 14 items. Rationale: [one sentence].`

10. Save the ranked list to `wiki/backlog-prioritized-YYYY-MM-DD.md`.

## Output format

```yaml
---
type: wiki
title: "Backlog Prioritization — YYYY-MM-DD"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: draft
tags: [backlog, prioritization, product, cpo]
sources: [linear, vault]
item_count: N
scoring_weights: {impact: 0.4, effort: 0.3, urgency: 0.3}
---
```

```markdown
# Backlog Prioritization — YYYY-MM-DD

> Items scored: N | Context: [context or "none"] | Weights: Impact 40% / Effort 30% / Urgency 30%

## Ranked Backlog

| Rank | Ticket | Title | Impact | Effort | Urgency | Score | Rationale |
|------|--------|-------|--------|--------|---------|-------|-----------|
| 1    | LIN-42 | [Title] | 5 | 2 | 4 | 4.5 | [One-sentence rationale] |
| 2    | LIN-17 | [Title] | 4 | 3 | 3 | 3.8 | [One-sentence rationale] |
| ...  | ...    | ...   | ...  | ...  | ...    | ...  | ...       |

## Decomposition Candidates

These items scored well but are too large for a single sprint. Break them down before
committing to a sprint:

- [LIN-XX] [Title] — Effort 5. Suggested split: [rough decomposition idea]

## Notes

[Any observations about the scoring that aren't captured in the table — e.g., "LIN-22
scored low but is a dependency for LIN-17; unblocking it first may be the right call."]
```

## Example output (truncated)

```markdown
# Backlog Prioritization — 2026-04-28

> Items scored: 12 | Context: "preparing for retention push this sprint" | Weights: Impact 40% / Effort 30% / Urgency 30%

## Ranked Backlog

| Rank | Ticket | Title | Impact | Effort | Urgency | Score | Rationale |
|------|--------|-------|--------|--------|---------|-------|-----------|
| 1 | LIN-44 | Email digest for inactive users | 5 | 2 | 5 | 4.7 | Directly targets retention; 3 churned users cited "forgot it existed"; low build effort. |
| 2 | LIN-31 | Skill output edit mode | 4 | 3 | 4 | 4.1 | Appeared in 9 of 34 feedback items this month; friction in core workflow. |
| 3 | LIN-28 | Onboarding fast path (skip integrations) | 5 | 4 | 3 | 3.8 | High impact on activation but high effort; context of retention push supports it. |
| 4 | LIN-19 | Dark mode | 2 | 2 | 1 | 2.3 | Requested once; no retention or conversion link visible. |

## Decomposition Candidates

- [LIN-28] Onboarding fast path — Effort 5. Suggested split: (a) skip-integrations option, (b) fast-path copy and UI, (c) analytics instrumentation.
```
