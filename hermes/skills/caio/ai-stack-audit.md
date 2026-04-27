---
name: ai-stack-audit
description: Inventory every AI tool in the stack — what it costs, how much it was used in the last 30 days, and whether it's earning its place.
version: 1.0.0
trigger:
  - "audit my AI stack"
  - "AI stack audit"
  - "what AI tools am I paying for"
  - "AI tools review"
  - "review my AI subscriptions"
  - "which AI tools are actually being used"
  - "AI ROI audit"
  - "monthly AI tools review"
  - "what's my AI spend"
  - "cut AI tools"
integrations:
  - bash
  - vault-sqlite-fts5
inputs: []
output_artifact: "wiki/ai-stack-audit-YYYY-MM.md"
frequency: "cron:0 9 1 * *"
pack: caio
---

# AI Stack Audit

## When to run

First of every month, automatically. Also run when you're about to add a new AI tool and want a baseline before the comparison, or when you've had an unexpected charge on a card and need to know where AI spend is going.

The CAIO job is not to add tools — it's to own what's in the stack and kill what isn't earning its place. This skill forces that discipline on a calendar.

## What you'll get

A structured wiki page that captures the full AI tool inventory at a point in time: every tool, its cost, its actual 30-day usage signal, and a keep/cut/watch verdict for each. The page is stamped with the date and overwrites last month's entry, but a version history section preserves the verdicts month-over-month so you can see which tools you kept promising yourself you'd use.

The output is an operating document, not a report. You read it, act on it, and move on.

## Steps

1. List all running MCP servers to find what's connected: `bash -c "cat ~/.hermes/config.json 2>/dev/null | python3 -c 'import json,sys; d=json.load(sys.stdin); [print(k) for k in d.get(\"mcpServers\",{}).keys()]' 2>/dev/null || echo 'No MCP config found'"`. Parse the list.

2. List all active Hermes cron jobs: `bash -c "crontab -l 2>/dev/null; ls ~/.hermes/crons/ 2>/dev/null"`. Note which automations are running and which agent skills they invoke.

3. Search the vault for any prior AI stack audit pages: `sqlite3 vault.db "SELECT path, updated, substr(content,1,500) FROM pages WHERE path LIKE 'wiki/ai-stack-audit-%' ORDER BY updated DESC LIMIT 3;"`. If found, use last month's tool list as a starting point — don't start from scratch.

4. Check for LangSmith or Langfuse usage logs if available: `bash -c "ls ~/.hermes/logs/ 2>/dev/null"`. If `gateway.log` exists, parse the last 30 days of model calls: `bash -c "grep -h 'model=' ~/.hermes/logs/gateway.log 2>/dev/null | awk -F'model=' '{print $2}' | awk '{print $1}' | sort | uniq -c | sort -rn | head -20"`.

5. Check for OpenRouter usage if the API key is set: `bash -c "test -n \"$OPENROUTER_API_KEY\" && curl -s -H 'Authorization: Bearer '$OPENROUTER_API_KEY 'https://openrouter.ai/api/v1/auth/key' 2>/dev/null | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d)' || echo 'No OpenRouter key configured'"`.

6. For tools that don't have API usage data, ask the user to provide spend figures directly. Format the request as a concise list: "I need the monthly cost for each of the following — please fill in or say 'unknown': [tool list]." Do not block the full audit on this; mark unknown costs as `?` and proceed.

7. Assess ROI for each tool. For each item, answer: (a) Is it running automations that fire at least weekly? (b) Does it have an active MCP connection? (c) Is there a cheaper or free alternative that covers 90% of the same use? (d) When did you last actually use it intentionally?

8. Assign a verdict to each tool: `KEEP` (actively used, earning its cost), `WATCH` (low usage but a specific upcoming use case justifies keeping it 30 more days), `CUT` (not used or replaced by something already in the stack).

9. Write the audit page to `wiki/ai-stack-audit-YYYY-MM.md`. If a prior version exists, preserve the verdict history section from it.

10. If any tools received a `CUT` verdict, surface them prominently at the top with the estimated monthly savings from canceling.

## Output format

```yaml
---
type: wiki
title: "AI Stack Audit — YYYY-MM"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: active
tags: [ai-ops, caio, monthly-audit, ai-stack]
sources: [bash, vault, mcp-config]
period: "YYYY-MM"
---
```

```markdown
# AI Stack Audit — YYYY-MM

> Audited: YYYY-MM-DD. Next audit: YYYY-MM-01.

## Cut List (act on these)

| Tool | Monthly Cost | Verdict | Reason |
|------|-------------|---------|--------|
| [tool] | $X | CUT | [one sentence] |

Canceling the above saves **$X/month**.

## Full Stack

| Tool | Category | Monthly Cost | 30-Day Usage Signal | Verdict |
|------|----------|-------------|--------------------|---------| 
| Hermes Agent | Orchestration | $0 (self-hosted) | [N cron runs, N manual triggers] | KEEP |
| Claude API | LLM | $X | [N calls, avg Xk tokens/call] | KEEP |
| OpenRouter | LLM routing | $X | [N calls, top models: X, Y] | KEEP |
| LangSmith | Observability | $X | [last used: YYYY-MM-DD] | WATCH |
| [tool] | [category] | $? | [unknown — needs manual input] | WATCH |

## MCP Servers Active

[Bulleted list from config — name, what it connects to]

## Active Cron Jobs

[Bulleted list — skill name, schedule, last run]

## Verdict History

| Month | Tools | Monthly Spend | Cut |
|-------|-------|--------------|-----|
| [prior months from vault] | N | $X | [tools cut] |

## Notes

[Anything that doesn't fit the table — a tool mid-trial, a price change coming, a replacement being evaluated]
```

## Example output (truncated)

```markdown
# AI Stack Audit — 2026-04

> Audited: 2026-04-01. Next audit: 2026-05-01.

## Cut List (act on these)

| Tool | Monthly Cost | Verdict | Reason |
|------|-------------|---------|--------|
| Zapier | $49 | CUT | All active zaps are now covered by Hermes crons — zero Zapier runs in March |

Canceling the above saves **$49/month**.

## Full Stack

| Tool | Category | Monthly Cost | 30-Day Usage Signal | Verdict |
|------|----------|-------------|--------------------|---------| 
| Hermes Agent | Orchestration | $0 | 847 total runs (cron + manual) | KEEP |
| Claude API (Sonnet 4.6) | LLM | $38 | 1,240 calls, avg 4.2k tokens | KEEP |
| OpenRouter | LLM routing | $12 | 340 calls — gemini-flash, gpt-4o | KEEP |
| LangSmith | Observability | $39 | Last active trace: 2026-03-08 | WATCH |

## MCP Servers Active

- google-calendar: read/write access to primary calendar
- gmail: read + draft create
- google-drive: read + create in /vault
- github: read-only on aporb/agentic-os

## Active Cron Jobs

- daily-standup: Mon–Fri 8am — last run 2026-04-01
- pipeline-health-report: Monday 8am — last run 2026-03-31
- ai-stack-audit: 1st of month 9am — running now
```
