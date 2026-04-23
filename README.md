# Agentic OS

**A starter template for turning any AI agent into your personal operating system.**

Memory. Skills. Automations. Dashboard. One repo. No code required.

## What Is This?

Agentic OS is an open-source template that turns your AI agent (Claude Code, Cursor, Copilot, or any other) into a complete operating system for your solo business or startup. It gives your agent:

- **Memory** — A knowledge base that remembers everything (the Second Brain)
- **Skills** — Repeatable procedures that produce consistent results every time
- **Automations** — Scheduled tasks that run even when you're not at your computer
- **Dashboard** — A visual command center for non-technical team members

## Who Is This For?

**Solo founders and small teams who want AI to run their operations.**

You don't need to be technical. If you can write a markdown file, you can use this template. The dashboard gives you buttons to press. The skills are written in plain English. The automations run on schedules you define.

## Quick Start

### Option 1: Use This Template

Click "Use this template" on GitHub to create your own repo from this structure.

### Option 2: Clone It

```bash
git clone https://github.com/aporb/agentic-os.git my-agentic-os
cd my-agentic-os
```

### Then

1. Open the repo in your AI agent (Claude Code, Cursor, etc.)
2. The agent reads `CLAUDE.md` (or `AGENTS.md` for non-Claude agents) and knows the architecture
3. Run any skill by name — "run the competitor-research skill for [company]"
4. Open `dashboard/index.html` in a browser for the visual command center

## Architecture

```
agentic-os/
├── CLAUDE.md              # Agent instructions (Claude Code)
├── AGENTS.md              # Agent-agnostic instructions (any agent)
├── .claude/commands/      # Claude Code slash commands
│
├── sources/               # Raw inputs (articles, transcripts, PDFs)
├── wiki/                  # Agent-synthesized knowledge base
├── journal/               # Daily notes, meeting prep, financial log
├── schema/                # Templates, tags, agent protocol
│
├── skills/                # Domain-organized skill packs
│   ├── market-intel/      # Competitor research, industry trends
│   ├── content-engine/    # Blog posts, social content, newsletters
│   ├── sales-engine/      # Prospect research, outreach, pitch decks
│   └── operations/        # Daily standup, weekly review, meeting prep
│
├── automations/           # Scheduled task templates
│   ├── local/             # Automations that run on your machine
│   └── remote/            # Automations that run in the cloud
│
└── dashboard/             # Visual command center (single HTML file)
```

## Skill Packs

| Pack | Skills | What It Does |
|------|--------|-------------|
| **Market Intel** | Competitor Research, Industry Trends | Know your market and competitors |
| **Content Engine** | Blog Post, Social Content, Newsletter | Create and distribute content |
| **Sales Engine** | Prospect Research, Outreach Email, Pitch Deck | Find and close customers |
| **Operations** | Daily Standup, Weekly Review, Meeting Prep, Financial Tracker | Run the business |

## The Four Zones

The knowledge base has four zones with different access rules:

| Zone | Path | Who Writes | Agent Access |
|------|------|-----------|-------------|
| Sources | `sources/` | You | Read only |
| Wiki | `wiki/` | Agent | Read + write |
| Journal | `journal/` | You + Agent | Read + write |
| Schema | `schema/` | You | Read only |

## Creating New Skills

1. Copy `skills/_skill-template.md`
2. Fill it in for your task
3. Test it 3 times
4. When output is consistent, add it to the skill pack

## Multi-Agent Support

Works with any AI agent:

| Agent | Instruction File |
|-------|-----------------|
| Claude Code | `CLAUDE.md` + `.claude/commands/` |
| Cursor | `.cursorrules` |
| GitHub Copilot | `copilot-instructions.md` |
| Any other | `AGENTS.md` |

## Philosophy

- **Plain English, no code.** Skills are markdown files, not scripts.
- **One task per skill.** A skill that does three things is three skills.
- **Memory first.** The agent checks what it already knows before researching from scratch.
- **Ship rough, improve from use.** Don't perfect the system upfront. Build skills for what you actually do every day.

## License

MIT

## Credits

Built on the [Second Brain Starter Template](https://github.com/aporb/second-brain-starter-template). Architecture inspired by [Chase AI's Agentic OS concept](https://www.youtube.com/watch?v=pfPi04pIfaw).
