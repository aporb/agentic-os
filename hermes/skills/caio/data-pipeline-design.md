---
name: data-pipeline-design
description: Spec how data flows from a source system (Stripe, HubSpot, Gmail, etc.) into agent context — triggers, transforms, storage, and freshness — saved as a DAG-style document.
version: 1.0.0
trigger:
  - "design a data pipeline"
  - "data pipeline design"
  - "how do I get data from"
  - "connect Stripe to my agent"
  - "pipe data into agent context"
  - "data flow spec"
  - "how should data flow from"
  - "set up a data feed from"
  - "build a pipeline from"
  - "data ingestion design"
integrations:
  - vault-sqlite-fts5
  - bash
inputs:
  - name: source_system
    description: The data source — e.g. "Stripe", "HubSpot", "Gmail", "Google Sheets", "Linear", "Airtable", "webhook payload from Typeform"
    required: true
  - name: target_use_case
    description: What the agent will do with the data — e.g. "weekly revenue summary", "deal stage updates in pipeline report", "trigger an alert when a payment fails"
    required: true
output_artifact: "wiki/data-pipeline-[slug].md"
frequency: on-demand
pack: caio
---

# Data Pipeline Design

## When to run

When you've identified a data source that would make an existing skill meaningfully more accurate or more automatic, but you don't know how to wire it in. When you're building a new reporting or alerting workflow and the data needs to flow from a SaaS tool into the vault or directly into agent context. When an automation is currently manual-input-dependent and you want to eliminate that friction.

The data pipeline is the infrastructure that makes skills reliable. A skill that depends on manual data paste degrades — you skip it when busy. A skill that pulls from a live source runs every time.

## What you'll get

A DAG-style spec at `wiki/data-pipeline-[slug].md` that documents: the source and what data it exposes, the trigger mechanism (cron pull, webhook push, or on-demand fetch), the transform logic (what fields are extracted, how they're shaped), the storage target (vault page, flat file, environment variable), and the freshness contract (how stale is too stale for the target use case). The spec is written to be implementable — either directly by the user or handed to a CTO Pack skill for implementation.

## Steps

1. Check whether a pipeline spec already exists for this source system and use case: `sqlite3 vault.db "SELECT path, title, updated FROM pages WHERE path LIKE 'wiki/data-pipeline-%' AND pages MATCH '[source_system]' ORDER BY updated DESC LIMIT 5;"`. If a close match exists, read it and scope this spec to what's different.

2. Identify the data exposure mechanism for `source_system`. Work through the options in order of preference:
   - **MCP server:** Does an MCP server exist for this source? Check the vault and known MCP registries. If yes, what methods does it expose?
   - **REST API:** Does the source have a REST API accessible via bash curl? What authentication does it require (API key, OAuth, basic auth)?
   - **CSV/JSON export:** Can data be exported manually and dropped into a known path for the agent to read?
   - **Webhook:** Can the source push events to a Hermes webhook endpoint on state changes?
   - **Email digest:** Does the source send email summaries that the Gmail MCP can parse?

3. Identify the specific data fields needed for `target_use_case`. List only the fields the use case actually requires — not every field the source exposes. Unnecessary fields add noise and token cost.

4. Design the trigger mechanism. Choose based on the use case's freshness requirement:
   - **Cron pull (periodic):** Fetch the data on a schedule. Use when the use case tolerates N-hour or N-day old data. Write the cron expression.
   - **Webhook push (event-driven):** The source notifies Hermes on each relevant state change. Use when the use case requires near-real-time data. Identify the event type and the Hermes webhook endpoint format.
   - **On-demand fetch:** Data is pulled at the moment a skill runs. Use when the skill is infrequent and live accuracy matters.

5. Design the transform logic. For each field from the source, specify: source field name → target field name, any type conversion (Unix timestamp → YYYY-MM-DD, cents → dollars, array → comma-separated string), and any filtering (only fetch records where status = "open", only the last 30 days).

6. Design the storage target. Where does the transformed data land?
   - **Vault wiki page:** Best for human-readable summaries updated on a schedule.
   - **Structured JSON file at a known path:** Best for machine-readable data that multiple skills will query.
   - **Environment variable or Hermes context injection:** Best for single scalar values (current MRR, open deal count).
   - **Direct in-context (no storage):** Best for on-demand skills where the data is fetched, used, and discarded.

7. Define the freshness contract. For `target_use_case`, what is the maximum age of data that still produces a useful output? If the data is older than this, the skill should alert rather than produce a stale report. Write the check: how old is the stored data, what does the skill do if it's too old?

8. Identify dependencies and risks. What happens if the source system is down or rate-limiting? What happens if authentication expires (see automation-failure-triage for the common failure modes)? What's the fallback — manual paste, cached prior data, or skip-and-alert?

9. Write the implementation steps. Based on the trigger mechanism and storage target, write numbered bash commands or MCP calls that implement the pipeline at a minimal working level. Include the exact API endpoint, auth header format, and jq/python3 transform command.

10. Write the spec to `wiki/data-pipeline-[slug].md`. End with an "Implementation status" section: Not started / In progress / Live. Note which skills depend on this pipeline once it's live.

## Output format

```yaml
---
type: wiki
title: "Data Pipeline — [Source] → [Use Case]"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: draft
tags: [caio, data-pipeline, [source-slug], [use-case-slug]]
sources: [vault, user-input]
source_system: "[source_system]"
target_use_case: "[target_use_case]"
trigger_type: "[cron|webhook|on-demand]"
implementation_status: "not-started"
---
```

```markdown
# Data Pipeline — [Source] → [Use Case]

> Spec created: YYYY-MM-DD. Implementation status: Not started.

## Overview

[One paragraph. What data flows from where to where, on what schedule, for what purpose.]

## Data Source

- **System:** [source_system]
- **Mechanism:** [MCP / REST API / CSV export / webhook / email]
- **Endpoint / Method:** `[specific API endpoint or MCP method]`
- **Auth:** [API key in $ENV_VAR / OAuth / Basic / None]

## Fields Required

| Source Field | Source Type | Target Field | Transform |
|-------------|------------|--------------|-----------|
| [field] | [type] | [field] | [none / convert / filter] |

## Trigger

- **Type:** [cron / webhook / on-demand]
- **Schedule / Event:** [cron expression or event name]
- **Rationale:** [Why this trigger fits the use case's freshness requirement]

## Storage Target

- **Type:** [vault page / JSON file / env var / in-context only]
- **Path / Key:** `[path or variable name]`
- **Update behavior:** [overwrite / append / merge]

## Freshness Contract

- **Max data age for use case:** [N hours / N days]
- **Staleness check:** [how the consuming skill detects stale data]
- **On stale:** [alert and skip / use cached / run anyway with warning]

## Implementation

```bash
# Step 1: [description]
[exact bash command]

# Step 2: [description]
[exact bash command]
```

## Failure Handling

| Failure Mode | Behavior | Recovery |
|-------------|----------|----------|
| [source API down] | [skip run, alert] | [manual paste fallback] |
| [auth expired] | [error logged] | [see automation-failure-triage] |

## Skills That Depend on This Pipeline

- `[pack]/[skill-name]` — [how it uses this pipeline]

## Implementation Status

Not started. Next step: [first concrete action to begin implementation].
```

## Example output (truncated)

```markdown
# Data Pipeline — Stripe → Weekly Revenue Summary

> Spec created: 2026-04-22. Implementation status: Not started.

## Overview

Weekly cron pulls MRR, new MRR, churned MRR, and active customer count from the Stripe API on Friday at 4pm. Stores the result as a structured JSON file at `~/.hermes/data/stripe-weekly.json`. The weekly-operating-review skill reads this file each Friday to populate the revenue section of the operating brief.

## Data Source

- **System:** Stripe
- **Mechanism:** REST API
- **Endpoint:** `GET https://api.stripe.com/v1/subscriptions?status=active&limit=100`
- **Auth:** API key in `$STRIPE_SECRET_KEY`

## Fields Required

| Source Field | Source Type | Target Field | Transform |
|-------------|------------|--------------|-----------|
| `plan.amount` | integer (cents) | `mrr_cents` | none |
| `created` | Unix timestamp | `created_date` | timestamp → YYYY-MM-DD |
| `status` | string | `status` | filter: active only |

## Freshness Contract

- **Max data age:** 7 days
- **Staleness check:** If `stripe-weekly.json` modified time > 8 days ago, weekly-operating-review alerts "Revenue data stale — Stripe pipeline may have failed"
```
