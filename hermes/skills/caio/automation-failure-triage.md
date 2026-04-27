---
name: automation-failure-triage
description: When a Hermes cron or webhook fails, read the relevant logs, identify the root cause, surface the fix, and optionally apply it to the cron config.
version: 1.0.0
trigger:
  - "my automation failed"
  - "cron job failed"
  - "webhook isn't working"
  - "automation failure"
  - "Hermes cron error"
  - "debug my automation"
  - "why did my workflow fail"
  - "triage a failure"
  - "agent error"
  - "skill failed"
  - "what went wrong with"
integrations:
  - bash
  - vault-sqlite-fts5
inputs:
  - name: automation_name
    description: Name of the failed cron job, webhook, or skill — e.g. "daily-standup", "pipeline-health-report", or the skill file name
    required: true
  - name: error_message
    description: The error or failure signal you observed — paste the message, the Telegram alert, or describe what didn't happen that should have
    required: false
output_artifact: "wiki/automation-fix-[slug].md"
frequency: on-demand
pack: caio
---

# Automation Failure Triage

## When to run

The moment an automation fails — a cron that didn't send its Telegram message, a webhook that returned nothing, a skill that errored mid-run. Don't wait to triage this. Silent failures in automations compound: if the daily standup fails on Monday and you don't notice until Friday, you've lost a week of operating context.

The output of this skill is the root cause and the fix. In most cases the fix is one of four things: a broken MCP connection, an expired API key, a changed upstream schema, or a prompt that hit a model context limit. This skill finds which one it is.

## What you'll get

A triage report at `wiki/automation-fix-[slug].md` with the root cause identified, the specific fix documented, the steps you need to take (or that the agent will take if you authorize it), and a check that the automation runs clean after the fix. If the fix requires editing a skill file or cron config, the report includes the exact diff.

## Steps

1. Read the Hermes error log for recent failures: `bash -c "tail -200 ~/.hermes/logs/errors.log 2>/dev/null | grep -i 'error\|fail\|exception\|timeout' | tail -50"`. Parse for entries matching `automation_name`.

2. Read the Hermes agent log for the last run of this automation: `bash -c "grep -A 20 '[automation_name]' ~/.hermes/logs/agent.log 2>/dev/null | tail -80"`. Find the last run timestamp and the last line before failure.

3. Read the Hermes gateway log for API calls made during that run: `bash -c "grep -h '[timestamp]' ~/.hermes/logs/gateway.log 2>/dev/null | tail -50"` where `[timestamp]` is the approximate window of the failed run. Look for: HTTP error codes (401, 429, 500), timeout markers, connection refused errors.

4. Classify the failure type based on the log evidence:
   - **Auth failure (401/403):** An API key expired or was revoked. Identify which service.
   - **Rate limit (429):** Too many requests in the window. Identify which API and the limit.
   - **Model context exceeded:** Prompt + context exceeded model token limit. Identify the approximate token count.
   - **MCP server down:** A required MCP server isn't responding. Identify which one.
   - **Schema change:** An upstream API response changed format and the parsing broke. Identify the field.
   - **Cron config error:** The cron expression is malformed or the skill file path is wrong.
   - **Vault query failure:** SQLite FTS5 query returned an error or the vault.db is locked.
   - **Unknown:** Log evidence is insufficient — flag what additional data is needed.

5. Check the MCP server status if the failure type is or might be MCP-related: `bash -c "cat ~/.hermes/config.json 2>/dev/null | python3 -c 'import json,sys; d=json.load(sys.stdin); servers=d.get(\"mcpServers\",{}); [print(k, v.get(\"command\",\"N/A\")) for k,v in servers.items()]'"`. For each server the automation depends on, verify it can be invoked.

6. If the failure is auth-related, identify the credential source: `bash -c "grep -r '[service_name]' ~/.hermes/.env 2>/dev/null | head -5"` (redact the value in any output — show only the key name). Tell the user which key to rotate and where to set the new value.

7. If the failure is context-length-related, read the skill file to identify what context loading is happening: `bash -c "cat ~/.hermes/skills/[pack]/[skill-name].md 2>/dev/null | grep -A 5 'Step [0-9]'"`. Identify the step that loads the most tokens and suggest the reduction: FTS5 query returning too many results, full page loads instead of summaries, or a prompt prefix that grew too large.

8. Draft the fix. Be specific: the exact line to change, the exact new value, the exact command to run. Do not describe the fix in general terms — write it as a diff or a set of numbered shell commands.

9. Ask the user whether to apply the fix automatically or to present it for manual application. If automatic: apply the change, re-run the automation once manually to confirm it succeeds: `bash -c "hermes run [automation_name]"`. Capture the output and confirm it matches expected output format.

10. Write the triage report to `wiki/automation-fix-[slug].md`. Include: the failure log excerpt, the root cause classification, the fix applied, the confirmation run output, and any follow-up preventive measures (e.g. add a health check cron, add an alert if the cron doesn't produce output within 30 minutes of scheduled time).

## Output format

```yaml
---
type: wiki
title: "Automation Fix — [Automation Name]"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: resolved
tags: [caio, automation-fix, [automation-slug]]
sources: [hermes-logs, bash]
automation: "[automation_name]"
root_cause: "[failure-type]"
fix_applied: true|false
---
```

```markdown
# Automation Fix — [Automation Name]

> Triaged: YYYY-MM-DD HH:MM. Root cause: [failure type]. Fix: [applied / pending manual action].

## Failure Summary

- **Automation:** `[automation_name]`
- **Last successful run:** YYYY-MM-DD HH:MM
- **First observed failure:** YYYY-MM-DD HH:MM
- **Root cause:** [classification]

## Log Evidence

```
[Relevant log excerpt — error lines, last lines before failure]
```

## Root Cause

[2–3 sentences. What broke, why it broke, what triggered the break (key rotation, upstream change, etc.).]

## Fix

[Exact steps. Either applied already (say when) or presented for manual application.]

```diff
# If a file change:
- [old line]
+ [new line]
```

```bash
# If a shell action:
[exact command]
```

## Confirmation

[Output of the post-fix test run, or "pending — awaiting user confirmation to apply fix".]

## Prevention

- [Specific action to prevent this class of failure recurring]
```

## Example output (truncated)

```markdown
# Automation Fix — daily-standup

> Triaged: 2026-04-14 08:04. Root cause: Auth failure (Google Calendar MCP). Fix: pending manual action.

## Failure Summary

- **Automation:** `daily-standup`
- **Last successful run:** 2026-04-11 08:00
- **First observed failure:** 2026-04-14 08:00 (3 days silent)
- **Root cause:** Auth failure — Google OAuth token expired

## Log Evidence

```
2026-04-14 08:00:02 [gateway] ERROR: MCP google-calendar: 401 Unauthorized
2026-04-14 08:00:02 [gateway] Token refresh failed: invalid_grant
2026-04-14 08:00:03 [agent] skill daily-standup: dependency google-calendar-read failed — aborting run
```

## Root Cause

The Google Calendar MCP OAuth token expired after 7 days without a refresh. The Hermes MCP config is using a short-lived token rather than a refresh token flow. This will recur every 7 days until the auth flow is updated.

## Fix

1. Re-authorize the Google Calendar MCP: `hermes mcp reauth google-calendar`
2. Confirm the new token is written to `~/.hermes/config.json`
3. Update the MCP config to use offline access (refresh token): add `"access_type": "offline"` to the Google Calendar MCP auth block

## Prevention

- Add a daily health check cron that pings each MCP server and sends a Telegram alert if any return 401 or connection refused
```
