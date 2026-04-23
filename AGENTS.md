# AGENTS.md — Agent-Agnostic Instructions

This file provides operating instructions for any AI agent working in this vault — whether that's Claude Code, OpenAI Codex, OpenCode, Cursor, GitHub Copilot, or any other agentic harness.

## Read This First

**All operating rules live in `/schema/agent-protocol.md`.** That file is the single source of truth. This file adds agent-agnostic guidance for the Agentic OS.

## Architecture

This is an **Agentic OS** — four layers on top of a Second Brain:

| Layer | Path | Purpose |
|-------|------|---------|
| Memory | `sources/`, `wiki/`, `journal/` | Persistent knowledge across sessions |
| Skills | `skills/` | Repeatable procedures organized by domain |
| Automations | `automations/` | Scheduled tasks (local or remote) |
| Dashboard | `dashboard/` | Visual command center |

## Zone Access Rules

| Zone | Path | Owner | Agent Access |
|------|------|-------|-------------|
| Sources | `sources/` | Human | **Read only** |
| Wiki | `wiki/` | Agent | **Read + write** |
| Journal | `journal/` | Human + Agent | **Read + write** |
| Schema | `schema/` | Human | **Read only** (unless instructed) |
| Skills | `skills/` | Human | **Read** (follow when invoked) |
| Automations | `automations/` | Human | **Read** (follow when triggered) |

## Core Workflows

### Run a Skill
1. Read the skill file from `skills/[pack]/[skill-name].md`
2. Follow the steps exactly as written
3. Save output to the location specified in the skill

### Ingest a Source
1. Read the source file in `sources/`.
2. Update its frontmatter `status` to `reading`.
3. Create or update wiki pages in `wiki/` that synthesize the source content.
4. Use `[[source-filename]]` citations in wiki pages.
5. Update the source frontmatter `status` to `processed`.

### Research a Topic
1. Search existing wiki pages and sources for relevant content.
2. If gaps exist, research externally.
3. Save findings to wiki pages with proper citations.

### Daily Standup
1. Read yesterday's journal entry.
2. Check wiki for open items (`status: draft`, `status: in-progress`).
3. Present: Done, Doing, Blocked, Watch.

## Skill Packs

| Pack | Path | Skills |
|------|------|--------|
| Market Intel | `skills/market-intel/` | Competitor Research, Industry Trends |
| Content Engine | `skills/content-engine/` | Blog Post, Social Content, Newsletter |
| Sales Engine | `skills/sales-engine/` | Prospect Research, Outreach Email, Pitch Deck Section |
| Operations | `skills/operations/` | Daily Standup, Weekly Review, Meeting Prep, Financial Tracker |

## Key Rules

1. **Never modify `reviewed` or `stable` wiki pages** without explicit instruction.
2. **Never modify files in `sources/`.**
3. **Always include frontmatter** — see `/schema/agent-protocol.md` for formats.
4. **Flag contradictions** in `/wiki/contradictions.md`.
5. **No fabrication.** If the source doesn't say it, don't write it.
6. **One concept per wiki page.** Split broad pages.
7. **Check memory first.** Always search wiki and sources before researching from scratch.
8. **Write like a human.** No AI hedging, no em-dash abuse, no corporate jargon.

## Agent-Specific Files

Different agents use different instruction files. All point to the same source of truth:

| Agent | Instruction File |
|-------|-----------------|
| Claude Code | `CLAUDE.md` + `.claude/commands/` |
| Cursor | `.cursorrules` |
| GitHub Copilot | `copilot-instructions.md` |
| Other | This file (`AGENTS.md`) |
