---
name: feature-spec
description: Turn a rough feature idea into a structured PRD ready for a developer or AI agent to execute without 10 clarifying questions.
version: 1.0.0
trigger:
  - "write a feature spec"
  - "spec out a feature"
  - "turn this idea into a ticket"
  - "write a PRD"
  - "product requirements for"
  - "spec this feature"
  - "write up the requirements for"
  - "I want to build"
integrations:
  - vault-sqlite-fts5
  - linear-api
inputs:
  - name: feature_name
    description: Short name or working title for the feature
    required: true
  - name: problem_statement
    description: What user pain or business need this feature addresses
    required: true
  - name: notes
    description: Any rough notes, user feedback quotes, or prior context you want pulled in
    required: false
output_artifact: "wiki/spec-[feature-slug].md"
frequency: on-demand
pack: cpo
---

# Feature Spec

## When to run

When you've committed to building something and need it scoped before handing it off — to a contractor, to an AI coding agent, or to yourself on a focused dev block next Tuesday. The signal is: you keep thinking about this feature but can't start because the shape isn't clear yet. Run this skill, get the PRD, move on.

Also run it when a user request keeps appearing across multiple feedback sources and you need to formalize it before it gets buried again.

## What you'll get

A structured product requirements document saved to your vault. It covers the problem, the proposed solution, user stories, acceptance criteria, edge cases, and what's explicitly out of scope. A good spec eliminates the back-and-forth that burns half the development budget. The output is opinionated — it pushes you to define what done looks like before anyone writes a line of code.

## Steps

1. Search the vault for any existing pages related to the feature: `sqlite3 vault.db "SELECT path, title, snippet(pages_fts, 0, '', '', '...', 25) FROM pages_fts WHERE pages_fts MATCH '<feature_name>' LIMIT 8;"`. Pull in relevant prior context — related specs, user feedback synthesis pages, OKR references.

2. If `notes` were provided, parse them for signal: direct user quotes, frequency of request, any constraints already identified.

3. Determine the user persona(s) this feature serves. Pull from the vault if an ICP or persona page exists (`sqlite3 vault.db "SELECT path, title FROM pages_fts WHERE pages_fts MATCH 'persona OR ICP' LIMIT 3;"`). If none exists, infer from the problem statement and flag the assumption.

4. Draft the problem statement. One paragraph, no solution language. Describe the friction the user experiences, not the feature you're proposing.

5. Draft the proposed solution. What does the feature do, at the highest level? One paragraph. Avoid implementation specifics — that's the developer's job.

6. Write 2–5 user stories in the format: `As a [persona], I want to [action] so that [outcome].` Each story should map to a distinct unit of user value.

7. Write acceptance criteria for each user story. Criteria must be testable. Use the format: `Given [context], when [action], then [result].` Flag any criteria that depend on an integration or third-party behavior.

8. List explicit out-of-scope items. Anything adjacent to this feature that someone might assume is included — call it out as out of scope now. This prevents scope creep before it starts.

9. List known edge cases and open questions. If any require a product decision before development can proceed, flag them with `[DECISION NEEDED]`.

10. If Linear API is configured, optionally create a Linear ticket from the spec: use the feature name as the title, paste the acceptance criteria as the description, and link back to the vault spec page. Note the Linear ticket ID in the wiki page frontmatter.

11. Save the spec to `wiki/spec-[feature-slug].md`.

## Output format

```yaml
---
type: wiki
title: "Spec — [Feature Name]"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: draft
tags: [spec, product, cpo, [feature-slug]]
sources: [vault, user-input]
linear_ticket: "[LIN-XXX or null]"
---
```

```markdown
# Spec — [Feature Name]

> Status: draft | Owner: [your name] | Created: YYYY-MM-DD

## Problem

[1–2 paragraphs. What breaks without this feature? Who feels it?
Cite user feedback quotes if available. No solution language here.]

## Proposed Solution

[1 paragraph. What the feature does, not how it works internally.
Reference related pages with [[wikilinks]] if prior specs inform this.]

## User Stories

- As a [persona], I want to [action] so that [outcome].
- As a [persona], I want to [action] so that [outcome].

## Acceptance Criteria

### Story 1: [Short label]
- Given [context], when [action], then [result].
- Given [context], when [action], then [result].

## Out of Scope

- [Adjacent thing that sounds related but is not included]
- [Another exclusion, with brief rationale]

## Edge Cases

- [Edge case] — how it should be handled
- [Edge case] — [DECISION NEEDED: describe the open question]

## Open Questions

- [Question] — [who needs to answer it, or what research would resolve it]
```

## Example output (truncated)

```markdown
# Spec — CSV Export for Analytics Dashboard

> Status: draft | Owner: Amyn | Created: 2026-04-28

## Problem

Users running the analytics dashboard currently have no way to get their data out of
the product. Three separate customers in April asked for CSV export — one mentioned
it as a blocker for their internal reporting workflow, another is comparing us against
a tool that already supports it. The friction: they are taking screenshots and manually
transcribing numbers, which erodes trust in the product.

## Proposed Solution

Add a CSV export button to the analytics dashboard that downloads all rows currently
visible in the table view (respecting active filters) as a UTF-8 encoded CSV file.
The file should be named with the dashboard name and export date.

## User Stories

- As an analyst, I want to export dashboard data to CSV so that I can run further
  analysis in Excel or Google Sheets without manual data entry.
- As an account owner, I want the CSV to reflect my active filters so that I export
  only the data relevant to my current view.

## Acceptance Criteria

### Story 1: Export to CSV
- Given I am on the analytics dashboard, when I click "Export CSV", then a file
  download begins within 2 seconds.
- Given the file downloads, then it contains exactly the rows visible in the current
  filtered view, in the same column order.

## Out of Scope

- Scheduled/recurring CSV exports via email — not in this version.
- Excel (.xlsx) format — CSV only for now; revisit if requested.

## Open Questions

- Should empty cells export as blank or as "N/A"? — [DECISION NEEDED: default behavior]
```
