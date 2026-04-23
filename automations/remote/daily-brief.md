---
name: daily-brief
description: Automated morning news brief — searches configured categories, delivers a summary.
version: 1.0.0
---

# Daily Brief Automation

**Type:** Remote
**Schedule:** Every day at 7:00 AM (configurable)
**Skill used:** (custom — searches web for your configured topics)

## What It Does

Runs a set of web searches across your configured topic areas, deduplicates results, ranks by relevance, and delivers a condensed summary. Saves full brief to the vault.

## Configuration

Create a file at `automations/remote/brief-config.md` with your topic areas and search queries. Example:

```markdown
# Brief Configuration

## Topics

### My Industry
- "[your industry] trends 2026"
- "[your industry] funding OR merger OR acquisition"
- "[your industry] new entrant OR startup"

### My Competitors
- "[competitor 1] news OR update"
- "[competitor 2] news OR update"

### My Customers
- "[customer industry] policy OR regulation change"
- "[customer industry] budget OR spending"
```

## Setup Instructions

### Claude Code Remote Task
1. Define your topics in `automations/remote/brief-config.md`
2. Create a Claude Code scheduled task that:
   - Reads your config file
   - Runs each search query via web search (24h recency filter)
   - Deduplicates across topics
   - Scores results (keep only high-relevance)
   - Formats a summary
   - Saves full brief to `journal/YYYY-MM-DD-morning-brief.md`
3. Set schedule to your preferred time

### GitHub Actions Alternative
1. Create `.github/workflows/daily-brief.yml`
2. Runs on cron schedule
3. Writes output to a repo file or sends via webhook

## Monitoring

- Check the vault for today's brief file — if it exists, the automation ran
- If the brief is empty or has only low-signal results, your queries may need tuning
- Review weekly and adjust search terms based on what you actually read

## Pitfalls

- **Query drift**: Search queries that are too broad return noise. Too narrow miss things. Tune based on engagement.
- **API limits**: Web search APIs have daily quotas. 10-15 queries per brief is sustainable on most plans.
- **Notification fatigue**: If the brief is too long, you'll stop reading it. Keep it under 1000 words.
