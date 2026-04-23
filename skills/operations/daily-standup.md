---
name: daily-standup
description: Generate a morning briefing from your vault — what's on deck, what's blocked, what happened yesterday.
version: 1.0.0
trigger: "morning standup", "daily standup", "what's on deck", "start my day", "morning brief"
---

# Daily Standup

Your morning check-in. Pulls from your journal, wiki, and task tracking to tell you what matters today.

## When to Use

- First thing in the morning, before you start working
- You say "start my day", "morning standup", "what's on deck"

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| date | No | Defaults to today |

## Steps

1. **Read yesterday's journal** — Check `journal/` for the most recent entry. What did you plan to do? What actually happened?
2. **Check open items** — Search wiki for any pages with `status: draft`, `status: in-progress`, or `status: blocked`. These are your open loops.
3. **Scan for deadlines** — Search journal and wiki for any dates mentioned in the next 7 days.
4. **Generate the standup**:
   - **Done** (yesterday): What you completed
   - **Doing** (today): Top 3 priorities
   - **Blocked**: Anything you're waiting on
   - **Watch**: Upcoming deadlines or commitments in next 7 days
5. **Present** — Deliver directly. No file save needed — this is ephemeral.

## Output

Direct delivery. 3-5 sentences max per section. Scannable.

```
## Done (Yesterday)
- Completed X
- Shipped Y

## Doing (Today)
1. [Most important task]
2. [Second priority]
3. [Third priority]

## Blocked
- Waiting on [thing] from [person]

## Watch
- [Deadline] coming up on [date]
```

## Pitfalls

- **10-item to-do lists**: Three priorities, not ten. If everything is important, nothing is.
- **No follow-through**: If the same item appears in "Doing" three days in a row, flag it. Either do it, delegate it, or drop it.
