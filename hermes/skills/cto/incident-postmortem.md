---
name: incident-postmortem
description: Structure a production incident into a five-section postmortem — timeline, impact, root cause, contributing factors, and action items.
version: 1.0.0
trigger:
  - "incident postmortem"
  - "write a postmortem"
  - "document the outage"
  - "postmortem for"
  - "what happened"
  - "incident report"
  - "document the incident"
  - "root cause analysis"
  - "blameless postmortem"
  - "write up the incident"
  - "document this outage"
integrations:
  - vault-sqlite-fts5
  - github-api
  - bash-git
inputs:
  - name: incident_date
    description: Date of the incident (YYYY-MM-DD)
    required: true
  - name: slug
    description: Short kebab-case identifier for the incident (e.g. "auth-service-down", "db-connection-pool-exhausted")
    required: true
  - name: description
    description: Paste your raw notes, Slack thread export, Sentry alert details, or a timeline summary — anything you have
    required: true
  - name: affected_systems
    description: Which services, features, or user segments were affected
    required: false
output_artifact: "wiki/postmortem-YYYY-MM-DD-[slug].md"
frequency: on-demand
pack: cto
---

# Incident Postmortem

## When to run

Within 48 hours of any production incident that caused user-facing downtime, data loss, incorrect behavior at scale, or security exposure. The closer to the incident you write it, the more accurate the timeline and the more useful the root cause.

Write the postmortem even for incidents that "resolved themselves." If you don't understand why it resolved, you don't understand why it happened.

The goal is not to assign blame — it is to build a record that helps you prevent this class of incident from recurring. The action items are the only part of the postmortem with legs.

## What you'll get

A `wiki/postmortem-[date]-[slug].md` with five structured sections: a precise timeline, quantified impact, root cause (stated as a system condition, not a person's mistake), contributing factors, and concrete action items with owners and due dates. The postmortem lands in your vault and can be referenced in future ADRs, security reviews, and onboarding docs.

## Steps

1. Read the `description` input. Extract every timestamped event you can identify. Fill gaps with "[unknown — needs investigation]" rather than guessing.

2. Search the vault for related context:
   - Prior postmortems on similar incidents: `sqlite3 vault.db "SELECT path, title FROM pages WHERE path LIKE 'wiki/postmortem-%' AND pages MATCH '<slug keywords>' LIMIT 5;"`.
   - Any ADRs related to the affected system: `sqlite3 vault.db "SELECT path, title FROM pages WHERE path LIKE 'wiki/adr-%' AND pages MATCH '<affected_systems>' LIMIT 5;"`.

3. Check GitHub for issues or PRs opened around the incident time: `gh issue list --repo <repo> --state all --search "created:>YYYY-MM-DD" --limit 20 --json title,createdAt,url`. Look for error reports, quick fixes, or rollback commits that corroborate the timeline.

4. Pull recent git log around the incident date to identify any deploys that preceded it: `git log --oneline --since="<incident_date - 2 days>" --until="<incident_date + 1 day>"`. A deploy within 30 minutes of incident start is a candidate contributing factor.

5. **Draft the Timeline.** Each entry is: `HH:MM [TZ] — [what happened / who noticed / what action was taken]`. Be precise about the sequence of detection, escalation, mitigation, and resolution. Note: detection lag (time between incident start and first alert) is always worth computing and noting.

6. **Draft the Impact section.** Quantify wherever possible: percentage of users affected, requests that errored, minutes of downtime, data rows affected, revenue impact if estimable. Do not use vague language like "some users experienced issues." Use "147 of 312 authenticated users received 500 errors for 23 minutes."

7. **Draft the Root Cause.** One to three sentences. State the condition in the system that caused the incident. Not: "Bob pushed broken code." Yes: "The connection pool limit for the database was set to 20, which is insufficient when more than 5 concurrent skill runs execute database queries simultaneously. Under load, the pool exhausted and all new queries returned a connection timeout error."

8. **Draft Contributing Factors.** Three to seven factors. These are conditions that made the root cause possible or made the incident worse. Examples: no alerting on connection pool saturation, no load test covering concurrent usage, staging environment uses a connection limit of 100 so the issue was not reproducible there.

9. **Draft Action Items.** Each action item: a specific task, a named owner (can be "me" for a solo founder), and a due date. Categorize as: Immediate (< 1 week), Short-term (1–4 weeks), or Long-term (next quarter). At least one action item must address the root cause directly. At least one must address detection (alerting, monitoring).

10. If Sentry or Datadog data is available (pasted in `description` or accessible via API), extract error rates, affected traces, and user impact numbers from it. Note the data source in the Sources section.

11. Write to `wiki/postmortem-<incident_date>-<slug>.md`.

## Output format

```markdown
---
type: wiki
title: "Postmortem — YYYY-MM-DD: [Slug]"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: draft
tags: [postmortem, cto, incident, [slug]]
incident_date: YYYY-MM-DD
severity: [P0 | P1 | P2]
duration_minutes: N
users_affected: N
---

# Postmortem — YYYY-MM-DD: [Incident Title]

> **Severity:** [P0 — complete outage / P1 — partial / P2 — degraded]
> **Duration:** [N] minutes
> **Users affected:** [N] ([X]% of active users)

---

## 1. Timeline

| Time (UTC) | Event |
|------------|-------|
| HH:MM | [Incident started / first error logged] |
| HH:MM | [First user report / alert fired] |
| HH:MM | [Investigation started] |
| HH:MM | [Root cause identified] |
| HH:MM | [Mitigation deployed] |
| HH:MM | [Incident resolved] |

**Detection lag:** [N] minutes between incident start and first alert.

---

## 2. Impact

- **Users affected:** [N] ([X]% of [segment])
- **Duration:** [N] minutes of [full outage / degraded service]
- **Errors:** [N] requests returned [error code/type] during the window
- **Data impact:** [None / describe if applicable]
- **Revenue impact:** [$X estimated, or "not estimated"]

---

## 3. Root Cause

[1–3 sentences. The specific system condition that caused the incident.
Named as a condition, not a person's failure.]

---

## 4. Contributing Factors

- [Condition that allowed root cause to exist]
- [Condition that delayed detection]
- [Condition that made recovery harder]
- [...]

---

## 5. Action Items

| # | Action | Category | Owner | Due |
|---|--------|----------|-------|-----|
| 1 | [Fix the root cause — specific task] | Immediate | [name] | YYYY-MM-DD |
| 2 | [Add alerting for [condition]] | Immediate | [name] | YYYY-MM-DD |
| 3 | [Add [condition] to load test] | Short-term | [name] | YYYY-MM-DD |
| 4 | [Architectural improvement] | Long-term | [name] | YYYY-MM-DD |

---

## Sources

- [Raw notes / Sentry export / Slack thread]
- [GitHub issues or PRs referenced]
- [Related ADRs or prior postmortems]
```

## Example output (truncated)

```markdown
# Postmortem — 2026-04-22: DB Connection Pool Exhausted

> **Severity:** P1 — partial outage (authenticated skill runs only)
> **Duration:** 23 minutes
> **Users affected:** 147 of 312 active users (47%)

## 1. Timeline

| Time (UTC) | Event |
|------------|-------|
| 14:03 | Skill run queue spike begins — 18 concurrent runs triggered by cron jobs |
| 14:04 | Database connection pool exhausted (limit: 20) |
| 14:04 | Skill runs begin returning 500 errors; user-facing error message: "Skill failed" |
| 14:19 | First user reports error via Telegram — 15-minute detection lag |
| 14:21 | Hermes runtime restarted; connection pool reset |
| 14:26 | All skill runs returning 200; incident resolved |

**Detection lag:** 15 minutes. No automated alerting on connection pool saturation.

## 3. Root Cause

The Supabase connection pool was configured with a limit of 20 connections. The Friday 2pm
cron window triggers 6 concurrent skill packs, each opening 3–5 database connections.
At 18 concurrent connections, the pool exhausted and all subsequent connection requests
failed with a timeout error, returning 500 to end users.

## 4. Contributing Factors

- No alert configured for connection pool utilization > 80%.
- Staging environment uses a pool limit of 100 (Supabase free tier default) — issue
  was not reproducible in staging.
- No circuit breaker in skill runner — all runs retry immediately on failure, which
  held connections longer and extended the exhaustion window.

## 5. Action Items

| # | Action | Category | Owner | Due |
|---|--------|----------|-------|-----|
| 1 | Increase connection pool limit to 50 in production Supabase dashboard | Immediate | Amyn | 2026-04-23 |
| 2 | Add Sentry alert: connection pool utilization > 75% for 60s | Immediate | Amyn | 2026-04-25 |
| 3 | Match staging pool limit to production | Short-term | Amyn | 2026-04-30 |
| 4 | Add exponential backoff + jitter to skill runner retry logic | Short-term | Amyn | 2026-05-07 |
```
