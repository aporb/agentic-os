---
name: daily-standup
description: What shipped yesterday, what's happening today, what's blocked — delivered to Telegram or saved as a journal note.
version: 1.0.0
trigger:
  - "morning standup"
  - "daily standup"
  - "what's on my plate today"
  - "what did I ship yesterday"
  - "start my day"
  - "morning briefing"
  - "what am I doing today"
  - "daily brief"
integrations:
  - google-calendar-read
  - vault-sqlite-fts5
  - telegram-send
inputs:
  - name: date
    description: Date to run the standup for (defaults to today)
    required: false
output_artifact: "journal/YYYY-MM-DD-standup.md"
frequency: cron:0 8 * * 1-5
pack: ceo
---

## When to run

Monday through Friday, 8am local time. The cron fires before you open Slack or email. Before you start reacting to other people's urgencies, you need 90 seconds of your own operating picture: what actually moved yesterday, what's on the calendar today, what can't proceed until something unblocks it. This skill gives you that picture without you having to reconstruct it from memory.

Run it manually any time you've been heads-down and lost the thread of what day it is.

## What you'll get

A tight three-section brief — Done / Doing / Blocked — pulled from your calendar and vault journal entries. Delivered to Telegram if configured, otherwise saved as a journal note you can open from the dashboard. The value is not speed; it's that you start every working day owning the operating picture instead of waiting for a Slack message to tell you what matters.

## Steps

1. Read today's date and determine the previous working day (skip weekends).
2. Read calendar events for today via Google Calendar MCP. Pull: event titles, times, attendees (first name only), and any event descriptions. Flag any event marked as "important" or with more than 2 attendees as a high-priority item.
3. Read calendar events from the previous working day to build the Done context.
4. Search the vault journal for entries from the previous working day: run `sqlite3 vault.db "SELECT path, title FROM pages WHERE path LIKE 'journal/%' AND date = '<PREV_DATE>' ORDER BY updated DESC LIMIT 10;"`. Extract any tasks marked done or projects mentioned.
5. Search the vault for any wiki pages updated in the last 24 hours: `sqlite3 vault.db "SELECT path, title FROM pages WHERE updated >= datetime('now', '-24 hours') AND path LIKE 'wiki/%' ORDER BY updated DESC LIMIT 5;"`. These are active work threads.
6. Scan today's journal entry if one exists already (user may have started it manually).
7. Identify blockers: look for any journal or wiki entries containing the words "blocked", "waiting on", "pending", "need from", or "stuck" updated in the last 48 hours.
8. Compose the standup brief in the output format below. Keep each section to 3–5 bullet points. If there is nothing to report in a section, write "Nothing to report" — do not omit the section.
9. If Telegram integration is configured, send the brief as a Telegram message. Format it as plain text (no markdown, Telegram renders it fine). Cap at 400 characters per section for readability on mobile.
10. Save the full brief as a journal entry at `journal/YYYY-MM-DD-standup.md`. If an entry already exists for today, append to it rather than overwriting.

## Output format

```yaml
---
type: journal
title: "Standup — YYYY-MM-DD"
created: YYYY-MM-DDT08:00:00
updated: YYYY-MM-DDT08:00:00
status: draft
tags: [standup, daily-ops, ceo]
sources: [google-calendar, vault-journal]
---
```

```markdown
# Standup — Monday, April 28 2026

## Done (yesterday)
- Sent investor update draft to Sarah — awaiting feedback
- Shipped auth bug fix, deployed to prod
- Reviewed and signed MSA with Kontrol Analytics

## Doing (today)
- 10am: Sales call with Nexus Media (Mehran — first meeting, context in meeting-prep note)
- Draft Q2 OKR progress check
- Follow up with Stratum Design on proposal — 5 days no reply

## Blocked
- Waiting on legal review of SAFE terms before countersigning
- Can't ship onboarding flow until Figma handoff from Priya (requested Wed)
```

## Example output (truncated)

```
Standup — Tue Apr 29 2026

DONE
• Closed Nexus Media deal — $4,200/mo, MSA signed
• Published Q2 OKR progress check to wiki
• Cold outreach batch: 8 emails sent via Gmail draft queue

DOING
• 9am: Advisor call w/ Marcus (prep note in journal)
• Draft investor update for May — Stripe MRR pull first
• Review Priya's Figma handoff for onboarding v2

BLOCKED
• Runway model needs updated burn figure — waiting on Mercury statement
• LinkedIn post set ready but needs image assets from Priya
```
