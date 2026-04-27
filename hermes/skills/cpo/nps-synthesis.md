---
name: nps-synthesis
description: Extract product insights, sentiment themes, and ICP signals from NPS or survey responses — with a clear read on what to act on and what to ignore.
version: 1.0.0
trigger:
  - "synthesize NPS responses"
  - "NPS synthesis"
  - "analyze survey responses"
  - "what are users saying in NPS"
  - "NPS analysis"
  - "survey synthesis"
  - "analyze feedback survey"
  - "read the NPS results"
  - "summarize survey"
integrations:
  - google-drive-read
  - vault-sqlite-fts5
inputs:
  - name: survey_responses
    description: The raw responses — either a Google Drive file link, a paste of the data, or a CSV export path
    required: true
  - name: response_count
    description: Number of responses in the dataset (helps calibrate confidence levels in the output)
    required: false
  - name: survey_type
    description: Type of survey — "nps" (includes score 0–10), "csat", "open-ended", or "mixed". Defaults to "nps".
    required: false
  - name: product_area_filter
    description: Optional filter to focus the synthesis on a specific product area mentioned in responses
    required: false
output_artifact: "wiki/nps-synthesis-YYYY-MM.md"
frequency: on-demand
pack: cpo
---

# NPS Synthesis

## When to run

After each NPS or survey send. The failure mode: survey results sit in a spreadsheet and you skim the scores without reading the verbatim. The score alone is nearly useless — an NPS of 32 tells you nothing about what to build. The verbatim is where the product intelligence lives.

Also run it before a roadmap review or quarterly planning session. Survey data from the prior quarter is a primary source for what belongs on the roadmap and what doesn't.

## What you'll get

A synthesis page that breaks NPS responses into sentiment themes, extracts direct quotes for each theme, and tells you what the score distribution actually means for product direction. The page includes an ICP signal section — what distinguishes your promoters from your detractors, and what that tells you about product-market fit. It saves to your vault and can be cross-referenced from the roadmap and feedback synthesis pages.

## Steps

1. Collect the raw data:
   - If `survey_responses` is a Google Drive URL: use Google Drive MCP to download the file content. Parse as CSV or plain text.
   - If it's a paste: use it directly.
   - If no data is provided: prompt the user to paste the responses before proceeding.

2. Parse the data into a normalized list: `[respondent_id (or anonymized), score (if NPS/CSAT), verbatim_comment, date, segment_if_available]`. If no score column exists (`survey_type: open-ended`), skip the quantitative scoring steps.

3. If `survey_type` is `"nps"`:
   - Classify respondents: Promoters (9–10), Passives (7–8), Detractors (0–6).
   - Calculate NPS: `(% Promoters) - (% Detractors)`.
   - Note: if `response_count` < 20, flag that the NPS score has low statistical confidence. Don't over-index on the number.

4. Separate verbatim responses into three buckets: Promoter comments, Passive comments, Detractor comments. If `survey_type` is not NPS, skip this split and analyze all verbatim together.

5. Within each bucket, cluster comments into themes. A theme requires at least 2 comments expressing the same underlying sentiment or topic. Name each theme concisely (3–6 words). Count occurrences per theme.

6. For each theme, pull 1–2 representative verbatim quotes. Do not paraphrase — use the user's exact words. Anonymize by user ID if no names should appear in the vault.

7. Write a one-sentence product implication for each theme: what would the product need to do differently to shift this response from detractor to passive, or passive to promoter?

8. Write the ICP signal section. Look for patterns that distinguish promoters from detractors:
   - What product features do promoters mention positively?
   - What triggers detractor complaints?
   - Is there a use case, company size, or workflow pattern that maps to promoters?
   This section should answer: "Who is this product actually for, based on who loves it?"

9. Search the vault for related prior surveys: `sqlite3 vault.db "SELECT path, updated FROM pages WHERE path LIKE 'wiki/nps-synthesis%' ORDER BY updated DESC LIMIT 3;"`. If prior syntheses exist, compare: is the NPS trending up, down, or flat? Have recurring themes from prior periods been addressed?

10. Search the vault for spec pages related to top detractor themes: `sqlite3 vault.db "SELECT path, title FROM pages_fts WHERE pages_fts MATCH '<theme_keyword>' LIMIT 3;"`. Link related specs with [[wikilinks]] in the "Recommended Actions" section.

11. Write a "What not to act on" section. Single-instance requests, requests that contradict your ICP, or requests that would require pivoting a core design decision — call them out explicitly and explain why they're not actionable.

12. Save to `wiki/nps-synthesis-YYYY-MM.md`.

## Output format

```yaml
---
type: wiki
title: "NPS Synthesis — [Month YYYY]"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: draft
tags: [nps, survey, feedback, product, cpo]
sources: [google-drive, vault]
period: "YYYY-MM"
survey_type: "[nps/csat/open-ended/mixed]"
response_count: N
nps_score: N
---
```

```markdown
# NPS Synthesis — [Month YYYY]

> Survey type: [type] | Responses: N | Period: [period]
> NPS Score: [N] (Promoters: N% | Passives: N% | Detractors: N%)
> *[Flag if N < 20: low sample — treat directionally, not statistically.]*

---

## Promoter Themes (score 9–10)

### 1. [Theme Name] (N mentions)
**Product implication:** [One sentence]

> "[Verbatim quote]" — User #XX
> "[Verbatim quote]" — User #XX

---

## Detractor Themes (score 0–6)

### 1. [Theme Name] (N mentions)
**Product implication:** [One sentence]

> "[Verbatim quote]" — User #XX

---

## ICP Signal

**Who loves this product:**
[Description of the promoter profile — use case, workflow, sophistication level.]

**Who struggles:**
[Description of the detractor profile — what they were expecting vs. what they got.]

**Implication for product-market fit:**
[Honest read on what this distribution tells you about fit.]

---

## Recommended Actions

| Priority | Theme | Action | Spec |
|----------|-------|--------|------|
| 1 | [Detractor theme] | [What to build or change] | [[spec-slug]] |
| 2 | [Detractor theme] | [Action] | [Create new spec] |

---

## What Not to Act On

- **[Request]:** [Why — one sentence. Contradicts ICP, single instance, out of scope for current stage.]

---

## Trend vs. Prior Periods

[If prior syntheses exist: NPS direction, whether recurring themes have been addressed.
Cite [[nps-synthesis-prior-month]] with wikilink.]
```

## Example output (truncated)

```markdown
# NPS Synthesis — April 2026

> Survey type: NPS | Responses: 28 | Period: April 2026
> NPS Score: 31 (Promoters: 46% | Passives: 39% | Detractors: 14%)
> *Low sample — treat directionally, not statistically.*

---

## Promoter Themes (score 9–10)

### 1. Second brain that actually knows my business (6 mentions)
**Product implication:** The vault-as-persistent-context is the core value prop. Anything
that weakens context persistence will hurt retention with our promoters.

> "It's the first AI tool that actually remembers what I told it last week.
  That changes everything." — User #03
> "I stopped keeping a separate Notion because the vault does it better." — User #11

---

## Detractor Themes (score 0–6)

### 1. Takes too long to get working (4 mentions)
**Product implication:** Activation friction is the primary churn driver.
Related: [[spec-onboarding-fast-path]], [[onboarding-analysis-2026-04]]

> "I really wanted this to work but I spent 2 hours setting it up and it still
  didn't connect to my calendar properly." — User #22

---

## ICP Signal

**Who loves this product:** Founders who already keep structured notes, who have tried
and abandoned other AI tools, and who are building for the long term. They treat the
vault as infrastructure, not as a feature.

**Who struggles:** Founders who want immediate output with no setup investment.
They arrive expecting a chatbot and encounter a system that requires configuration.
The product currently makes them wrong to expect that — the onboarding experience
confirms the chatbot expectation before the setup process corrects it.

**Implication for product-market fit:** Fit is real but narrow. The fast-path
onboarding work is essential to widen it — not by changing the product's fundamental
model, but by earning trust before asking for configuration time.
```
