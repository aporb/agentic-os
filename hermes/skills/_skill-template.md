---
name: skill-name
description: One-sentence description of what this skill does.
version: 1.0.0
trigger:
  - "natural-language phrase the user might say"
  - "another phrase"
  - "5–8 phrases total — be exhaustive because users won't remember pack names"
integrations:
  - <integration-name>     # e.g. google-calendar-read, web-search-ddgr-gogcli, vault-search-fts5
inputs:
  - name: <input_name>
    description: <what user provides>
    required: true
output_artifact: <relative path, e.g. "wiki/skill-output-[slug].md">
frequency: on-demand    # or "cron:0 8 * * 1-5" or "on-demand-or-cron"
pack: <ceo|cro|cmo|cpo|cto|caio|cfo>
---

# Skill Title

## When to run

A few sentences naming the moment in the user's week when this skill earns its keep. Practitioner voice — describe the situation, not the feature.

## What you'll get

The artifact's shape and the leverage it delivers. What becomes possible
that wasn't possible before? (Not "what gets faster.")

## Steps

1. Specific, ordered instructions the agent reads and follows.
2. Reference integrations explicitly (e.g. "Read calendar events for the next 7 days via Google Calendar MCP").
3. Reference vault interactions (e.g. "Search wiki via SQLite FTS5 for related pages tagged with the company's domain").
4. Apply anti-AI-voice rules where the skill produces public-facing content.

## Output format

```markdown
---
type: wiki
title: "..."
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: draft
sources: []
tags: []
---

# Output title

## Section 1
## Section 2
```

## Example output (truncated)

A 15–30 line example showing what good output looks like for this skill.
