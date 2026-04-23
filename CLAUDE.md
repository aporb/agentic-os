# CLAUDE.md — Agentic OS Instructions

You are operating inside an **Agentic OS** — a persistent operating system built on a Second Brain vault. You have memory, skills, automations, and a dashboard. Use all of them.

## Architecture

This vault has four layers:

1. **Memory** (sources → wiki → journal) — Persistent knowledge across sessions
2. **Skills** (skills/) — Repeatable procedures organized by domain
3. **Automations** (automations/) — Scheduled tasks (local or remote)
4. **Dashboard** (dashboard/) — Visual command center (single HTML file)

## Zone Access Rules

| Zone | Path | Your Access |
|------|------|-------------|
| Sources | `sources/` | **Read only** — never modify |
| Wiki | `wiki/` | **Read + write** — your primary output area |
| Journal | `journal/` | **Read + write** — daily notes, meeting prep, financial log |
| Schema | `schema/` | **Read only** unless explicitly instructed |
| Skills | `skills/` | **Read** — follow skill instructions when invoked |
| Automations | `automations/` | **Read** — follow automation configs when triggered |

## Core Workflows

### When the user asks to research something:
1. Check `wiki/` and `sources/` for existing knowledge first
2. If coverage exists, surface it — don't re-research
3. If gaps exist, research and save new wiki pages

### When the user asks to run a skill:
1. Read the skill file from `skills/[pack]/[skill-name].md`
2. Follow the steps exactly as written
3. Save output to the location specified in the skill

### When the user asks to create content:
1. Check wiki for relevant material
2. Follow the anti-AI-voice rules: no em-dashes, no hedging, no corporate jargon
3. Save drafts to `wiki/draft-[topic-slug].md`

## Skill Packs

- **market-intel**: Competitor research, industry trends
- **content-engine**: Blog posts, social content, newsletters
- **sales-engine**: Prospect research, outreach emails, pitch deck sections
- **operations**: Daily standup, weekly review, meeting prep, financial tracking

## Slash Commands

- `/ingest` — Process a source into the knowledge base
- `/research` — Deep research on a topic
- `/ask` — Answer a question from vault knowledge
- `/expand` — Expand a wiki page with more detail
- `/daily` — Daily journal entry
- `/status` — Vault status report
- `/sync` — Sync to git

## Key Rules

1. **Never modify sources.** They are the raw input.
2. **Always include frontmatter** on wiki pages.
3. **No fabrication.** If the source doesn't say it, don't write it.
4. **One concept per wiki page.** Split broad pages.
5. **Check memory first.** Always search before researching.
6. **Write like a human.** No AI hedging, no em-dash abuse, no corporate jargon.
