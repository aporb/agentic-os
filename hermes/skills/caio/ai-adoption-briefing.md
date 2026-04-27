---
name: ai-adoption-briefing
description: Monthly 1-pager on what changed in AI in the last 30 days — filtered to what's worth acting on for this business — with a clear act/watch/ignore verdict for each item.
version: 1.0.0
trigger:
  - "AI adoption briefing"
  - "what's new in AI"
  - "monthly AI update"
  - "AI landscape update"
  - "what changed in AI this month"
  - "AI briefing"
  - "AI news summary"
  - "what AI should I care about"
  - "AI update for founders"
  - "monthly AI briefing"
integrations:
  - web-search-ddgr-gogcli
  - vault-sqlite-fts5
inputs:
  - name: month
    description: The month to cover, in YYYY-MM format. Defaults to the current month.
    required: false
output_artifact: "wiki/ai-briefing-YYYY-MM.md"
frequency: "cron:0 8 1 * *"
pack: caio
---

# AI Adoption Briefing

## When to run

First of every month, automatically. The AI landscape moves fast enough that a monthly read is the minimum viable cadence for staying positioned — slower than that and you're reacting to things your competitors already acted on. Faster than that and you're spending time on noise instead of signal.

This briefing is not a roundup of everything that happened in AI. It is a filtered, opinionated 1-pager on what matters for this specific business, this specific stack, and this specific month. The act/watch/ignore verdict is the deliverable — not the summary.

## What you'll get

A single wiki page at `wiki/ai-briefing-YYYY-MM.md` with 5–8 items from the last 30 days of AI news, each tagged with a verdict: ACT (do something about this now), WATCH (relevant but not yet actionable — revisit next month), or IGNORE (noise for this use case). The page also includes a "stack impact" section that maps each ACT item to the specific part of the current AI stack it affects.

## Steps

1. Set the time window. If `month` is provided, set start_date to the first of that month and end_date to the last day. If not provided, use the last 30 days. Format: `date -d "30 days ago" +%Y-%m-%d` and `date +%Y-%m-%d`.

2. Run primary AI news searches:
   - `ddgr --json --num 10 "AI model release OR launch 2026 site:techcrunch.com OR site:theverge.com OR site:simonwillison.net"` — major model and tool releases
   - `ddgr --json --num 10 "Claude OR Anthropic OR OpenAI OR Gemini release 2026"` — releases from the primary providers in the current stack
   - `ddgr --json --num 8 "AI agent framework release 2026"` — relevant to Hermes orchestration
   - `ddgr --json --num 8 "LLM cost reduction OR price cut 2026"` — relevant to llm-cost-optimization
   - Fall back to `gog` on any search with fewer than 4 results.

3. Run stack-specific searches based on what's in the current AI stack. Check the vault for the latest AI stack audit to know what to search for: `sqlite3 vault.db "SELECT content FROM pages WHERE path LIKE 'wiki/ai-stack-audit-%' ORDER BY updated DESC LIMIT 1;"`. For each tool in the stack, run: `ddgr --json --num 5 "[tool_name] update OR release OR deprecation 2026"`.

4. Collect raw items. For each search result, extract: headline, source, date, and a 1-sentence summary of the claim. Discard items older than 30 days and items from sources with no citation (pure speculation or rumors without a primary source).

5. Filter for relevance. Apply the following filters in order:
   - **Stack relevance:** Does this affect a tool in the current stack, or a tool being evaluated? If yes, it's a candidate.
   - **Use case relevance:** Does this change how you'd handle one of the 11 CAIO skill jobs, or any of the other C-suite pack jobs? If yes, it's a candidate.
   - **Cost relevance:** Does this affect what you're paying for AI, or what a competitor might pay? If yes, it's a candidate.
   - **Competitive relevance:** Does this represent a capability that a customer might ask you about or a competitor might claim? If yes, it's a candidate.
   - Items that pass none of these filters: IGNORE and don't include in the briefing.

6. Assign verdicts. For each remaining item: **ACT** — there is a specific, concrete action to take this week that would benefit the business (e.g. switch to the new cheaper model, update a skill file to use the new API, evaluate the new tool against the current stack). **WATCH** — the item is relevant but not yet actionable (e.g. a capability is in beta and not widely available, a price change is announced but not yet live). **IGNORE** — the item is interesting but does not affect this business in any concrete way in the next 30 days.

7. For each ACT item, write the specific action: what to do, which skill or tool it affects, how long it should take. Link to the relevant wiki page or skill file.

8. Check the vault for the prior month's briefing: `sqlite3 vault.db "SELECT content FROM pages WHERE path LIKE 'wiki/ai-briefing-%' ORDER BY updated DESC LIMIT 1;"`. For any item that carried a WATCH verdict last month, check whether it has become ACT or IGNORE this month. Note the resolution.

9. Write the briefing to `wiki/ai-briefing-YYYY-MM.md`. The document should be readable in under 3 minutes. If you can't fit it in one tight page, you've included too much noise.

10. Deliver a Telegram summary of the ACT items only (max 300 characters) if the cron is configured to send one.

## Output format

```yaml
---
type: wiki
title: "AI Briefing — YYYY-MM"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: active
tags: [caio, ai-briefing, monthly]
sources: [web-search, vault]
period: "YYYY-MM"
act_count: N
watch_count: N
---
```

```markdown
# AI Briefing — YYYY-MM

> Compiled: YYYY-MM-DD. Coverage: [start_date] – [end_date].
> ACT: N items | WATCH: N items | IGNORE: N items filtered out.

## Act on This

### [Item Title] — ACT
**What:** [1–2 sentences. What happened.]
**Why it matters:** [1 sentence. The concrete implication for your stack or workflow.]
**Action:** [Specific next step. Who does it, which skill or tool, estimated time.]

### [Item Title] — ACT
[same structure]

## Watch This Month

### [Item Title] — WATCH
**What:** [1–2 sentences.]
**Why watching:** [What would make this ACT vs. IGNORE next month.]

## Prior Month Watch List — Resolved

| Item | Prior Verdict | Resolved To | Notes |
|------|-------------|-------------|-------|
| [item] | WATCH | ACT / IGNORE | [one line] |

## Filtered Out (IGNORE)

These items were found but are not relevant to this stack or this use case:
- [Item]: [one-line reason for ignoring]
```

## Example output (truncated)

```markdown
# AI Briefing — 2026-04

> Compiled: 2026-04-01. Coverage: 2026-03-01 – 2026-03-31.
> ACT: 2 items | WATCH: 3 items | 14 items filtered out.

## Act on This

### Claude Sonnet 4.6 Price Cut (38% on output tokens) — ACT
**What:** Anthropic reduced claude-sonnet-4-6 output token pricing by 38%, effective March 15, 2026. No capability change.
**Why it matters:** Sonnet is the primary model for 7 of 11 active cron workflows. This reduces monthly API spend by an estimated $14–18/month at current volume.
**Action:** No action needed — you're already on Sonnet. Verify in the next llm-cost-report that the lower pricing is reflected. (~15 min)

### OpenRouter Adds Prompt Caching for Anthropic Routes — ACT
**What:** OpenRouter now passes Anthropic's prompt caching headers through to the API for requests routed to claude-* models. Previously, caching only worked on direct Anthropic API calls.
**Why it matters:** The daily-standup and pipeline-health-report skills make OpenRouter calls with static system prompts. Enabling cache_control on those system prompts could reduce costs by 30–50% on those workflows.
**Action:** Run llm-cost-optimization skill to identify the specific prompts. Add cache_control headers to the top 3 most frequent prompts. (~1 hour — see wiki/llm-cost-report-2026-03.md for the list)

## Watch This Month

### Hermes v0.9.0 Multi-Agent Support (Beta) — WATCH
**What:** Hermes announced multi-agent orchestration support in their v0.9.0 beta — one agent can invoke another as a subagent with its own context window.
**Why watching:** This is the v3 architecture for agentic-os. Not ready to act — beta is invite-only and the API surface may change before GA. Will reassess next month once more community testing data is available.
```
