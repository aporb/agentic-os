---
name: pricing-strategy-brief
description: Research competitor pricing, surface vault feedback from customers, and produce a single recommendation with rationale when you're considering a price change or new tier.
version: 1.0.0
trigger:
  - "pricing strategy"
  - "should I raise my prices"
  - "pricing review"
  - "help me think through pricing"
  - "new pricing tier"
  - "what should I charge"
  - "pricing research"
  - "am I priced right"
  - "pricing recommendation"
  - "competitor pricing"
integrations:
  - web-search-ddgr-gogcli
  - vault-sqlite-fts5
inputs:
  - name: product_name
    description: Name of your product or the specific plan/tier being evaluated
    required: true
  - name: current_price
    description: Current price or pricing structure (e.g. "$199/mo flat" or "$99/$299/$799 tiers")
    required: true
  - name: target_segment
    description: The customer segment this pricing decision is for (e.g. "solo founders", "SMB teams of 5–20", "enterprise")
    required: false
  - name: decision_context
    description: What's prompting the review — e.g. "planning to add a new tier", "losing deals on price", "first time setting pricing"
    required: false
output_artifact: "wiki/pricing-strategy.md"
frequency: on-demand
pack: cfo
---

## When to run

Run this when you're about to change a price and want to know if you're moving in the right direction. Run it when you lose three deals in a row on price and need to know whether you're expensive or just talking to the wrong buyers. Run it before launching a new tier so you don't anchor the wrong way on day one.

Pricing decisions are almost impossible to reverse cleanly once customers are on a plan. This brief doesn't make the decision for you — it gives you the market data and your own vault's customer feedback so you're not deciding from a blank slate.

## What you'll get

A research-backed brief covering: what competitors charge and how they structure their tiers, what your own vault says about how customers perceive your current pricing, a gap analysis, and a single recommended next move with rationale. One recommendation, not a list of options — you can always ignore it, but the brief commits to a direction so you're reacting to a concrete position rather than abstract tradeoffs.

## Steps

1. Check the vault for an existing pricing strategy page:
   ```
   sqlite3 vault.db "SELECT path, updated FROM pages WHERE path = 'wiki/pricing-strategy.md';"
   ```
   If it exists and was updated within 60 days, read it as baseline. Note what's changed since then.

2. Search the vault for customer pricing feedback. Pull from: win/loss debriefs, prospect intel cards, journal entries, and any notes tagged with "pricing" or "price":
   ```
   sqlite3 vault.db "SELECT path, title, snippet(pages, 0, '', '', '...', 30)
   FROM pages WHERE pages MATCH 'price OR pricing OR expensive OR cheap OR cost OR tier OR plan'
   ORDER BY updated DESC LIMIT 15;"
   ```
   For each relevant result, note whether it's a positive signal (customer paid without objection, pricing wasn't mentioned), a friction signal (prospect pushed back on price, asked for discount), or a churn signal (customer cited cost as reason for leaving). Cite each source as a `[[wikilink]]` in the output.

3. Identify 4–6 named competitors or close alternatives. Use:
   - Vault intel pages: `sqlite3 vault.db "SELECT path FROM pages WHERE path LIKE 'wiki/intel-%';"` — read any competitor intel pages that exist.
   - If `decision_context` mentions specific competitors, prioritize those.
   - Otherwise, derive from the product category: run `ddgr --json --num 5 "[product_name] alternatives"` to find the names.

4. Research competitor pricing for each. For each competitor identified:
   ```
   ddgr --json --num 8 "[competitor] pricing 2026"
   ```
   Fall back to `gogcli "[competitor] pricing 2026"` if fewer than 4 results. Look for: public pricing pages, review site data (G2, Capterra, Product Hunt), community discussions (Reddit, Hacker News, Indie Hackers). Extract: tier names, price points, what's included at each tier, whether pricing is per-seat or flat or usage-based.

5. Build a pricing comparison table. Rows = competitors + your product. Columns = entry price, mid tier, top tier, pricing model (flat/per-seat/usage), free trial or freemium.

6. Run a positioning search for price perception in the category:
   ```
   ddgr --json --num 6 "[product category] pricing too expensive OR underpriced OR fair"
   ```
   Look for community threads where buyers discuss price expectations. Note the price points that come up as "reasonable" vs. "too much."

7. Analyze your current price against the market. Answer:
   - Are you above, below, or in-line with the median competitor price at your tier?
   - Is your pricing model (flat/per-seat/usage) consistent with buyer expectations in this category?
   - What does the vault feedback say — are you losing deals on price, or are you pricing cleanly?

8. Formulate one recommendation. The recommendation must:
   - Name a single next move (e.g. "raise the base plan from $199 to $249", or "add a $49/mo solo tier below the current $199 entry point")
   - Give one-paragraph rationale grounded in the research
   - Note the one assumption the recommendation depends on most
   - State what would change the recommendation (e.g. "if the vault shows more than 2 price objections per month, revisit")

9. Save to `wiki/pricing-strategy.md`. This is a living document — overwrite the prior version but preserve the prior recommendation in an "## Update history" section at the bottom.

## Output format

```yaml
---
type: wiki
title: "Pricing Strategy — [Product Name]"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: draft
tags: [pricing, cfo, strategy]
sources: [web-search, vault]
product: "[Product Name]"
current_price: "[price string]"
recommendation: "[one-line summary of the recommended move]"
---
```

```markdown
# Pricing Strategy — [Product Name]

> Updated [YYYY-MM-DD]. Covers [segment] pricing for [product]. Prior version below.

## Current Pricing
[Current price / structure in plain language.]

## Competitive Landscape

| Competitor | Entry | Mid | Top | Model |
|------------|-------|-----|-----|-------|
| [name] | $[x] | $[x] | $[x] | [flat/seat/usage] |
| [your product] | $[x] | — | — | |

> Sources: [list web search sources and dates]

## Customer Pricing Feedback (from vault)

| Signal | Source | Type |
|--------|--------|------|
| "[quote or paraphrase]" | [[wiki/win-loss-dealname]] | friction |
| "[quote or paraphrase]" | [[wiki/prospect-slug]] | positive |

## Market Price Perception
[2–3 sentences on what buyers in this category consider a fair price range, sourced from community discussions.]

## Gap Analysis
[Where your pricing sits relative to the market. What's misaligned — model, price point, or tier structure?]

## Recommendation

**Move:** [Single specific action]

**Rationale:** [One paragraph. Grounded in the research above.]

**Key assumption:** [The one thing this recommendation depends on being true.]

**What would change this:** [Condition under which you'd revisit the recommendation.]

## Update History
- [prior date]: Prior recommendation — [one-line summary]
```

## Example output (truncated)

```markdown
# Pricing Strategy — Kodax Agentic OS

> Updated 2026-04-26. Covers solo-founder segment pricing. First version.

## Current Pricing
$0 open-source / $49/mo Pro (single seat, all packs). No team tier.

## Competitive Landscape

| Competitor | Entry | Mid | Top | Model |
|------------|-------|-----|-----|-------|
| Vantage AI | ~$2,500/mo | ~$4,500/mo | custom | flat managed |
| Relay.app | $0 | $49/mo | $199/mo | per-seat |
| n8n (cloud) | $20/mo | $50/mo | custom | usage |
| Kodax Pro | $0 | $49/mo | — | flat |

## Customer Pricing Feedback (from vault)

| Signal | Source | Type |
|--------|--------|------|
| "This is way cheaper than what I was paying for Jasper + Zapier combined" | [[wiki/win-loss-stratum-design]] | positive |
| "Is there a team plan? I'd want to add my VA" | [[wiki/prospect-ortega-ventures]] | friction |

## Recommendation

**Move:** Add a $149/mo Team tier (up to 3 seats) before the next public launch.

**Rationale:** Two inbound signals from the last 30 days suggest the solo ceiling is
capping revenue from buyers who would pay more if there were a seat model. At $49/mo flat,
the Pro tier is already priced below market for the value delivered. The $149 Team tier
creates a natural expansion path without requiring existing Pro customers to move.

**Key assumption:** The buyers asking about team plans actually have 2–3 seats to fill,
not just one person who wants to share a login.

**What would change this:** If the next 5 Pro signups are all solo founders with no
mention of team use, hold the team tier until you have 10 active Pro customers.
```
