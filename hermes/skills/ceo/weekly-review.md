---
name: weekly-review
description: End-of-week reflection — what shipped, what didn't, and the top three priorities for next week.
version: 1.0.0
trigger:
  - "weekly review"
  - "end of week review"
  - "week in review"
  - "what did I ship this week"
  - "reflect on the week"
  - "Friday review"
  - "wrap up the week"
  - "what should I focus on next week"
integrations:
  - vault-sqlite-fts5
inputs:
  - name: week_end_date
    description: The Friday date for the week being reviewed (defaults to this Friday)
    required: false
  - name: notes
    description: Any additional context or wins/losses the user wants to include
    required: false
output_artifact: "journal/YYYY-MM-DD-weekly-review.md"
frequency: on-demand-or-cron:0 16 * * 5
pack: ceo
---

## When to run

Friday afternoon, before you close your laptop. The week's context is still fresh — you can remember why that deal stalled, why that task slipped, what the decision was behind the tradeoff. Wait until Monday and you'll reconstruct a fiction. Run this now and you get an honest record that becomes context for next week's planning and compounds into a pattern you can actually learn from.

Run it on-demand any time you need to get a clean read on where the week went.

## What you'll get

A one-page journal entry that captures what shipped, what slipped and why, and your three highest-leverage priorities for next week. Over time, these entries are the raw material for quarterly reviews, investor updates, and the honest post-mortems that separate founders who learn from the ones who repeat the same quarter four times.

## Steps

1. Determine the week being reviewed. Default to the current week (Monday through today). If `week_end_date` is provided, use that Friday as the anchor.
2. Search the vault journal for all entries from this week: `sqlite3 vault.db "SELECT path, title, content FROM pages WHERE path LIKE 'journal/%' AND date >= '<MONDAY>' AND date <= '<FRIDAY>' ORDER BY date ASC;"`. Read each entry.
3. Search for any standup journal entries this week (path pattern `journal/YYYY-MM-DD-standup.md`). These are ground truth for Done/Blocked.
4. Search wiki for pages created or updated this week: `sqlite3 vault.db "SELECT path, title, updated FROM pages WHERE path LIKE 'wiki/%' AND updated >= datetime('<MONDAY>') ORDER BY updated DESC LIMIT 20;"`. These represent shipped outputs.
5. Search wiki for any decision pages, meeting prep notes, or competitor research from this week. These represent strategic work done.
6. If user provided `notes`, incorporate them — user-supplied context always wins over inferred context.
7. Synthesize: identify what actually shipped (concrete deliverables, deals closed, decisions made), what was planned but didn't ship (cross-reference Monday's standup if it exists), and what caused slippage.
8. Draft the top three priorities for next week. Base them on: unfinished items with high stakes, explicitly flagged blockers that resolved or need resolution, and any patterns in what keeps slipping.
9. Write the review in the output format below. The "Honest Assessment" section should be one frank paragraph — not a praise sandwich. If the week was bad, say why. If it was great, say what drove it.
10. Save as `journal/YYYY-MM-DD-weekly-review.md` where the date is the Friday of the week reviewed.

## Output format

```yaml
---
type: journal
title: "Weekly Review — Week of YYYY-MM-DD"
created: YYYY-MM-DDT16:00:00
updated: YYYY-MM-DDT16:00:00
status: draft
tags: [weekly-review, reflection, ceo]
sources: [vault-journal]
week_start: YYYY-MM-DD
week_end: YYYY-MM-DD
---
```

```markdown
# Weekly Review — Week of April 28, 2026

## Shipped
- [Item 1 — concrete output]
- [Item 2]
- [Item 3]

## Slipped
- [Item that didn't ship] — [one-line honest reason]
- [Item] — [reason]

## Honest Assessment
[One frank paragraph. What drove the week? What cost the most time for the least return?
What decision in hindsight was right or wrong?]

## Top 3 for Next Week
1. [Highest-leverage priority] — [why this one, not something else]
2. [Second priority]
3. [Third priority]

## Notes & Loose Ends
- [Anything that didn't fit above but needs to be captured]
```

## Example output (truncated)

```markdown
# Weekly Review — Week of April 28, 2026

## Shipped
- Closed Nexus Media ($4,200/mo MRR) — contract signed, onboarding call booked
- Published competitor brief on Vantage AI to wiki
- Sent May investor update draft to advisor group
- Shipped onboarding v2 to staging — one bug outstanding

## Slipped
- Q2 OKR check — kept getting pushed by sales calls; not urgent but compounding
- Mercury financial statement review — statement arrived Thursday, ran out of time

## Honest Assessment
Strong revenue week: Nexus close moves us to $31K MRR. The cost was operational debt —
two recurring tasks (OKR check, financial review) slipped a second week in a row.
These are Friday-morning 30-minute tasks that keep landing on the wrong side of my
attention. The fix is not more discipline; it's scheduling them as hard blocks.

## Top 3 for Next Week
1. OKR progress check — two weeks overdue, Q2 is 6 weeks in, need the read
2. Mercury review + runway recalc — need this before the advisor call May 8
3. Onboarding v2 bug fix + ship to prod — Nexus onboarding call is May 5
```
