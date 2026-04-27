---
name: strategic-decision-brief
description: Research and frame a build/buy/hire/partner decision with options, tradeoffs, and a recommended path.
version: 1.0.0
trigger:
  - "help me decide"
  - "strategic decision"
  - "should I build or buy"
  - "should I hire or outsource"
  - "decision brief"
  - "help me think through"
  - "frame this decision"
  - "research my options for"
  - "I need to decide whether to"
  - "make vs buy decision"
integrations:
  - web-search-ddgr-gogcli
  - vault-sqlite-fts5
inputs:
  - name: decision_topic
    description: The decision to be made, stated plainly (e.g. "build a custom CRM vs use HubSpot", "hire a full-time COO vs bring on a fractional", "partner with Acme for distribution vs build our own channel")
    required: true
  - name: context
    description: Any constraints or context the agent should factor in (e.g. "runway is 14 months", "we have one contractor dev available", "we have 3 interested partners already")
    required: false
  - name: deadline
    description: When the decision needs to be made by (helps calibrate how much research is warranted)
    required: false
output_artifact: "wiki/decision-[slug].md"
frequency: on-demand
pack: ceo
---

## When to run

When a decision is real — not hypothetical, not "someday" — and the cost of the wrong call is meaningful. Build vs. buy decisions that will consume two months of engineering. Hire vs. outsource decisions that will shape the next six months of operations. Partner vs. build decisions that affect your distribution and your cap table. These are the moments where structured thinking pays for itself.

Don't run this for operational decisions with obvious answers. Run it when you're genuinely uncertain, when two smart advisors would disagree, or when you're about to spend real money or real time.

## What you'll get

A structured one-page decision brief with the options laid out, their tradeoffs quantified where possible, the assumptions that drive each option, and a recommended path. The brief gives you something to share with an advisor for a second opinion and a record of the reasoning when you revisit the decision 6 months later.

## Steps

1. Parse `decision_topic` to identify: the decision type (build/buy/hire/partner/other), the options being compared, and the domain (product, operations, sales, infrastructure, etc.).
2. Search the vault for any existing wiki or journal pages related to this decision: `sqlite3 vault.db "SELECT path, title, snippet(pages, 0, '', '', '...', 20) FROM pages WHERE pages MATCH '<key terms from decision_topic>' LIMIT 10;"`. Prior research, vendor evaluations, or related decisions are useful starting context.
3. Run web research on each option in the decision. For a build/buy decision, search for the buy-side tools: `ddgr --json --num 10 "<tool name> pricing review 2026"` and `ddgr --json --num 10 "<tool name> alternatives"`. For a hire decision, search for market comp: `ddgr --json --num 10 "<role title> salary benchmark 2026"`. For a partner decision, research the potential partner.
4. Run one additional search to surface any community discussion: `ddgr --json --num 10 "<decision topic paraphrase> founder experience OR lesson OR mistake"`. Founder-written content (blog posts, X/Twitter threads, Hacker News discussions) often contains the honest tradeoff data that vendor sites don't.
5. If `context` is provided, factor the constraints explicitly into each option's feasibility. Runway, team capacity, and technical debt are the three most common constraints that flip the correct answer.
6. For each option, structure: what it is, what it costs (money, time, and opportunity cost), what it unlocks, what it forecloses, and what assumptions have to hold for it to be the right choice.
7. Write the recommendation. Be direct. State which option you recommend and the two or three reasons why, given the constraints. If the right answer is "gather more information before deciding," say that and specify exactly what information is needed and how to get it.
8. List the top 3 assumptions the recommendation rests on. If any of these assumptions are wrong, the recommendation changes — flag them so the user knows what to watch.
9. Save the brief to `wiki/decision-[slug].md` where the slug is a kebab-case summary of the decision topic.

## Output format

```yaml
---
type: wiki
title: "Decision Brief — [Decision Topic]"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: draft
tags: [decision, strategic, ceo, [domain-tag]]
sources: [web-search, vault]
decision_topic: "[decision_topic string]"
deadline: "[deadline or 'not specified']"
decision_status: open
---
```

```markdown
# Decision Brief — [Decision Topic]

> Created: YYYY-MM-DD. Status: open. Deadline: [deadline or TBD].

## The Question
[One sentence restating the decision, clearly framed.]

## Context
[2–4 sentences. What's driving this decision now? What constraints are fixed?
Pull from user-provided context and vault research.]

## Option A — [Name]
**What it is:** [description]
**Cost:** [money / time / opportunity cost]
**Unlocks:** [what becomes possible]
**Forecloses:** [what becomes harder or impossible]
**Assumptions required:** [what has to be true for this to be the right choice]

## Option B — [Name]
[Same structure]

## Option C — [Name, if applicable]
[Same structure]

## Recommendation
**[Option X].**

[2–4 sentences making the case. Direct. No hedging. Name the primary reason.]

## Key Assumptions
1. [Assumption the recommendation rests on]
2. [Second assumption]
3. [Third assumption]

## If You Disagree With the Recommendation
[What would need to be different — a constraint that changes, a data point
that reverses the tradeoff — for the other option to be correct.]

## Sources Consulted
- [URL or vault path — brief description]
- [URL or vault path]
```

## Example output (truncated)

```markdown
# Decision Brief — Build Custom CRM vs. Use HubSpot Free

> Created: 2026-04-26. Status: open. Deadline: May 10 (before hiring the SDR).

## The Question
Should we build a lightweight CRM in our own codebase or adopt HubSpot Free
before bringing on our first SDR in May?

## Context
One contractor dev (8h/week capacity). Runway is 14 months. Currently tracking deals
in a Google Sheet with 47 rows. The SDR hire assumes they have a real CRM to work in.

## Option A — HubSpot Free
**Cost:** $0 cash; ~4h setup; ongoing: data entry discipline from the SDR
**Unlocks:** Real pipeline management, deal tracking, sequence automation on day one.
  SDR can be productive in week one without waiting on custom tooling.
**Forecloses:** Nothing meaningful at this stage. HubSpot export is clean if you leave.
**Assumptions required:** SDR will actually use it (not revert to email + spreadsheet).

## Option B — Build Custom CRM
**Cost:** ~40 contractor hours ($4,000–6,000) to reach feature parity with HubSpot Free
**Unlocks:** Tight integration with our existing product data and vault
**Forecloses:** Those 40h hours are not going to shipping product or fixing bugs
**Assumptions required:** Custom integration value justifies the cost and delay.

## Recommendation
**HubSpot Free.**

The build costs 40h of contractor capacity you don't have. HubSpot Free does
90% of what you need on day one, and the SDR will be trained on it already.
Revisit this decision when you hit HubSpot Free's limits or when a custom
integration becomes worth the cost. That is not this month.
```
