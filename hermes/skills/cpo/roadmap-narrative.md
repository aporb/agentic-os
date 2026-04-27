---
name: roadmap-narrative
description: Write an investor- or customer-facing roadmap narrative with strategic rationale, grounded in your vault backlog and OKRs.
version: 1.0.0
trigger:
  - "write the roadmap"
  - "roadmap narrative"
  - "product roadmap"
  - "investor roadmap"
  - "customer roadmap"
  - "what are we building this quarter"
  - "roadmap for Q[N]"
  - "update the roadmap"
  - "roadmap story"
integrations:
  - vault-sqlite-fts5
inputs:
  - name: horizon
    description: Time horizon to cover — "3m", "6m", or "12m"
    required: true
  - name: focus_areas
    description: Comma-separated product themes or areas to anchor the narrative — e.g. "onboarding, integrations, reporting"
    required: true
  - name: audience
    description: Who will read this — "investors", "customers", or "internal". Shapes the framing and level of commitment.
    required: false
  - name: quarter
    description: The quarter this roadmap covers — e.g. "Q2 2026"
    required: false
output_artifact: "wiki/roadmap-[period].md"
frequency: on-demand
pack: cpo
---

# Roadmap Narrative

## When to run

At the start of each quarter before investor calls or customer conversations where roadmap comes up. Also run it before a board or advisor session where you need a written artifact rather than an off-the-cuff answer to "what are you building next?"

A roadmap narrative is not a feature list. It's the story of why you're building what you're building in the order you're building it. The narrative is what separates a founder who knows their product direction from one who sounds like they're winging it.

## What you'll get

A wiki page with `status: draft` that tells the product story for the specified horizon. It cites existing vault pages — backlog, specs, OKRs, feedback synthesis — using [[wikilinks]] for everything it draws from. The page is written in plain English, opinionated, and free of hedge language. It is honest about what's on the roadmap and what's not, and it explains why.

All source material must be cited as [[wikilinks]]. Do not reference a backlog item, spec, or OKR that doesn't exist in the vault without flagging it as an assumption.

## Steps

1. Collect source material from the vault:

   **OKR pages:** `sqlite3 vault.db "SELECT path, title FROM pages_fts WHERE pages_fts MATCH 'OKR OR objectives OR goals' ORDER BY updated DESC LIMIT 5;"`. Read the most recent OKR page. Extract the objectives that map to product output.

   **Backlog:** `sqlite3 vault.db "SELECT path, title FROM pages WHERE path LIKE 'wiki/backlog-prioritized%' ORDER BY updated DESC LIMIT 1;"`. Read the most recent prioritized backlog page. Note the top 10–15 items.

   **Specs:** `sqlite3 vault.db "SELECT path, title FROM pages WHERE path LIKE 'wiki/spec%' ORDER BY updated DESC LIMIT 10;"`. Read each spec page. Note the status (draft, in-progress, complete) and the problem each spec addresses.

   **Feedback synthesis:** `sqlite3 vault.db "SELECT path, title FROM pages WHERE path LIKE 'wiki/feedback-synthesis%' ORDER BY updated DESC LIMIT 3;"`. Pull the top themes from the most recent 1–3 months.

2. Map collected items to `focus_areas`. For each focus area, identify which backlog items, specs, and feedback themes belong to it. Group them. Discard anything not in a focus area — the roadmap narrative does not try to capture everything.

3. For each focus area, determine the narrative arc:
   - What problem does this area address? (Source from feedback synthesis or OKRs — [[wikilink]] the source.)
   - What are we building in the horizon? (Source from backlog and specs — [[wikilink]] each.)
   - What does success look like at the end of the horizon? (Tie to an OKR if possible.)

4. Order the focus areas by strategic sequence, not alphabetically. Which one unlocks the next? Which one must ship first for the others to matter? Name the dependency explicitly.

5. Write the "What we're not building" section. For a roadmap to be credible, the audience needs to see that you've made trade-offs. List 2–4 things that are deliberately out of scope for this horizon and give the reason. If it's in the backlog but not in this horizon, name it here. "We're not building X yet because Y" is more credible than omitting X entirely.

6. Set the appropriate confidence level based on `audience`:
   - `"investors"`: frame as directional commitment. "We plan to..." not "We will definitely..."
   - `"customers"`: frame as intention with honest caveat. "We're working toward... subject to what we learn from you."
   - `"internal"`: frame as the current working plan. Direct and specific.

7. Write the narrative. Target: 400–700 words for the main body. No bullet lists in the executive summary section — prose only. The sections below the summary can use structured lists.

8. Set `status: draft` in the frontmatter. Do not change this to `published` — that is the operator's decision after review.

9. Save to `wiki/roadmap-[period].md` where `[period]` is the quarter or horizon identifier (e.g. `2026-Q2` or `2026-H1`).

## Output format

```yaml
---
type: wiki
title: "Product Roadmap — [Quarter/Period]"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: draft
tags: [roadmap, product, cpo, [quarter]]
sources: [vault]
horizon: "[3m/6m/12m]"
audience: "[investors/customers/internal]"
focus_areas: [area1, area2, area3]
---
```

```markdown
# Product Roadmap — [Quarter/Period]

> Horizon: [3m/6m/12m] | Audience: [investors/customers/internal]
> Status: draft — review before sharing
> Sources: [[okr-YYYY-QN]], [[backlog-prioritized-YYYY-MM-DD]], [[feedback-synthesis-YYYY-MM]]

## Where We're Going

[2–4 sentence executive summary. The single-most-important thing we're trying to
accomplish this horizon and why it matters now. No jargon. No hedge language.]

---

## [Focus Area 1]

**The problem:** [1–2 sentences grounded in user feedback or OKR. Cite [[source]] inline.]

**What we're building:**
- [[spec-feature-slug]] — [one-line description of what it does and why it's first]
- [[spec-feature-slug-2]] — [one-line description]

**What success looks like:** [Measurable outcome tied to an OKR or metric.]

---

## [Focus Area 2]
...

---

## What We're Not Building (This Horizon)

- **[Feature or area]:** [Why not — honest reason. "Not enough signal yet." "Dependency on X not ready." "Lower leverage than the above."]
- **[Feature or area]:** [Why not]

---

## Open Dependencies

[Anything the roadmap depends on that isn't fully in our control.
Integration completion, a design decision, a hire, external API availability.]

- [Dependency] — [status and expected resolution]
```

## Example output (truncated)

```markdown
# Product Roadmap — Q2 2026

> Horizon: 3m | Audience: investors
> Status: draft — review before sharing
> Sources: [[okr-2026-q2]], [[backlog-prioritized-2026-04-28]], [[feedback-synthesis-2026-04]]

## Where We're Going

Q2 is about activation. We have a retention problem that starts at signup: too many users
configure the product, run one skill, and don't come back. The data from [[feedback-synthesis-2026-04]]
points to a clear root cause — users don't see meaningful output fast enough to form the
habit. Everything we're building this quarter reduces the time between "I signed up" and
"I use this daily."

---

## Onboarding

**The problem:** The current setup flow requires 4–6 integration steps before a user sees
any output. [[feedback-synthesis-2026-04]] shows 11 of 34 users explicitly cited onboarding
length as the friction point. Three users churned before completing setup.

**What we're building:**
- [[spec-onboarding-fast-path]] — A demo vault mode that lets new users run their first
  skill in under 10 minutes, no integrations required. Ships first because it unlocks
  the retention experiments below.
- [[spec-skill-output-edit]] — An edit surface on generated pages so users can refine
  output without going to the vault directly. Second most-requested item in April.

**What success looks like:** Time-to-first-output under 10 minutes for 70% of new users by June 30.

---

## What We're Not Building (This Horizon)

- **Mobile app:** There's demand, but native mobile is a 6-week build and the desktop
  experience isn't habit-forming yet. Mobile amplifies an existing habit — it doesn't create one.
- **Team collaboration features:** Our ICP is the solo founder. Team features dilute the
  product before the solo use case is solved.
```
