---
name: runway-scenario-model
description: Take current MRR, monthly burn, and cash balance — produce three runway scenarios (flat, 10% MoM growth, 20% MoM growth) in a table you can defend to an investor or a co-founder.
version: 1.0.0
trigger:
  - "runway model"
  - "how much runway do I have"
  - "runway scenarios"
  - "model my runway"
  - "when do I run out of money"
  - "runway if we grow"
  - "cash runway"
  - "burn and runway"
  - "runway scenario"
  - "how long can I go without raising"
integrations:
  - stripe-api
  - vault-sqlite-fts5
inputs:
  - name: current_mrr
    description: Current MRR in dollars (manual input — or pulled from Stripe if configured)
    required: false
  - name: monthly_burn
    description: Total monthly operating expenses in dollars
    required: true
  - name: cash_balance
    description: Current cash in the bank in dollars
    required: true
  - name: growth_assumption_note
    description: Optional context on why you're using these growth rates — e.g. "last 3 months averaged 8% MoM" (used in the output notes)
    required: false
output_artifact: "wiki/runway-model-YYYY-MM.md"
frequency: on-demand
pack: cfo
---

## When to run

Run this before any major spending decision — a new hire, a tool, a conference, a paid channel. Run it before a fundraising conversation so you know how much time you're actually negotiating from. Run it when MRR growth has been inconsistent and you want to see what the range of outcomes looks like on paper rather than in your head.

Most founders carry a single runway number in their head — the flat scenario. That number is almost always too optimistic (you assume costs stay flat) and too pessimistic (you ignore compounding revenue). This model runs all three scenarios simultaneously so you can see the spread, not just the median.

## What you'll get

A three-scenario runway table: flat MRR (worst case — revenue doesn't grow), 10% MoM growth (moderate — roughly 3x ARR in a year), and 20% MoM growth (strong — roughly 8x ARR in a year). Each scenario shows MRR at months 3, 6, 9, and 12, cumulative revenue, cumulative burn, and remaining cash. The table is simple enough to put in a slide deck or share in a Telegram message.

## Steps

1. Pull current MRR. If Stripe is configured, fetch total MRR from active subscriptions as of today. If not, use `current_mrr` input. If neither is available, check the vault:
   ```
   sqlite3 vault.db "SELECT content FROM pages WHERE path LIKE 'wiki/financial-summary-%.md'
   ORDER BY path DESC LIMIT 1;"
   ```
   Extract MRR from frontmatter. If no source has MRR, prompt for it.

2. Confirm monthly burn and cash balance from inputs. These are required — the model cannot run without them.

3. Check the vault for recent growth rate history to provide context:
   ```
   sqlite3 vault.db "SELECT path, content FROM pages WHERE path LIKE 'wiki/financial-summary-%.md'
   ORDER BY path DESC LIMIT 4;"
   ```
   Extract MRR from the last 3–4 months. Calculate the actual trailing MoM growth rate. Report it alongside the three scenarios so the founder can see how the assumptions compare to recent actuals.

4. Run the flat scenario. For each month 1–12:
   - MRR stays constant at `current_mrr`
   - Cumulative revenue += `current_mrr` each month
   - Cumulative burn += `monthly_burn` each month
   - Remaining cash = `cash_balance` + cumulative revenue − cumulative burn
   - Flag the month where remaining cash first goes negative — that is the runway endpoint.

5. Run the 10% MoM growth scenario. For each month 1–12:
   - MRR(month n) = current_mrr × (1.10)^n
   - Cumulative revenue is the sum of monthly MRR values through month n
   - Cumulative burn += `monthly_burn` each month (assume burn stays flat unless growth assumption note suggests otherwise)
   - Remaining cash = `cash_balance` + cumulative revenue − cumulative burn
   - Flag the month where remaining cash goes negative, or note "Does not go negative in 12-month window."

6. Run the 20% MoM growth scenario. Same method as step 5 with 1.20 growth factor.

7. Build the summary tables. Two tables:
   - **Table 1:** MRR at months 3, 6, 9, 12 across all three scenarios.
   - **Table 2:** Remaining cash at months 3, 6, 9, 12 across all three scenarios. Highlight in the output text (not formatting — just prose) where each scenario runs out of cash, or that it doesn't in the 12-month window.

8. Calculate the growth rate needed to reach profitability (MRR = burn) and the month that happens in each scenario:
   ```
   MRR breakeven = monthly_burn
   Months to breakeven (10% growth) = log(burn / current_mrr) / log(1.10)
   Months to breakeven (20% growth) = log(burn / current_mrr) / log(1.20)
   ```
   If current MRR already exceeds burn, flag it: "You are already profitable at current MRR — burn is covered without growth."

9. Note any assumptions that most change the output. The two that matter most:
   - Burn staying flat: if you hire or add a major tool, what does that do to the model?
   - Growth rate being consistent: MoM growth is rarely smooth — note the variance if you have historical data from step 3.

10. Save to `wiki/runway-model-YYYY-MM.md`. Add a `See also` link in the most recent financial summary and investor metrics pages if they exist.

## Output format

```yaml
---
type: wiki
title: "Runway Model — [Month YYYY]"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: draft
tags: [runway, cfo, scenario-model, cash]
sources: [stripe, vault-financial-summary, manual-input]
model_date: YYYY-MM-DD
current_mrr: [number]
monthly_burn: [number]
cash_balance: [number]
runway_flat_months: [number]
runway_10pct_months: [number or "12+"]
runway_20pct_months: [number or "12+"]
---
```

```markdown
# Runway Model — [Month YYYY]

> Modeled [YYYY-MM-DD].
> Inputs: MRR $[x] | Burn $[x]/mo | Cash $[x]
> [growth_assumption_note if provided]
> Trailing actual MoM growth (last 3 months): [x]% — context for the scenarios below.

## Scenario Assumptions

| Scenario | MRR Growth Rate | Burn Assumption |
|----------|----------------|-----------------|
| Flat | 0% MoM | $[burn]/mo fixed |
| Moderate | 10% MoM | $[burn]/mo fixed |
| Strong | 20% MoM | $[burn]/mo fixed |

## MRR Projection

| Month | Flat MRR | 10% Growth MRR | 20% Growth MRR |
|-------|----------|----------------|----------------|
| Now | $[x] | $[x] | $[x] |
| Month 3 | $[x] | $[x] | $[x] |
| Month 6 | $[x] | $[x] | $[x] |
| Month 9 | $[x] | $[x] | $[x] |
| Month 12 | $[x] | $[x] | $[x] |

## Cash Remaining

| Month | Flat | 10% Growth | 20% Growth |
|-------|------|------------|------------|
| Month 3 | $[x] | $[x] | $[x] |
| Month 6 | $[x] | $[x] | $[x] |
| Month 9 | $[x] | $[x] | $[x] |
| Month 12 | $[x] | $[x] | $[x] |

## Runway Summary

| Scenario | Months of Runway | Runway End |
|----------|-----------------|------------|
| Flat | [n] months | [Month YYYY] |
| 10% MoM growth | [n] months or 12+ | [Month YYYY or "Beyond Dec YYYY"] |
| 20% MoM growth | [n] months or 12+ | [Month YYYY or "Beyond Dec YYYY"] |

## Breakeven (MRR = Burn)

At $[burn]/mo burn and $[mrr] current MRR:
- Flat: MRR never reaches burn — gap is $[burn - mrr]/mo
- 10% growth: Breakeven at month [n] ([Month YYYY])
- 20% growth: Breakeven at month [n] ([Month YYYY])

## Key Assumptions to Stress-Test
1. **Burn stays flat.** If you add a $[x]/mo hire next month, flat runway drops to [n] months.
2. **Growth is consistent.** Trailing 3-month growth has ranged [low]–[high]% MoM.
   [Scenario closest to actual trailing growth] is the most realistic baseline.

## Decision Prompt
[One question this model raises for the next 30 days — e.g., "At flat growth, runway is under 6 months. What's the fastest path to one more deal that extends that runway by 30 days?"]
```

## Example output (truncated)

```markdown
# Runway Model — April 2026

> Modeled 2026-04-26.
> Inputs: MRR $31,200 | Burn $18,600/mo | Cash $142,000
> Trailing actual MoM growth (last 3 months): avg 12.4% MoM.

## MRR Projection

| Month | Flat MRR | 10% Growth MRR | 20% Growth MRR |
|-------|----------|----------------|----------------|
| Now | $31,200 | $31,200 | $31,200 |
| Month 3 | $31,200 | $41,554 | $53,914 |
| Month 6 | $31,200 | $55,320 | $93,240 |
| Month 9 | $31,200 | $73,661 | $161,320 |
| Month 12 | $31,200 | $98,080 | $279,000 |

## Runway Summary

| Scenario | Months of Runway | Runway End |
|----------|-----------------|------------|
| Flat | 11.6 months | Apr 2027 |
| 10% MoM growth | 12+ months | Beyond Apr 2027 |
| 20% MoM growth | 12+ months | Beyond Apr 2027 |

## Breakeven (MRR = Burn)

At $18,600/mo burn and $31,200 current MRR — you are already profitable.
MRR covers burn with $12,600/mo net positive. This model is about extending
cash runway, not reaching breakeven.

## Decision Prompt
Flat runway is 11.6 months — comfortable. The real question is whether to deploy
the $142K cash into growth (hire, paid acquisition) or hold it as a safety buffer.
At 10% MoM, you never touch the cash reserve. At flat growth, you deplete it in
under a year. The growth assumption matters more than the cash balance here.
```
