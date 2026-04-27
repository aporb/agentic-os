---
name: ai-risk-assessment
description: Structured risk assessment for a new AI use case — failure modes, data privacy concerns, hallucination risk, fallback plan, and monitoring — saved as a wiki page before the use case goes live.
version: 1.0.0
trigger:
  - "AI risk assessment"
  - "assess the risk of"
  - "risk assessment for AI use case"
  - "before I deploy this AI"
  - "what could go wrong with this AI"
  - "AI safety check"
  - "evaluate AI risk"
  - "risk profile for"
  - "what are the failure modes of"
  - "AI privacy check"
integrations:
  - vault-sqlite-fts5
inputs:
  - name: use_case_description
    description: Plain-English description of the AI use case being assessed — what it does, who triggers it, what decisions it influences
    required: true
  - name: data_accessed
    description: What data the AI reads or writes — customer PII, financial records, internal comms, public data. Be specific.
    required: true
output_artifact: "wiki/ai-risk-[use-case-slug].md"
frequency: on-demand
pack: caio
---

# AI Risk Assessment

## When to run

Before any new AI use case goes live — before you enable a cron, before you expose a skill to a client, before you give an agent write access to a new data source. This is the pre-flight checklist. It takes 5 minutes and it prevents the class of failures that are embarrassing at best and liability-creating at worst.

The risk assessment is also the document that lets you move fast with confidence. You don't slow down because you're risk-averse — you slow down because the failure modes are unexamined. Examine them first, then move fast.

## What you'll get

A structured risk profile at `wiki/ai-risk-[use-case-slug].md` covering: the failure modes specific to this use case, the data privacy surface, the hallucination risk rating and what it's based on, the fallback plan if the AI output is wrong or unavailable, and the monitoring approach that will tell you early if something goes sideways. The document is the record that this use case was reviewed before deployment.

## Steps

1. Parse `use_case_description` and `data_accessed`. Extract: what the AI produces (text, decisions, actions, data writes), who receives the output (internal only, client-facing, public), what data it reads (type, sensitivity, whether it includes PII), and what actions it takes autonomously vs. what requires human approval.

2. Check the vault for related use case pages: `sqlite3 vault.db "SELECT path, title FROM pages WHERE path LIKE 'wiki/ai-risk-%' ORDER BY updated DESC LIMIT 5;"`. If a similar use case was assessed before, read it for relevant prior findings.

3. Assess the failure modes. For this use case, identify the specific ways it can fail and what the impact is. Structure each failure mode as: trigger condition (what causes it), failure behavior (what the AI does wrong), and impact (who is affected, how bad). Categories to cover:
   - **Hallucination:** Does the AI produce factually incorrect content that gets acted on? What's the verification step?
   - **Silent failure:** Does the automation fail without producing an error or alert? What's the monitoring?
   - **Scope creep:** Could the AI interpret its instructions more broadly than intended and take actions outside its mandate?
   - **Stale context:** Does the AI rely on data that goes stale? What's the freshness requirement?
   - **Cascading failure:** If this automation fails, does it cause another automation to fail or to run on bad data?

4. Assess the data privacy surface. For each data type in `data_accessed`:
   - **PII:** Is it present? Which fields (name, email, phone, address, financial)? Is it stored, transmitted to external APIs, or only processed in-context?
   - **Vendor exposure:** Which AI providers receive this data as part of the prompt? Are there data processing agreements in place?
   - **Retention:** Does the output artifact store sensitive fields? Should any fields be masked in the wiki output?
   - **Access control:** Who can read the output artifact? Is it a wiki page accessible to all agents, or should it be restricted?

5. Rate the hallucination risk. Rate on a 3-point scale: **Low** (the AI is summarizing or formatting factual data it was explicitly given — math errors are possible, fabrication is not), **Medium** (the AI is synthesizing from multiple sources — omission errors and mischaracterization are possible), **High** (the AI is making claims about the world based on training knowledge or web search — facts can be fabricated with confidence). Explain the rating in one sentence.

6. Write the fallback plan. For each critical output this use case produces, what happens if the AI output is wrong, unavailable, or degraded? A good fallback plan answers: how does the user know something went wrong, what do they do instead, and how do they recover? If there's no fallback (the AI output is trusted and acted on without verification), flag this as a risk — it's only acceptable for Low hallucination risk use cases.

7. Write the monitoring plan. What signals will tell you early that this use case is producing bad output? Name the specific metric or check: output reviewed weekly, Telegram alert if the automation errors, human spot-check of N outputs per month, downstream metric that goes sideways if the AI is wrong.

8. Assign an overall risk rating: **Green** (deploy with standard monitoring), **Yellow** (deploy with enhanced monitoring and a defined review date), **Red** (do not deploy until specific conditions are met — list them).

9. Write the assessment to `wiki/ai-risk-[use-case-slug].md`. End with a "Sign-off" line that says the assessment was reviewed on [date] and the risk rating accepted.

## Output format

```yaml
---
type: wiki
title: "AI Risk Assessment — [Use Case Name]"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: reviewed
tags: [caio, ai-risk, [use-case-slug]]
sources: [vault, user-input]
use_case: "[use_case_description short form]"
hallucination_risk: "low|medium|high"
overall_risk: "green|yellow|red"
---
```

```markdown
# AI Risk Assessment — [Use Case Name]

> Assessed: YYYY-MM-DD. Overall risk: [GREEN / YELLOW / RED]. Hallucination risk: [Low / Medium / High].

## Use Case

[2–3 sentences. What this AI does, who triggers it, what it produces, and what happens to the output.]

## Data Accessed

| Data Type | Sensitivity | Vendor Exposure | Stored in Output? |
|-----------|-------------|----------------|-------------------|
| [type] | [PII / Internal / Public] | [provider names] | [Yes / No / Masked] |

## Failure Modes

### [Failure Mode 1]
- **Trigger:** [What causes it]
- **Behavior:** [What the AI does wrong]
- **Impact:** [Who is affected, how bad]
- **Mitigation:** [Specific control that reduces likelihood or impact]

### [Failure Mode 2]
[same structure]

## Hallucination Risk: [Low / Medium / High]

[One sentence explaining the rating.]

## Privacy Assessment

[2–4 bullets covering PII handling, vendor exposure, retention, access control]

## Fallback Plan

[If AI output is wrong or unavailable: how the user knows, what they do instead, how they recover.]

## Monitoring Plan

- [Specific check with frequency]
- [Specific alert or metric]

## Overall Risk: [GREEN / YELLOW / RED]

[2–3 sentences. Deploy conditions if Green. Conditions to meet before deploying if Red or Yellow.]

## Sign-off

Reviewed: YYYY-MM-DD. Risk rating [GREEN/YELLOW/RED] accepted. Owner: [user].
```

## Example output (truncated)

```markdown
# AI Risk Assessment — Customer Health Review Cron

> Assessed: 2026-04-20. Overall risk: YELLOW. Hallucination risk: Medium.

## Use Case

Monthly cron reads all customer pages in the vault, assesses health signals (last contact date, support ticket count, NPS score if present), and generates a customer health report. Output is a wiki page with a color-coded health status per customer. No actions are taken automatically — the output is informational only.

## Data Accessed

| Data Type | Sensitivity | Vendor Exposure | Stored in Output? |
|-----------|-------------|----------------|-------------------|
| Customer names | Internal | Claude API (Anthropic) | Yes |
| NPS scores | Internal | Claude API (Anthropic) | Yes — masked to ranges |
| Support ticket descriptions | Internal | Claude API (Anthropic) | Summarized only |

## Hallucination Risk: Medium

The AI synthesizes across multiple vault pages to infer churn risk — it can misread a normal support ticket as a churn signal or vice versa.

## Overall Risk: YELLOW

Deploy with enhanced monitoring. Condition: a human reviews the first 3 monthly outputs to calibrate the health scoring logic before treating it as reliable signal. Review date: 2026-07-01.
```
