---
name: smart-commit
description: Read staged changes, generate a conventional commit message, and run git commit — no manual message writing.
version: 1.0.0
trigger:
  - "smart commit"
  - "commit these changes"
  - "write a commit message"
  - "commit this"
  - "git commit"
  - "commit my staged changes"
  - "commit with a good message"
  - "conventional commit"
  - "commit and push"
  - "generate commit message"
  - "commit staged"
integrations:
  - bash-git
inputs:
  - name: scope
    description: Conventional commit scope override (e.g. "auth", "webhooks", "ui") — if omitted, the skill infers it from the diff
    required: false
  - name: push
    description: Whether to run `git push` after committing — "yes" or "no" (defaults to "no")
    required: false
output_artifact: "git-commit"
frequency: on-demand
pack: cto
---

# Smart Commit

## When to run

When you have staged changes and want a commit message that's specific enough to be useful in `git log`, without spending two minutes writing it yourself. Also useful after an OpenCode run that didn't commit, or when a contractor hands you changes that need a clean commit history before merging.

Run `git add <files>` first. This skill reads whatever is staged. If nothing is staged, it will tell you.

## What you'll get

A conventional commit message written from the actual diff — not a generic "update code" message. The message follows the `type(scope): subject` format, uses the right type (feat, fix, refactor, chore, docs, test, style), infers the scope from the changed files, and keeps the subject under 72 characters. A body is added when the diff is complex enough to need explanation.

## Steps

1. Check that there are staged changes: `git diff --staged --stat`. If the output is empty, stop and inform the user: "No staged changes found. Run `git add <files>` first."

2. Get the full staged diff: `git diff --staged`. This is the primary input — read every file and every changed line.

3. Get the list of changed files and their change type (added, modified, deleted): `git diff --staged --name-status`.

4. Get the recent commit history for context — understand the commit message conventions already in use in this repo: `git log --oneline -10`.

5. Analyze the diff. Determine:

   **Type** — choose the most accurate:
   - `feat` — adds a new capability that a user or system can invoke
   - `fix` — corrects a bug or broken behavior
   - `refactor` — restructures code without changing external behavior
   - `chore` — maintenance, dependency updates, build configuration, non-functional changes
   - `docs` — documentation changes only (including skill files, READMEs, wiki pages)
   - `test` — adds or modifies tests only
   - `style` — formatting, linting, whitespace, no logic change
   - `perf` — improves performance without changing behavior
   - `ci` — CI/CD pipeline changes

   **Scope** — the system, module, or feature area affected. Infer from the directory or file names of changed files. Examples: `auth`, `webhooks`, `skill-runner`, `ui`, `db`, `api`, `cto-pack`. If `scope` input is provided, use it verbatim.

   **Subject** — one imperative-mood sentence under 72 characters describing what this commit does. Imperative mood: "add", "fix", "remove", "update", "refactor" — not "added", "fixed", "removes". State the outcome, not the method: "add rate limiting to skill run API" not "implement rate limiting middleware".

   **Body** — add if any of these are true: the change is non-obvious, there's a reason the approach was chosen that's worth preserving, there's a breaking change, or the diff touches more than 5 files in different areas. Keep body lines under 72 characters. Body explains the *why*, not the *what* (the diff already shows the what).

   **Breaking change** — if the change is a breaking change to any public interface, API, or behavior, add a footer line: `BREAKING CHANGE: [description]`.

6. Construct the commit message:
   ```
   type(scope): subject

   Body paragraph if needed.

   BREAKING CHANGE: description if applicable.
   ```

7. Present the proposed commit message to the user for review before committing. Print it clearly.

8. Run the commit: `git commit -m "<type>(<scope>): <subject>" -m "<body if any>"`. Use `-m` flags to set the message without opening an editor.

9. If `push` is "yes": `git push`. Print the push result. If `push` is not "yes" or is omitted, do not push.

10. Print the resulting commit hash: `git log --oneline -1`.

## Output format

The skill prints the proposed commit message before running it:

```
Proposed commit message:
─────────────────────────────────────────
feat(webhooks): add HMAC signature validation to webhook delivery

Adds SHA-256 HMAC signing to all outbound webhook payloads.
The signature is sent in the `X-Kodax-Signature` header.
Consumers can verify using the shared secret from their webhook settings.
─────────────────────────────────────────
Committing...
[main a3f7c2d] feat(webhooks): add HMAC signature validation to webhook delivery
 3 files changed, 67 insertions(+), 4 deletions(-)
```

If `push` is "yes":
```
Pushing to origin/main...
To github.com/aporb/agentic-os.git
   b1c2d3e..a3f7c2d  main -> main
```

## Example output (truncated)

Example 1 — a focused feature addition:
```
feat(cto-pack): add security-review skill with grep-based secret scanning

Scans the codebase for hardcoded credentials, SQL injection patterns,
and missing auth guards on API routes. Outputs to wiki/security-review-YYYY-MM-DD.md.
Supports full codebase scan or PR-scoped diff scan via --pr-url.
```

Example 2 — a chore commit:
```
chore(deps): upgrade lodash to 4.17.21 to patch CVE-2021-23337

Prototype pollution fix. No breaking changes in this minor version bump.
```

Example 3 — a fix with breaking change:
```
fix(auth): validate JWT expiry on all API routes

BREAKING CHANGE: Previously, expired JWTs were silently accepted on
/api/skills/* routes. Clients that were relying on this behavior will
now receive 401 and must re-authenticate.
```

Example 4 — a refactor across multiple files:
```
refactor(skill-runner): extract database writes into dedicated service module

Moves all vault read/write operations out of individual skill handlers
into a shared VaultService class. No behavior change — this is preparation
for adding vault access logging in the next sprint.
```
