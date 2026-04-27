---
name: model-benchmarking
description: Send sample prompts to multiple models via OpenRouter, compare outputs on quality, speed, and cost, and save the comparison table to the wiki.
version: 1.0.0
trigger:
  - "benchmark models"
  - "compare models"
  - "which model is best for"
  - "model comparison"
  - "test models on"
  - "run a benchmark"
  - "compare Claude vs GPT"
  - "which LLM should I use for"
  - "model benchmarking"
  - "evaluate models for"
integrations:
  - bash
  - vault-sqlite-fts5
inputs:
  - name: task_type
    description: The category of task being benchmarked — e.g. "cold email drafting", "code review", "financial summary", "pipeline health report"
    required: true
  - name: models
    description: Comma-separated list of model identifiers to test (OpenRouter format, e.g. "anthropic/claude-sonnet-4-6,openai/gpt-4o,google/gemini-flash-1.5")
    required: true
  - name: sample_prompts
    description: 2–3 representative prompts for the task, separated by "---". If omitted, the skill generates sample prompts from the task_type description.
    required: false
  - name: evaluation_dimensions
    description: Comma-separated dimensions to score — defaults to "quality,speed,cost,instruction-following"
    required: false
output_artifact: "wiki/model-benchmark-[task-slug].md"
frequency: on-demand
pack: caio
---

# Model Benchmarking

## When to run

Before committing a new workflow to a specific model. When you're paying too much for a skill that runs frequently and want to know if a cheaper model can hold the quality bar. When a new model releases and you want to know if it earns a slot in the stack for any of your active task types.

The benchmark runs real prompts against real APIs. It is not a synthetic test — it reflects actual behavior on the specific prompts you use in production. That's the only benchmark that matters.

## What you'll get

A comparison table at `wiki/model-benchmark-[task-slug].md` with the outputs from each model side by side (or summarized if too long), scores on each evaluation dimension, the measured latency and cost per call, and a recommendation for which model to use for this task type. The page persists so you can track model quality over time as new versions ship.

## Steps

1. Validate that `OPENROUTER_API_KEY` is set: `bash -c "test -n \"$OPENROUTER_API_KEY\" && echo 'key set' || echo 'ERROR: OPENROUTER_API_KEY not set — cannot run benchmark'"`. If not set, halt and tell the user to add it to their environment.

2. Parse the `models` list. For each model identifier, confirm it follows OpenRouter format (`provider/model-name`). If any identifier looks malformed, flag it before making any API calls.

3. Prepare the sample prompts. If `sample_prompts` is provided, parse them on the `---` separator. If not provided, generate 2–3 representative prompts for `task_type` based on what a real user would send in that category. Keep prompts realistic — they should reflect actual inputs from your vault and workflows.

4. For each model, for each sample prompt, send a completion request via OpenRouter: 
   ```bash
   curl -s -X POST https://openrouter.ai/api/v1/chat/completions \
     -H "Authorization: Bearer $OPENROUTER_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "model": "[model_id]",
       "messages": [{"role": "user", "content": "[prompt]"}],
       "max_tokens": 1000
     }' | python3 -c "import json,sys; r=json.load(sys.stdin); print('OUTPUT:', r['choices'][0]['message']['content'][:500]); print('TOKENS_IN:', r['usage']['prompt_tokens']); print('TOKENS_OUT:', r['usage']['completion_tokens']); print('LATENCY:', r.get('_request_time_ms','N/A'))"
   ```
   Capture output text, token counts, and latency for each call.

5. Retrieve current pricing for each model from OpenRouter: `curl -s https://openrouter.ai/api/v1/models | python3 -c "import json,sys; models=json.load(sys.stdin)['data']; [print(m['id'], m.get('pricing',{})) for m in models if m['id'] in [<model_list>]]"`. Calculate cost per call: `(tokens_in * price_per_input_token) + (tokens_out * price_per_output_token)`.

6. Score each output on the evaluation dimensions. For each dimension:
   - **Quality:** Rate 1–5 based on how well the output serves the task. Does it follow the prompt, is the content accurate, would you use it? Be specific about what's missing.
   - **Speed:** Use the measured latency. If OpenRouter doesn't return it, note "not measured."
   - **Cost:** Calculated from step 5.
   - **Instruction-following:** Did the model produce the format requested? Did it miss any required sections?
   - Any additional dimensions from `evaluation_dimensions`.

7. Check the vault for prior benchmarks on this task type: `sqlite3 vault.db "SELECT path, updated FROM pages WHERE path LIKE 'wiki/model-benchmark-[task-slug]%' ORDER BY updated DESC LIMIT 3;"`. If prior benchmarks exist, add a "Change from prior benchmark" column noting whether each model improved, regressed, or is new.

8. Write the recommendation section. Based on scores and costs, name the recommended model for this task type. If cost and quality trade off (expensive model is much better), say at what frequency the cost premium becomes worth it.

9. Save to `wiki/model-benchmark-[task-slug].md`. Overwrite if the file exists, but preserve the prior benchmark dates in the version history section.

## Output format

```yaml
---
type: wiki
title: "Model Benchmark — [Task Type]"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: active
tags: [caio, model-benchmark, [task-slug]]
sources: [openrouter-api]
task_type: "[task_type]"
models_tested: [[model_ids]]
---
```

```markdown
# Model Benchmark — [Task Type]

> Benchmarked: YYYY-MM-DD. Models: [list]. Prompts used: N.

## Recommendation

**Use [model] for this task.** [2–3 sentence rationale covering quality, cost, and speed tradeoffs.]

## Summary Table

| Model | Quality (1–5) | Instruction-Following | Avg Latency | Cost/Call | Verdict |
|-------|-------------|----------------------|-------------|-----------|---------|
| [model] | X | X | Xms | $0.00X | Recommended |
| [model] | X | X | Xms | $0.00X | Viable at lower cost |
| [model] | X | X | Xms | $0.00X | Not recommended |

## Sample Prompts Used

### Prompt 1
[Full prompt text]

### Prompt 2
[Full prompt text]

## Per-Model Output (Prompt 1)

### [Model A]
[Output excerpt — up to 200 words]

**Notes:** [Specific quality observations]

### [Model B]
[Output excerpt — up to 200 words]

**Notes:** [Specific quality observations]

## Version History

| Date | Models Tested | Winner |
|------|--------------|--------|
| YYYY-MM-DD | [models] | [winner] |
```

## Example output (truncated)

```markdown
# Model Benchmark — Cold Email First Touch

> Benchmarked: 2026-04-15. Models: 3. Prompts used: 2.

## Recommendation

**Use anthropic/claude-sonnet-4-6 for cold email drafting.** It produces the most specific, non-generic output and follows the "no template language" constraint reliably. GPT-4o produces comparable quality at 15% lower cost — use it for high-volume sequences where cost adds up. Gemini Flash fails the instruction-following test on constraint 2 in both prompt runs.

## Summary Table

| Model | Quality (1–5) | Instruction-Following | Avg Latency | Cost/Call | Verdict |
|-------|-------------|----------------------|-------------|-----------|---------|
| anthropic/claude-sonnet-4-6 | 4.5 | 5/5 | 1,820ms | $0.0062 | Recommended |
| openai/gpt-4o | 4.2 | 4/5 | 2,100ms | $0.0053 | Viable |
| google/gemini-flash-1.5 | 3.1 | 2/5 | 680ms | $0.0008 | Not recommended |
```
