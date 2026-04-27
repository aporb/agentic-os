---
name: expense-audit
description: Scan Gmail for SaaS subscription receipts, categorize every recurring charge, flag the ones most replaceable, and compute the monthly run-rate — so you know exactly what you're paying for before the next renewal hits.
version: 1.0.0
trigger:
  - "expense audit"
  - "audit my subscriptions"
  - "what subscriptions am I paying for"
  - "SaaS spend audit"
  - "what am I spending on tools"
  - "find my recurring charges"
  - "subscription review"
  - "monthly software spend"
  - "what can I cut"
  - "review my expenses"
integrations:
  - gmail-search
  - vault-sqlite-fts5
inputs:
  - name: subscription_list
    description: Manual paste of your subscriptions if Gmail search is not configured (format — one per line, "Tool Name, $price/mo, category")
    required: false
  - name: lookback_months
    description: How many months of receipts to scan (defaults to 3)
    required: false
output_artifact: "wiki/expense-audit-YYYY-MM.md"
frequency: on-demand
pack: cfo
---

## When to run

Run this before renewing any annual subscription. Run it after a quarter where expenses climbed without a clear explanation. Run it when you feel like you're paying for tools you stopped using but can't remember which ones. The right cadence is monthly if you're actively managing burn, quarterly if you're comfortable and just want to confirm nothing crept in.

The skill does not tell you to cancel things. It tells you what you're paying and which tools are the most replaceable based on what alternatives exist. The decision is yours.

## What you'll get

A full inventory of your SaaS subscriptions sorted by cost, with each tool categorized (dev infrastructure, sales tools, content tools, etc.), a monthly run-rate total, and a short list of the subscriptions most likely to be replaceable — based on whether a free or cheaper alternative exists in the same category. The output is a working document you can use in a 20-minute self-review, not a final verdict.

## Steps

1. Check the vault for a prior expense audit:
   ```
   sqlite3 vault.db "SELECT path, updated FROM pages WHERE path LIKE 'wiki/expense-audit-%.md'
   ORDER BY path DESC LIMIT 1;"
   ```
   If found and within 60 days, read it as baseline. Note which subscriptions were flagged previously — check whether they were acted on.

2. Pull subscription receipts from Gmail (if Gmail MCP is configured):
   - Search query 1: `from:(receipt OR billing OR invoice OR noreply) subject:(receipt OR invoice OR subscription OR payment) newer_than:[lookback_months]m`
   - Search query 2: `"your subscription" OR "payment confirmation" OR "you've been charged" newer_than:[lookback_months]m`
   - For each matching thread, extract: sender/vendor name, amount charged, frequency (monthly/annual), date of most recent charge.
   - If annual charges appear, convert to monthly equivalent for the run-rate calculation.
   - If Gmail is not configured, use `subscription_list` input. If neither is available, prompt: "Paste your subscriptions below in this format: Tool Name, $price/mo, category."

3. Also query the vault for any financial-log entries mentioning subscription payments:
   ```
   sqlite3 vault.db "SELECT path, content FROM pages WHERE
   pages MATCH 'subscription OR receipt OR charged OR renewal OR annual'
   AND date >= date('now', '-[lookback_months] months')
   ORDER BY date DESC LIMIT 20;"
   ```
   Add any subscriptions found here that were missed by Gmail search.

4. Deduplicate. If the same tool appears in multiple sources, keep the most recent charge and mark it as confirmed.

5. Categorize each subscription. Use these categories:
   - **Core infrastructure** — hosting, database, domain, email delivery, auth (Vercel, Supabase, Render, Postmark, AWS)
   - **Dev tools** — code editors, CI/CD, monitoring, error tracking (Cursor, GitHub, Sentry, Datadog)
   - **AI / LLM** — API costs, AI tools (Anthropic, OpenAI, Perplexity)
   - **Sales / CRM** — pipeline, outreach, proposals (HubSpot, Apollo, PandaDoc)
   - **Marketing / content** — email, social scheduling, SEO (Beehiiv, Buffer, Ahrefs)
   - **Finance / admin** — accounting, banking, legal (QuickBooks, Mercury, Stripe fee pass-through)
   - **Productivity / ops** — project management, docs, comms (Notion, Linear, Slack, Loom)
   - **Other** — anything that doesn't fit the above

6. Compute monthly run-rate:
   - Sum all monthly charges.
   - For annual charges, divide by 12 and add to the monthly total.
   - Report: total monthly run-rate, total annual equivalent, and run-rate by category.

7. Flag replaceable subscriptions. For each tool, apply a simple test: does a free or significantly cheaper alternative exist that handles the core use case? Apply this test conservatively — do not flag tools that are genuinely load-bearing. The categories most commonly replaceable at the $100K–$1M stage:
   - Paid SEO tools when the founder is not actively running SEO (Ahrefs, Semrush — $100+/mo)
   - Paid social scheduling when volume is low (Buffer Pro — free tier usually sufficient)
   - Duplicate project management tools (both Notion and Linear when Linear alone covers it)
   - Paid monitoring when error volume is low (Datadog — free tiers of Sentry handle most early-stage needs)
   - Paid email tools for small lists (Beehiiv Pro, ConvertKit — free tiers cap around 1K subscribers)
   Flag with reasoning, not conclusions. Example: "Ahrefs ($99/mo) — flagged: no SEO content published in vault in the last 60 days. Consider pausing until content cadence resumes."

8. Do not recommend cancellations for tools you cannot evaluate (no usage data in the vault, no prior mention in journal). Mark those as "Usage unknown — verify before acting."

9. Save to `wiki/expense-audit-YYYY-MM.md`.

## Output format

```yaml
---
type: wiki
title: "Expense Audit — [Month YYYY]"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: draft
tags: [expense-audit, cfo, subscriptions]
sources: [gmail-search, vault-journal, manual-input]
audit_month: YYYY-MM
monthly_run_rate: [number or null]
annual_run_rate: [number or null]
subscription_count: [number]
flagged_count: [number]
---
```

```markdown
# Expense Audit — [Month YYYY]

> Audited [YYYY-MM-DD]. Sources: [Gmail / vault / manual]. Lookback: [n] months.

## Run-Rate Summary

| Category | Monthly | Annual Equiv. |
|----------|---------|---------------|
| Core infrastructure | $[x] | $[x] |
| Dev tools | $[x] | $[x] |
| AI / LLM | $[x] | $[x] |
| Sales / CRM | $[x] | $[x] |
| Marketing / content | $[x] | $[x] |
| Finance / admin | $[x] | $[x] |
| Productivity / ops | $[x] | $[x] |
| Other | $[x] | $[x] |
| **TOTAL** | **$[x]** | **$[x]** |

## Full Subscription List

| Tool | Monthly Cost | Category | Billing | Last Seen | Status |
|------|-------------|----------|---------|-----------|--------|
| [tool] | $[x] | [category] | monthly | [date] | active |
| [tool] | $[x]/12 | [category] | annual | [date] | active |

## Flagged — Most Replaceable

| Tool | Cost/mo | Reason Flagged | Replacement Option |
|------|---------|---------------|-------------------|
| [tool] | $[x] | [specific reason] | [free alternative or pause] |

## Not Evaluated (Usage Unknown)
- [tool] — no vault mentions, no usage signals found. Verify before renewing.

## Prior Audit Comparison
[If a prior audit exists: which flagged items were acted on, which were not.]
```

## Example output (truncated)

```markdown
# Expense Audit — April 2026

> Audited 2026-04-26. Sources: Gmail (87 receipt threads), vault (3 financial-log mentions).
> Lookback: 3 months.

## Run-Rate Summary

| Category | Monthly | Annual Equiv. |
|----------|---------|---------------|
| Core infrastructure | $890 | $10,680 |
| Dev tools | $640 | $7,680 |
| AI / LLM | $310 | $3,720 |
| Sales / CRM | $480 | $5,760 |
| Marketing / content | $380 | $4,560 |
| Finance / admin | $150 | $1,800 |
| Productivity / ops | $350 | $4,200 |
| **TOTAL** | **$3,200** | **$38,400** |

## Flagged — Most Replaceable

| Tool | Cost/mo | Reason Flagged | Replacement Option |
|------|---------|---------------|-------------------|
| Ahrefs | $99 | No SEO content published in vault in 90 days | Pause — resume when content cadence picks up |
| Buffer Pro | $18 | 3 posts/week at current cadence; free tier handles up to 10/mo | Downgrade to free |
| Notion AI | $16 | Hermes already handles all writing tasks flagged in journal | Cancel — no unique use case remaining |

## Not Evaluated (Usage Unknown)
- Loom Pro ($15/mo) — no vault mentions, no receipt in Gmail. Verify if still in use.
```
