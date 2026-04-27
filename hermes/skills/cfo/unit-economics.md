---
name: unit-economics
description: Calculate CAC, LTV, payback period, and gross margin with the math shown — so you can defend the numbers to an investor, not just read them off a dashboard.
version: 1.0.0
trigger:
  - "unit economics"
  - "calculate my CAC"
  - "what's my LTV"
  - "LTV to CAC ratio"
  - "what's my payback period"
  - "gross margin calculation"
  - "unit economics for investors"
  - "how healthy are my unit economics"
  - "CAC payback"
  - "LTV CAC"
integrations:
  - stripe-api
  - vault-sqlite-fts5
inputs:
  - name: quarter
    description: The quarter to calculate for (e.g. "Q1 2026" — defaults to the most recently completed quarter)
    required: false
  - name: sales_and_marketing_spend
    description: Total sales and marketing spend for the quarter in dollars (manual input)
    required: false
  - name: new_customers_acquired
    description: Number of new customers acquired this quarter (manual input if not pulling from Stripe)
    required: false
  - name: arpu
    description: Average revenue per user per month in dollars (manual input — or calculated from Stripe)
    required: false
  - name: gross_margin_pct
    description: Gross margin as a percentage (e.g. 72 for 72%) — manual input required; cannot be inferred from Stripe alone
    required: false
  - name: monthly_churn_rate_pct
    description: Monthly churn rate as a percentage (e.g. 2.5 for 2.5%) — manual input or calculated from Stripe
    required: false
output_artifact: "wiki/unit-economics-YYYY-QN.md"
frequency: on-demand
pack: cfo
---

## When to run

Run this quarterly — not because the numbers change that fast, but because forcing yourself to compute them quarterly catches the drift before it becomes a structural problem. Run it before an investor conversation where you'll be asked about unit economics. Run it when you're considering a price change and need to understand whether you're pricing above or below your cost to serve.

The goal is not to produce a number. The goal is to understand the math well enough to defend it when an investor asks "how did you get there?" — and to spot the assumption that's most likely to be wrong.

## What you'll get

A calculation sheet showing CAC, LTV, LTV:CAC ratio, gross margin, and payback period — with every formula written out and every input labeled. The output is designed to be investor-ready: you can paste the table directly into a data room or deck appendix, and you can answer follow-up questions because the math is transparent.

If the numbers look weak, the output will say so directly and name which input has the most leverage to improve them.

## Steps

1. Determine the quarter. Default to the most recently completed quarter if not provided. Set `QUARTER_START` and `QUARTER_END` date bounds.

2. Pull Stripe data if configured:
   - Fetch all new subscriptions created between `QUARTER_START` and `QUARTER_END`. Count = `new_customers_acquired` (Stripe-sourced).
   - Calculate ARPU: total MRR as of `QUARTER_END` / total active customer count.
   - Calculate monthly churn: customers who churned during the quarter / average active customers during the quarter / 3 months.
   - If Stripe is not configured, use `new_customers_acquired`, `arpu`, and `monthly_churn_rate_pct` inputs. If any are missing, prompt with a placeholder and note what's needed.

3. Pull sales and marketing spend. Check vault for any `financial-summary` pages covering this quarter's months:
   ```
   sqlite3 vault.db "SELECT path, content FROM pages WHERE
   path LIKE 'wiki/financial-summary-%-%.md'
   ORDER BY path DESC LIMIT 3;"
   ```
   Look for a "sales and marketing" or "contractors" line item. Use `sales_and_marketing_spend` input if provided. If neither source has data, leave as `$[enter S&M spend for the quarter]`.

4. Calculate CAC with formula shown:
   ```
   CAC = Total Sales & Marketing Spend / New Customers Acquired
       = $[S&M spend] / [new customers]
       = $[result]
   ```

5. Calculate LTV with formula shown. Use `gross_margin_pct` input — do not infer it from Stripe:
   ```
   LTV = (ARPU × Gross Margin %) / Monthly Churn Rate
       = ($[ARPU] × [GM%]%) / [churn%]%
       = $[result]

   Note: LTV assumes churn stabilizes at the current rate. If churn is still
   declining (early-stage), LTV will look worse than the steady-state value.
   Flag this if monthly churn has moved more than 1 point in the last 3 months.
   ```

6. Calculate LTV:CAC ratio:
   ```
   LTV:CAC = LTV / CAC = $[LTV] / $[CAC] = [ratio]x

   Benchmark context (SaaS):
   - < 1x: pricing or cost structure is broken — each new customer destroys value
   - 1–3x: marginal — survivable, not scalable
   - 3–5x: healthy — fundable, scalable
   - > 5x: strong — or you're underinvesting in growth
   ```

7. Calculate CAC payback period:
   ```
   Payback (months) = CAC / (ARPU × Gross Margin %)
                    = $[CAC] / ($[ARPU] × [GM%]%)
                    = [n] months

   Benchmark context:
   - < 12 months: strong for self-serve SaaS
   - 12–18 months: acceptable for sales-led
   - > 24 months: requires significant capital to grow; high churn risk before payback
   ```

8. Calculate gross margin explicitly:
   ```
   Gross Margin % = (Revenue − COGS) / Revenue × 100
                  = [GM%]% (input provided)

   COGS for SaaS typically includes: hosting, third-party APIs, support costs
   directly tied to delivering the product. Does NOT include sales, marketing,
   or G&A. If your GM% includes those, the LTV calculation above is overstated.
   ```

9. Assess the weakest assumption. Identify which single input, if wrong by 20%, most changes the conclusion. Note it explicitly: "The number most likely to be wrong is [X]. Here's why and how to validate it."

10. Save to `wiki/unit-economics-YYYY-QN.md`.

## Output format

```yaml
---
type: wiki
title: "Unit Economics — [Quarter YYYY]"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: draft
tags: [unit-economics, cfo, quarterly, investor-ready]
sources: [stripe, vault-financial-summary, manual-input]
quarter: YYYY-QN
cac: [number or null]
ltv: [number or null]
ltv_cac_ratio: [number or null]
payback_months: [number or null]
gross_margin_pct: [number or null]
arpu: [number or null]
monthly_churn_pct: [number or null]
---
```

```markdown
# Unit Economics — [Quarter YYYY]

> Calculated [YYYY-MM-DD]. Inputs: [Stripe API / manual]. Review before sharing externally.

## Inputs Used

| Input | Value | Source |
|-------|-------|--------|
| Sales & Marketing Spend (quarter) | $[x] | [source] |
| New Customers Acquired (quarter) | [n] | [source] |
| ARPU (monthly) | $[x] | [source] |
| Gross Margin % | [x]% | manual input |
| Monthly Churn Rate | [x]% | [source] |

## Calculations

### CAC
[formula with numbers]

### LTV
[formula with numbers]

### LTV:CAC Ratio
[formula with numbers + benchmark context]

### CAC Payback Period
[formula with numbers + benchmark context]

### Gross Margin
[formula with numbers + definition note]

## Summary Table

| Metric | Value | Benchmark (SaaS) | Status |
|--------|-------|-----------------|--------|
| CAC | $[x] | varies | |
| LTV | $[x] | varies | |
| LTV:CAC | [x]x | 3–5x healthy | [flag] |
| Payback | [n] mo | <12 mo strong | [flag] |
| Gross Margin | [x]% | 70–80% SaaS | [flag] |

## Weakest Assumption
[Name the input most likely to be wrong and how to validate it.]

## What This Means for the Next Decision
[One forward-looking implication — pricing, spend, or retention — based on the numbers.]
```

## Example output (truncated)

```markdown
# Unit Economics — Q1 2026

> Calculated 2026-04-05. Inputs: Stripe (ARPU, churn), manual (S&M spend, gross margin).

## Inputs Used

| Input | Value | Source |
|-------|-------|--------|
| Sales & Marketing Spend (Q1) | $9,200 | Manual (contractor + LinkedIn ads) |
| New Customers Acquired (Q1) | 6 | Stripe |
| ARPU (monthly) | $2,226 | Stripe (MRR $26,800 / 12 customers) |
| Gross Margin % | 74% | Manual |
| Monthly Churn Rate | 1.4% | Stripe |

## Calculations

### CAC
CAC = $9,200 / 6 = **$1,533**

### LTV
LTV = ($2,226 × 74%) / 1.4% = $1,647 / 0.014 = **$117,643**

### LTV:CAC Ratio
$117,643 / $1,533 = **76.7x**
> This is an outlier — LTV:CAC above 20x at early stage almost always reflects
> either a very low churn rate (which may not hold) or underinvestment in growth.
> Your 1.4% monthly churn is genuinely strong; the ratio is real, not a math error.

### CAC Payback Period
$1,533 / ($2,226 × 74%) = $1,533 / $1,647 = **0.9 months**

## Weakest Assumption
Monthly churn at 1.4% with 12 customers is statistically thin — one churned customer
moves this to 9.7%, which cuts LTV from $117K to $17K. Validate by tracking cohort
retention through Q2 before using these numbers in a pitch deck.
```
