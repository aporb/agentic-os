---
name: competitor-research
description: One-page intel brief on a named competitor — positioning, pricing, recent moves, and where you have an edge.
version: 1.0.0
trigger:
  - "research a competitor"
  - "competitor research"
  - "what do I know about [competitor]"
  - "competitive intel on"
  - "brief me on a competitor"
  - "how does [company] compete with us"
  - "what's [company] doing"
  - "competitive analysis"
  - "compare us to [company]"
integrations:
  - web-search-ddgr-gogcli
  - vault-sqlite-fts5
inputs:
  - name: company_name
    description: Name of the competitor to research
    required: true
  - name: focus
    description: Specific angle to emphasize — e.g. "pricing", "product features", "go-to-market", "recent news" (defaults to general overview)
    required: false
output_artifact: "wiki/intel-[company-slug].md"
frequency: on-demand
pack: ceo
---

## When to run

Before a sales call where the prospect mentioned a competitor by name. Before you price a new tier and need to know what the market expects. Before a board or advisor conversation where competitive position will come up. After you hear a competitor's name twice in one week — that's the signal the market is forming an opinion about them that you need to understand.

Don't run this on every competitor. Run it on the ones that matter this quarter: the ones showing up in your lost deals, in your prospects' shortlists, or in your category's conversation.

## What you'll get

A one-page wiki entry that gives you the operating picture on a specific competitor: what they sell, who they sell it to, what they charge, what they've shipped recently, and where your position is differentiated. The page persists in your vault and gets updated each time you run the skill — so your competitive intel compounds instead of resetting every quarter.

## Steps

1. Check the vault for an existing intel page for this company: `sqlite3 vault.db "SELECT path, updated FROM pages WHERE path = 'wiki/intel-<company-slug>.md';"`. If it exists and was updated within 30 days, read it and use it as the baseline — only research what's changed.
2. Run web search using ddgr: `ddgr --json --num 10 "<company_name> pricing 2026"`. Parse results. Fall back to `gog --json "<company_name> pricing 2026"` if fewer than 5 results.
3. Run web search for recent news: `ddgr --json --num 10 "<company_name> news OR launch OR funding OR raised 2025 2026"`.
4. Run web search for positioning and product: `ddgr --json --num 10 "<company_name> features OR product OR review OR alternative"`.
5. If `focus` is provided, run one additional targeted search: `ddgr --json --num 10 "<company_name> <focus>"`.
6. Search the vault for any prior mentions of the company across all pages: `sqlite3 vault.db "SELECT path, title, snippet(pages, 0, '', '', '...', 20) FROM pages WHERE pages MATCH '<company_name>' LIMIT 10;"`. Prior deal notes, prospect feedback, or win/loss debriefs that mention this competitor are high-value signal.
7. Synthesize findings. Structure the brief around: what they sell and to whom, their pricing model (tiers, price points if findable), their go-to-market motion, recent product moves, public positioning claims, and where their weaknesses are visible.
8. Assess competitive position. Based on what you know about your own product (from vault wiki pages), write a brief "Where we have the edge" section. Keep this honest — don't manufacture advantages; surface real ones.
9. If this is an update to an existing page, add an "Updated [date]" section at the top and preserve the prior content below it. The history matters.
10. Save the brief to `wiki/intel-[company-slug].md`. If the file already exists, overwrite it with the updated version (the step above preserves history within the file).

## Output format

```yaml
---
type: wiki
title: "Intel — [Company Name]"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: draft
tags: [competitor-intel, ceo, market-intel, [company-slug]]
sources: [web-search, vault]
company: "[Company Name]"
focus: "[focus string or 'general']"
---
```

```markdown
# Intel — [Company Name]

> Last researched: YYYY-MM-DD. Sources: web search, vault cross-references.

## What They Are
[2–3 sentences. Product category, target customer, business model (SaaS, services, marketplace, etc.).]

## Who They Sell To
[ICP description. Company size, industry, role/persona buying the product.]

## Pricing
[Tiers and prices if findable. If not public, note that and include any signals
from reviews, forums, or screenshots. Format as a brief table or bullets.]

## Product — Current State
[3–5 bullets. What the product does, key features, what they lead with in messaging.
Cite specific claims from their site or marketing.]

## Recent Moves (last 90 days)
[Bullet list. Product launches, funding rounds, hires, partnerships, pricing changes.
Each bullet cites source and date.]

## How They Win
[Their stated or apparent go-to-market edge. What do their happy customers say?]

## Where They're Weak
[Gaps visible in reviews, forums, social commentary, or your own deal experience.
Keep this evidence-based, not wishful.]

## Where We Have the Edge
[Honest assessment of your differentiation against this specific competitor.
If the edge is unclear, say so — that's more useful than false confidence.]

## Open Questions
- [Something you couldn't confirm through research — note it for future investigation]
```

## Example output (truncated)

```markdown
# Intel — Vantage AI

> Last researched: 2026-04-26. Sources: web search, vault (2 prior deal mentions).

## What They Are
Vantage AI is a managed AI-workforce platform targeting B2B SaaS founders and operators.
They sell a fixed cohort of named AI "executives" that handle sales, marketing, and ops
functions through a chat interface. Their model is fully managed — no local install,
no user-controlled customization.

## Who They Sell To
Series A–B SaaS companies with $1M–$10M ARR and a small ops team (2–10 people).
The buyer is typically the founder or COO. Deal sizes appear to be $2K–$5K/month
based on public case studies.

## Pricing
Not publicly listed. Sales-led motion. Community reports suggest $2,500–$4,500/mo
for the base cohort; enterprise pricing on request. Annual contracts preferred.
(Source: G2 reviews, r/SaaS, April 2026)

## Recent Moves (last 90 days)
- Raised $8M Series A, announced March 2026 (TechCrunch, Mar 14)
- Launched "autonomy ladder" feature — progressive AI delegation system (ProductHunt, Feb 2026)
- Expanded to EU market with GDPR-compliant hosting (company blog, Apr 2026)

## Where We Have the Edge
- **Ownership.** Their users own nothing when they cancel. Our vault is the user's.
- **Pricing.** Our OSS tier is $0 vs. their $2.5K+/mo floor.
- **Inspectability.** Every skill file is readable markdown. Their system is a black box.
```
