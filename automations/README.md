# Automations

Automations run skills on a schedule or trigger — so your Agentic OS works even when you're not at your computer.

## Two Types of Automation

| Type | What It Means | When to Use |
|------|---------------|-------------|
| **Local** | Runs on your machine. Can access your files, CLIs, and local tools. | Tasks that need your files, browser, or local apps |
| **Remote** | Runs in the cloud. Works even when your computer is off. | Tasks that only need web access and write to GitHub/cloud |

## How to Choose

**Ask yourself:**
1. Does this task need files on my computer? → **Local**
2. Does this task need a CLI tool installed on my machine? → **Local**
3. Can this task be done entirely with web searches and writes to GitHub? → **Remote**

**Examples:**

| Task | Type | Why |
|------|------|-----|
| Morning news brief (web search → GitHub) | Remote | Doesn't need local files |
| Weekly report (reads local vault) | Local | Needs access to your journal and wiki |
| Competitor monitoring (web search → save to vault) | Remote | Can push results to GitHub |
| Blog post drafting (reads sources, writes to vault) | Local | Needs local source files |

## Directory Structure

```
automations/
├── local/
│   ├── _automation-template.md
│   └── README.md
└── remote/
    ├── _automation-template.md
    ├── daily-brief.md
    └── README.md
```

## Setting Up Automations

### Local Automations
Use your agent's scheduled task feature:
- **Claude Code**: `claude schedule` or the desktop app's scheduler
- **Other agents**: cron jobs, launchd, or Windows Task Scheduler

### Remote Automations
Use your agent's cloud scheduling:
- **Claude Code**: Remote scheduled tasks (run in Anthropic's cloud)
- **GitHub Actions**: Cron-based workflows that run on GitHub's infrastructure
- **Other**: Any serverless platform (Modal, AWS Lambda, etc.)

## Creating a New Automation

1. Copy `_automation-template.md` from the appropriate directory
2. Define: what skill it runs, when it runs, where output goes
3. Set up the schedule in your agent
4. Monitor the first few runs to make sure output is consistent
