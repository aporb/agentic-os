---
name: meeting-prep
description: Pull everything known about a person or company before a meeting — calendar context, vault intel, and fresh web research — into one read-before-you-dial brief.
version: 1.0.0
trigger:
  - "prep for my meeting"
  - "meeting prep"
  - "prepare for a call"
  - "research before my meeting"
  - "brief me before my call"
  - "what do I know about this person"
  - "call prep"
  - "prep for my call with"
  - "get me ready for my meeting with"
integrations:
  - google-calendar-read
  - vault-sqlite-fts5
  - web-search-ddgr-gogcli
inputs:
  - name: person_or_org
    description: Name of the person or company you're meeting (e.g. "Sarah Kim" or "Nexus Media")
    required: true
  - name: purpose
    description: What the meeting is about (e.g. "first sales call", "partnership discussion", "advisor check-in")
    required: false
  - name: meeting_date
    description: Date/time of the meeting if not pulling from calendar (defaults to next calendar event matching the person)
    required: false
output_artifact: "journal/YYYY-MM-DD-meeting-prep-[slug].md"
frequency: on-demand
pack: ceo
---

## When to run

Run this 30–60 minutes before any meeting that matters: a first sales call, a partnership conversation, an investor check-in, an advisor call with a new contact. The cost of showing up uninformed is not just embarrassment — it's the deal that doesn't close because you asked a question Google could have answered, or the partnership that stalls because you didn't know the other party had just pivoted.

This skill earns its keep most on cold meetings where you've never met the person and have 45 minutes to build enough rapport to move something forward.

## What you'll get

A one-page brief with everything you need to walk into the meeting ready to listen instead of scrambling to learn. Calendar context, your prior history with this person or org, web intel on their current situation, and a short list of prepared questions and likely friction points. The brief turns a cold meeting into a warm one and a warm meeting into a deal-ready one.

## Steps

1. Search Google Calendar via MCP for events matching `person_or_org`. Look back 90 days and forward 30 days. Pull: event title, time, attendees, description, and any linked documents.
2. If `meeting_date` is provided, retrieve that specific event. Otherwise, use the next upcoming event matching the person or org name.
3. Extract any context from the calendar event description (agenda, pre-read links, notes added by attendees).
4. Search the vault for any existing wiki or journal pages mentioning this person or organization: `sqlite3 vault.db "SELECT path, title, snippet(pages, 0, '<b>', '</b>', '...', 20) FROM pages WHERE pages MATCH '<person_or_org>' ORDER BY rank LIMIT 10;"`. Read any matching pages in full.
5. Check if there is an existing prospect page (`wiki/prospect-[slug].md`) or intel page (`wiki/intel-[slug].md`) for this person or org. If yes, read it fully — it is the highest-trust prior context.
6. Run web search for the person or organization. Queries to run (using ddgr then gogcli fallback):
   - `"<person_or_org>" professional background site:linkedin.com`
   - `"<person_or_org>" news 2025 2026`
   - If org: `"<org_name>" funding OR revenue OR launched OR "raised" 2025 2026`
   - If person is a founder/exec: `"<name>" "<org>" announcement OR interview OR "said"`
7. Synthesize web findings. Prioritize: recent news (last 90 days), funding events, product launches, leadership changes, public statements. Discard generic bios.
8. Draft the meeting brief in the output format. Tailor the "Prepared Questions" section to the `purpose` if provided. If purpose is a sales call, the questions should qualify budget, timeline, and decision process. If it's a partnership call, focus on mutual leverage and what each side brings. If it's an advisor call, focus on specific asks.
9. Keep the brief to one reading length — no more than 600 words in the body. If you have more research, distill to what matters for this specific meeting.
10. Save the brief as `journal/YYYY-MM-DD-meeting-prep-[slug].md` where the date is the meeting date and the slug is a lowercase kebab-case version of `person_or_org`.

## Output format

```yaml
---
type: journal
title: "Meeting Prep — [Person/Org] — YYYY-MM-DD"
created: YYYY-MM-DDThh:mm:00
updated: YYYY-MM-DDThh:mm:00
status: draft
tags: [meeting-prep, ceo, [person-slug]]
sources: [google-calendar, vault, web-search]
meeting_time: YYYY-MM-DDThh:mm:00
meeting_purpose: "[purpose string]"
person_or_org: "[name]"
---
```

```markdown
# Meeting Prep — [Name] — [Date]

## The Meeting
- **When:** [day, date, time, timezone]
- **Format:** [call / video / in-person]
- **Purpose:** [what this meeting is for]
- **Their ask or your ask:** [who initiated and why]

## Who They Are
[2–4 sentences. Role, org, what they do. Recent news if any. Keep this factual.]

## Prior History
[Any vault context — previous calls, emails, deals. If none: "No prior history in vault."]

## Current Situation (web intel)
[2–4 bullet points. Recent news, funding, product moves, public statements.
Each bullet cites the source URL in parentheses.]

## What They Likely Want From This Meeting
[1–3 sentences. Your read on their agenda, not yours.]

## What You Want From This Meeting
[1–3 sentences. Your specific outcome — what does success look like?]

## Prepared Questions
1. [Question — why you're asking it]
2. [Question]
3. [Question]

## Potential Friction
- [Risk or objection you might face — how you plan to handle it]
- [Second risk]
```

## Example output (truncated)

```markdown
# Meeting Prep — Sarah Kim / Nexus Media — 2026-04-29

## The Meeting
- **When:** Tuesday Apr 29, 10:00am ET
- **Format:** Zoom (link in calendar)
- **Purpose:** First sales call — inbound, Sarah filled out the demo form Apr 24
- **Their ask:** Wants to see how the CEO Pack handles investor update drafting

## Who They Are
Sarah Kim, co-founder and CEO at Nexus Media. They run a B2B newsletter business
doing ~$600K ARR (per their Substack public stats). Sarah was previously head of
content at Archetype Group. Two-person team; no dedicated ops person.

## Prior History
No prior history in vault. Fresh contact.

## Current Situation (web intel)
- Nexus announced a paid-tier launch in March 2026, targeting $1M ARR by Q4
  (linkedin.com/in/sarahkim-nexus, Mar 12 2026)
- Interview with Creator Economy Weekly: "We're drowning in ops work; editorial
  is the only thing we want to spend time on." (creatoreconomyweekly.com, Feb 2026)

## What They Likely Want
A demo of investor-update-draft and possibly weekly-review. She's the ops bottleneck
and she knows it — she wants to see if this handles the real work.

## Prepared Questions
1. What does your current investor update process look like — how long does it take?
2. Which operational task costs you the most time each week?
3. If you had 5 extra hours back per week, where would they go first?
```
