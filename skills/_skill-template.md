---
name: skill-template
description: Template for creating new skills. Copy this file and fill in each section.
version: 1.0.0
trigger: "Replace with: keywords or phrases that indicate this skill should activate"
---

# [Skill Name]

Brief one-line description of what this skill does and when to use it.

## When to Use

- Condition 1 that triggers this skill
- Condition 2
- Explicit command (e.g., "run the [skill-name] skill")

## Inputs

Before starting, the agent needs:

| Input | Required | Description |
|-------|----------|-------------|
| Example: topic | Yes | The subject to research/write about |
| Example: format | No | Output format (default: markdown) |

## Steps

1. **First step** — Concrete, specific action. Include exact commands or tool calls if applicable.
2. **Second step** — What to do with the output from step 1.
3. **Third step** — Continue until the task is complete.
4. **Validation** — How to verify the output meets quality standards.
5. **Save output** — Where to write the result (specific path in the vault).

## Output

The skill produces:
- **File**: Path where output should be saved
- **Format**: What the output looks like (template, structure, or example)

```
Example output format:
# [Title]
## Summary
[2-3 sentences]
## Key Points
- Point 1
- Point 2
```

## Pitfalls

- **Pitfall 1**: Description of what can go wrong and how to handle it.
- **Pitfall 2**: Another known failure mode.

## Examples

### Example Input
```
"Research the competitive landscape for AI agent frameworks in 2026"
```

### Example Output
```
# AI Agent Framework Landscape 2026
## Summary
The market has consolidated around three patterns...
```

## Changelog

| Date | Change |
|------|--------|
| YYYY-MM-DD | Initial version |
