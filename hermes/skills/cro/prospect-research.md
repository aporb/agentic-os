---
name: prospect-research
description: Build a one-page intel card on a target account or person before outreach — company context, decision-maker mapping, signals, and gaps.
version: 1.0.0
trigger:
  - "research prospect"
  - "build intel on"
  - "what do we know about"
  - "who is"
  - "research before I reach out to"
  - "pull a brief on"
  - "what should I know before contacting"
  - "prospect intel card for"
inputs:
  - name: company_or_person
    description: Company name, domain, LinkedIn URL, or person's full name and employer
    required: true
  - name: your_product
    description: One sentence on what you sell and who it's for — used to calibrate relevance of findings
    required: true
  - name: focus
    description: Optional angle — e.g., "are they funded?" or "do they have a dev team?" or "who owns procurement?"
    required: false
output_artifact: wiki/prospect-{slug}.md
frequency: on-demand
pack: cro
---

## When to run

Run this before any first-touch outreach to a new account or person. Run it before a sales call if you don't have a recent intel card or if the card is more than 60 days old. Run it after an inbound lead arrives to confirm the fit before spending time on a response.

This is the entry point for every deal in the Revenue Pack. `cold-outreach-email`, `sales-call-prep`, `proposal-draft`, and `win-loss-debrief` all read from the output this skill produces. Do not write a cold email without running this first.

## What you'll get

A single wiki page saved to `wiki/prospect-{slug}.md` with:

- Company overview: size, stage, funding, industry, geography, business model
- Decision-maker map: who likely owns the budget and the problem you solve
- Recent signals: funding rounds, hiring patterns, product launches, press, job postings
- Fit assessment: why this account might be a match, and where the gaps or risks are
- Talking points: 2–3 specific, non-generic angles for the first conversation
- Open questions: what you still don't know that matters before outreach

The page becomes the living record for the prospect. Future skills append to it rather than overwriting.

## Steps

1. **Vault check.** Query `vault.db` (SQLite FTS5) for the company or person name. If a `wiki/prospect-{slug}.md` already exists, load it. Note how old the data is. If it's less than 30 days old and reasonably complete, surface it and ask whether to refresh or reuse.

2. **Web research — company layer.** Run `ddgr` queries: `"{company} funding"`, `"{company} team size"`, `"{company} {your_product_category} problem"`, `"{company} recent news"`. Fall back to `gogcli` if fewer than 5 results. Fall back to headless browser if still thin. Target sources: Crunchbase, LinkedIn company page, official website About/Team pages, press releases, job postings (Lever, Greenhouse, Ashby, LinkedIn Jobs).

3. **Web research — person layer** (if a specific contact was provided). Run queries: `"{person} {company}"`, `"{person} LinkedIn"`, `"{person} {role} {industry}"`. Look for: their tenure at the company, stated priorities in posts or interviews, any writing or talks they've done, mutual connections. Do not fabricate connections. Only cite what's findable.

4. **Signal extraction.** Parse job postings from step 2 for org signals — headcount by function, tools mentioned in JDs, pain points implied by the roles they're hiring for. A company hiring 3 data engineers and no analysts is a different prospect than one hiring the inverse.

5. **Fit assessment.** Cross-reference findings against `your_product`. Answer: does this account have the problem your product solves? Do they have the headcount/budget to be a real deal? Are there any disqualifying signals (wrong stage, wrong geography, locked into a named competitor)?

6. **Talking-point generation.** Write 2–3 specific angles for the outreach. Each angle must be grounded in a specific finding from steps 2–4 — not a generic "I noticed you're growing." Bad: "I saw you recently closed a round." Good: "Your Q1 job postings show 4 open RevOps roles — which usually means the pipeline tooling is under strain."

7. **Write the wiki page.** Save to `wiki/prospect-{slug}.md` with full frontmatter. Cite every factual claim with the source URL in `[[source-filename]]` format if the material is worth saving as a source file, or as a plain URL inline if not. Mark the page `status: draft` until manually reviewed.

8. **Confirmation.** Return a one-paragraph summary of the key findings and the path to the saved page. Prompt: "Ready to draft an outreach email? Run `cold-outreach-email` with this prospect."

## Output format

```markdown
---
type: wiki
title: "Prospect Intel: {Company or Person Name}"
created: {YYYY-MM-DD}
updated: {YYYY-MM-DD}
status: draft
tags: [prospect, cro, pipeline]
sources: []
deal_stage: pre-outreach
company: "{Company Name}"
domain: "{domain.com}"
slug: "{slug}"
---

# Prospect Intel: {Company or Person Name}

## Company Overview
{3–5 sentences: what the company does, size, stage, business model, geography}

## Decision-Maker Map
| Name | Title | Signal |
|------|-------|--------|
| {name} | {title} | {why they matter} |

## Recent Signals
- {date}: {signal — e.g., raised $4M seed, hired Head of RevOps, published post about X}
- {date}: {signal}
- {date}: {signal}

## Fit Assessment
**Why this could be a real deal:** {1–3 sentences}
**Risks / gaps:** {1–2 sentences — be honest}

## Talking Points
1. {Specific, source-grounded angle for first outreach}
2. {Specific, source-grounded angle}
3. {Specific, source-grounded angle}

## Open Questions
- {What you still need to know before closing}
- {What you couldn't find in public sources}

## Activity Log
- {YYYY-MM-DD}: Intel card created by prospect-research skill
```

## Example output

```markdown
---
type: wiki
title: "Prospect Intel: Meridian Logistics"
created: 2026-04-26
updated: 2026-04-26
status: draft
tags: [prospect, cro, pipeline]
deal_stage: pre-outreach
company: "Meridian Logistics"
domain: "meridianlog.com"
slug: "meridian-logistics"
---

# Prospect Intel: Meridian Logistics

## Company Overview
Meridian Logistics is a freight brokerage operating in the US mid-market
(50–500 shipper accounts). Founded 2019. ~40 employees per LinkedIn. No
disclosed funding — likely bootstrapped or SBA-backed. Revenue model is
margin on booked loads. Operates primarily in Southeast US lanes.

## Decision-Maker Map
| Name | Title | Signal |
|------|-------|--------|
| Dana Perez | VP Operations | Posted about carrier capacity pain in Feb |
| Marcus Webb | CEO/Co-Founder | Signs all vendor contracts per LinkedIn bio |

## Recent Signals
- 2026-03-14: Posted job for "Operations Analyst — TMS tooling experience preferred"
- 2026-02-28: Dana Perez LinkedIn post: "Carrier fallout is at 18% on spot lanes this quarter"
- 2026-01-10: Website updated with new "Technology" page — no named vendors listed

## Fit Assessment
**Why this could be a real deal:** TMS analyst hire + carrier fallout commentary maps
directly to the dispatch optimization problem. 40-person team = real budget, real pain.
**Risks / gaps:** No signal on current TMS vendor. Could be locked in a multi-year
contract. Need to confirm before spending cycles.

## Talking Points
1. The TMS analyst JD asked for "experience improving carrier acceptance rates" —
   that's the exact workflow gap the product addresses.
2. Dana's carrier fallout post (18%) is above industry average (12%) — worth
   surfacing that delta and asking what's driving it.
3. The new "Technology" page with no named vendors suggests they're either
   shopping or recently churned — worth asking directly.
```
