---
name: competitor-product-audit
description: Feature-by-feature product comparison and UX teardown of a competitor's product, with a clear-eyed assessment of where you're ahead, behind, and differentiated.
version: 1.0.0
trigger:
  - "competitor product audit"
  - "product audit of"
  - "analyze competitor product"
  - "compare our product to"
  - "feature comparison with"
  - "how does our product compare to"
  - "UX teardown of"
  - "product teardown"
  - "what features does [competitor] have"
integrations:
  - web-search-ddgr-gogcli
  - vault-sqlite-fts5
inputs:
  - name: competitor_name
    description: Name of the competitor product to audit
    required: true
  - name: your_product_area
    description: The specific area of your product to compare — e.g. "onboarding", "skill runner", "integrations". Defaults to full product.
    required: false
  - name: audit_depth
    description: "shallow" (positioning and key features only, ~30 min) or "deep" (full UX teardown including review mining, ~90 min). Defaults to "shallow".
    required: false
output_artifact: "wiki/product-audit-[competitor-slug].md"
frequency: on-demand
pack: cpo
---

# Competitor Product Audit

## When to run

Before a roadmap review where you need to know whether a feature gap is actually a gap or just a different bet. Before a sales call where the prospect mentioned this competitor by name and you need to know exactly where you win and where you don't. After a competitor ships a major update that changes the comparison.

This is a product-focused audit — it goes deeper on features, UX, and product decisions than the CEO Pack's `competitor-research` skill, which covers positioning and go-to-market. Run the CEO Pack skill for market intelligence; run this one when you need product intelligence.

## What you'll get

A structured comparison page that maps the competitor's product feature set against yours, calls out their UX decisions and why they made them, and gives you an honest read on where you lead, where you trail, and where the comparison doesn't apply. The page saves to your vault and can be updated each time you run the skill.

## Steps

1. Check the vault for any existing competitive intel on this company: `sqlite3 vault.db "SELECT path, title, updated FROM pages WHERE path LIKE 'wiki/intel-%' OR path LIKE 'wiki/product-audit-%' ORDER BY updated DESC LIMIT 5;"`. If a recent audit exists (less than 60 days old), use it as the baseline and research only what's changed.

2. Check the vault for any prior deal notes or feedback that mention this competitor: `sqlite3 vault.db "SELECT path, title, snippet(pages_fts, 0, '', '', '...', 20) FROM pages_fts WHERE pages_fts MATCH '<competitor_name>' LIMIT 8;"`. Lost deals that cited this competitor are primary signal.

3. Research the competitor's product. Run web searches using ddgr, falling back to gogcli:
   - `ddgr --json --num 10 "<competitor_name> features 2026"` — product feature overview
   - `ddgr --json --num 10 "<competitor_name> review site:g2.com OR site:capterra.com OR site:producthunt.com"` — third-party user reviews
   - `ddgr --json --num 10 "<competitor_name> vs OR alternative 2026"` — comparison pages
   - If `audit_depth` is `"deep"`: `ddgr --json --num 10 "<competitor_name> changelog OR updates OR new features 2026"` — recent product moves
   - If `your_product_area` is specified: `ddgr --json --num 10 "<competitor_name> <your_product_area>"` — targeted area research

4. If `audit_depth` is `"deep"`: mine user reviews from G2, Capterra, or ProductHunt. Extract: top praised features (what they do well), top complaints (what users hate), and switching motivations (what made someone leave them or choose them).

5. Build the feature comparison. List each major product area as a row. For each area, assess your product and the competitor's product on a simple scale:
   - `[+]` — we lead here (meaningfully better capability or UX)
   - `[=]` — comparable (similar capability, different approach)
   - `[-]` — we trail here (they have it, we don't, or theirs is materially better)
   - `[N/A]` — not a relevant comparison point for this product area

   Do not manufacture advantages. A false `[+]` in the comparison is worse than a true `[-]`.

6. Write a UX observations section. Based on review mining and any public screenshots or demo videos found: how do users experience their product? What UX decisions did they make that differ from yours? Why might they have made them? Avoid vague assessments — cite specific UI behaviors or user quotes.

7. Write a "differentiation read" section: where your product makes a fundamentally different bet than theirs, regardless of feature parity. This is the most valuable output — the reason a user would choose you even if the competitor has more features.

8. Write an "open questions" section: things you couldn't confirm through research that would change the comparison if answered.

9. Save the audit to `wiki/product-audit-[competitor-slug].md`. If a prior version exists, prepend an "Updated [date]" section and preserve the prior content.

## Output format

```yaml
---
type: wiki
title: "Product Audit — [Competitor Name]"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: draft
tags: [competitor, product-audit, cpo, [competitor-slug]]
sources: [web-search, vault, user-reviews]
competitor: "[Competitor Name]"
product_area: "[area or 'full product']"
audit_depth: "[shallow or deep]"
---
```

```markdown
# Product Audit — [Competitor Name]

> Last audited: YYYY-MM-DD | Depth: [shallow/deep] | Area: [product_area]
> Related intel: [[intel-competitor-slug]] (if CEO Pack page exists)

## What They've Built

[2–3 paragraphs. Product overview, core workflow, who it's built for.
Be concrete — name the actual features and flows, not the marketing language.]

## Feature Comparison

| Area | Us | [Competitor] | Notes |
|------|-----|------------|-------|
| [Feature area] | [+/-/=] | [+/-/=] | [Brief note on difference] |
| [Feature area] | [+/-/=] | [+/-/=] | [Brief note] |
| ...  | ... | ... | ... |

**Legend:** [+] We lead | [=] Comparable | [-] We trail | [N/A] Not applicable

## UX Observations

[What their product experience is actually like, based on reviews and demos.
Specific, concrete observations — not "their UI is clean."]

- [Specific UX behavior or decision and what it signals about their product bets]
- [Specific UX behavior]

## What Users Love (from reviews)

- [Top praised aspect] — [quote or paraphrase from review, with source]

## What Users Complain About (from reviews)

- [Top complaint] — [quote or paraphrase, with source]

## Our Differentiation Read

[Where we make a different bet entirely — not a feature gap, a different philosophy.
This is the honest version of "why us over them."]

## Open Questions

- [Something the research didn't confirm — with note on how to resolve it]
```

## Example output (truncated)

```markdown
# Product Audit — Vantage AI

> Last audited: 2026-04-28 | Depth: deep | Area: full product
> Related intel: [[intel-vantage-ai]]

## What They've Built

Vantage AI ships a managed cohort of named AI executives — fixed personas called
"Aria" (marketing), "Cole" (sales), and "Mira" (ops) — through a chat interface.
The core interaction is conversational: you tell Mira to "send the weekly ops report"
and it runs. There is no user-defined skill system. The product is fully cloud-managed;
no local install, no access to the underlying prompts.

## Feature Comparison

| Area | Us | Vantage AI | Notes |
|------|-----|------------|-------|
| Skill customization | [+] | [-] | We ship editable markdown; their system is closed |
| Data ownership | [+] | [-] | Our vault is the user's; theirs disappears on cancel |
| Product pack (CPO skills) | [=] | [=] | Both cover spec, backlog, roadmap |
| Named AI personas | [-] | [+] | They have established character branding; we don't |
| OSS / self-hosted option | [+] | [-] | We are open; they are SaaS-only |
| Onboarding time | [-] | [+] | Their managed setup is faster; our integrations take effort |

## Our Differentiation Read

The fundamental bet is ownership vs. managed service. Vantage AI is a subscription
to a team — when you cancel, the team goes away and you have nothing. Agentic-OS is
infrastructure you own — the vault, the skills, the data, the workflows all persist.
This matters most to the segment of founders who plan to be running this business in
5 years, not founders who want quick-start AI and don't care what's under the hood.
```
