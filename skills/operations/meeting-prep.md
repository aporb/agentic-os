---
name: meeting-prep
description: Prepare for a meeting by pulling everything you know about the person or company.
version: 1.0.0
trigger: "meeting prep", "prepare for meeting", "meeting with", "what do I know about"
---

# Meeting Prep

Pull everything you know about a person, company, or topic before a meeting. One-page prep doc, ready in 60 seconds.

## When to Use

- You have a meeting coming up
- You're meeting someone new and want context
- You need to remember what happened last time you talked

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| person_or_org | Yes | Name of the person or company |
| purpose | No | What the meeting is about |
| date | No | When the meeting is |

## Steps

1. **Search your vault** — Search wiki, sources, and journal for any mention of this person or company. Previous meetings, research, notes.
2. **Search externally** (if not in vault) — LinkedIn, company website, recent news. Quick scan, not deep research.
3. **Compile the prep**:
   - Who they are (2 sentences)
   - Previous interactions (if any, from vault)
   - What they care about (based on research)
   - Your goal for the meeting
   - 3 questions to ask
   - 1 thing to avoid saying
4. **Save** — Write to `journal/YYYY-MM-DD-meeting-prep-[slug].md`

## Output

**File**: `journal/YYYY-MM-DD-meeting-prep-[slug].md`

One page max. If you can't scan it in 30 seconds, it's too long.

## Pitfalls

- **Over-preparing**: A 15-minute coffee chat doesn't need a 3-page prep doc. Scale depth to meeting importance.
- **Not reviewing last time**: If you've met before, the most important thing is remembering what you discussed. Check the vault first.
