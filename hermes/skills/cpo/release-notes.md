---
name: release-notes
description: Write plain-English release notes for a shipped sprint, pulling from Linear closed issues and GitHub commits between two refs or dates.
version: 1.0.0
trigger:
  - "write release notes"
  - "release notes for this sprint"
  - "what shipped this sprint"
  - "draft release notes"
  - "changelog for version"
  - "summarize what shipped"
  - "post-sprint release notes"
  - "what went out in this release"
integrations:
  - linear-api
  - github-api
  - vault-sqlite-fts5
inputs:
  - name: version_or_sprint
    description: Version number (e.g. "v1.4.0") or sprint identifier (e.g. "S24" or "2026-W18")
    required: true
  - name: date_range
    description: Start and end dates for the release window, e.g. "2026-04-14 to 2026-04-28"
    required: false
  - name: github_ref_from
    description: Starting git ref (tag or commit SHA) for commit range — optional, NTH
    required: false
  - name: github_ref_to
    description: Ending git ref (tag or commit SHA) for commit range — defaults to HEAD
    required: false
  - name: audience
    description: Who these notes are for — "customers" (plain English, benefits-first) or "internal" (technical detail OK). Defaults to "customers".
    required: false
output_artifact: "wiki/release-notes-[version].md"
frequency: on-demand
pack: cpo
---

# Release Notes

## When to run

At the end of a sprint or before a public release. The failure mode this skill prevents: engineers ship things and the product owner never writes it up, so customers don't know what changed, support gets questions about new behavior, and the changelog is perpetually stale.

Run it immediately when the sprint closes, before the context fades. The longer you wait, the more you're reconstructing from memory instead of sourcing from actual commit data.

## What you'll get

A release notes page, in plain English, organized by category (new features, improvements, bug fixes). If `audience` is `"customers"`, every item is framed as user benefit — not as a technical change. If `audience` is `"internal"`, technical detail is included. The page is saved to your vault and ready to copy into your changelog, product blog, or in-app notification.

## Steps

1. Determine source availability and collect raw items:

   **Linear API (primary source):**
   If Linear API is configured: fetch all issues in the project that were completed within `date_range` or in the cycle matching `version_or_sprint`. For each issue: pull title, description, labels, and linked PR URLs.

   **GitHub API (NTH enrichment):**
   If GitHub API is configured and `github_ref_from` is provided: run `git log [github_ref_from]..[github_ref_to] --oneline --no-merges`. Parse commit messages. Filter out commits that are already covered by a Linear ticket (match by branch name or PR reference). Any commits not linked to a Linear ticket become additional items.

   **Manual fallback:**
   If neither integration is configured, prompt: "No Linear or GitHub integration found. Please paste the list of changes for this release (one item per line)." Proceed with the pasted list.

2. Classify each item into one of three categories:
   - **New**: A capability that did not exist before.
   - **Improved**: An existing capability that changed behavior or quality.
   - **Fixed**: A bug or broken behavior that was corrected.

   Use Linear labels if available ("bug", "feature", "enhancement"). Fall back to reading the title and description.

3. Discard internal-only items: dependency upgrades, refactors with no user-visible change, CI/CD changes, config tweaks — unless `audience` is `"internal"`. If internal, include a "Technical changes" section at the bottom.

4. For each item, write a one-to-two sentence release note:
   - `"customers"` mode: lead with the user benefit. "You can now export your analytics data to CSV directly from the dashboard." Not: "Added CSV export endpoint to /api/analytics."
   - `"internal"` mode: include the technical action. "Added GET /api/analytics/export endpoint. Returns UTF-8 CSV with active filter params applied."

5. Search the vault for any spec pages related to items in this release: `sqlite3 vault.db "SELECT path, title FROM pages_fts WHERE pages_fts MATCH '<item_keywords>' LIMIT 3;"`. Link the related spec in the internal section of the output with [[wikilinks]].

6. If the release includes breaking changes or deprecations, add a "Heads up" section at the top. This is the most important part of any release notes — do not bury it.

7. Write a 2–3 sentence release summary that opens the document. Plain English, no jargon. Describe the theme of this release: what did we focus on, and why.

8. Save to `wiki/release-notes-[version].md`.

## Output format

```yaml
---
type: wiki
title: "Release Notes — [version_or_sprint]"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: draft
tags: [release-notes, changelog, product, cpo]
sources: [linear, github, vault]
version: "[version_or_sprint]"
audience: "[customers or internal]"
date_range: "[start] to [end]"
---
```

```markdown
# Release Notes — [Version] ([Date Range])

[2–3 sentence release summary. Theme of the release. Plain English.]

---

## Heads Up (breaking changes or removals)

- [Breaking change] — [what changed, what users need to do]

---

## New

- **[Feature name].** [1–2 sentences, benefit-first for customer mode.]
- **[Feature name].** [1–2 sentences.]

## Improved

- **[Item].** [What got better and why it matters.]
- **[Item].** [What got better.]

## Fixed

- **[Bug description — user-facing].** [What was broken and what now works.]
- **[Bug description].** [Brief fix description.]

---

## Technical Changes (internal only)

- [Dependency update, refactor, CI change — with Linear or commit reference]
- Spec reference: [[spec-feature-slug]]
```

## Example output (truncated)

```markdown
# Release Notes — v1.4.0 (April 14–28 2026)

This release focused on onboarding: new users can now reach their first skill output
in under 10 minutes without connecting any integrations. We also addressed the top
two bug reports from the April feedback period.

---

## New

- **Onboarding fast path.** New users can now try a pre-configured demo vault immediately
  after signup — no integrations required. The demo runs a live standup so you see
  real output before committing to setup. Connect your tools when you're ready.
- **Email digest for inactive users.** If you haven't logged in for 7 days, you'll
  receive a digest email with 3 skill suggestions. You can unsubscribe from the notification
  settings page.

## Improved

- **Skill output loading time.** The skill runner now shows a progress indicator during
  execution. Previously the screen was blank while a skill ran, which made it look broken.

## Fixed

- **Standup not showing previous-day journal entries.** The daily standup was missing
  entries created after 8pm the night before. This is now resolved.
- **Sprint brief page overwriting existing content.** If you re-ran sprint planning for
  the same sprint number, the prior page was overwritten entirely. The skill now appends
  a "re-run" section rather than overwriting.
```
