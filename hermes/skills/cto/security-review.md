---
name: security-review
description: Grep the codebase for auth gaps, exposed secrets, injection risks, and rate limiting holes. Outputs a structured security review wiki page.
version: 1.0.0
trigger:
  - "security review"
  - "security audit"
  - "check for security issues"
  - "find security vulnerabilities"
  - "review security"
  - "check for secrets"
  - "find exposed secrets"
  - "check auth"
  - "pre-launch security check"
  - "security scan"
  - "find injection risks"
integrations:
  - bash-grep
  - bash-git
  - github-api
  - vault-sqlite-fts5
inputs:
  - name: project_path
    description: Absolute path to the project root (defaults to current working directory)
    required: false
  - name: pr_url
    description: GitHub PR URL — if provided, scan only the files changed in this PR instead of the full codebase
    required: false
  - name: focus
    description: Specific area to emphasize — "secrets", "auth", "injection", "rate-limiting", or "all" (defaults to "all")
    required: false
output_artifact: "wiki/security-review-YYYY-MM-DD.md"
frequency: on-demand
pack: cto
---

# Security Review

## When to run

Before every production release. Before you hand repository access to a new contractor. After a sprint that touched authentication, user input handling, or environment configuration. Whenever you hear "I just pushed a quick fix to the auth flow."

A 20-minute grep pass before a launch is worth more than a post-incident postmortem. The issues this skill finds are the ones that cause the incidents.

## What you'll get

A wiki page categorizing every finding by risk class and severity. Each finding includes the file, line, the matching code, and a concrete remediation step. Clean runs produce a "no findings" page — which is worth keeping in the vault as a timestamp of your last clean review.

## Steps

1. Determine scan scope. If `pr_url` is provided, get the list of changed files: `gh pr diff <pr_url> --name-only`. Scan only those files. If no PR is provided, scan the full project: `find <project_path>/src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.py" -o -name "*.go" -o -name "*.rb" \) 2>/dev/null`.

2. Exclude build artifacts and test fixtures: filter out `node_modules/`, `dist/`, `.next/`, `__pycache__/`, `*.min.js`, `*.test.*`, `*.spec.*` from the file list.

3. **Secrets scan.** Run each pattern against all in-scope files:
   ```bash
   grep -rn --include="*.ts" --include="*.js" --include="*.py" --include="*.env*" \
     -E "(sk-[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16}|password\s*=\s*['\"][^'\"]+['\"]|secret\s*=\s*['\"][^'\"]+['\"]|api_key\s*=\s*['\"][^'\"]+['\"]|Bearer\s+[a-zA-Z0-9\-._~+/]+=*)" \
     <project_path>/src
   ```
   Flag any hardcoded value that looks like a credential, token, or key.

4. **SQL injection scan.** Find string concatenation into SQL queries:
   ```bash
   grep -rn -E "(query|execute|raw)\s*\(\s*['\"].*\$\{|\".*\+\s*(req\.|params\.|body\.|query\.)|f['\"]SELECT.*\{" \
     <project_path>/src
   ```

5. **Auth check scan.** Find route handlers that accept user input without an apparent auth guard:
   ```bash
   grep -rn -E "(app\.(get|post|put|delete|patch)|router\.(get|post|put|delete|patch))\s*\(" \
     <project_path>/src
   ```
   For each route match, check the 20 lines following for `auth`, `session`, `verify`, `middleware`, `protect`, or `requireAuth`. Flag routes that appear unguarded.

6. **Input validation scan.** Find places where `req.body`, `req.params`, or `request.form` data is used without passing through a validation layer:
   ```bash
   grep -rn -E "(req\.body\.|req\.params\.|req\.query\.|request\.form\.|request\.args\.)[a-zA-Z]+" \
     <project_path>/src
   ```
   Check whether each usage is within a validated block (zod, joi, yup, pydantic, cerberus, marshmallow, or similar).

7. **Eval / shell injection scan.** Find dangerous function calls:
   ```bash
   grep -rn -E "\beval\s*\(|\bexec\s*\(|\bsubprocess\.\w+\s*\(|\bspawn\s*\(|\bshell_exec\s*\(" \
     <project_path>/src
   ```
   Flag any call that includes a variable derived from user input.

8. **Rate limiting scan.** Check whether new API routes have rate limiting applied:
   ```bash
   grep -rn -E "rateLimit|rate_limit|throttle|@RateLimit" <project_path>/src
   ```
   Cross-reference against the routes found in step 5. Routes without rate limiting on mutation endpoints (POST, PUT, PATCH, DELETE) are flagged as warnings.

9. **Environment variable hygiene.** Check for `.env` files committed to the repository:
   ```bash
   git -C <project_path> log --all --full-history -- "*.env" ".env*" 2>/dev/null
   ```
   Also check `.gitignore` for the pattern `.env`: `grep -l "^\.env" <project_path>/.gitignore`. Flag if `.env` is tracked in git history even if currently ignored.

10. Classify each finding: **Critical** (secrets in code, SQL injection, unauthenticated mutation endpoints), **High** (unvalidated input, eval with user data, rate limiting absent on auth endpoints), **Moderate** (rate limiting absent on non-auth endpoints, suspicious patterns that may be false positives).

11. For each finding, provide: file path, line number, the matching code snippet, a one-sentence explanation of the risk, and a concrete remediation step.

12. Write to `wiki/security-review-<YYYY-MM-DD>.md`. Search vault for prior reviews and note the delta: `sqlite3 vault.db "SELECT path, updated FROM pages WHERE path LIKE 'wiki/security-review-%' ORDER BY updated DESC LIMIT 1;"`.

## Output format

```markdown
---
type: wiki
title: "Security Review — YYYY-MM-DD"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: [clean | issues-found | critical]
tags: [security-review, cto, security]
scope: [full-codebase | pr-[number]]
critical_count: N
high_count: N
moderate_count: N
---

# Security Review — YYYY-MM-DD

## Summary

| Risk Class | Critical | High | Moderate |
|------------|----------|------|----------|
| Secrets / credentials | N | N | N |
| Injection (SQL/shell/eval) | N | N | N |
| Auth gaps | N | N | N |
| Input validation | N | N | N |
| Rate limiting | N | N | N |
| **Total** | **N** | **N** | **N** |

**Scope:** [full codebase / PR #N — N files]
**Status:** [Clean / Review before next deploy / Do not ship]

---

## Critical Findings

### [CRIT-1] Hardcoded API key — src/lib/openai.ts:14

```
const client = new OpenAI({ apiKey: "sk-proj-abc123..." });
```

**Risk:** Credential exposed in source code. Any contributor with repo access owns this key.
Any git history that includes this commit exposes it permanently even after removal.

**Fix:** Move to `process.env.OPENAI_API_KEY`. Add `OPENAI_API_KEY=` to `.env.example`.
Rotate the key immediately — it is compromised from the moment it hit the repo.

---

## High Findings

---

## Moderate Findings

---

## Clean Areas

[Explicitly note which scan categories returned zero findings — this is part of the record.]

## Comparison to Prior Review

[Reference prior review. Note whether critical/high count went up or down.]
```

## Example output (truncated)

```markdown
# Security Review — 2026-04-26

## Summary

| Risk Class | Critical | High | Moderate |
|------------|----------|------|----------|
| Secrets / credentials | 1 | 0 | 0 |
| Injection | 0 | 1 | 0 |
| Auth gaps | 0 | 1 | 2 |
| Input validation | 0 | 2 | 3 |
| Rate limiting | 0 | 0 | 4 |
| **Total** | **1** | **4** | **9** |

**Status:** Do not ship — 1 critical finding.

---

## Critical Findings

### [CRIT-1] Hardcoded Stripe secret key — src/lib/stripe.ts:8

```typescript
const stripe = new Stripe("sk_live_abc123xyz...");
```

**Risk:** Live Stripe secret key committed to source. Any access to the repo
(current or historical) grants full Stripe API access including refunds and
payout manipulation.

**Fix:** `process.env.STRIPE_SECRET_KEY`. Rotate the key in the Stripe dashboard now.
Run `git filter-repo --path src/lib/stripe.ts --invert-paths` to scrub history,
or accept the key is permanently compromised and rotate only.

---

## High Findings

### [HIGH-1] Unvalidated user input passed to database query — src/api/search/route.ts:31

```typescript
const results = await db.raw(`SELECT * FROM posts WHERE title LIKE '%${query}%'`);
```

**Risk:** SQL injection via the `query` parameter. An attacker can extract any data
in the database or drop tables.

**Fix:** Use parameterized queries: `db.raw('SELECT * FROM posts WHERE title LIKE ?', [\`%${query}%\`])`.
```
