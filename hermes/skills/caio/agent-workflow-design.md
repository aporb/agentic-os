---
name: agent-workflow-design
description: Spec a new multi-step Hermes automation — trigger, skills loaded, prompt, delivery target — and save it as a workflow spec ready to instantiate.
version: 1.0.0
trigger:
  - "design a workflow"
  - "create a new automation"
  - "spec a Hermes workflow"
  - "I want to automate"
  - "build a cron job for"
  - "set up a recurring agent"
  - "new agent workflow"
  - "automate this process"
  - "workflow spec"
  - "build a webhook handler"
integrations:
  - vault-sqlite-fts5
  - bash
inputs:
  - name: workflow_goal
    description: Plain-English description of what the workflow should accomplish — the outcome, not the steps
    required: true
  - name: trigger
    description: What kicks it off — cron schedule (e.g. "Monday 9am"), webhook event, or manual
    required: true
  - name: delivery_target
    description: Where the output goes — Telegram, Gmail draft, wiki page, Slack, or stdout
    required: false
output_artifact: "wiki/workflow-spec-[slug].md"
frequency: on-demand
pack: caio
---

# Agent Workflow Design

## When to run

When you've noticed a recurring task that follows a predictable pattern and you're tired of triggering it manually. Also when you're designing a new reporting cadence, a new monitoring loop, or a new input-to-output pipeline for data coming from an external source (a webhook, an API, an inbound email).

The output of this skill is the input to creating a new Hermes cron or webhook handler. It's a spec, not the automation itself — that's by design. You review the spec before anything runs. The gap between "I want to automate this" and "here's exactly what the agent will do, step by step, with every decision point explicit" is where most automations fail. This skill closes that gap.

## What you'll get

A structured workflow spec file saved to `wiki/workflow-spec-[slug].md`. The spec is written at the level of detail that a Hermes cron config can be built from it directly — or handed to another agent to build. It includes the trigger, the skill sequence, the prompt the agent will receive, where context is loaded from, what the output looks like, and what happens when something fails.

After you approve the spec, the next step is instantiating it as an actual cron entry in `~/.hermes/crons/` or a webhook registration in the Hermes config.

## Steps

1. Parse `workflow_goal` and `trigger`. Identify the workflow class: (a) periodic reporting — runs on schedule, pulls data, produces a summary; (b) event-driven processing — responds to an incoming signal, processes it, routes output; (c) monitoring loop — checks for a condition, fires if condition is met; (d) multi-stage pipeline — output of one skill is input to next.

2. Search the vault for related workflows already spec'd: `sqlite3 vault.db "SELECT path, title FROM pages WHERE path LIKE 'wiki/workflow-spec-%' AND pages MATCH 'trigger OR cron OR webhook' ORDER BY updated DESC LIMIT 10;"`. If a similar workflow exists, read it and call out what differs — this prevents duplicating logic that already runs.

3. Search the vault for the skills likely to be involved: `sqlite3 vault.db "SELECT path, title FROM pages WHERE path LIKE 'skills/%' ORDER BY path;"`. Cross-reference against `workflow_goal` to identify which existing skills the workflow should load. If a needed skill doesn't exist, flag it — this is where skill-file-authoring gets called after the spec is approved.

4. Draft the trigger block. For cron: convert the plain-English schedule to a cron expression. For webhook: identify the source system (GitHub, Stripe, HubSpot, Zapier), the event type, and the payload fields the workflow needs. For manual: define the invocation command and required arguments.

5. Draft the context-loading sequence. In what order does the agent load context before executing? Typical sequence: (1) load relevant vault pages via FTS5; (2) call external APIs for live data; (3) read logs or file system state if relevant. Be specific about each step — what query, what API endpoint, what file path.

6. Draft the core prompt the agent will receive. This is the most important part of the spec. Write it as if you're writing the actual system prompt the cron job will send. It should be BLUF, specific, and include the output format the agent should produce.

7. Draft the delivery block. Where does the output go? If Telegram: which chat ID, what message format (markdown, plain text, truncated to X chars). If wiki page: what path, what frontmatter, whether to overwrite or append. If Gmail draft: subject line format, recipient. If stdout only: say so.

8. Draft the failure handling block. What should happen if the workflow fails? (a) Retry logic — how many times, with what backoff. (b) Failure notification — Telegram alert with the error. (c) Graceful degradation — what partial output is better than no output.

9. Estimate the token cost per run. Based on the context loaded and the expected output length, estimate the Claude API cost per execution. For weekly workflows this is usually negligible; for daily workflows running on expensive models it can add up.

10. Write the spec to `wiki/workflow-spec-[slug].md`. End with a "Next steps" section listing exactly what needs to happen for this workflow to go live: spec review, any missing skills, cron config entry, test run.

## Output format

```yaml
---
type: wiki
title: "Workflow Spec — [Workflow Name]"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: draft
tags: [caio, workflow-spec, [trigger-type]]
sources: [vault]
slug: "[workflow-slug]"
trigger_type: "[cron|webhook|manual]"
estimated_cost_per_run: "$X.XX"
---
```

```markdown
# Workflow Spec — [Workflow Name]

> Status: DRAFT — review before instantiating. Created: YYYY-MM-DD.

## Goal

[One paragraph. The outcome this workflow produces and why it matters.]

## Trigger

- **Type:** [cron / webhook / manual]
- **Schedule / Event:** [cron expression or webhook event name]
- **Invocation:** `[command or endpoint]`

## Skills Loaded

1. `[pack]/[skill-name]` — [why this skill, what it contributes]
2. `[pack]/[skill-name]` — [why this skill, what it contributes]

## Context Loading Sequence

1. [Vault FTS5 query — what pages, what query]
2. [External API call — endpoint, auth, what fields to extract]
3. [File system read — what path, what to parse]

## Agent Prompt

```
[The exact prompt the agent will receive. Written to be copied directly into the cron config.]
```

## Output

- **Artifact:** `[path]`
- **Delivery:** [Telegram / wiki / Gmail draft / stdout]
- **Format:** [description or link to output format spec]

## Failure Handling

- **Retry:** [N times, X-second backoff]
- **On failure:** Telegram alert to [chat_id] with error summary
- **Degradation:** [what partial output to produce if full run fails]

## Estimated Cost

- **Per run:** ~$X.XX (Claude [model], ~Xk tokens in + Xk tokens out)
- **Per month ([frequency]):** ~$X.XX

## Next Steps

- [ ] Review this spec
- [ ] Author missing skills: [list if any]
- [ ] Add cron entry to `~/.hermes/crons/[slug].yaml`
- [ ] Run once manually to validate output
- [ ] Enable on schedule
```

## Example output (truncated)

```markdown
# Workflow Spec — Monday Pipeline Brief

> Status: DRAFT — review before instantiating. Created: 2026-04-07.

## Goal

Every Monday at 8am, pull the current state of all open deals from the HubSpot wiki pages, generate a pipeline health summary, and send a 3-paragraph Telegram message with the deal count, total weighted value, and top 3 at-risk deals. This replaces the manual Monday morning pipeline check.

## Trigger

- **Type:** cron
- **Schedule / Event:** `0 8 * * 1` (Monday 8:00am)
- **Invocation:** `hermes run cro/pipeline-health-report`

## Skills Loaded

1. `cro/pipeline-health-report` — core skill; pulls deal data and produces the pipeline brief

## Context Loading Sequence

1. FTS5 query: `WHERE path LIKE 'wiki/prospect-%' AND pages MATCH 'stage:' ORDER BY updated DESC`
2. FTS5 query: `WHERE path = 'wiki/icp-current.md'` — ICP for risk scoring

## Agent Prompt

```
Today is [DATE]. Generate a Monday morning pipeline brief. Load all open deal pages from the vault. For each deal, extract: stage, last contact date, deal value, and any risk flags noted in the page. Produce a pipeline health report following the pipeline-health-report output format. After the report, write a 3-paragraph Telegram summary (max 400 chars total) with: (1) total deal count and weighted value, (2) top 3 deals to move this week, (3) top 2 at-risk deals.
```

## Output

- **Artifact:** `wiki/pipeline-YYYY-MM-DD.md`
- **Delivery:** Telegram (primary) + wiki page
- **Format:** pipeline-health-report output format + Telegram summary block

## Estimated Cost

- **Per run:** ~$0.04 (Claude Sonnet, ~8k tokens in + 2k tokens out)
- **Per month (4 runs):** ~$0.16
```
