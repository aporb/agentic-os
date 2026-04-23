# Local Automations

Automations that run on your machine. They can access your files, local CLIs, browser, and apps.

## When to Use Local

- The task reads or writes files on your computer
- The task uses a CLI tool installed locally
- The task interacts with your browser or desktop apps
- You want more control over execution and data privacy

## Common Local Automations

| Automation | Schedule | What It Does |
|------------|----------|-------------|
| Vault sync | On commit | Syncs wiki changes to git |
| Deep research | On demand | Runs multi-source research using local CLIs |
| Weekly review | Friday 4PM | Reads your journal, generates weekly summary |
| Financial log | On demand | Tracks income/expenses to local file |

## Setup

Local automations typically use:
- **Claude Code**: `claude schedule` for local scheduled tasks
- **cron** (Linux/Mac): `crontab -e` to add scheduled commands
- **launchd** (Mac): plist files in `~/Library/LaunchAgents/`
- **Task Scheduler** (Windows): via GUI or `schtasks`

## Always-On Machine

For local automations to work while you're away, your computer needs to be on. Options:
- **Mac Mini**: Popular for this — low power, always on, runs all local automations
- **VPS**: Rent a server ($5-20/month) and run automations there
- **Your laptop**: Works if you don't mind leaving it open
