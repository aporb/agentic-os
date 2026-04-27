---
name: okr-progress-check
description: Pull status on all active OKRs, flag at-risk key results, and generate a brief with what's on track and what needs attention.
version: 1.0.0
trigger:
  - "OKR check"
  - "OKR progress"
  - "how are my OKRs doing"
  - "check my goals"
  - "quarterly goal check"
  - "are my OKRs on track"
  - "goal progress check"
  - "review my OKRs"
  - "how am I tracking against my goals"
  - "OKR status update"
integrations:
  - vault-sqlite-fts5
  - google-drive-read
inputs:
  - name: quarter
    description: The quarter to check (e.g. "Q2 2026" — defaults to current quarter)
    required: false
  - name: okr_source
    description: Path or link to the OKR document if not in vault (e.g. a Google Drive file URL or a vault wiki path)
    required: false
output_artifact: "wiki/okr-check-YYYY-QN.md"
frequency: on-demand-or-cron:0 9 * * 1
pack: ceo
---

## When to run

Monday morning, once a week. OKRs are only useful if you look at them. Most founders write OKRs in January and rediscover them in December. This skill closes that gap: it pulls your current OKR document, maps recent activity in your vault against each key result, and tells you plainly which goals are on track, which are at risk, and which are already lost.

Run on-demand any time you're preparing for an advisor conversation, an investor update, or a quarterly review.

## What you'll get

A plain-English OKR status brief that tells you where you actually stand — not where you planned to stand. Each key result gets a status (On Track / At Risk / Off Track / Complete) with a one-line evidence statement. At-risk and off-track key results get a brief diagnosis: is this a capacity problem, a strategy problem, or an external factor? The brief turns the quarterly goal-setting exercise into a living operating tool.

## Steps

1. Determine the quarter. Default to the current calendar quarter if `quarter` is not provided. Map to date range (e.g. Q2 2026 = April 1 – June 30 2026).
2. Locate the OKR source. Try in order:
   a. If `okr_source` is provided and is a vault path, read it directly.
   b. If `okr_source` is a Google Drive URL, fetch it via Google Drive MCP.
   c. Search the vault for the OKR document: `sqlite3 vault.db "SELECT path, content FROM pages WHERE path LIKE 'wiki/okr%' AND pages MATCH '<quarter>' ORDER BY updated DESC LIMIT 3;"`.
   d. Search the vault for any page with "OKR" or "goal" in the title: `sqlite3 vault.db "SELECT path, title, content FROM pages WHERE (title LIKE '%OKR%' OR title LIKE '%goal%') ORDER BY updated DESC LIMIT 5;"`.
   e. If no OKR document is found, report this clearly and prompt the user to either paste their OKRs or point to the document. Do not hallucinate OKRs.
3. Parse the OKR document. Extract: Objectives (1–5 typically) and Key Results under each (2–5 per objective). Note any existing target metrics (e.g. "$50K MRR by June 30").
4. For each Key Result, search the vault for evidence of progress: `sqlite3 vault.db "SELECT path, title, content FROM pages WHERE pages MATCH '<key result keywords>' AND updated >= '<quarter_start>' ORDER BY updated DESC LIMIT 5;"`. Standup journals, weekly reviews, and wiki pages are all signal.
5. Calculate how much of the quarter has elapsed: `days_elapsed / total_days_in_quarter`. This is the "time consumed" percentage. A key result at 30% progress when 50% of the quarter is gone is at risk.
6. For each Key Result, assign a status:
   - **Complete** — target metric already hit
   - **On Track** — progress proportional to time elapsed (within 10% of expected pace)
   - **At Risk** — progress behind pace but recoverable with focus
   - **Off Track** — progress is so far behind that hitting the target this quarter would require a step-change; be honest
   - **No Data** — cannot determine status from vault; flag for user to update manually
7. For At Risk and Off Track key results, write a one-sentence diagnosis: what's the primary reason for the gap? Use vault evidence — don't speculate.
8. Write the overall summary: 2–3 sentences on the quarter's trajectory. Is this a strong quarter? A mixed one? What's the single highest-leverage action this week to move the needle?
9. Save as `wiki/okr-check-YYYY-QN.md`. If a check already exists for this quarter, create a new dated version (`wiki/okr-check-YYYY-QN-MMDD.md`) rather than overwriting — the history of how the quarter evolved is worth keeping.

## Output format

```yaml
---
type: wiki
title: "OKR Progress Check — [Quarter Year]"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: draft
tags: [okr, quarterly-goals, ceo, [quarter-tag]]
sources: [vault-wiki, vault-journal, google-drive]
quarter: "[Q# YYYY]"
check_date: YYYY-MM-DD
quarter_elapsed_pct: [0-100]
---
```

```markdown
# OKR Progress Check — [Quarter Year]

> Checked: YYYY-MM-DD. Quarter is [N]% complete ([X] of [Y] weeks elapsed).

## Summary
[2–3 sentences. Overall read on the quarter. Honest. What's going right,
what's in trouble, what's the most important thing to do this week.]

---

## Objective 1 — [Objective Title]

### KR 1.1 — [Key Result description]
**Status:** [On Track / At Risk / Off Track / Complete / No Data]
**Target:** [metric]
**Current:** [current value or best estimate]
**Evidence:** [1 sentence citing vault source or lack thereof]

### KR 1.2 — [Key Result description]
[same structure]

---

## Objective 2 — [Objective Title]

### KR 2.1 — [Key Result description]
[same structure]

---

## At-Risk Key Results — Action Required

| Key Result | Status | Primary Diagnosis |
|------------|--------|------------------|
| [KR name] | At Risk | [one-line diagnosis] |
| [KR name] | Off Track | [one-line diagnosis] |

## Top 3 Actions This Week
1. [Highest-leverage action to move a specific KR]
2. [Second action]
3. [Third action]
```

## Example output (truncated)

```markdown
# OKR Progress Check — Q2 2026

> Checked: 2026-04-28. Quarter is 31% complete (4 of 13 weeks elapsed).

## Summary
Revenue is tracking ahead of plan — MRR hit $31.2K on the back of the Nexus
close, putting KR 1.1 at 62% with 69% of the quarter remaining. The product
and pipeline KRs are the concern: onboarding completion is still below target
and outbound pipeline build hasn't started. Those two gaps compound each other.

---

## Objective 1 — Reach $50K MRR by June 30

### KR 1.1 — Grow MRR from $22K to $50K
**Status:** On Track
**Target:** $50,000
**Current:** $31,200 (62% of target, 31% of quarter elapsed — ahead of pace)
**Evidence:** April investor update draft (wiki), Nexus close noted in weekly review Apr 25

### KR 1.2 — Achieve 0% involuntary churn
**Status:** On Track
**Target:** 0% involuntary churn
**Current:** 0% (14 active customers, all paying)
**Evidence:** Standup journals Apr 1–28 — no churn events mentioned

---

## At-Risk Key Results — Action Required

| Key Result | Status | Primary Diagnosis |
|------------|--------|------------------|
| Onboarding completion >70% | At Risk | Metric is 61% after v2 ship; needs 2 more weeks of data |
| 20 outbound prospects researched | Off Track | No outbound prospect research in vault since March |
```
