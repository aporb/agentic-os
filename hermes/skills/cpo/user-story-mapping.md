---
name: user-story-mapping
description: Break an epic into a full map of user stories, ordered by user journey, with acceptance criteria and a suggested release slice.
version: 1.0.0
trigger:
  - "user story mapping"
  - "break this epic into stories"
  - "map user stories for"
  - "write user stories for"
  - "decompose this epic"
  - "what are the stories in this feature"
  - "story map for"
  - "break down this feature into stories"
integrations:
  - vault-sqlite-fts5
  - linear-api
inputs:
  - name: epic_name
    description: Name or short description of the epic to map
    required: true
  - name: user_persona
    description: The primary user persona this epic serves — e.g. "solo founder", "analyst", "account admin"
    required: true
  - name: release_constraint
    description: Optional scope constraint for the minimum viable slice — e.g. "must ship in 1 week" or "target: 3-day build"
    required: false
output_artifact: "wiki/stories-[epic-slug].md"
frequency: on-demand
pack: cpo
---

# User Story Mapping

## When to run

Before a sprint starts and after the epic is approved but before tickets are created. The standard failure mode: a developer picks up an epic, interprets it their way, ships something that technically works but misses the user journey entirely. User story mapping forces the product thinking to happen before the coding starts.

Also run it when an existing epic has gotten too large to fit in one sprint and you need to identify the minimum valuable slice to ship first.

## What you'll get

A structured map of the user journey for this epic, broken into: backbone activities (the high-level steps the user takes), user stories under each activity (the specific actions), and acceptance criteria per story. The map includes a suggested release slice — the minimum set of stories that delivers real value without requiring the full epic. Stories are ready to be pasted into Linear as tickets.

## Steps

1. Search the vault for any existing spec or prior context for this epic: `sqlite3 vault.db "SELECT path, title, snippet(pages_fts, 0, '', '', '...', 20) FROM pages_fts WHERE pages_fts MATCH '<epic_name>' LIMIT 5;"`. If a spec page exists, use it as the source of truth. Link it in the output with a [[wikilink]].

2. Search the vault for any feedback synthesis pages that reference this epic area: `sqlite3 vault.db "SELECT path, title FROM pages_fts WHERE pages_fts MATCH '<epic_keywords>' LIMIT 3;"`. User quotes from feedback synthesis should inform the story wording.

3. Define the user journey backbone: the 3–7 high-level activities the user performs when engaging with this feature end-to-end. Activities are verbs — they describe what the user does, not what the system does. Example: "Discovers the feature" → "Sets up" → "Runs the core action" → "Reviews output" → "Shares or saves."

4. Under each backbone activity, write 1–5 user stories. Format: `As a [persona], I want to [action] so that [outcome].` The persona comes from `user_persona`. Keep each story to one unit of user value — if you can't write one acceptance criterion for it, it's too vague.

5. Write 2–3 acceptance criteria per story. Format: `Given [context], when [action], then [result].` Acceptance criteria should be testable by a developer or QA run without asking the product owner.

6. Identify the minimum viable slice: the smallest horizontal cut across the backbone that delivers meaningful value to the user without requiring all stories. Mark these stories with `[MVP]`. The MVP slice should be shippable in the `release_constraint` timeframe if provided, or in one sprint if not.

7. Identify stories that are enhancements on top of the MVP slice. Mark these `[V2]`. They go into the backlog, not the current sprint.

8. Flag any story that introduces a dependency on an external integration, an unresolved design decision, or a capability that doesn't exist yet. Mark these `[BLOCKED: reason]`.

9. If Linear API is configured: offer to create tickets for the MVP slice. Each story becomes one Linear issue with the acceptance criteria in the description and the epic as the parent.

10. Save the story map to `wiki/stories-[epic-slug].md`.

## Output format

```yaml
---
type: wiki
title: "Story Map — [Epic Name]"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: draft
tags: [stories, epic, product, cpo, [epic-slug]]
sources: [vault, user-input]
epic: "[epic_name]"
persona: "[user_persona]"
mvp_story_count: N
---
```

```markdown
# Story Map — [Epic Name]

> Persona: [user_persona] | Epic source: [[spec-epic-slug]] (if exists)
> MVP slice: [N stories] | Full map: [N stories]

---

## Backbone

`[Activity 1]` → `[Activity 2]` → `[Activity 3]` → `[Activity 4]`

---

## [Activity 1]: [Label]

### Story 1.1 [MVP]
As a [persona], I want to [action] so that [outcome].

**Acceptance criteria:**
- Given [context], when [action], then [result].
- Given [context], when [action], then [result].

### Story 1.2 [V2]
As a [persona], I want to [action] so that [outcome].
...

---

## [Activity 2]: [Label]
...

---

## MVP Slice Summary

Stories marked [MVP]: 1.1, 2.1, 2.2, 3.1
Estimated build: [N days solo / N days team of N]
Delivers: [one sentence on the value the MVP slice provides to the user]

## Backlog Stories (V2)

| Story | Activity | Why deferred |
|-------|----------|--------------|
| 1.2 | [Activity 1] | Enhancement; MVP slice delivers without it |
| 3.3 | [Activity 3] | Requires design work not yet started |

## Blocked Stories

- [Story X.X] — [BLOCKED: reason] — unblock by: [action or decision needed]
```

## Example output (truncated)

```markdown
# Story Map — Onboarding Fast Path

> Persona: solo founder (non-technical) | Epic source: [[spec-onboarding-fast-path]]
> MVP slice: 6 stories | Full map: 14 stories

---

## Backbone

`Signs Up` → `Chooses Setup Path` → `Runs First Skill` → `Sees Output` → `Connects Integrations`

---

## Signs Up: Initial Account Creation

### Story 1.1 [MVP]
As a solo founder, I want to create an account with just my email so that I can
get started without connecting integrations immediately.

**Acceptance criteria:**
- Given I land on the signup page, when I enter my email and click "Get started",
  then I receive a magic link within 30 seconds.
- Given I click the magic link, then I am taken to the dashboard without being asked
  to configure any integrations.

---

## Chooses Setup Path: Fast Path vs. Full Setup

### Story 2.1 [MVP]
As a solo founder, I want to see a "Try it first" option so that I can experience
the product before committing setup time.

**Acceptance criteria:**
- Given I am on the first-run screen, when the page loads, then I see two options:
  "Quick demo" and "Connect my tools".
- Given I choose "Quick demo", then a pre-configured sample vault is activated
  and I am taken directly to the skill runner.
```
