---
name: prompt-library-update
description: Create a new prompt entry or bump the version of an existing one in the versioned prompt library at wiki/prompts/ — with when-to-use, examples, antipatterns, and version history.
version: 1.0.0
trigger:
  - "update the prompt library"
  - "add a prompt to the library"
  - "save this prompt"
  - "version a prompt"
  - "new prompt entry"
  - "update prompt"
  - "improve this prompt"
  - "prompt library"
  - "document this prompt"
  - "add to prompt library"
integrations:
  - vault-sqlite-fts5
  - bash
inputs:
  - name: prompt_name
    description: Kebab-case name for the prompt (e.g. "cold-email-first-touch", "pipeline-summary")
    required: true
  - name: prompt_text
    description: The actual prompt text to save or update. Paste the full prompt.
    required: true
  - name: use_case
    description: Where and when this prompt is used — which skill, which workflow, which manual context
    required: true
  - name: change_notes
    description: For version bumps — what changed and why. Omit for new prompts.
    required: false
output_artifact: "wiki/prompts/[prompt-name].md"
frequency: on-demand
pack: caio
---

# Prompt Library Update

## When to run

When you've tuned a prompt through iteration and want to lock in the current version so you're not re-deriving it from memory next quarter. When a skill's output has improved and you want to record the prompt change that caused it. When you're building a new workflow and want the prompt to live in a known, searchable location rather than buried in a skill file.

Prompt quality is the variable most directly under your control. A library that versions prompts is the difference between compounding improvements and resetting every time.

## What you'll get

A wiki page at `wiki/prompts/[prompt-name].md` with the full prompt text, the version history, the rationale for each version, when-to-use guidance, worked examples of good output, and documented antipatterns. The page is structured so that anyone — including a different agent running months from now — can read it and know exactly what the prompt does, when to use it, and what version is current.

## Steps

1. Check whether a prompt entry already exists: `sqlite3 vault.db "SELECT path, updated, substr(content,1,200) FROM pages WHERE path = 'wiki/prompts/[prompt-name].md';"`. If it exists, read the current version number and the version history table.

2. If this is a new prompt: set version to `1.0.0`. If this is an update to an existing prompt: increment the version. Use semantic versioning: bump the patch (1.0.0 → 1.0.1) for minor wording tweaks, bump the minor (1.0.0 → 1.1.0) for meaningful output changes, bump the major (1.0.0 → 2.0.0) for structural rewrites.

3. Parse the prompt text. Identify:
   - What role or persona does it assign to the agent (if any)?
   - What context does it expect to be pre-loaded?
   - What output format does it specify?
   - What constraints does it impose?
   - What does it leave ambiguous (potential antipatterns)?

4. Write the when-to-use section. This is not a description of the prompt — it's the decision rule for when to reach for this prompt vs. a different one. Include: the specific trigger situation, the inputs required for the prompt to work, and the output you should expect when it's working well.

5. Generate a worked example. Using the prompt text and `use_case`, generate a representative (not idealized) example of what the prompt produces on a realistic input. Keep it to 15–20 lines. Label it clearly as an example, not a live run.

6. Document antipatterns. Based on the prompt structure and your use of it, note 2–4 failure modes: what inputs break it, what contexts produce hallucinations, what edge cases it handles badly. This is the most valuable section for future debugging.

7. If this is a version bump, preserve the prior version text verbatim in the version history section. Do not edit or summarize it — the full prior text is the record. Add `change_notes` as the changelog entry for this version.

8. Write the page to `wiki/prompts/[prompt-name].md`. If updating, overwrite the page but preserve all prior version history within the file.

9. Search the vault for skill files that reference this prompt by name: `sqlite3 vault.db "SELECT path FROM pages WHERE path LIKE 'skills/%' AND pages MATCH '[prompt-name]';"`. If any are found, note them in the page's "Used in" section.

10. Confirm the save and return the path, current version, and the prior version if this was an update.

## Output format

```yaml
---
type: wiki
title: "Prompt — [Prompt Name]"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: active
version: X.Y.Z
tags: [caio, prompt-library, [pack], [use-case-slug]]
sources: [user-input, vault]
prompt_name: "[prompt-name]"
---
```

```markdown
# Prompt — [Prompt Name]

> Current version: X.Y.Z — last updated YYYY-MM-DD.

## Prompt Text (v X.Y.Z)

```
[Exact prompt text — no paraphrasing, no summarizing]
```

## When to Use

[The decision rule. Specific situation, required inputs, expected output quality.]

## Used In

- `[pack]/[skill-name]` — [how it's used]

## Worked Example

**Input context:** [brief description of what was provided]

**Output (representative, not live):**
[15–20 lines of example output]

## Antipatterns

- **[Pattern name]:** [What goes wrong and why]
- **[Pattern name]:** [What goes wrong and why]

## Version History

| Version | Date | Change |
|---------|------|--------|
| X.Y.Z | YYYY-MM-DD | [change_notes or "Initial version"] |
| [prior versions] | | |

## Prior Version Text

### v X.Y-1.Z (archived)

```
[Full prior prompt text verbatim]
```
```

## Example output (truncated)

```markdown
# Prompt — Pipeline Health Summary

> Current version: 1.1.0 — last updated 2026-04-07.

## Prompt Text (v 1.1.0)

```
Today is {DATE}. You are reviewing the current sales pipeline for a solo founder.

You have been given a set of deal pages from the vault. Each page describes one open deal with fields: company name, stage, last contact date, deal value, and any risk flags.

Produce a pipeline health report with three sections:
1. Summary table — all open deals, stage, value, days since last contact
2. At-risk deals — any deal where last contact was >14 days ago, sorted by value descending
3. This week's priority — the 2–3 deals most worth moving this week, with a one-line action for each

Be direct. Do not soften bad news. If the pipeline is thin, say so.
```

## Antipatterns

- **Stale vault data:** If deal pages haven't been updated in 3+ weeks, the report will reflect old stage data. The prompt has no way to detect this — check page update dates before trusting the output.
- **Missing deal value:** Deals without a value field produce rows that can't be sorted or weighted. Enforce value entry at prospect creation.

## Version History

| Version | Date | Change |
|---------|------|--------|
| 1.1.0 | 2026-04-07 | Added "this week's priority" section; removed vague "next steps" section that produced generic output |
| 1.0.0 | 2026-03-01 | Initial version |
```
