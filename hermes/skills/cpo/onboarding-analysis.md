---
name: onboarding-analysis
description: Identify where users drop off in the onboarding flow and what the friction points indicate about product, messaging, and expectation gaps.
version: 1.0.0
trigger:
  - "onboarding analysis"
  - "where do users drop off"
  - "analyze onboarding"
  - "onboarding funnel"
  - "onboarding drop-off"
  - "why aren't users completing setup"
  - "activation analysis"
  - "where do people quit during onboarding"
  - "onboarding friction"
integrations:
  - vault-sqlite-fts5
  - mixpanel-amplitude-manual-fallback
inputs:
  - name: product_name
    description: Name of the product being analyzed (used to contextualize the analysis)
    required: true
  - name: onboarding_steps
    description: The steps in the onboarding flow, in order — as a list or description. Required if analytics data is not available.
    required: false
  - name: analytics_data
    description: Raw analytics export (CSV paste or plain-text funnel summary) from Mixpanel, Amplitude, or another tool. If not available, the skill runs on qualitative data only.
    required: false
  - name: time_period
    description: Time period for the analysis, e.g. "April 2026" or "last 30 days"
    required: true
output_artifact: "wiki/onboarding-analysis-YYYY-MM.md"
frequency: on-demand
pack: cpo
---

# Onboarding Analysis

## When to run

Monthly, or any time activation metrics dip. Run it before building new onboarding features — you need to know where users are dropping before you decide what to change. Run it after shipping an onboarding update to measure whether the change moved the needle.

The output of this skill is not a feature list. It's a diagnosis. "Users drop at step 3" tells you where the problem is. The skill's job is to tell you why.

## What you'll get

A structured analysis of your onboarding funnel with drop-off rates per step (if analytics data is available), qualitative signal from your vault, and a prioritized list of hypotheses about what's causing the drop-off. Each hypothesis maps to a testable intervention. The page is saved to your vault and feeds directly into the backlog prioritization and roadmap narrative skills.

## Steps

1. Collect available data:

   **Analytics data (primary — if available):**
   If `analytics_data` is provided: parse it as a funnel. Each step should yield: step name, users who reached the step, users who completed the step, and drop-off rate (%). If the data is raw CSV, extract these four columns. If it's a plain-text summary, parse accordingly.

   If Mixpanel or Amplitude is configured via API (NTH): fetch the onboarding funnel report for `time_period`. Pull step-level conversion rates.

   If no analytics data is available: proceed in qualitative-only mode. Flag the output as qualitative and note that drop-off rates are inferred, not measured.

   **Qualitative data from vault:**
   `sqlite3 vault.db "SELECT path, title, snippet(pages_fts, 0, '', '', '...', 25) FROM pages_fts WHERE pages_fts MATCH 'onboarding OR setup OR activation OR first OR getting started' LIMIT 10;"`. Pull feedback synthesis pages, user interview notes, and support ticket logs. Extract all direct quotes related to onboarding.

2. If `onboarding_steps` is not provided: search the vault for a spec or flow description: `sqlite3 vault.db "SELECT path, title FROM pages_fts WHERE pages_fts MATCH 'onboarding spec OR setup flow' LIMIT 3;"`. If not in vault, infer steps from the analytics data step labels.

3. Map the funnel. For each step:
   - Step name
   - Entry count (from analytics or inferred)
   - Completion count
   - Drop-off rate
   - Qualitative signal from vault (user quotes, support tickets referencing this step)

4. Identify the top drop-off point: the step with the highest absolute drop-off count (not just rate). This is the highest-leverage place to intervene.

5. For the top 3 drop-off points, generate 2–3 hypotheses per step. A hypothesis has three parts:
   - **Observation:** what the data shows
   - **Hypothesis:** why it might be happening
   - **Test:** what change would confirm or disconfirm the hypothesis

   Base hypotheses on: the vault's qualitative signal, standard activation patterns (clarity gaps, cognitive load, integration friction, expectation mismatch), and any prior attempts to fix this step.

6. Write a "What the data isn't showing" section. Drop-off data tells you where users leave; it doesn't tell you who continues. Look at the users who did complete onboarding — what do they have in common? Search vault for any notes on activated users.

7. Search the vault for any prior onboarding analysis pages: `sqlite3 vault.db "SELECT path, updated FROM pages WHERE path LIKE 'wiki/onboarding-analysis%' ORDER BY updated DESC LIMIT 3;"`. If prior analyses exist, compare the top drop-off point this month vs. prior months. Is it improving, stagnant, or getting worse?

8. Write a prioritized intervention list. Rank proposed changes by: (a) how many users they affect (top drop-off points first), and (b) how testable they are (clear win/loss signal in 2 weeks). Mark each with effort estimate: Low / Medium / High.

9. Link this analysis to [[backlog-prioritized]] and [[feedback-synthesis]] pages with [[wikilinks]] where relevant.

10. Save to `wiki/onboarding-analysis-YYYY-MM.md`.

## Output format

```yaml
---
type: wiki
title: "Onboarding Analysis — [Month YYYY]"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: draft
tags: [onboarding, activation, product, cpo, analysis]
sources: [analytics, vault]
product: "[product_name]"
period: "YYYY-MM"
data_mode: "[quantitative / qualitative-only]"
---
```

```markdown
# Onboarding Analysis — [Month YYYY]

> Product: [product_name] | Period: [time_period]
> Data mode: [quantitative (N users) / qualitative-only]
> Related: [[feedback-synthesis-YYYY-MM]], [[backlog-prioritized-YYYY-MM-DD]]

## Funnel Summary

| Step | Users In | Users Out | Drop-off |
|------|----------|-----------|----------|
| [Step 1] | N | N | N% |
| [Step 2] | N | N | N% |
| ...  | ... | ... | ... |
| **Total** | N start | N complete | **N% overall** |

*[Note if data is inferred rather than measured.]*

## Top Drop-off Points

### 1. [Step Name] — [N%] drop-off

**Qualitative signal:**
> "[User quote or paraphrase]" — [source]

**Hypotheses:**

| # | Observation | Hypothesis | Test |
|---|-------------|------------|------|
| A | [What the data shows] | [Why it might be happening] | [What change to test] |
| B | [Observation] | [Hypothesis] | [Test] |

---

## What the Data Isn't Showing

[Observations about users who complete onboarding — what they have in common,
what distinguishes them from those who drop. Infer from qualitative data if
no analytics cohort segmentation is available.]

## Prioritized Interventions

| Rank | Intervention | Addresses | Users Affected | Effort | Signal Timeline |
|------|-------------|-----------|----------------|--------|-----------------|
| 1 | [Change] | [Step] | ~N users/mo | Low | 2 weeks |
| 2 | [Change] | [Step] | ~N users/mo | Medium | 4 weeks |

## Trend vs. Prior Months

[If prior analyses exist in vault: is the top drop-off point improving or not?
Cite [[onboarding-analysis-prior-month]] with wikilink.]
```

## Example output (truncated)

```markdown
# Onboarding Analysis — April 2026

> Product: Agentic OS | Period: April 2026
> Data mode: qualitative-only (no analytics integration configured)
> Related: [[feedback-synthesis-2026-04]], [[backlog-prioritized-2026-04-28]]

## Funnel Summary

| Step | Users In | Users Out | Drop-off |
|------|----------|-----------|----------|
| Signup | ~45 [inferred] | ~45 | 0% |
| Integration setup | ~45 | ~31 | 31% [inferred] |
| First skill run | ~31 | ~22 | 29% [inferred] |
| Return visit (Day 3) | ~22 | ~11 | 50% [inferred] |

*Data inferred from support tickets and user interview notes — not measured via analytics.*

## Top Drop-off Points

### 1. Integration Setup — ~31% drop-off

**Qualitative signal:**
> "I got to the Google Calendar step and just gave up. I didn't want to give it
  access to everything." — User #14, Apr 18 2026

**Hypotheses:**

| # | Observation | Hypothesis | Test |
|---|-------------|------------|------|
| A | Users stop at integration step | Permission scopes feel too broad | Reduce requested scopes; add "why we need this" copy |
| B | Users stop at integration step | The value isn't clear yet — trust isn't established | Show a demo output before asking for permissions |

## Prioritized Interventions

| Rank | Intervention | Addresses | Users Affected | Effort | Signal Timeline |
|------|-------------|-----------|----------------|--------|-----------------|
| 1 | Fast path (demo vault, skip integrations) | Integration setup | ~14 users/mo | Medium | 2 weeks post-ship |
| 2 | "Why we need this" copy on each OAuth step | Integration setup | ~14 users/mo | Low | 2 weeks |
```
