---
name: ai-vendor-research
description: Evaluate a new AI tool or model against the current stack — what it does, what it costs, whether it earns a slot, and what the integration lift would be.
version: 1.0.0
trigger:
  - "research an AI tool"
  - "evaluate a new AI tool"
  - "should I use"
  - "is [tool] worth it"
  - "evaluate [tool] for my stack"
  - "AI vendor research"
  - "new AI tool launched"
  - "compare [tool] to what I'm using"
  - "should I switch to"
  - "AI tool evaluation"
integrations:
  - web-search-ddgr-gogcli
  - vault-sqlite-fts5
inputs:
  - name: tool_name
    description: Name of the AI tool or model to evaluate (e.g. "Cursor", "GPT-4.1", "Lovable", "Langfuse")
    required: true
  - name: use_case
    description: The specific job you're considering this tool for — be specific (e.g. "LLM observability", "code generation", "vector search")
    required: true
output_artifact: "wiki/ai-vendor-[tool-slug].md"
frequency: on-demand
pack: caio
---

# AI Vendor Research

## When to run

When a tool you've been hearing about shows up in your feed twice in one week. When your current tool for a job is breaking down or getting expensive. When a prospect or partner mentions a tool and you need to know if it matters. When a major new model drops and you need to know whether to re-run your model benchmarks.

The default answer to "new AI tool" is not adoption — it's evaluation. Most tools that launch don't earn a slot in a disciplined stack. This skill produces the evidence for that call.

## What you'll get

A structured evaluation page at `wiki/ai-vendor-[tool-slug].md` covering what the tool does, who it's built for, what it costs, how it compares to what you're already running, what the integration lift is, and a binary recommendation: evaluate further (with a defined next step) or pass. The page persists — when the tool's next version ships, you append to it rather than starting over.

## Steps

1. Check whether an existing vendor page exists: `sqlite3 vault.db "SELECT path, updated, substr(content,1,300) FROM pages WHERE path = 'wiki/ai-vendor-[tool-slug].md';"`. If it exists and was updated within 60 days, read it and scope the new research to what's changed.

2. Search for recent coverage: `ddgr --json --num 10 "[tool_name] AI review 2026"`. Parse results. Fall back to `gog --json "[tool_name] AI review 2026"` if fewer than 5 results.

3. Search for pricing: `ddgr --json --num 5 "[tool_name] pricing tiers 2026"`. If pricing is not publicly listed, note that and check for community reports on G2, Hacker News, or Reddit.

4. Search for independent assessments: `ddgr --json --num 8 "[tool_name] review OR alternative OR vs OR comparison site:reddit.com OR site:news.ycombinator.com OR site:x.com"`. Third-party accounts of real-world use are more reliable than vendor marketing.

5. Search for the tool's position relative to your current stack. For each current tool that overlaps with `use_case`, run: `ddgr --json --num 5 "[tool_name] vs [current_tool]"`. Identify where the capabilities overlap and where they differ.

6. Search the vault for your current stack's tool covering this use case: `sqlite3 vault.db "SELECT path, title FROM pages WHERE path LIKE 'wiki/ai-vendor-%' AND pages MATCH '[use_case]' ORDER BY updated DESC LIMIT 5;"`. Also check the latest AI stack audit: `sqlite3 vault.db "SELECT content FROM pages WHERE path LIKE 'wiki/ai-stack-audit-%' ORDER BY updated DESC LIMIT 1;"`.

7. Assess the integration lift. Based on what you know about the tool's API and the Hermes MCP integration system, estimate: (a) Does an MCP server exist for this tool? (b) Is there a REST API that bash can call directly? (c) What credentials/setup does it require? (d) What's the realistic time to integrate it at a minimal working level?

8. Write the evaluation. Be direct: this tool either earns a slot in the stack for `use_case` or it doesn't. If the evidence is mixed, say what would tip it — a specific feature release, a price drop, or a failing in your current tool that this one would fix.

9. If this is an update to an existing evaluation page, add a dated "Update" section at the top and preserve the prior evaluation below it. The history of how your read on a tool changes over time is valuable.

10. Save to `wiki/ai-vendor-[tool-slug].md`.

## Output format

```yaml
---
type: wiki
title: "AI Vendor — [Tool Name]"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: active
tags: [caio, ai-vendor, [use-case-slug], [tool-slug]]
sources: [web-search, vault]
tool: "[Tool Name]"
use_case: "[use_case]"
recommendation: "[adopt|evaluate|pass]"
---
```

```markdown
# AI Vendor — [Tool Name]

> Evaluated: YYYY-MM-DD for use case: [use_case]. Recommendation: [ADOPT / EVALUATE FURTHER / PASS].

## What It Is

[2–3 sentences. What the tool does, who built it, what category it's in.]

## Who It's For

[The actual target user — company size, technical level, specific job to be done.]

## Pricing

[Tiers, prices, usage limits. Free tier? API pricing if applicable. Source and date.]

## What the Current Stack Has for This Job

| Current Tool | Cost | Coverage | Gap |
|-------------|------|----------|-----|
| [tool] | $X/mo | [what it does for use_case] | [what's missing] |

## How [Tool Name] Compares

**Where it wins:** [Specific capabilities that beat the current stack]

**Where it's weak or unproven:** [Gaps, concerns, missing features]

**Evidence quality:** [How much of this is vendor marketing vs. independent confirmation]

## Integration Lift

- **MCP server available:** [Yes / No / Community-built at [repo]]
- **API access:** [REST / SDK / Bash-callable — details]
- **Setup time estimate:** [X hours realistically]
- **Credentials needed:** [API key / OAuth / self-hosted]

## Recommendation

**[ADOPT / EVALUATE FURTHER / PASS]**

[2–3 sentences. The specific reasoning. If "evaluate further," name the trigger condition that would move it to adopt or pass.]

## Open Questions

- [Something that couldn't be confirmed — relevant to the decision]

## Prior Evaluations

[Date and one-line summary of prior reads if this is an update]
```

## Example output (truncated)

```markdown
# AI Vendor — Langfuse

> Evaluated: 2026-04-10 for use case: LLM observability. Recommendation: EVALUATE FURTHER.

## What It Is

Langfuse is an open-source LLM observability platform. It traces LLM calls, logs prompt and completion pairs, tracks token costs, and surfaces latency and quality metrics via a self-hosted or cloud dashboard.

## Pricing

- Open-source self-hosted: $0
- Cloud hobby tier: $0 up to 50k observations/month
- Cloud Pro: $59/month, 1M observations, team features
- (Source: langfuse.com/pricing, April 2026)

## What the Current Stack Has for This Job

| Current Tool | Cost | Coverage | Gap |
|-------------|------|----------|-----|
| LangSmith | $39/mo | Full tracing, datasets, evals | Actively paying but underused |

## Recommendation

**EVALUATE FURTHER.** Langfuse's self-hosted tier is a direct path to $0 observability cost vs. the $39/month LangSmith charge. The integration lift is moderate (Docker + SDK wrapper). Worth running both in parallel for 30 days to confirm parity on the traces you actually care about.

Trigger to adopt: confirm that Langfuse traces Hermes gateway calls without custom instrumentation. Trigger to pass: if self-hosting creates maintenance overhead that exceeds the $39/month it would save.
```
