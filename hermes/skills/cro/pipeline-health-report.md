---
name: pipeline-health-report
description: Deal-by-deal pipeline status report — stage, age, risk flags, and probability-weighted forecast against your target.
version: 1.0.0
trigger:
  - "pipeline report"
  - "pipeline health"
  - "how is my pipeline"
  - "deal status report"
  - "weekly pipeline review"
  - "forecast this week"
  - "what's in my pipeline"
  - "pipeline check"
inputs:
  - name: as_of_date
    description: Date for the report — defaults to today
    required: false
  - name: pipeline_data
    description: "Manual input mode: paste your pipeline as a table, CSV, or plain description. Accepted formats: Google Sheets content (paste directly), a plain list of deals with stage and value, or a brief verbal description. HubSpot API is NTH — see Steps for fallback."
    required: false
  - name: monthly_target
    description: Your revenue target for the current month or quarter — used to calculate forecast vs. target gap
    required: false
output_artifact: wiki/pipeline-{YYYY-MM-DD}.md
frequency: on-demand-or-cron
cron: "0 8 * * 1"
pack: cro
---

## When to run

Run every Monday morning as your weekly pipeline meeting with yourself. This is the forcing function that keeps deals from quietly aging off your radar while you're busy with delivery.

The report answers three questions: Which deals moved last week? Which deals are stalled and why? What does the weighted forecast say vs. the target?

**v1 runs in manual input mode.** HubSpot is a nice-to-have integration (NTH) that, when connected, replaces manual input with a live pull. Until then, paste your pipeline data as described below. 5–10 minutes of paste time produces a full analysis.

## What you'll get

A wiki page saved to `wiki/pipeline-{YYYY-MM-DD}.md` with:

- Deal-by-deal status table: stage, value, age in stage, days since last activity
- Risk flags: deals that are stalled, aging, or missing a named next step
- Probability-weighted forecast (your estimate, not a black-box algorithm)
- Gap to target: what needs to close to hit the month/quarter number
- Weekly action list: the 3 deals that need a touch this week, and why

If the cron fires on Monday morning without a `pipeline_data` input, it posts a Telegram prompt to the user asking them to paste their pipeline. It does not silently generate an empty report.

## Steps

### Manual Input Mode (v1 default)

1. **Parse pipeline data.** Accept the input from `pipeline_data` in any of these formats:
   - **Google Sheets paste:** columns typically include Company, Stage, Deal Value, Last Activity, Notes. Parse the tab-separated text.
   - **Plain list:** "Acme Corp — Proposal Sent — $12,000 — last contact April 10." Parse line-by-line.
   - **Verbal description:** "I have 4 deals: Acme at $12K in negotiation, Meridian at $8K proposal stage, two others at discovery." Extract structured data.
   If no data is provided and this is a cron run, send a Telegram message: "It's Monday pipeline time. Paste your deals and I'll generate the report." Halt and wait.

2. **Enrich from vault.** For each deal named in the pipeline data, query `vault.db` for a matching `wiki/prospect-{slug}.md`. Pull: last activity log entry date, deal stage from intel card, any open questions or risk flags noted in the card. This fills in context the paste alone won't have.

3. **Compute deal metrics.** For each deal:
   - `age_in_stage`: days since the deal entered its current stage (use last contact date from intel card or pipeline data)
   - `last_activity`: days since any documented touch (email, call, proposal send)
   - `risk_flag`: auto-flag any deal where `age_in_stage` > 14 days or `last_activity` > 10 days with no scheduled next step

4. **Apply probability weights.** Standard weights by stage (user can override these in `schema/`):
   - Discovery: 20%
   - Proposal sent: 40%
   - Negotiation: 70%
   - Verbal commit: 85%
   - Closed won: 100%
   Multiply each deal value by its stage weight. Sum for weighted pipeline total.

5. **Calculate forecast vs. target.** If `monthly_target` was provided:
   - Weighted forecast vs. target: `weighted_total / monthly_target * 100`%
   - Gap: `target - weighted_total`
   - Deals needed to close to hit target: enumerate which specific deals would cover the gap if they closed

6. **Generate risk flags.** Flag deals by category:
   - **Stalled:** age in stage > 14 days, no documented activity
   - **Missing next step:** no named next step in the intel card or pipeline notes
   - **Aging proposal:** proposal sent > 10 days ago with no response
   - **Single-threaded:** only one contact identified in the intel card (decision-maker risk)

7. **Write weekly action list.** From the risk flags, select the 3 deals that need a touch this week. For each: name the deal, name the specific action (send the follow-up sequence, re-engage with a new angle, ask for a decision), and link to the relevant skill to run.

8. **Write and save wiki page.** Save to `wiki/pipeline-{YYYY-MM-DD}.md` with full frontmatter. Mark `status: reviewed` (it's an operational report, not a draft).

9. **Confirmation.** Return a Telegram-friendly summary (5 lines max) for delivery if the report was cron-triggered. Return the full wiki path for reference.

### HubSpot Mode (NTH — when integration is configured)

Steps 1–2 are replaced by:
1. Call HubSpot API (`GET /crm/v3/deals`) to retrieve all open deals with stage, value, last modified date, associated contacts.
2. For each deal, call `GET /crm/v3/deals/{id}/associations/contacts` to pull contact names and pull any recent notes from `GET /crm/v3/objects/notes`.
3. Continue from step 3 with enriched data.

## Output format

```markdown
---
type: wiki
title: "Pipeline Health Report — {YYYY-MM-DD}"
created: {YYYY-MM-DD}
status: reviewed
tags: [pipeline, cro, report]
as_of: "{YYYY-MM-DD}"
total_open_deals: {n}
weighted_forecast: ${amount}
monthly_target: ${amount}
---

# Pipeline Health Report — {YYYY-MM-DD}

## Summary
- Open deals: {n} | Total value: ${gross} | Weighted forecast: ${weighted}
- Target: ${target} | Gap: ${gap} ({pct}% covered)
- Deals at risk: {n}

## Deal Status Table

| Deal | Stage | Value | Age in Stage | Last Activity | Risk |
|------|-------|-------|--------------|---------------|------|
| {name} | {stage} | ${value} | {n} days | {n} days ago | {flag or —} |

## Risk Flags
**Stalled deals:**
- {Deal}: {n} days in {stage} with no documented activity

**Missing next step:**
- {Deal}: proposal sent {n} days ago, no reply documented

## Forecast vs. Target
| | Amount |
|-|--------|
| Weighted pipeline | ${amount} |
| Monthly target | ${target} |
| Gap | ${gap} |
| Deals that would close the gap | {Deal A} (${value}) + {Deal B} (${value}) |

## This Week's Action List
1. **{Deal}** — {specific action} → run `{skill-name}`
2. **{Deal}** — {specific action}
3. **{Deal}** — {specific action}
```

## Example output

```markdown
---
type: wiki
title: "Pipeline Health Report — 2026-04-27"
created: 2026-04-27
status: reviewed
tags: [pipeline, cro, report]
as_of: "2026-04-27"
total_open_deals: 4
weighted_forecast: 19400
monthly_target: 30000
---

# Pipeline Health Report — 2026-04-27

## Summary
- Open deals: 4 | Total value: $42,000 | Weighted forecast: $19,400
- Target: $30,000 | Gap: $10,600 (65% covered)
- Deals at risk: 2

## Deal Status Table

| Deal | Stage | Value | Age in Stage | Last Activity | Risk |
|------|-------|-------|--------------|---------------|------|
| Meridian Logistics | Proposal Sent | $18,000 | 11 days | 11 days ago | Aging proposal |
| Acme Corp | Negotiation | $12,000 | 4 days | 2 days ago | — |
| Thornfield Media | Discovery | $8,000 | 3 days | 3 days ago | — |
| Vertex Partners | Discovery | $4,000 | 19 days | 19 days ago | Stalled |

## Risk Flags
**Stalled deals:**
- Vertex Partners: 19 days in Discovery, no activity documented

**Aging proposals:**
- Meridian Logistics: proposal sent 11 days ago, no response documented

## Forecast vs. Target
| | Amount |
|-|--------|
| Weighted pipeline | $19,400 |
| Monthly target | $30,000 |
| Gap | $10,600 |
| Deals that would close the gap | Meridian ($18K × 40% = $7,200) + Acme ($12K × 70% = $8,400) |

## This Week's Action List
1. **Meridian Logistics** — 11 days since proposal, no reply. Run `follow-up-sequence`.
2. **Vertex Partners** — 19 days stalled in Discovery. Re-engage or disqualify.
3. **Thornfield Media** — Send discovery call notes recap and propose next meeting.
```
