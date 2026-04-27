---
name: opencode-delegation
description: Write a spec, invoke OpenCode to implement it, and archive both the spec and the result in the vault.
version: 1.0.0
trigger:
  - "delegate to OpenCode"
  - "run OpenCode"
  - "have OpenCode build"
  - "send this to OpenCode"
  - "opencode this"
  - "let OpenCode implement"
  - "delegate implementation"
  - "have the agent build"
  - "run the coding agent"
  - "opencode delegation"
integrations:
  - bash-opencode
  - bash-git
  - vault-sqlite-fts5
inputs:
  - name: feature_name
    description: Name of the feature or task to implement
    required: true
  - name: project_path
    description: Absolute path to the project root
    required: true
  - name: spec_source
    description: Existing spec content, wiki reference, or rough notes — if omitted, the skill runs technical-spec first to produce one
    required: false
output_artifact: "wiki/delegation-log-[slug].md"
frequency: on-demand
pack: cto
---

# OpenCode Delegation

## When to run

When you have a well-scoped task and want to hand implementation to OpenCode rather than coding it yourself. The cleaner your spec, the less you'll need to intervene. If you're not sure the task is scoped enough to delegate, run `technical-spec` first — this skill will do it automatically if no spec exists.

Use this for greenfield features, migrations, refactors with clear before/after behavior, and test suite generation. Do not use it for tasks that require external credentials or API keys you haven't set in the environment yet — OpenCode can't ask you for them mid-run.

## What you'll get

A git commit containing the implementation, a `spec.md` in the project root, and a delegation log at `wiki/delegation-log-[slug].md` that captures what was delegated, what OpenCode produced, and whether the result passed your acceptance criteria. If OpenCode fails or produces a broken output, the log captures the error and next steps.

## Steps

1. Check whether `spec.md` already exists in `<project_path>`: `ls <project_path>/spec.md 2>/dev/null`. If it exists and is current (check the `created` frontmatter field against today's date), use it. If it's stale or absent, run the `technical-spec` skill first to generate it. Do not invoke OpenCode without a spec.

2. Read `<project_path>/spec.md` in full. Confirm it has: a one-paragraph summary, numbered acceptance criteria, a data model or interface contract, and an implementation order. If any of these sections are missing, add them before proceeding.

3. Build the OpenCode invocation prompt. The prompt is the full text of `spec.md` with a preamble line: `"Implement the following spec. Work incrementally. Commit each logical unit of work. Do not ask clarifying questions — make the best decision and note it in a comment."` Keep the prompt under 8000 tokens; if spec.md exceeds this, summarize the context section and preserve acceptance criteria verbatim.

4. Run OpenCode: `cd <project_path> && opencode -p "<prompt>" 2>&1 | tee /tmp/opencode-run.log`. Capture all output. Set a 10-minute timeout: `timeout 600 opencode -p "<prompt>"`. If the process does not exit within 10 minutes, kill it and treat as a timeout failure.

5. Check the exit code. Exit 0 = success. Non-zero = failure. Proceed to the appropriate branch below.

6. **On success:** Run `git diff HEAD~1..HEAD --stat` to see what was changed. Run `git log --oneline -5` to capture the commit message(s) OpenCode wrote. If no commits were made (OpenCode produced output but didn't commit), run `git add -A && git commit -m "feat(<feature_name>): OpenCode implementation via delegation"`.

7. **On failure or timeout:** Read `/tmp/opencode-run.log` and identify the last error. Common failure modes:
   - *TypeScript type error*: extract the error, identify the file and line, resolve manually or iterate with a targeted follow-up prompt.
   - *Missing environment variable*: note which var is missing, stop, and surface it to the user.
   - *Infinite loop / no progress*: kill the process, read partial output, identify where it stalled, break the spec into smaller sub-tasks.
   - *Dependency conflict*: read the package manager output, resolve the conflict, re-run.

8. Archive `spec.md` to `wiki/specs/spec-[feature-slug]-YYYY-MM-DD.md` using: `cp <project_path>/spec.md wiki/specs/spec-<slug>-<date>.md`. This preserves the spec history even as `spec.md` is overwritten by future tasks.

9. Write the delegation log to `wiki/delegation-log-[slug].md`. Include: spec summary, invocation timestamp, exit status, git diff stat, any failure notes, and the acceptance criteria pass/fail assessment.

10. Confirm to the user: success path prints commit hash and diff stat. Failure path prints the specific error and a suggested next step.

## Output format

```markdown
---
type: wiki
title: "Delegation Log — [Feature Name]"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: [success | partial | failed]
tags: [opencode-delegation, cto, [feature-slug]]
feature: "[Feature Name]"
spec_path: "wiki/specs/spec-[slug]-YYYY-MM-DD.md"
---

# Delegation Log — [Feature Name]

## Summary

- **Delegated:** YYYY-MM-DD HH:MM
- **Agent:** OpenCode
- **Project:** [project_path]
- **Exit status:** [0 — success / N — error]
- **Duration:** ~[N] minutes

## What Was Implemented

[Git diff stat output. Files changed, insertions, deletions.]

## Commits

[`git log --oneline -5` output]

## Acceptance Criteria Review

| # | Criterion | Status |
|---|-----------|--------|
| 1 | [criterion text] | Pass / Fail / Not verified |
| 2 | [criterion text] | ... |

## Failure Notes (if applicable)

[Error output, what was attempted, what remains.]

## Next Steps

- [ ] [Manual review task]
- [ ] [Follow-up delegation if partial]
```

## Example output (truncated)

```markdown
# Delegation Log — User-defined Webhook Notifications

## Summary

- **Delegated:** 2026-04-26 14:32
- **Agent:** OpenCode
- **Project:** /home/amynporb/repos/kodax-app
- **Exit status:** 0 — success
- **Duration:** ~6 minutes

## What Was Implemented

 src/lib/webhooks.ts             | 87 +++++++++++++++++++++
 src/app/api/webhooks/route.ts   | 44 +++++++++++
 src/app/settings/webhooks/      | 112 +++++++++++++++++++++++++++++
 supabase/migrations/003_webhooks.sql | 18 +++++
 4 files changed, 261 insertions(+)

## Acceptance Criteria Review

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Register up to 5 webhook URLs | Pass |
| 2 | POST within 5 seconds of skill completion | Not verified — needs integration test |
| 3 | JSON body shape correct | Pass |
| 4 | Retry on failure with backoff | Pass |

## Next Steps

- [ ] Add integration test for delivery latency (criterion 2)
- [ ] Confirm HMAC signing is tested against a real receiver
```
