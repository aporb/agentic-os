---
name: investor-update-draft
description: Draft a monthly investor and advisor update memo from key metrics, milestones, and asks.
version: 1.0.0
trigger:
  - "draft investor update"
  - "investor update"
  - "write my investor memo"
  - "monthly investor update"
  - "advisor update"
  - "write an update for my investors"
  - "investor email draft"
  - "update my board"
  - "write my monthly update"
integrations:
  - vault-sqlite-fts5
  - google-drive-read
inputs:
  - name: month
    description: The month the update covers (e.g. "April 2026" — defaults to last calendar month)
    required: false
  - name: mrr
    description: Current MRR in dollars (optional — pulls from vault if available, falls back to manual input)
    required: false
  - name: highlights
    description: 2–5 bullet points of the month's key wins (deals closed, product shipped, partnerships signed, etc.)
    required: false
  - name: lowlights
    description: 1–3 bullet points of what didn't go as planned — investors respect honesty more than spin
    required: false
  - name: asks
    description: What you need from investors/advisors this month (intros, advice on a specific decision, warm leads)
    required: false
output_artifact: "wiki/investor-update-YYYY-MM.md"
frequency: on-demand
pack: ceo
---

## When to run

Once a month, between the 1st and the 5th — after the month closes and before investors have given up waiting. Most solo founders skip investor updates when things are hard and only write them when things are good. That's the wrong pattern: investors fund founders who communicate, not just founders who perform. A consistent monthly update, even in a hard month, builds the relationship capital that closes the bridge round when you need one.

Run on-demand any time you owe an update and want help drafting it.

## What you'll get

A clean, honest investor memo in the format investors actually read: metrics first, narrative second, ask at the end. The draft starts from your assembled month — milestones from your weekly reviews, metrics from Stripe, decisions you've documented in the wiki — instead of from a blank page. You arrive at review-ready with the month's context already in place, instead of spending the first hour reconstructing it from scratch.

## Steps

1. Determine the reporting month. Default to the previous calendar month if `month` is not provided.
2. Search the vault for weekly review journal entries from the reporting month: `sqlite3 vault.db "SELECT path, title, content FROM pages WHERE path LIKE 'journal/%-weekly-review%' AND date >= '<FIRST_OF_MONTH>' AND date <= '<LAST_OF_MONTH>' ORDER BY date ASC;"`. These are the highest-signal source for what shipped and what didn't.
3. Search the vault for standup journal entries from the month: `sqlite3 vault.db "SELECT path, content FROM pages WHERE path LIKE 'journal/%-standup%' AND date >= '<FIRST_OF_MONTH>' AND date <= '<LAST_OF_MONTH>' ORDER BY date ASC;"`. Look for patterns in Done sections — recurring wins or recurring blockers.
4. Search for wiki pages created or updated during the reporting month (new wiki pages often represent shipped outputs or closed research): `sqlite3 vault.db "SELECT path, title, updated FROM pages WHERE path LIKE 'wiki/%' AND updated >= '<FIRST_OF_MONTH>' AND updated <= '<LAST_OF_MONTH>' ORDER BY updated DESC LIMIT 20;"`.
5. Look for any existing OKR wiki page or progress check: `sqlite3 vault.db "SELECT path, content FROM pages WHERE path LIKE 'wiki/okr%' ORDER BY updated DESC LIMIT 3;"`. Pull current OKR status if available.
6. If Google Drive integration is configured, search for any financial summary or metrics documents from this month: search Drive for files named or containing "financial summary", "MRR", "metrics" updated in the reporting month. Read the first matching file. (Skip this step gracefully if Drive is not configured — fall back to `mrr` input.)
7. Use `mrr` input if provided. If MRR is available from vault or Drive, use that. If not available anywhere, leave a `[MRR: $__,___]` placeholder and note it in the brief's preamble.
8. Compile the metrics block. Minimum: MRR (current and last month delta), customer count if available. If you have it: churn, NRR, pipeline value. Use placeholders for anything not in vault or inputs.
9. Draft the memo. Voice: founder-to-investor, not formal corporate memo. Direct, honest, specific. The ask section is the most important — make it one clear, specific ask per investor/advisor, not a vague "open to intros."
10. Save as `wiki/investor-update-YYYY-MM.md` where YYYY-MM is the reporting month.

## Output format

```yaml
---
type: wiki
title: "Investor Update — [Month YYYY]"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: draft
tags: [investor-update, ceo, monthly]
sources: [vault-journal, vault-wiki, google-drive]
reporting_month: YYYY-MM
mrr: [number or null]
---
```

```markdown
# Investor Update — [Month Year]

Hi [names] —

Monthly update for [Month]. [One sentence on the headline of the month — the
single biggest thing that happened, good or bad.]

---

## Metrics

| Metric | This Month | Last Month | Change |
|--------|-----------|------------|--------|
| MRR | $[x] | $[y] | [+/-z%] |
| Customers | [n] | [n-1] | [+/-] |
| Churn | [x%] | [y%] | |
| Pipeline | $[x] | $[y] | |

---

## Highlights
- [Win 1 — specific, concrete]
- [Win 2]
- [Win 3]

## Lowlights
- [What didn't go as planned — honest, one-line reason]
- [Second lowlight if applicable]

## What's Next (30 days)
- [Top priority 1]
- [Top priority 2]
- [Top priority 3]

---

## Ask

[One specific ask per reader. Example: "Marcus — would love a warm intro
to anyone you know running ops at a Series A SaaS company. We're targeting
that buyer. Happy to give you context on who specifically."]

---

[Your name]
```

## Example output (truncated)

```markdown
# Investor Update — April 2026

Hi Marcus, Tara —

Monthly update for April. We crossed $30K MRR and signed our largest contract to date.

---

## Metrics

| Metric | This Month | Last Month | Change |
|--------|-----------|------------|--------|
| MRR | $31,200 | $26,800 | +16.4% |
| Customers | 14 | 12 | +2 |
| Churn | 0% | 0% | flat |
| Pipeline | $18,500 | $11,000 | +68% |

---

## Highlights
- Closed Nexus Media ($4,200/mo) — largest single contract, 12-month term
- Shipped onboarding v2 — activation rate up from 42% to 61% in first week of data
- Launched CEO Pack v1 skills publicly; 47 GitHub stars in first 72 hours

## Lowlights
- OKR progress check is two weeks overdue — blocked myself on the process; fixing next week
- Lost Thornfield Labs deal — they chose a managed service; price was not the reason

## What's Next (30 days)
- Close 2 more deals in pipeline (Stratum Design and Ortega Ventures)
- Ship CRO Pack v1 — first 7 skills in staging, targeting May 15 launch
- Hire fractional CFO for 4h/month financial oversight

---

## Ask

Marcus — you mentioned knowing a couple of Series A ops leaders. Would love
a warm intro to anyone managing AI-ops decisions at that stage; that's our
sweet spot and I want to talk to 5 of them this quarter.

Tara — open to 30 min this month to think through our pricing tier structure
before we launch the paid Kodax tier. Would value your read.
```
