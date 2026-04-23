# Remote Automations

Automations that run in the cloud. They work even when your computer is off.

## When to Use Remote

- The task only needs web access (searching, fetching URLs)
- Output can go to GitHub, email, or a chat platform
- You want it to run reliably regardless of your computer's state
- The task doesn't need local files or tools

## Common Remote Automations

| Automation | Schedule | What It Does |
|------------|----------|-------------|
| Daily brief | Every morning 7AM | Searches news, delivers summary to chat/GitHub |
| Competitor monitor | Daily | Checks competitor websites/repos for changes |
| Social content queue | 2x daily | Surfaces draft content for review |

## Setup

Remote automations typically use:
- **Claude Code**: Remote scheduled tasks (Anthropic's cloud)
- **GitHub Actions**: Free for public repos, 2000 min/month for private
- **Modal / AWS Lambda / Vercel Cron**: Serverless platforms with cron triggers

## The Daily Brief

The included `daily-brief.md` is a ready-to-use remote automation. Configure your topics in `brief-config.md` and set up the schedule. See `daily-brief.md` for full setup instructions.
