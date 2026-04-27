---
name: dependency-audit
description: Scan package files for outdated or vulnerable dependencies and produce a structured remediation table.
version: 1.0.0
trigger:
  - "dependency audit"
  - "audit dependencies"
  - "check for vulnerabilities"
  - "npm audit"
  - "pip audit"
  - "check packages"
  - "outdated packages"
  - "vulnerable packages"
  - "check npm"
  - "dependency scan"
  - "update dependencies"
integrations:
  - bash-npm-audit
  - bash-pip-audit
  - bash-git
  - github-api
inputs:
  - name: project_path
    description: Absolute path to the project root (defaults to current working directory)
    required: false
  - name: severity_threshold
    description: Minimum severity to flag — "critical", "high", "moderate", or "all" (defaults to "moderate")
    required: false
output_artifact: "wiki/dependency-audit-YYYY-MM-DD.md"
frequency: cron:0 9 1 * *
pack: cto
---

# Dependency Audit

## When to run

Monthly, on the first of the month, as a cron job — so you're not the last person to know your packages have a known CVE. Also run before any major release, before a new contractor starts (they'll read your code and notice what you missed), and any time a security advisory surfaces in your community.

Dependency vulnerabilities are the most common way a small team ends up with a compromise they didn't detect for months. Running this monthly closes the window.

## What you'll get

A structured wiki page with every vulnerability at or above your threshold, organized by severity, with the affected package, the CVE, the fix version, and whether a breaking change is involved in the upgrade. Outdated non-vulnerable packages are listed separately so you can plan upgrades without conflating "old" with "dangerous."

## Steps

1. Detect the project ecosystem. Check `<project_path>` for:
   - `package.json` or `package-lock.json` — Node.js / npm
   - `yarn.lock` — Node.js / Yarn
   - `pnpm-lock.yaml` — Node.js / pnpm
   - `requirements.txt`, `pyproject.toml`, or `Pipfile` — Python
   - Both may coexist in a monorepo — run both audits.

2. **Node.js audit:** `cd <project_path> && npm audit --json 2>&1 > /tmp/npm-audit.json`. If yarn: `yarn audit --json 2>&1 > /tmp/yarn-audit.json`. Parse JSON output for vulnerabilities. Extract: package name, severity, CVE IDs, vulnerable versions range, fixed version, dependency path (direct vs. transitive).

3. **Python audit:** `pip-audit --format json --output /tmp/pip-audit.json 2>&1`. Parse JSON output for vulnerabilities. Extract the same fields. If `pip-audit` is not installed: `pip install pip-audit && pip-audit --format json --output /tmp/pip-audit.json`.

4. **Outdated packages (non-critical):** Run `npm outdated --json > /tmp/npm-outdated.json` and/or `pip list --outdated --format json > /tmp/pip-outdated.json`. These represent upgrade opportunities, not security risks — keep separate from the vulnerability section.

5. Filter by `severity_threshold`. Default: include `critical`, `high`, and `moderate`. Drop `low` and `info` unless threshold is "all".

6. For each vulnerability at or above threshold, check whether a fix version exists and whether the upgrade is a breaking change (major version bump = potentially breaking). Tag each row accordingly.

7. Cross-reference GitHub Security Advisories for any CVEs found: `gh api /advisories?cve_id=<CVE_ID> --jq '.[] | {summary, severity, patched_versions}'` for each critical/high CVE. This surfaces CVSS scores and vendor advisories the package manager audit may omit.

8. Search the vault for any prior dependency audit pages: `sqlite3 vault.db "SELECT path, updated FROM pages WHERE path LIKE 'wiki/dependency-audit-%' ORDER BY updated DESC LIMIT 3;"`. Compare the current finding count against the prior audit — note improvements or regressions.

9. Write the audit to `wiki/dependency-audit-<YYYY-MM-DD>.md`.

10. If any critical vulnerabilities are found, print a prominent warning: "CRITICAL: [N] critical vulnerabilities found. Review immediately."

## Output format

```markdown
---
type: wiki
title: "Dependency Audit — YYYY-MM-DD"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: [clean | warnings | critical]
tags: [dependency-audit, cto, security]
ecosystem: [npm | pip | both]
critical_count: N
high_count: N
moderate_count: N
---

# Dependency Audit — YYYY-MM-DD

## Summary

| Severity | Count | Fix Available |
|----------|-------|---------------|
| Critical | N | N |
| High     | N | N |
| Moderate | N | N |
| Total vulnerable | N | N |

**Status:** [Clean / Action required]

---

## Vulnerabilities

### Critical

| Package | Version | CVE | Fixed In | Breaking? | Path |
|---------|---------|-----|----------|-----------|------|
| [name] | [v] | CVE-XXXX-XXXX | [v+1] | [Yes/No] | [direct/transitive via X] |

**CVE-XXXX-XXXX:** [One-sentence description of the vulnerability and exploit vector.]

### High

| Package | Version | CVE | Fixed In | Breaking? | Path |
|---------|---------|-----|----------|-----------|------|

### Moderate

| Package | Version | CVE | Fixed In | Breaking? | Path |
|---------|---------|-----|----------|-----------|------|

---

## Outdated (Non-Vulnerable)

These packages are behind their latest release but have no known CVEs.
Upgrade at your discretion — check for breaking changes before updating major versions.

| Package | Current | Latest | Major Bump? |
|---------|---------|--------|-------------|

---

## Recommended Actions

1. **Immediate (Critical/High):** `npm install <package>@<fixed-version>` or `pip install --upgrade <package>==<fixed-version>`
2. **This sprint (Moderate):** [List upgrades]
3. **Next sprint (Outdated):** [Batch the non-breaking updates]

## Comparison to Prior Audit

[Reference prior audit file if it exists. State whether the vulnerability count went up or down.]
```

## Example output (truncated)

```markdown
# Dependency Audit — 2026-04-01

## Summary

| Severity | Count | Fix Available |
|----------|-------|---------------|
| Critical | 1     | 1             |
| High     | 3     | 3             |
| Moderate | 5     | 4             |
| Total    | 9     | 8             |

**Status:** Action required — 1 critical vulnerability.

---

## Vulnerabilities

### Critical

| Package | Version | CVE | Fixed In | Breaking? | Path |
|---------|---------|-----|----------|-----------|------|
| lodash | 4.17.20 | CVE-2021-23337 | 4.17.21 | No | transitive via express-validator |

**CVE-2021-23337:** Prototype pollution via `zipObjectDeep`. Attacker-controlled keys
can override Object prototype properties. Fix: `npm install lodash@4.17.21`.

---

## Recommended Actions

1. **Immediate:** `npm install lodash@4.17.21` — no breaking change, patch release.
2. **This sprint:** Upgrade `axios` (1.4.0 → 1.7.9), `jsonwebtoken` (8.5.1 → 9.0.2).
   Note: `jsonwebtoken` 9.x has a breaking change in `verify()` callback signature —
   review before shipping.
```
