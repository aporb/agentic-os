---
name: tax-prep-data-pull
description: At year-end, organize income from Stripe, deductible expenses from Gmail receipts and the vault, and contractor 1099 data into a structured document your CPA can ingest without a two-hour call.
version: 1.0.0
trigger:
  - "tax prep"
  - "tax preparation"
  - "pull my tax data"
  - "organize for my CPA"
  - "year-end tax"
  - "1099 data"
  - "tax document pull"
  - "expenses for taxes"
  - "business income and expenses"
  - "prepare tax information"
  - "what do I owe the CPA"
integrations:
  - stripe-api
  - gmail-search
  - vault-sqlite-fts5
inputs:
  - name: tax_year
    description: The tax year to pull data for (e.g. "2025" — defaults to the prior calendar year)
    required: false
  - name: business_entity_type
    description: Business structure — e.g. "LLC (sole member)", "S-Corp", "C-Corp", "sole proprietor" — affects which expenses are deductible
    required: false
  - name: state
    description: State of incorporation or primary business operations — e.g. "California" — for state tax context
    required: false
  - name: contractor_list
    description: Manual list of contractors paid during the year (name, total paid, payment method) — paste if not tracked in vault
    required: false
output_artifact: "wiki/tax-prep-[year].md"
frequency: "cron:0 9 2 1 *"
pack: cfo
---

## When to run

Run this in January, after the tax year closes and before your CPA starts asking for documents. The goal is to arrive at your CPA meeting with a structured summary rather than a shoebox of receipts and a Stripe login. Sending your CPA a clean document reduces their time, which reduces your bill, and removes the three-week back-and-forth that delays your filing.

This skill organizes your data — it does not do your taxes. It does not give tax advice. Everything it produces should be reviewed by a licensed CPA or tax professional before filing.

## What you'll get

A structured year-end document covering: total gross income from Stripe, categorized deductible expenses from Gmail receipts and vault journal entries, contractor payments flagged for 1099 reporting, and a list of what's missing or needs CPA clarification. The document is formatted so a CPA can scan it in 10 minutes and know what to ask about.

## Steps

1. Determine the tax year. Default to the previous calendar year if not provided. Set `YEAR_START` (Jan 1) and `YEAR_END` (Dec 31).

2. Pull gross income from Stripe (if configured):
   - Fetch all charges created between `YEAR_START` and `YEAR_END`.
   - Sum: total gross charges, total refunds, net revenue.
   - Also fetch: total Stripe fees paid during the year (these are deductible as a cost of revenue).
   - Break down by month for the income schedule.
   - Note: Stripe sends a 1099-K if gross payments exceed $600 (as of 2024 IRS rules). Flag this if applicable.
   - If Stripe is not configured, check the vault for all financial summary pages for the year:
     ```
     sqlite3 vault.db "SELECT path, content FROM pages WHERE path LIKE 'wiki/financial-summary-[year]-%.md'
     ORDER BY path ASC;"
     ```
     Sum gross_revenue values from frontmatter across all months. Flag any months with missing summaries.

3. Pull deductible expense data. Run three passes:

   **Pass 1 — Gmail receipts (if configured):**
   Search Gmail: `from:(receipt OR billing OR invoice OR noreply) subject:(receipt OR invoice OR payment) after:[YEAR_START] before:[YEAR_END]`
   For each receipt: extract vendor name, amount, date. Categorize by deduction type (see step 5).

   **Pass 2 — Vault financial-log entries:**
   ```
   sqlite3 vault.db "SELECT path, content FROM pages WHERE
   pages MATCH 'expense OR payment OR invoice OR receipt OR subscription'
   AND date >= '[YEAR_START]' AND date <= '[YEAR_END]'
   ORDER BY date ASC;"
   ```
   Extract any expense entries not captured by Gmail.

   **Pass 3 — Vault expense audit pages:**
   ```
   sqlite3 vault.db "SELECT path, content FROM pages WHERE path LIKE 'wiki/expense-audit-[year]-%.md'
   ORDER BY path ASC;"
   ```
   Pull monthly run-rate totals and subscription lists from any expense audits run during the year.

4. Deduplicate expenses. If the same charge appears in Gmail and a vault entry, keep one and mark it confirmed. Flag any duplicate candidates for manual review.

5. Categorize expenses by deduction type. Common categories for a software/SaaS solo founder:
   - **Software subscriptions** — tools used in the business (fully deductible)
   - **Cloud infrastructure / hosting** — servers, databases, CDNs (fully deductible)
   - **AI / LLM API costs** — directly deductible as cost of goods or business expense
   - **Marketing and advertising** — paid ads, newsletter tools, SEO tools (fully deductible)
   - **Professional services** — accountant, attorney, fractional CFO fees (fully deductible)
   - **Contractor payments** — flagged separately for 1099 reporting
   - **Home office** — if applicable; flag for CPA to assess (requires dedicated space rule)
   - **Travel and meals** — if applicable; flag for CPA (meals are 50% deductible, travel 100% if business-only)
   - **Education and training** — courses, books, conferences (deductible if directly related to business)
   - **Bank and payment fees** — Stripe fees, wire fees, Mercury/Brex fees (fully deductible)

6. Identify contractor payments for 1099 reporting. Pull from:
   - `contractor_list` input if provided.
   - Gmail: search for payment confirmations to individuals (Venmo, PayPal, Wise, bank transfer confirmations).
   - Vault: `sqlite3 vault.db "SELECT content FROM pages WHERE pages MATCH 'contractor OR freelance OR 1099' AND date >= '[YEAR_START]' AND date <= '[YEAR_END]';"`.
   For any contractor paid more than $600 during the year via non-credit-card methods, flag as "likely 1099-NEC required." Note: payments via credit card (Stripe, Square) are reported by the payment processor — your business does not issue a 1099 for those.

7. Flag what's missing. Review the coverage:
   - Are all 12 months of income accounted for?
   - Are there months where expenses are zero or look anomalously low?
   - Are there contractors flagged for 1099 who don't have a confirmed address or SSN/EIN in the vault?
   - Are there major expense categories with no receipts (e.g., subscriptions paid by credit card not captured by Gmail)?
   List each gap explicitly so the CPA knows what to ask about, not just what you provided.

8. Add a CPA briefing section. Two paragraphs: (1) what the data covers and what it doesn't, (2) the three questions most likely to come up in a CPA review. Keep this factual — no tax advice. Example: "Home office: I worked from a dedicated room in my home for the full year. CPA to assess eligibility and method."

9. Save to `wiki/tax-prep-[year].md`.

## Output format

```yaml
---
type: wiki
title: "Tax Prep — [Year]"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: draft
tags: [tax-prep, cfo, annual, [year]]
sources: [stripe, gmail-receipts, vault-financial-log]
tax_year: [year]
business_entity: "[entity type or null]"
state: "[state or null]"
gross_income: [number or null]
total_deductible_expenses: [number or null]
contractor_1099_count: [number]
---
```

```markdown
# Tax Prep — [Year]

> Prepared [YYYY-MM-DD]. Tax year: [Year].
> Entity: [type] | State: [state]
> **THIS IS A WORKING DOCUMENT — review with your CPA before filing.**

## Income Summary

| Month | Gross Revenue | Refunds | Net Revenue | Source |
|-------|--------------|---------|-------------|--------|
| January | $[x] | $[x] | $[x] | [Stripe / vault] |
| ... | | | | |
| **Total** | **$[x]** | **$[x]** | **$[x]** | |

Stripe fees paid (deductible): $[x]
Stripe 1099-K: [Yes — threshold met / No / Unknown]

## Deductible Expenses

### By Category

| Category | Annual Total | Notes |
|----------|-------------|-------|
| Software subscriptions | $[x] | [n] tools |
| Cloud infrastructure | $[x] | |
| AI / LLM costs | $[x] | |
| Marketing / advertising | $[x] | |
| Professional services | $[x] | CPA, legal |
| Contractor payments | $[x] | See 1099 section |
| Bank / payment fees | $[x] | Stripe fees included |
| [Other categories] | $[x] | |
| **Total** | **$[x]** | |

### Full Expense List
[Itemized list: date, vendor, amount, category, source]

## Contractor Payments — 1099 Review

| Name | Total Paid | Payment Method | 1099-NEC Required? |
|------|-----------|----------------|-------------------|
| [name] | $[x] | [method] | [Yes / No / Verify] |

*1099-NEC required for non-corporate contractors paid >$600 via non-credit-card methods.*

## What's Missing / Needs CPA Review

- [Gap 1 — e.g., "March income not in vault — confirm against bank statement"]
- [Gap 2 — e.g., "Home office deduction — worked from dedicated space, CPA to assess"]
- [Gap 3 — e.g., "2 contractors missing SSN/EIN — collect before Jan 31 deadline"]

## CPA Briefing

[Paragraph 1: What this document covers and what sources were used.]

[Paragraph 2: The 3 most likely questions a CPA will ask based on this data.]
```

## Example output (truncated)

```markdown
# Tax Prep — 2025

> Prepared 2026-01-03. Tax year: 2025.
> Entity: LLC (sole member) | State: Virginia
> **THIS IS A WORKING DOCUMENT — review with your CPA before filing.**

## Income Summary

| Month | Gross Revenue | Refunds | Net Revenue | Source |
|-------|--------------|---------|-------------|--------|
| January | $12,400 | $0 | $12,400 | Stripe |
| February | $14,800 | $200 | $14,600 | Stripe |
| ...
| **Total** | **$261,300** | **$1,400** | **$259,900** | |

Stripe fees paid (deductible): $8,240
Stripe 1099-K: Yes — gross payments exceeded $600 threshold.

## Contractor Payments — 1099 Review

| Name | Total Paid | Payment Method | 1099-NEC Required? |
|------|-----------|----------------|-------------------|
| Jordan Chen | $14,400 | Wise (bank transfer) | Yes — collect W-9 |
| Rahul Mehta | $8,200 | Venmo | Yes — collect W-9 |
| Apex Dev Studio LLC | $6,000 | ACH | No — corporation exempt |

## What's Missing / Needs CPA Review

- September income: vault shows $0 — likely missed financial-log entry. Verify against Stripe.
- Home office: used dedicated home office full year. CPA to calculate deduction (regular/exclusive use rule).
- Jordan Chen W-9: no SSN/EIN on file. Must collect before Jan 31 to file 1099-NEC on time.
```
