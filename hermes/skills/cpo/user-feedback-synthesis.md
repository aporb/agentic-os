---
name: user-feedback-synthesis
description: Turn a month of scattered user feedback — Intercom threads, Loom transcripts, support emails, and raw notes — into a prioritized list of product insights.
version: 1.0.0
trigger:
  - "synthesize user feedback"
  - "what are users saying"
  - "analyze user feedback"
  - "feedback synthesis"
  - "what do users want"
  - "compile user feedback"
  - "user research summary"
  - "what's coming up in user interviews"
integrations:
  - google-drive-read
  - vault-sqlite-fts5
inputs:
  - name: feedback_source
    description: Where the feedback lives — "google-drive", "vault", "paste", or a specific Google Drive folder URL
    required: true
  - name: time_period
    description: Time window to cover, e.g. "April 2026" or "last 30 days"
    required: true
  - name: focus_area
    description: Optional product area to filter by — e.g. "onboarding", "billing", "search" (defaults to all)
    required: false
output_artifact: "wiki/feedback-synthesis-YYYY-MM.md"
frequency: on-demand
pack: cpo
---

# User Feedback Synthesis

## When to run

At the end of each month before you update the backlog. Also run it before a roadmap review or before a sprint planning session where you want the backlog shaped by what users actually said, not by what you remember users said.

The signal that this skill is overdue: you're in a backlog session and you're prioritizing from gut feel because you can't remember which request came up most. Three pieces of feedback from one vocal user are not the same as one piece of feedback from ten separate users. This skill makes the difference visible.

## What you'll get

A synthesis page that collapses all user feedback from the period into named themes, with counts and direct quotes for each. The page shows you what's recurring (ship it), what's a one-off (park it), and what's a signal about a different problem than the one users named. That last category — the reframe — is where the spec work starts.

## Steps

1. Based on `feedback_source`:
   - If `"google-drive"` or a Drive URL: search Google Drive for documents matching `[time_period] feedback OR interview OR transcript OR notes` in the relevant folder. Use Google Drive MCP to read each document. Collect the raw text.
   - If `"vault"`: run `sqlite3 vault.db "SELECT path, title, content FROM pages_fts WHERE pages_fts MATCH 'feedback OR interview OR transcript' ORDER BY updated DESC LIMIT 20;"`. Read each matched page.
   - If `"paste"`: the user has provided the raw feedback text directly. Use it as-is.
   - If both vault and Drive sources exist, collect from both and deduplicate.

2. If Intercom or support ticket data is available as a manual paste or export, include it. Parse each ticket/thread for: user name (or anonymized ID), date, product area referenced, and core complaint or request.

3. Normalize all feedback items into a flat list: `[source, date, user_id (if known), raw quote or paraphrase, product_area]`. If `focus_area` is set, filter this list to items that touch the specified area. Flag filtered-out items with a count ("38 items outside scope of [focus_area] — not analyzed").

4. Cluster the flat list into themes. A theme is a recurrence — the same underlying friction or request appearing across at least 2 separate users or sessions. Name each theme with a short label (3–6 words). Record the count of occurrences per theme.

5. For each theme, pull 1–3 representative direct quotes. Quote verbatim — do not paraphrase the user's own words when a direct quote is available.

6. For each theme, write a one-sentence product implication: what would need to change in the product to resolve this feedback.

7. Flag any items that don't cluster — single-user requests or highly specific edge cases. List them in a "One-offs" section. They may be real, but they don't drive prioritization.

8. Write an "Analyst's reframe" section: 2–3 observations about what the feedback might be signaling beyond the literal request. Example: "Users asking for CSV export may actually be signaling that the in-product reporting lacks the specificity they need — the feature request is a workaround, not the fix."

9. Search the vault for any existing spec pages related to the top 3 themes: `sqlite3 vault.db "SELECT path, title FROM pages_fts WHERE pages_fts MATCH '<theme_keyword>' LIMIT 5;"`. Link to them with [[wikilinks]] in the output.

10. Save the synthesis to `wiki/feedback-synthesis-YYYY-MM.md`.

## Output format

```yaml
---
type: wiki
title: "User Feedback Synthesis — [Month YYYY]"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: draft
tags: [feedback, product, cpo, synthesis]
sources: [google-drive, vault, intercom]
period: "YYYY-MM"
focus_area: "[area or 'all']"
item_count: N
---
```

```markdown
# User Feedback Synthesis — [Month YYYY]

> Period: [time_period] | Items analyzed: N | Sources: [list]

## Top Themes

### 1. [Theme Name] (N occurrences)
**Product implication:** [One sentence — what changes to fix this]

Quotes:
> "[Verbatim user quote]" — [User ID or anonymized, Date]
> "[Verbatim user quote]" — [User ID or anonymized, Date]

Related spec: [[spec-feature-name]] (if exists)

---

### 2. [Theme Name] (N occurrences)
...

## One-offs (not prioritized)
- [Single request] — [user, date]
- [Single request] — [user, date]

## Analyst's Reframe

[2–3 observations about what the feedback is really signaling.
The goal here is not to explain away the feedback but to find the
upstream problem that generated it.]

## Recommended Next Actions

1. [Top theme] — create or update spec: [[spec-slug]]
2. [Second theme] — investigate before speccing: [what to learn first]
3. [Third theme] — park until [condition]
```

## Example output (truncated)

```markdown
# User Feedback Synthesis — April 2026

> Period: April 2026 | Items analyzed: 34 | Sources: Google Drive (interview transcripts), vault (support notes)

## Top Themes

### 1. Onboarding is too long before first value (11 occurrences)
**Product implication:** The setup sequence needs to surface a meaningful output
in the first session — currently users are 4–6 steps in before anything runs.

Quotes:
> "I signed up, went through the whole thing, and I still didn't know if it worked."
  — User #12, Apr 14 2026
> "Took me like 45 minutes to get the first standup. I almost quit."
  — User #07, Apr 22 2026

Related spec: [[spec-onboarding-fast-path]]

### 2. No clear way to edit or re-run a skill output (9 occurrences)
**Product implication:** Users need an edit surface on generated pages — currently
they have to go to the vault directly, which breaks the workflow mental model.

## Analyst's Reframe

The volume of onboarding complaints may mask a deeper positioning issue: users
arrive expecting instant output (marketing suggests "your AI second brain, ready in
minutes") but the integration setup requires real configuration time. The fix may
need to start upstream of the product — in the onboarding expectations set during signup.
```
