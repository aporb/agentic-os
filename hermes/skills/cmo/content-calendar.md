---
name: content-calendar
description: Build a 4-week content calendar from business goals and themes, saved to the vault and written to Google Calendar as publish-date events.
version: 1.0.0
trigger:
  - "build a content calendar"
  - "content calendar for next month"
  - "plan my content"
  - "plan content for the month"
  - "content plan"
  - "what should I publish this month"
  - "monthly content plan"
  - "schedule content"
integrations:
  - vault-sqlite-fts5
  - google-calendar-write
  - google-calendar-read
inputs:
  - name: month
    description: The month the calendar covers — e.g. "May 2026" or "next month"
    required: true
  - name: goals
    description: The 1–3 business goals content should serve this month — e.g. "generate leads from technical founders, build authority on AI ops"
    required: true
  - name: channels
    description: "Channels to plan for — e.g. 'newsletter, linkedin, blog'. Default: newsletter, linkedin"
    required: false
  - name: cadence
    description: "How often per channel — e.g. 'newsletter: weekly, linkedin: daily, blog: 2x/month'. Default: newsletter weekly, linkedin 3x/week"
    required: false
output_artifact: "wiki/content-calendar-YYYY-MM.md"
frequency: on-demand-or-cron
pack: cmo
---

## When to run

The last Friday of the prior month, or the first Monday of the new month. Run it before you start writing anything, not after you've already published three pieces ad hoc. A calendar built before the month forces the through-line between posts that ad hoc publishing never achieves.

Run it again mid-month if the business context shifted — a big win, a product launch, a pivot. The calendar is a plan, not a contract.

## What you'll get

A 4-week content calendar in two forms. First, a vault wiki page with every planned piece: date, channel, topic, angle, format, and a one-line content brief. Second, Google Calendar events for each publish date with the piece title as the event name, so the calendar shows up in your weekly view and you can't pretend it doesn't exist.

The calendar is driven by your goals, not by generic content advice. If your goal this month is lead generation from technical founders, the calendar reflects that — it doesn't produce a mix of "tips and tricks" posts to fill slots.

## Steps

1. Parse `month`, `goals`, `channels`, and `cadence`. Resolve "next month" to the actual YYYY-MM. Determine the date range (1st through last day of the month). Identify all working days in the range.

2. Check Google Calendar for the target month via Google Calendar MCP. Pull any existing events that might affect content cadence: product launches, conferences, travel blocks, scheduled calls with key customers. A newsletter can't go out on the day you're presenting at a conference; flag those conflicts.

3. Search the vault for the prior month's calendar: `sqlite3 vault.db "SELECT path, title FROM pages WHERE path LIKE 'wiki/content-calendar-%' ORDER BY updated DESC LIMIT 3;"`. Read the most recent one. Note: which themes ran, which channels were used, what performed well if noted. Don't repeat a newsletter theme covered in the last 4 weeks.

4. Search the vault for wiki pages relevant to each goal: `sqlite3 vault.db "SELECT path, title FROM pages WHERE pages MATCH '<goal-keywords>' ORDER BY rank LIMIT 10;"`. These wiki pages are source material for specific planned pieces. Where a piece can draw directly from a vault page, note the source in the content brief.

5. Map the business goals to content angles for each week. A goal like "build authority on AI ops for solo founders" maps to angles such as: (a) a problem this audience has that's not widely discussed, (b) a specific method or system you use, (c) a result or case from your own work, (d) a contrarian take on a common approach in this space. Assign one primary angle per week, then vary execution across channels.

6. Build the calendar week by week. For each piece:
   - **Date:** the specific publish date
   - **Channel:** newsletter, linkedin, blog, or other
   - **Title or working title:** specific enough to write from — not "AI post" but "Why most founders' AI stacks solve the wrong problem"
   - **Format:** long-form, short take, curated links, tactical breakdown, case study, etc.
   - **Angle:** one sentence stating what argument or story this piece makes
   - **Source:** vault wiki page slug if a piece can draw from existing research, or "fresh research needed"
   - **Goal served:** which of the month's 1–3 goals this piece directly serves

7. Check for week-level coherence: each week's pieces across channels should share a through-line, not be disconnected items. Monday's LinkedIn post should relate to Thursday's newsletter, which should relate to any blog content that week. This is what makes a content calendar a strategy rather than a schedule.

8. Check for month-level arc: the 4 weeks should build on each other. Week 1 might introduce the month's core claim. Week 2 provides evidence or examples. Week 3 addresses the counterargument or goes deeper on one angle. Week 4 gives the practical implication or call to action. This is optional but significantly increases the value of a 4-week run.

9. Create Google Calendar events for each piece's publish date. Event title: "[Channel] — [piece title]". Event duration: 30 minutes at the planned publish time. Event description: the one-line angle brief from step 6. Color code if possible: newsletter = blue, blog = green, LinkedIn = orange (or whatever convention you establish — document it in the vault calendar page).

10. Save the full calendar to `wiki/content-calendar-YYYY-MM.md`.

11. Report back: confirm the vault page and calendar events created. Flag any week with fewer pieces than the cadence requires (so the user knows where they have gaps) and any piece marked "fresh research needed" (so they know which pieces need more prep time).

## Output format

```yaml
---
type: wiki
title: "Content Calendar — [Month YYYY]"
created: YYYY-MM-DDT00:00:00
updated: YYYY-MM-DDT00:00:00
status: draft
tags: [content-calendar, cmo, planning]
month: YYYY-MM
goals: [<goal-1>, <goal-2>]
channels: [newsletter, linkedin, blog]
---
```

```markdown
# Content Calendar — [Month YYYY]

**Goals this month:**
1. [Goal 1]
2. [Goal 2]

**Channels:** [newsletter, linkedin, blog]
**Cadence:** [newsletter: weekly | linkedin: 3x/week | blog: 2x/month]

---

## Week 1: [Date range] — Theme: [Week through-line]

| Date | Channel | Title | Format | Angle | Source | Goal |
|------|---------|-------|--------|-------|--------|------|
| Apr 28 | LinkedIn | [title] | Short take | [angle] | [[wiki-page]] | [goal] |
| Apr 30 | LinkedIn | [title] | Tactical | [angle] | Fresh research | [goal] |
| May 1 | Newsletter | [title] | Hybrid | [angle] | [[wiki-page]] | [goal] |
| May 2 | LinkedIn | [title] | Contrarian | [angle] | [[wiki-page]] | [goal] |

## Week 2: [Date range] — Theme: [Week through-line]

[Same table structure]

## Week 3: [Date range] — Theme: [Week through-line]

[Same table structure]

## Week 4: [Date range] — Theme: [Week through-line]

[Same table structure]

---

## Google Calendar events created

- [list of events with date, title, channel]

## Gaps and flags

- [Any week with under-cadence pieces]
- [Pieces requiring fresh research — flag for early prep]
```

## Example output (truncated)

```markdown
---
type: wiki
title: "Content Calendar — May 2026"
created: 2026-04-28T09:00:00
status: draft
tags: [content-calendar, cmo, planning]
month: 2026-05
goals: [generate leads from technical founders, build authority on AI ops]
channels: [newsletter, linkedin, blog]
---

# Content Calendar — May 2026

**Goals this month:**
1. Generate leads from technical founders evaluating AI ops tooling
2. Build demonstrated authority on AI operations for solo founders

**Channels:** newsletter, linkedin, blog
**Cadence:** newsletter weekly (Thursday), linkedin 3x/week, blog 2x/month

---

## Week 1: Apr 28 – May 2 — Theme: The coordination overhead problem

| Date | Channel | Title | Format | Angle | Source | Goal |
|------|---------|-------|--------|-------|--------|------|
| Apr 28 | LinkedIn | "Most AI advice solves the wrong problem" | Short take | Contrarian | [[wiki/coordination-overhead-research.md]] | Authority |
| Apr 30 | LinkedIn | "What 40% of your week is actually spent on" | Tactical | Specific result | Fresh research | Lead gen |
| May 1 | Newsletter | "Your AI stack is solving the wrong problems" | Hybrid | Main argument | [[wiki/coordination-overhead-research.md]] | Both |
| May 2 | LinkedIn | "The second brain vs. the productivity tool" | Short take | Contrarian | [[wiki/icp-current.md]] | Authority |
```
