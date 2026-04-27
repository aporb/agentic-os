---
name: tech-debt-register
description: Scan the codebase for TODO/FIXME/HACK comments, cross-reference GitHub issues, and build or update a prioritized tech debt register.
version: 1.0.0
trigger:
  - "tech debt register"
  - "update tech debt"
  - "catalog tech debt"
  - "find tech debt"
  - "scan for todos"
  - "list all todos and fixmes"
  - "what's our tech debt"
  - "tech debt audit"
  - "build tech debt list"
  - "find fixmes and hacks"
  - "what shortcuts did we take"
integrations:
  - bash-grep
  - bash-git
  - github-api
  - vault-sqlite-fts5
inputs:
  - name: project_path
    description: Absolute path to the project root (defaults to current working directory)
    required: false
  - name: focus_area
    description: Limit the scan to a specific directory or file pattern (e.g. "src/api", "*.py") — defaults to all source files
    required: false
output_artifact: "wiki/tech-debt-register.md"
frequency: on-demand
pack: cto
---

# Tech Debt Register

## When to run

Monthly, to keep the register current, and any time you finish a sprint where you deliberately took shortcuts. The register is not a hall of shame — it's a ledger. Items get added when shortcuts are taken, and they get removed when the debt is paid off.

Running this after a fast-moving sprint is especially valuable: you'll find the five TODOs that got buried in the diff, the HACK that made the deadline but needs to be replaced before you scale, and the FIXME that represents a real risk if ignored.

## What you'll get

A `wiki/tech-debt-register.md` that lists every identified debt item with its source location, the type of debt, an estimated severity (High / Medium / Low based on risk and blast radius), and a payoff estimate. If the file already exists, the skill updates it — adding new items, marking resolved items as such, and preserving the history. The register is the single source of truth for technical debt; it feeds directly into sprint planning.

## Steps

1. Determine the scan scope. If `focus_area` is provided, scope to that path. Otherwise scan all source files in `<project_path>/src` (and equivalent for non-Node projects).

2. Scan for annotated debt markers:
   ```bash
   grep -rn --include="*.ts" --include="*.tsx" --include="*.js" --include="*.py" \
     --include="*.go" --include="*.rb" \
     -E "(TODO|FIXME|HACK|XXX|TEMPORARY|WORKAROUND|KLUDGE|TECH.?DEBT)" \
     <project_path>/src 2>/dev/null | sort
   ```
   For each match, extract: file path, line number, the comment text, and the 2 lines above and below for context.

3. Enrich each match with git blame to find when the comment was introduced:
   ```bash
   git -C <project_path> blame -L <line>,<line> <file> --porcelain | grep "author-time\|summary"
   ```
   Items older than 90 days that have never been touched since introduction are higher priority — they've survived multiple sprints without being addressed.

4. Pull open GitHub issues labeled as tech debt or with "debt", "refactor", "cleanup", "todo" in the title:
   ```bash
   gh issue list --repo <repo> --state open \
     --search "label:tech-debt OR label:refactor label:cleanup OR refactor OR technical debt" \
     --limit 50 --json number,title,labels,createdAt,assignees
   ```
   Cross-reference issue titles against the code comment items — if a TODO references an issue number (common: `TODO(#42): ...`), link them.

5. Check if `wiki/tech-debt-register.md` already exists in the vault:
   ```bash
   sqlite3 vault.db "SELECT path, updated FROM pages WHERE path = 'wiki/tech-debt-register.md';"
   ```
   If it exists, read it. Preserve items marked as `resolved` and their resolution date. Items in the existing register that no longer appear in the code scan have been resolved — mark them accordingly.

6. Classify each debt item by type:
   - **Code quality** — messy logic, unclear naming, missing abstraction
   - **Architecture** — wrong layer, violated separation of concerns, pattern mismatch
   - **Performance** — known slow path, N+1 query, missing cache, synchronous where async is needed
   - **Security** — noted insecurity that was deferred (these are always High severity)
   - **Testing** — missing test coverage noted by the author
   - **Dependency** — pinned to old version, workaround for a library bug that may be fixed upstream
   - **Documentation** — noted gap in internal documentation

7. Estimate severity for each item:
   - **High** — any security debt; any item in a hot code path touched weekly; any item where the comment says "this will break when X" and X is approaching
   - **Medium** — architectural debt in non-critical paths; missing tests on important features; workarounds with a clear better path
   - **Low** — cosmetic issues, naming problems, minor duplication, speculative TODOs ("maybe we should...")

8. Estimate payoff effort: S (< 2 hours), M (2–8 hours), L (1–3 days), XL (> 3 days). This is a rough estimate — the goal is to identify which items are cheap wins vs. which require sprint planning.

9. Write to `wiki/tech-debt-register.md`. If the file already exists, update it: add new items, update item ages, mark resolved items, preserve the full history section at the bottom.

10. Print summary: "[N] items total — [N] High, [N] Medium, [N] Low. [N] new since last run. [N] resolved."

## Output format

```markdown
---
type: wiki
title: "Tech Debt Register"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: current
tags: [tech-debt, cto, engineering]
total_items: N
high_count: N
medium_count: N
low_count: N
---

# Tech Debt Register

> Updated: YYYY-MM-DD — [N] items ([N] High / [N] Medium / [N] Low).
> Source: automated code scan + GitHub issue cross-reference.

---

## High Severity

| ID | Type | Location | Description | Age | Effort | Issue |
|----|------|----------|-------------|-----|--------|-------|
| TD-001 | Security | `src/api/auth/route.ts:45` | Rate limiting not applied to login endpoint | 47d | S | #89 |
| TD-002 | Architecture | `src/lib/skill-runner.ts:120` | HACK: skill output written synchronously — blocks event loop under load | 23d | M | — |

### TD-001 — Rate limiting missing on login endpoint

**Comment:** `// TODO(#89): add rate limiting here before public launch`
**Introduced:** 2026-03-10 (commit `a1b2c3d`)
**Risk:** Brute-force attack on the login endpoint is unmitigated. Any user password is guessable given enough requests.
**Payoff:** Add `express-rate-limit` middleware to `/api/auth/login` — estimated 2 hours.

---

## Medium Severity

| ID | Type | Location | Description | Age | Effort | Issue |
|----|------|----------|-------------|-----|--------|-------|
| TD-003 | Testing | `src/lib/vault.ts` | No unit tests on FTS5 query builder | 60d | M | — |

---

## Low Severity

| ID | Type | Location | Description | Age | Effort | Issue |
|----|------|----------|-------------|-----|--------|-------|

---

## Resolved (last 90 days)

| ID | Description | Resolved | PR |
|----|-------------|----------|----|
| TD-000 | Missing input validation on webhook URL field | 2026-04-10 | #102 |
```

## Example output (truncated)

```markdown
# Tech Debt Register

> Updated: 2026-04-26 — 14 items (3 High / 7 Medium / 4 Low).
> 2 new since last run (2026-04-01). 1 resolved (TD-008).

## High Severity

| ID | Type | Location | Description | Age | Effort |
|----|------|----------|-------------|-----|--------|
| TD-001 | Security | `src/api/auth/route.ts:45` | No rate limiting on login | 47d | S |
| TD-004 | Performance | `src/lib/vault-search.ts:89` | HACK: full table scan on unindexed query field | 12d | M |
| TD-011 | Architecture | `src/app/api/skills/run/route.ts:201` | TEMPORARY: OpenCode timeout hardcoded to 600s — needs config | 3d | S |

### TD-001 — No rate limiting on login endpoint

**Comment:** `// TODO(#89): add rate limiting before public launch`
**Introduced:** 2026-03-10 by commit `a1b2c3d`
**Risk:** Login endpoint accepts unlimited requests. Credential stuffing or brute-force
is unmitigated. Rated High because the endpoint is public-facing.
**Payoff (S — < 2h):** Install and configure `@upstash/ratelimit` on the login route.
Blocked by: nothing. Can be done independently this sprint.
**Linked issue:** #89 (open)
```
