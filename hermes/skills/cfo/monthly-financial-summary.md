---
name: monthly-financial-summary
description: Pull this month's revenue, expenses, net, and runway vs. last month into a single 1-page brief you can act on.
version: 1.0.0
trigger:
  - "monthly financial summary"
  - "run my financial summary"
  - "how did we do this month financially"
  - "what's my burn this month"
  - "financial close"
  - "P&L summary"
  - "revenue and expenses this month"
  - "what's my runway"
  - "show me my numbers"
integrations:
  - stripe-api
  - vault-sqlite-fts5
inputs:
  - name: month
    description: The month to summarize (e.g. "April 2026" — defaults to the previous calendar month)
    required: false
  - name: cash_balance
    description: Current cash balance in dollars (manual input — pull from your bank if Stripe doesn't cover it)
    required: false
  - name: monthly_burn
    description: Total monthly operating expenses in dollars (manual input if not tracked in journal)
    required: false
output_artifact: "wiki/financial-summary-YYYY-MM.md"
frequency: "cron:0 8 1 * *"
pack: cfo
---

## When to run

Run on the first of every month, or whenever you need to know where you stand before making a spending or hiring decision. The instinct to avoid this brief is the instinct that causes late-stage surprises — the month you discover burn is 30% above plan is never the month you ran this skill on schedule.

This brief is not a performance review. It's a navigation instrument. You're not reliving last month; you're calibrating what you can afford to do next month.

## What you'll get

A one-page financial brief with four numbers that matter: revenue, expenses, net, and runway in months. Compared to last month so you can see the direction, not just the position. Saved to the vault so the investor-metrics-package and runway-scenario-model skills can read it without asking you to re-enter data.

## Steps

1. Determine the reporting month. Default to the previous calendar month if `month` is not provided. Set `FIRST_OF_MONTH` and `LAST_OF_MONTH` as date bounds.

2. Pull revenue from Stripe. If the Stripe MCP integration is configured:
   - Fetch all charges and subscriptions created between `FIRST_OF_MONTH` and `LAST_OF_MONTH`.
   - Sum gross revenue. Calculate MRR from active subscriptions as of `LAST_OF_MONTH`.
   - Pull the same figures for the prior month for delta calculation.
   - If Stripe is not configured, check for a manual entry: `sqlite3 vault.db "SELECT content FROM pages WHERE path LIKE 'journal/%-financial-log%' AND date >= '<FIRST_OF_MONTH>' AND date <= '<LAST_OF_MONTH>' ORDER BY date DESC LIMIT 5;"`. Parse out any revenue figures.
   - If neither source has data, leave `MRR: $[enter]` and `Gross Revenue: $[enter]` as placeholders.

3. Pull expense data. Query the vault for journal entries tagged `financial-log` or containing expense-related keywords:
   ```
   sqlite3 vault.db "SELECT path, content FROM pages WHERE
   pages MATCH 'expense OR spend OR subscription OR invoice OR payment'
   AND date >= '<FIRST_OF_MONTH>' AND date <= '<LAST_OF_MONTH>'
   ORDER BY date DESC LIMIT 10;"
   ```
   Also check for any `wiki/expense-audit-*.md` from this month — if it exists, pull the monthly run-rate total from it rather than re-computing.

4. Use `monthly_burn` input if provided and no expense data is in the vault. If no source has expenses, leave `Total Expenses: $[enter]` as a placeholder.

5. Compute net. `Net = Gross Revenue − Total Expenses`. If either is a placeholder, mark net as `$[calculate after filling in placeholders]`.

6. Compute runway. `Runway (months) = Cash Balance / Monthly Burn`. Use `cash_balance` and `monthly_burn` inputs. If not provided, check the vault for the most recent financial-log entry with a cash balance figure. If unavailable, leave `Runway: [enter cash balance] ÷ [monthly burn]`.

7. Pull prior month delta. Check for `wiki/financial-summary-<PRIOR_MONTH>.md` in the vault:
   ```
   sqlite3 vault.db "SELECT content FROM pages WHERE path = 'wiki/financial-summary-<PRIOR-YYYY-MM>.md';"
   ```
   If found, extract MRR, expenses, and runway for the comparison row. If not found, mark prior month as `—`.

8. Draft the brief. Lead with the headline number: is MRR up or down vs. last month? What is net — profitable, breakeven, or burning? How many months of runway at current burn?

9. Add a single "Decision prompt" at the bottom: one question the numbers raise for the next 30 days. Example: "Burn is $2,400 above MRR — is there one expense to cut before month-end, or do you need to close one more deal?" Do not editorialize beyond this.

10. Save to `wiki/financial-summary-YYYY-MM.md` where YYYY-MM is the reporting month.

## Output format

```yaml
---
type: wiki
title: "Financial Summary — [Month YYYY]"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: draft
tags: [financial-summary, cfo, monthly]
sources: [stripe, vault-journal]
reporting_month: YYYY-MM
mrr: [number or null]
gross_revenue: [number or null]
total_expenses: [number or null]
net: [number or null]
cash_balance: [number or null]
runway_months: [number or null]
---
```

```markdown
# Financial Summary — [Month Year]

> Generated [YYYY-MM-DD]. Sources: [Stripe API / journal financial-log / manual input].

## The Numbers

| Metric | This Month | Last Month | Change |
|--------|-----------|------------|--------|
| MRR | $[x] | $[y] | [+/-z%] |
| Gross Revenue | $[x] | $[y] | [+/-z%] |
| Total Expenses | $[x] | $[y] | [+/-z%] |
| Net | $[x] | $[y] | |
| Cash Balance | $[x] | — | |
| Runway (months) | [n] | [n-1] | |

## Revenue Breakdown
- Subscriptions: $[x] ([n] active)
- One-time / project: $[x]
- Refunds / chargebacks: -$[x]

## Expense Breakdown
- SaaS subscriptions: $[x]
- Contractors / payroll: $[x]
- Infrastructure: $[x]
- Other: $[x]

## Decision Prompt
[One question the numbers raise for the next 30 days.]

## Notes
[Any anomalies, one-time items, or missing data sources — flagged so you know what to verify.]
```

## Example output (truncated)

```markdown
# Financial Summary — April 2026

> Generated 2026-05-01. Sources: Stripe API, journal financial-log (Apr 3, Apr 28 entries).

## The Numbers

| Metric | This Month | Last Month | Change |
|--------|-----------|------------|--------|
| MRR | $31,200 | $26,800 | +16.4% |
| Gross Revenue | $33,400 | $28,100 | +18.9% |
| Total Expenses | $18,600 | $17,200 | +8.1% |
| Net | $14,800 | $10,900 | +35.8% |
| Cash Balance | $142,000 | — | |
| Runway (months) | 7.6 | — | |

## Revenue Breakdown
- Subscriptions: $31,200 (14 active)
- One-time / project: $2,200
- Refunds / chargebacks: $0

## Expense Breakdown
- SaaS subscriptions: $3,200
- Contractors / payroll: $11,400
- Infrastructure: $1,800
- Other: $2,200

## Decision Prompt
Runway is 7.6 months at current burn. MRR growth is strong (+16%), but burn grew
too (SaaS + contractor costs up $1.4K vs. last month). Before adding a contractor
next month, confirm which existing subscriptions can be cut from the expense audit.
```
