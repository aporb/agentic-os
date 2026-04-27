---
name: skill-file-authoring
description: Generate a new production-ready skill file from a task description — reads the skill template, fills it in, and saves it as a draft for review before it goes live.
version: 1.0.0
trigger:
  - "write a new skill"
  - "author a skill file"
  - "create a skill"
  - "I need a skill for"
  - "add a skill to the"
  - "build a skill that"
  - "new skill file"
  - "skill file authoring"
  - "generate a skill for"
  - "there's no skill for"
integrations:
  - vault-sqlite-fts5
  - bash
inputs:
  - name: task_description
    description: Plain-English description of what the skill should do — the job it handles, the inputs it takes, and what it produces
    required: true
  - name: pack
    description: Target pack — ceo, cro, cmo, cpo, cto, caio, or cfo
    required: true
  - name: skill_name
    description: Proposed kebab-case skill name (e.g. "client-health-review") — defaults to one generated from task_description
    required: false
output_artifact: "skills/[pack]/[skill-name].md"
frequency: on-demand
pack: caio
---

# Skill File Authoring

## When to run

When you've hit a workflow gap — a task you do repeatedly that no existing skill covers — and you want to close it with a proper skill file rather than a one-off prompt. Also when an agent-workflow-design spec calls for a skill that doesn't exist yet.

This is the meta-skill: it uses the agent runtime to extend the agent runtime. The output is `status: draft` and does not go live until you review it. That gate is non-negotiable — a skill file that executes unchecked on a cron is a liability.

## What you'll get

A complete, production-format skill file saved to `skills/[pack]/[skill-name].md` with `status: draft` in the frontmatter. The file follows the `_skill-template.md` structure exactly — frontmatter, When to run, What you'll get, Steps, Output format, and Example output (truncated). It is ready for your review and a one-line status change to go live.

## Steps

1. Read the skill template: `bash -c "cat ~/.hermes/skills/_skill-template.md 2>/dev/null || cat /home/*/repos/agentic-os/hermes/skills/_skill-template.md 2>/dev/null"`. Parse every section and its expected content. This is the canonical schema — do not deviate from the section structure.

2. Check for an existing skill that already covers this task: `sqlite3 vault.db "SELECT path, title FROM pages WHERE path LIKE 'skills/%' AND pages MATCH '<keywords from task_description>' LIMIT 10;"`. Also scan the `skills/[pack]/` directory: `bash -c "ls ~/.hermes/skills/[pack]/ 2>/dev/null || ls /home/*/repos/agentic-os/hermes/skills/[pack]/ 2>/dev/null"`. If a close match exists, surface it before generating a new file — duplication is waste.

3. Parse `task_description` into the skill's core components:
   - What does the user provide as input? (explicit data, file paths, parameters)
   - What does the agent do with it? (research, synthesis, generation, execution)
   - What does the output look like? (wiki page, message, file, action taken)
   - What integrations does it need? (vault, web search, bash, specific APIs)
   - How often would someone run this? (on-demand, daily, weekly, monthly)

4. Generate the skill name. If `skill_name` is not provided, derive a kebab-case name from the core job: `[verb]-[object]` where verb is what the skill does (audit, draft, analyze, design, triage, benchmark) and object is what it operates on. Keep it under 4 words.

5. Generate 8–10 trigger phrases. Think about how a user would ask for this in natural language at different moments of intent: urgent phrasing ("my X just broke"), planning phrasing ("I want to"), recurring phrasing ("run the X review"), and vague phrasing ("what's going on with X"). The trigger list is the skill's discoverability surface — be exhaustive.

6. Design the Steps section. Write numbered steps the agent will execute. Each step should be:
   - Specific enough that the agent knows exactly what command to run or what to look for
   - Honest about what's automated vs. what requires user input
   - Inclusive of the bash commands or API calls the agent will make, with actual syntax
   - Written for a practitioner, not a tutorial — assume competence, skip the preamble

7. Design the output format. Write the YAML frontmatter block and the markdown skeleton the output page will follow. The skeleton should be detailed enough that the output is structurally consistent every run — same sections, same ordering, same table shapes.

8. Write a truncated example output (15–30 lines). The example should show real values, not placeholder text. It should make clear what "good" looks like for this skill.

9. Write the voice rules at the top of the Steps section as a comment if the skill produces any user-facing content: no productivity/efficient/faster framing, no hedging, BLUF, practitioner voice.

10. Save to `skills/[pack]/[skill-name].md` with `status: draft` in the frontmatter. Confirm the path with: `bash -c "ls skills/[pack]/[skill-name].md && echo 'saved'"`. Return to the user: the file path, the skill name, the trigger list, and a one-line summary of what it does. Note explicitly: "This skill is status: draft and will not run until you change status to active."

## Output format

The output artifact IS the skill file itself. Its frontmatter:

```yaml
---
name: [skill-name]
description: [one sentence]
version: 1.0.0
trigger:
  - "[phrase 1]"
  - "[phrase 2]"
  - "[8–10 total]"
integrations:
  - [integration-1]
  - [integration-2]
inputs:
  - name: [input_name]
    description: [what user provides]
    required: true|false
output_artifact: "[path with slug]"
frequency: [on-demand|cron:expression|on-demand-or-cron]
pack: [ceo|cro|cmo|cpo|cto|caio|cfo]
status: draft
---
```

Followed by the full skill body per `_skill-template.md` section structure.

## Example output (truncated)

```markdown
# New skill file generated: skills/cro/renewal-expansion-brief.md

Status: draft — will not run until you set status: active.
Saved to: /home/amynporb/repos/agentic-os/hermes/skills/cro/renewal-expansion-brief.md

---
name: renewal-expansion-brief
description: Pre-call intelligence brief for a renewal or expansion conversation — account health, usage signals, and the case for expanding.
version: 1.0.0
trigger:
  - "renewal brief"
  - "prep for a renewal call"
  - "expansion brief for"
  - "customer renewal prep"
  - "pre-call for renewal"
  - "what do I know about [customer] renewal"
  - "upsell brief"
  - "expansion call prep"
status: draft
pack: cro
---

## When to run

Two days before any renewal or expansion conversation...
```
