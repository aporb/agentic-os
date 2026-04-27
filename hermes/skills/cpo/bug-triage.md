---
name: bug-triage
description: Assess a reported bug for severity, reproduction steps, and user impact — then create a tracked ticket so nothing falls through the cracks.
version: 1.0.0
trigger:
  - "triage a bug"
  - "bug report"
  - "something is broken"
  - "report a bug"
  - "log this bug"
  - "create a bug ticket"
  - "assess this bug"
  - "user reported a bug"
  - "bug triage"
integrations:
  - linear-api
  - vault-sqlite-fts5
  - github-api
inputs:
  - name: bug_description
    description: What the user reported — raw description, paste of message, or your own observation
    required: true
  - name: reporter
    description: Who reported it — customer name, user ID, or "self-observed"
    required: false
  - name: affected_feature
    description: Which part of the product this bug touches — e.g. "skill runner", "vault search", "sprint planning"
    required: false
  - name: reproduction_steps
    description: Any steps already known to reproduce the bug (optional — skill will infer if missing)
    required: false
output_artifact: "wiki/bug-[id].md"
frequency: on-demand
pack: cpo
---

# Bug Triage

## When to run

Any time a bug surfaces — whether a user reports it in Intercom, Slack, or email, or you observe it yourself. The risk of not triaging immediately: bugs accumulate in inboxes and Slack threads, their severity degrades in your memory ("was that the one that crashed the export, or the one that just showed wrong data?"), and they surface again at the worst possible time.

Triage does not mean fix. It means: assessed, classified, and tracked. The ticket is the commitment that this bug won't disappear.

## What you'll get

A structured bug assessment with severity classification, inferred reproduction steps, impact scope, and a Linear ticket. The vault page persists the full context — reporter quote, affected users, related spec — so when you pick this up in sprint planning two weeks from now, you don't have to reconstruct the story.

## Steps

1. Parse the bug report from `bug_description`. Extract: the symptom (what the user sees), the expected behavior (what they expected to see), and any environmental details (browser, device, account type, step in workflow).

2. Search the vault for any prior reports of this bug or related issues: `sqlite3 vault.db "SELECT path, title, snippet(pages_fts, 0, '', '', '...', 20) FROM pages_fts WHERE pages_fts MATCH '<bug_keywords>' LIMIT 5;"`. If a prior bug page exists for the same issue, note it as a duplicate or recurrence — do not create a second ticket.

3. If GitHub API is configured, search open issues for similar reports: look for issues with titles matching key terms from `bug_description`. If a matching open issue exists, link it in the assessment rather than creating a duplicate.

4. Assess severity. Assign one of four levels:

   - **P0 — Critical**: The bug causes data loss, security exposure, or complete loss of a core feature for all users. Fix before anything else.
   - **P1 — High**: The bug breaks a primary user workflow for a significant user segment. Block the next sprint if unfixed.
   - **P2 — Medium**: The bug impairs a non-critical feature or affects a small user segment. Prioritize within 2 sprints.
   - **P3 — Low**: Cosmetic, edge case, or single-user issue with a known workaround. Park in backlog.

   Document the rationale for the severity assignment. If uncertain between P1 and P2, default to P1.

5. Infer reproduction steps if not provided. Use the bug description, your knowledge of the product (from vault spec pages), and standard debugging heuristics to draft a step-by-step reproduction guide. Mark inferred steps as `[inferred]` — they need verification.

6. Assess impact scope: how many users are likely affected? Is this tied to a specific integration, a specific user action, or a general platform behavior? Search the vault for related user counts or feedback: `sqlite3 vault.db "SELECT path, title FROM pages_fts WHERE pages_fts MATCH '<affected_feature>' LIMIT 5;"`.

7. Write a one-sentence fix hypothesis: what's the most likely root cause, and where in the codebase would you look first? This is a hypothesis, not a diagnosis — flag it as such.

8. If Linear API is configured: create a Linear ticket with:
   - Title: `[P{N}] [Short bug label] — [affected_feature]`
   - Description: full assessment (steps below)
   - Labels: `bug`, severity label (p0/p1/p2/p3)
   - Priority: mapped from severity (P0 → Urgent, P1 → High, P2 → Medium, P3 → Low)
   Record the Linear ticket ID. Save the vault page at `wiki/bug-[LIN-XXX].md`.

9. If GitHub API is configured (NTH): create a corresponding GitHub issue and cross-reference the Linear ticket.

10. If the bug is P0 or P1, flag for immediate attention: add a note to the current sprint wiki page if one exists (`sqlite3 vault.db "SELECT path FROM pages WHERE path LIKE 'wiki/sprint%' ORDER BY updated DESC LIMIT 1;"`).

## Output format

```yaml
---
type: wiki
title: "Bug — [Short Label] ([LIN-XXX or pending])"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: draft
tags: [bug, triage, cpo, [affected_feature]]
sources: [user-report, vault, linear]
severity: "P[N]"
linear_ticket: "[LIN-XXX or null]"
reporter: "[reporter]"
---
```

```markdown
# Bug — [Short Label]

> Severity: P[N] — [Critical/High/Medium/Low]
> Reported by: [reporter] on YYYY-MM-DD
> Affected feature: [affected_feature]
> Linear: [LIN-XXX]

## Symptom

[What the user sees. Verbatim quote from reporter if available.]

## Expected Behavior

[What should happen instead.]

## Reproduction Steps

1. [Step 1]
2. [Step 2] [inferred]
3. [Step 3]

**Reproducible:** [Yes / Likely / Unknown — requires verification]

## Impact Scope

[Who is affected, how severely, and how broadly. Is there a workaround?]

## Fix Hypothesis

[Most likely root cause and where to investigate first. Flagged as hypothesis —
not a confirmed diagnosis.]

## Related

- [[spec-affected-feature]] (if exists)
- Prior report: [[bug-LIN-XXX]] (if duplicate or recurrence)
```

## Example output (truncated)

```markdown
# Bug — Standup Missing Prior-Day Entries

> Severity: P2 — Medium
> Reported by: User #07 on 2026-04-22
> Affected feature: skill runner / daily-standup
> Linear: LIN-51

## Symptom

"My standup shows 'Nothing to report' for Done even though I wrote up yesterday's
work in my journal. It's not picking up my notes." — User #07, Apr 22 2026

## Expected Behavior

The daily standup should include all journal entries from the previous working day,
including those created after 8pm.

## Reproduction Steps

1. Create a journal entry for the previous day at 9:30pm. [inferred]
2. Run the daily-standup skill the following morning.
3. Observe: the entry does not appear in the Done section. [inferred]

**Reproducible:** Likely — matches pattern reported by 2 separate users.

## Impact Scope

Affects users who do their journaling in the evening. The standup is the product's
primary daily touchpoint — incorrect Done section reduces trust in the whole output.
Workaround: run standup with yesterday's date explicitly set. Affects an estimated
30–40% of active users based on usage patterns.

## Fix Hypothesis

The vault query for previous-day journal entries likely uses a date comparison that
cuts off at midnight UTC, missing entries created after 8pm in US timezones.
Investigate: `pages WHERE date = '<PREV_DATE>'` — may need to query by timestamp range
rather than date string.
```
