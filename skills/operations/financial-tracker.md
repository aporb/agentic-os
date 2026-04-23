---
name: financial-tracker
description: Track income, expenses, and runway from your journal entries.
version: 1.0.0
trigger: "financial tracker", "track expense", "log revenue", "runway check", "burn rate"
---

# Financial Tracker

Log financial events and track your runway. Not a replacement for accounting software — a founder's quick-reference financial picture.

## When to Use

- You want to log a payment received or expense made
- You want to see your current financial picture
- You're checking how much runway you have

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| action | Yes | `log` (add an entry) or `report` (see summary) |
| amount | No | Dollar amount (for `log`) |
| type | No | `income` or `expense` (for `log`) |
| description | No | What it was for (for `log`) |

## Steps

### For `log`:
1. **Record the entry** — Append to `journal/financial-log.md`:
   ```markdown
   ## YYYY-MM-DD
   - [income/expense] $AMOUNT — Description
   ```
2. **Confirm** — Show the entry back to the user for confirmation.

### For `report`:
1. **Read the log** — Parse `journal/financial-log.md`
2. **Calculate**:
   - Total income this month
   - Total expenses this month
   - Net for the month
   - Runway estimate (if monthly burn is known: months remaining at current rate)
3. **Present** — Show the summary directly.

## Output

**For log**: Entry appended to `journal/financial-log.md`
**For report**: Direct delivery — income, expenses, net, runway

## Pitfalls

- **Not a bookkeeper**: This is for quick founder-level tracking. Real accounting needs real software.
- **Missing entries**: The tracker is only as good as what you log. Make it a habit to log right after transactions.
