---
name: investor-metrics-package
description: Pull ARR, MRR, NRR, churn, CAC payback, burn multiple, and runway into investor-standard format — the data layer that feeds the CEO Pack's investor update draft.
version: 1.0.0
trigger:
  - "investor metrics"
  - "investor metrics package"
  - "pull my SaaS metrics"
  - "ARR MRR NRR"
  - "investor-ready metrics"
  - "metrics for investors"
  - "SaaS metrics package"
  - "monthly metrics"
  - "burn multiple"
  - "NRR calculation"
integrations:
  - stripe-api
  - vault-sqlite-fts5
inputs:
  - name: as_of_date
    description: The date the metrics snapshot is as of (defaults to yesterday — end of the most recently completed month)
    required: false
  - name: cash_balance
    description: Current cash balance in dollars (manual input required — not available from Stripe)
    required: false
  - name: monthly_burn
    description: Total monthly operating expenses in dollars (manual input or pulled from vault financial summary)
    required: false
  - name: net_new_mrr_from_expansions
    description: MRR added from existing customers upgrading this month (manual input — Stripe does not always surface this cleanly)
    required: false
output_artifact: "wiki/investor-metrics-YYYY-MM.md"
frequency: on-demand
pack: cfo
---

## When to run

Run monthly, typically on the 1st–3rd of the month after close. Run it before drafting an investor update (the CEO Pack's `investor-update-draft` skill reads from this file rather than asking you to re-enter numbers). Run it before any investor conversation where you'll be asked to walk through the metrics.

This skill produces the data layer. The narrative goes in the investor update. Keep them separate — investors who receive a metrics package alongside a narrative can validate independently. That builds trust faster than a narrative-only update.

## What you'll get

A clean metrics snapshot in investor-standard format: ARR, MRR, MoM MRR growth, NRR, gross and net churn, CAC payback (from the most recent unit economics calculation), burn multiple, and runway. Each metric includes a one-line definition so any investor reading the package knows exactly how you computed it — no assumptions required.

## Steps

1. Determine the reporting period. Default `as_of_date` to the last day of the previous calendar month. Set `MONTH_START` and `MONTH_END`.

2. Pull MRR from Stripe if configured:
   - Fetch all active subscriptions as of `MONTH_END`. Sum their monthly amounts.
   - MRR (current) = sum of monthly subscription revenue from active subscribers.
   - MRR (prior month) = same calculation as of the last day of the prior month.
   - MoM growth % = (MRR current - MRR prior) / MRR prior × 100.
   - ARR = MRR current × 12.
   - If Stripe is not configured, check for a financial summary in the vault:
     ```
     sqlite3 vault.db "SELECT content FROM pages WHERE path = 'wiki/financial-summary-<YYYY-MM>.md';"
     ```
     Extract MRR from it. If neither source has data, leave placeholders.

3. Calculate net revenue retention (NRR). NRR requires three components:
   - Starting MRR (beginning of month, from existing customers only — new logos excluded)
   - Expansion MRR (upgrades from existing customers this month) — use `net_new_mrr_from_expansions` input
   - Churned MRR (from customers who cancelled) — pull from Stripe subscription cancellations during the month
   ```
   NRR = (Starting MRR + Expansion MRR - Churned MRR) / Starting MRR × 100

   Note: If you have fewer than 20 customers, monthly NRR will be noisy.
   Report trailing 3-month NRR if monthly is misleading: flag this in the output.
   ```

4. Calculate churn:
   - Gross MRR churn % = Churned MRR / Starting MRR × 100
   - Logo churn % = Customers who churned / Active customers at start of month × 100
   - Pull churned subscriptions from Stripe for the month period.

5. Pull CAC payback from the most recent unit economics page:
   ```
   sqlite3 vault.db "SELECT path, content FROM pages WHERE path LIKE 'wiki/unit-economics-%.md'
   ORDER BY updated DESC LIMIT 1;"
   ```
   Extract the `payback_months` frontmatter value. If no unit economics page exists, leave CAC payback as `[run unit-economics skill first]`.

6. Calculate burn multiple if burn and net new ARR are available:
   ```
   Burn Multiple = Net Cash Burn / Net New ARR

   Net Cash Burn = monthly_burn (input or from vault financial summary)
   Net New ARR = (MRR current - MRR prior) × 12

   Benchmark context:
   - < 1x: exceptional capital efficiency
   - 1–1.5x: good
   - 1.5–2x: acceptable early-stage
   - > 2x: burning fast relative to growth — needs attention
   ```

7. Calculate runway:
   ```
   Runway (months) = Cash Balance / Monthly Burn
   ```
   Use `cash_balance` input. If not provided, check the vault:
   ```
   sqlite3 vault.db "SELECT content FROM pages WHERE path LIKE 'wiki/financial-summary-%.md'
   ORDER BY path DESC LIMIT 1;"
   ```
   Extract cash_balance from frontmatter if available.

8. Pull customer count metrics from Stripe:
   - Total active customers (paying subscribers) as of `MONTH_END`
   - New customers added this month
   - Churned customers this month

9. Assemble the package. Do not editorialize. Present the numbers with definitions, no spin. If a metric looks bad, report it accurately — omitting it from an investor package is worse than a bad number.

10. Save to `wiki/investor-metrics-YYYY-MM.md`. Link from the financial summary if it exists: add a `See also: [[wiki/investor-metrics-YYYY-MM]]` line to the financial summary page.

## Output format

```yaml
---
type: wiki
title: "Investor Metrics — [Month YYYY]"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: draft
tags: [investor-metrics, cfo, monthly, saas-metrics]
sources: [stripe, vault-financial-summary, manual-input]
reporting_month: YYYY-MM
mrr: [number or null]
arr: [number or null]
mom_mrr_growth_pct: [number or null]
nrr_pct: [number or null]
gross_churn_pct: [number or null]
logo_churn_pct: [number or null]
cac_payback_months: [number or null]
burn_multiple: [number or null]
runway_months: [number or null]
total_customers: [number or null]
---
```

```markdown
# Investor Metrics — [Month Year]

> Snapshot as of [YYYY-MM-DD]. Sources: [Stripe API / vault / manual input].
> Definitions follow each metric — do not assume investor uses the same formula.

## Revenue

| Metric | Value | Definition |
|--------|-------|------------|
| MRR | $[x] | Monthly recurring revenue from active subscriptions |
| ARR | $[x] | MRR × 12 |
| MoM MRR Growth | [x]% | (This month MRR − last month MRR) / last month MRR |
| Net Revenue Retention | [x]% | (Starting MRR + Expansions − Churn) / Starting MRR |

## Customers

| Metric | Value |
|--------|-------|
| Total Active Customers | [n] |
| New Customers (this month) | [n] |
| Churned Customers (this month) | [n] |

## Churn

| Metric | Value | Definition |
|--------|-------|------------|
| Gross MRR Churn | [x]% | Churned MRR / Starting MRR |
| Logo Churn | [x]% | Churned customers / Starting customer count |

## Efficiency

| Metric | Value | Benchmark |
|--------|-------|-----------|
| CAC Payback | [n] months | <12 mo strong (self-serve SaaS) |
| Burn Multiple | [x]x | <1.5x good early-stage |
| Runway | [n] months | |

## Month-over-Month Summary

| Metric | This Month | Last Month | Change |
|--------|-----------|------------|--------|
| MRR | $[x] | $[y] | [+/-z%] |
| Customers | [n] | [n-1] | [+/-] |
| Runway | [n] mo | [n-1] mo | |

## Notes
[Flag any metrics that are estimated, noisy due to sample size, or that use a non-standard definition.]
```

## Example output (truncated)

```markdown
# Investor Metrics — April 2026

> Snapshot as of 2026-04-30. Sources: Stripe API, vault financial-summary-2026-04, manual (cash balance, burn).

## Revenue

| Metric | Value | Definition |
|--------|-------|------------|
| MRR | $31,200 | Monthly recurring revenue from active subscriptions |
| ARR | $374,400 | MRR × 12 |
| MoM MRR Growth | +16.4% | ($31,200 − $26,800) / $26,800 |
| Net Revenue Retention | 108% | ($26,800 + $2,400 expansion − $0 churn) / $26,800 |

## Customers

| Metric | Value |
|--------|-------|
| Total Active Customers | 14 |
| New Customers (April) | 2 |
| Churned Customers (April) | 0 |

## Efficiency

| Metric | Value | Benchmark |
|--------|-------|-----------|
| CAC Payback | 0.9 months | <12 mo strong |
| Burn Multiple | 0.32x | <1.5x good |
| Runway | 7.6 months | |

## Notes
NRR of 108% is based on 14 active customers — statistically thin. One churn event
next month moves this to ~93%. Report trailing 3-month NRR in investor conversations
until customer count exceeds 30.
```
