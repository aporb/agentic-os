---
name: code-review
description: Review a PR diff and flag issues, risks, and style violations — posts a review comment to GitHub and writes a wiki page.
version: 1.0.0
trigger:
  - "review this PR"
  - "code review"
  - "review pull request"
  - "review PR"
  - "check this diff"
  - "what's wrong with this PR"
  - "review the code"
  - "review this diff"
  - "give me a code review"
  - "review the changes"
integrations:
  - github-api
  - bash-gh
  - vault-sqlite-fts5
inputs:
  - name: pr_url
    description: Full GitHub PR URL (e.g. https://github.com/org/repo/pull/123) or PR number if repo is known
    required: false
  - name: diff
    description: Raw diff text — used when no PR URL is provided (paste inline)
    required: false
output_artifact: "wiki/review-PR-[number].md"
frequency: on-demand
pack: cto
---

# Code Review

## When to run

When a contractor or an AI agent opens a PR and you need to own the quality gate before merging. When you've been coding solo for a week and want a second pass before you ship. When a diff looks bigger than expected and you want a structured risk assessment before you touch the merge button.

This skill won't replace judgment — it surfaces the issues so you spend your review time on the ones that matter, not on hunting for them.

## What you'll get

A structured review that sorts findings by severity (blocking / warning / suggestion), identifies specific file and line references, flags security and correctness risks first, and posts the review directly to the PR as a GitHub comment. The same review lands in your wiki for the record.

## Steps

1. Resolve the diff. If `pr_url` is provided: `gh pr diff <pr_url>` to get the diff and `gh pr view <pr_url> --json title,body,author,files,commits` to get metadata. If `diff` is provided as raw text, use it directly. If neither is provided, check for an open PR on the current branch: `gh pr status`.

2. Read the PR title and body. Understand the stated intent of the change before reading the diff. A "refactor" that adds new logic is a risk signal. A "fix" that modifies 15 files is a risk signal. Note any mismatch between title intent and diff scope.

3. Scan the diff in five passes, in this order:

   **Pass 1 — Security.** Look for: hardcoded secrets or API keys (patterns: `sk-`, `Bearer `, `password =`, `secret =`), SQL string concatenation (injection risk), user-controlled input passed to `eval()`, `exec()`, or shell commands, missing auth checks on new routes, new files committed with overly permissive modes.

   **Pass 2 — Correctness.** Look for: unhandled promise rejections or missing `await`, off-by-one errors in loops, null/undefined dereferences without guards, type assertions that bypass the type system (`as any`, `!`), broken error handling (catch blocks that swallow errors silently), race conditions in async paths.

   **Pass 3 — Scope creep.** Compare the diff to the PR title/body. Flag any changes that are not explained by the stated purpose. These are high risk — they may be intentional but undocumented, or they may be accidental changes that will introduce regression.

   **Pass 4 — Style and conventions.** Compare patterns in the diff against the surrounding codebase (from the vault or from files visible in the diff context). Flag: inconsistent naming conventions, missing error handling patterns used elsewhere in the project, duplicated logic that belongs in a shared utility.

   **Pass 5 — Test coverage.** Check whether the diff includes tests. If it adds new logic without tests, flag as a warning. If it modifies existing logic and no tests changed, flag as blocking — the existing tests may no longer accurately reflect the behavior.

4. Search the vault for any prior reviews of this PR or related code: `sqlite3 vault.db "SELECT path, title FROM pages WHERE pages MATCH 'PR <number> OR <feature_name>' LIMIT 5;"`. Cross-reference if relevant.

5. Classify each finding:
   - **Blocking** — must be resolved before merge (correctness bugs, security issues, broken tests)
   - **Warning** — should be resolved before merge, but judgment call (missing tests, scope creep, suspicious patterns)
   - **Suggestion** — low-priority improvement, can be addressed in a follow-up (style, naming, minor refactor opportunities)

6. Write the wiki page to `wiki/review-PR-[number].md`. Include the summary table of findings first (BLUF), then the full findings below.

7. Post the review to the PR: `gh pr review <pr_url> --comment --body "$(cat wiki/review-PR-<number>.md)"`. If there are blocking issues, use `--request-changes` instead of `--comment`: `gh pr review <pr_url> --request-changes --body "..."`.

8. Print summary: "[N] blocking, [N] warnings, [N] suggestions. Review posted to PR #[number]."

## Output format

```markdown
---
type: wiki
title: "Code Review — PR #[number]: [PR Title]"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: [approved | changes-requested | reviewed]
tags: [code-review, cto, pr-[number]]
pr_url: "[URL]"
pr_author: "[author]"
---

# Code Review — PR #[number]: [PR Title]

## Summary

| Severity | Count |
|----------|-------|
| Blocking | N |
| Warning  | N |
| Suggestion | N |

**Recommendation:** [Approve / Request changes / Approve with suggestions]

---

## Blocking Issues

### [File path, line N] — [Issue title]

[Precise description of the problem. Why it matters. What to do instead.]

```diff
- [the problematic code]
+ [suggested fix]
```

---

## Warnings

### [File path, line N] — [Issue title]

[Description. Lower urgency but real risk.]

---

## Suggestions

### [File path, line N] — [Issue title]

[Optional improvement. No action required before merge.]

---

## Scope Check

[States whether the diff scope matches the PR description. Flags any unexplained changes.]

## What Looks Good

[1–3 things done well. Keeps the review honest and specific, not just a list of complaints.]
```

## Example output (truncated)

```markdown
# Code Review — PR #47: Add webhook delivery with retry logic

## Summary

| Severity | Count |
|----------|-------|
| Blocking | 1 |
| Warning  | 2 |
| Suggestion | 3 |

**Recommendation:** Request changes — one blocking issue before merge.

---

## Blocking Issues

### src/lib/webhooks.ts, line 84 — Webhook secret exposed in plain text log

The HMAC secret is logged at INFO level before the signature is computed:
`logger.info('Signing with secret:', webhook.secret)`. Any log aggregator
or stdout capture will expose the secret in plain text.

```diff
- logger.info('Signing with secret:', webhook.secret);
+ logger.info('Signing webhook delivery', { webhook_id: webhook.id });
```

---

## Warnings

### src/lib/webhooks.ts, line 112 — Retry backoff does not cap at max delay

The exponential backoff formula `delay = baseDelay * 2^attempt` has no ceiling.
Attempt 10 = 512 seconds. Add `Math.min(delay, 30000)` to cap at 30s.

### No tests for the retry path

The happy path (200 response) is tested. The retry and disable-after-10-failures
paths have no coverage. These are the highest-risk code paths.
```
