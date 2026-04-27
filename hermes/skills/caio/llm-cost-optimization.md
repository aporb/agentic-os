---
name: llm-cost-optimization
description: Parse LangSmith, Langfuse, or OpenRouter usage data to identify expensive prompts, over-provisioned models, and missing caching opportunities — with a prioritized list of cuts and their estimated savings.
version: 1.0.0
trigger:
  - "optimize LLM costs"
  - "LLM cost report"
  - "reduce API costs"
  - "why is my Claude bill high"
  - "LLM cost optimization"
  - "which prompts are expensive"
  - "where am I wasting tokens"
  - "cut AI API costs"
  - "prompt cost analysis"
  - "over-provisioned models"
integrations:
  - bash
  - vault-sqlite-fts5
inputs:
  - name: time_period
    description: The period to analyze — e.g. "last 30 days", "March 2026", "last 7 days". Defaults to last 30 days.
    required: false
  - name: usage_csv
    description: Paste raw CSV from LangSmith, Langfuse, or OpenRouter usage export. If omitted, the skill reads from Hermes gateway logs directly.
    required: false
output_artifact: "wiki/llm-cost-report-YYYY-MM.md"
frequency: "cron:0 9 1 * *"
pack: caio
---

# LLM Cost Optimization

## When to run

Monthly, on the first, alongside the AI stack audit. Also run when you notice a cost spike on an API dashboard, or when you're about to commit a high-frequency workflow to a production model and want to know what it'll actually cost at scale.

LLM cost is not a fixed overhead — it's variable, and the variables are within your control. Prompt length, model choice, caching configuration, and output length are all levers. This skill reads your actual usage data and tells you which levers have the most pull.

## What you'll get

A prioritized list of cost optimizations with estimated monthly savings for each. Each item names the specific prompt or workflow, what the problem is (token overuse, wrong model, no caching), and the specific fix. The list is sorted by estimated savings descending so the first item is the highest-leverage action.

The output lives at `wiki/llm-cost-report-YYYY-MM.md` and is updated monthly. It also feeds the AI stack audit if that skill runs after it.

## Steps

1. Determine the data source. Check in this order:
   - If `usage_csv` is pasted: parse it directly. Detect the schema (LangSmith, Langfuse, or OpenRouter) from column headers.
   - If no CSV: check for Hermes gateway logs: `bash -c "ls -la ~/.hermes/logs/gateway.log 2>/dev/null"`. If the log exists, parse it for the time period: `bash -c "grep -h '$(date -d "30 days ago" +%Y-%m-%d)\|$(date +%Y-%m-%d)' ~/.hermes/logs/gateway.log 2>/dev/null | head -200"`.
   - If no logs: tell the user to export a usage CSV from their provider dashboard and paste it. Provide the exact URL: LangSmith (smith.langchain.com → Usage), Langfuse (cloud.langfuse.com → Settings → Usage), OpenRouter (openrouter.ai/account → Usage).

2. Parse the usage data into a normalized format. For each call or trace, extract: timestamp, model used, prompt tokens, completion tokens, total cost, and the prompt name or tag if available.

3. Aggregate by model. Calculate: total spend per model, total calls per model, average tokens per call per model, average cost per call per model. Identify any model that accounts for >20% of total spend.

4. Aggregate by prompt or workflow. If traces are tagged (LangSmith run names, Langfuse trace names), group by tag. If untagged, group by approximate prompt length buckets (short: <500 tokens, medium: 500–2000, long: >2000). Identify the top 5 most expensive prompts or workflow patterns.

5. Check for caching opportunities. For each high-frequency prompt pattern, check: (a) Does the prompt have a static system prompt prefix that could be cached? (b) Does it load the same vault context repeatedly? (c) Does Anthropic prompt caching apply (>1024 tokens, repeated prefix)? Mark each as "cacheable" or "not cacheable" with the reason.

6. Check for model over-provisioning. For each task type and model combination, ask: is there a cheaper model in the stack that has benchmarked adequately for this task type? Check the vault for any model benchmark pages: `sqlite3 vault.db "SELECT path, title FROM pages WHERE path LIKE 'wiki/model-benchmark-%' ORDER BY updated DESC;"`. If a benchmark exists showing a cheaper model is viable, flag the over-provisioned workflow.

7. Check for prompt bloat. For any prompt averaging >3000 tokens in, scan the vault for the corresponding skill file to see what context loading it does: `sqlite3 vault.db "SELECT content FROM pages WHERE path LIKE 'skills/%' AND pages MATCH '[workflow_name]' LIMIT 1;"`. Identify context loaded on every run that could be reduced (full page loads where only a summary is needed, duplicate context, unnecessary preamble).

8. Build the optimization list. Sort by estimated monthly savings, highest first. For each item, write: the issue (specific prompt/workflow, specific problem), the fix (specific action — switch model, add cache_control, reduce context to X lines), and the estimated saving (current cost - optimized cost, projected monthly).

9. Calculate the total estimated monthly savings across all items. Note how many require code changes vs. prompt changes vs. configuration changes.

10. Write to `wiki/llm-cost-report-YYYY-MM.md`. If last month's report exists, add a "vs. Prior Month" column showing whether each cost center improved, worsened, or is new.

## Output format

```yaml
---
type: wiki
title: "LLM Cost Report — YYYY-MM"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: active
tags: [caio, llm-cost, monthly]
sources: [gateway-log, langsmith-csv, openrouter-api]
period: "YYYY-MM"
total_spend: "$X.XX"
total_savings_available: "$X.XX"
---
```

```markdown
# LLM Cost Report — YYYY-MM

> Period: [start] – [end]. Total API spend: $X.XX. Savings identified: $X.XX/month.

## Priority Optimizations

| # | Issue | Workflow / Prompt | Fix | Est. Monthly Saving |
|---|-------|------------------|-----|---------------------|
| 1 | [Over-provisioned model] | [workflow] | Switch to [cheaper model] | $X.XX |
| 2 | [No prompt caching] | [prompt] | Add cache_control to system prompt | $X.XX |
| 3 | [Context bloat] | [prompt] | Reduce context load from full page to summary | $X.XX |

**Total available savings if all fixes applied: $X.XX/month ($X.XX/year)**

## Spend by Model

| Model | Calls | Avg Tokens/Call | Total Cost | % of Spend |
|-------|-------|----------------|------------|------------|
| [model] | N | X | $X.XX | X% |

## Spend by Workflow

| Workflow | Calls/Month | Avg Cost/Call | Total Cost | Caching? |
|----------|------------|--------------|------------|----------|
| [workflow] | N | $0.00X | $X.XX | [Cacheable / Not] |

## Caching Opportunities

[Bulleted list of prompts where Anthropic prompt caching would apply and the estimated reduction]

## vs. Prior Month

| Category | Last Month | This Month | Change |
|----------|-----------|------------|--------|
| Total spend | $X.XX | $X.XX | [+/-X%] |
| Avg cost/run | $0.00X | $0.00X | [+/-X%] |
```

## Example output (truncated)

```markdown
# LLM Cost Report — 2026-04

> Period: 2026-03-01 – 2026-03-31. Total API spend: $94.12. Savings identified: $41.20/month.

## Priority Optimizations

| # | Issue | Workflow / Prompt | Fix | Est. Monthly Saving |
|---|-------|------------------|-----|---------------------|
| 1 | Over-provisioned model | weekly-operating-review | Switch from claude-opus-4 to claude-sonnet-4-6 — benchmark showed no quality difference for summary tasks | $28.40 |
| 2 | No prompt caching | daily-standup | System prompt is 2,100 tokens and identical every run — add cache_control to system block | $8.80 |
| 3 | Context bloat | competitor-research | Full vault page load (avg 6k tokens) where only the "Recent Moves" section is needed | $4.00 |

**Total available savings if all fixes applied: $41.20/month ($494.40/year)**
```
