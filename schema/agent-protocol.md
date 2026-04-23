# Agent Protocol

The operating rules for any AI agent working in this vault. This file is the single source of truth — CLAUDE.md, AGENTS.md, .cursorrules, and copilot-instructions.md all point here.

---

## Vault Architecture

This vault has four zones. Each has a different owner and different access rules.

| Zone | Path | Owner | Agent Access |
|------|------|-------|-------------|
| Sources | `/sources/` | Human curates, agent ingests | **Read only** |
| Wiki | `/wiki/` | Agent writes, human reviews | **Read + write** |
| Journal | `/journal/` | Human writes, agent reads | **Read only** |
| Schema | `/schema/` | Human sets rules, agent follows | **Read only** (unless explicitly instructed) |

### Zone Rules

1. **Sources are immutable.** The agent never modifies a file in `/sources/`. If a source needs correction, the human handles it. The agent can create new source files if asked, but cannot edit existing ones.

2. **Wiki is the agent's domain.** The agent creates and updates wiki pages. But once a page reaches `status: reviewed` or `status: stable`, the agent must not modify it without explicit human instruction.

3. **Journal is the human's domain.** The agent reads journal entries for context but never creates or edits them (except via `/daily`, which creates a scaffold the human then owns).

4. **Schema is law.** The agent follows the rules in `/schema/` without exception. If a schema rule conflicts with a user instruction, the agent flags the conflict and asks for resolution before proceeding.

---

## Frontmatter

Every page in `/sources/` and `/wiki/` must include YAML frontmatter. No exceptions.

### Source Frontmatter

```yaml
---
type: source
title: "Descriptive title"
created: YYYY-MM-DD
updated: YYYY-MM-DD
source_url: "https://..."        # original URL or path
author: "Name or organization"
status: unread | reading | processed
tags: [tag1, tag2]
---
```

### Wiki Frontmatter

```yaml
---
type: wiki
title: "Descriptive title"
created: YYYY-MM-DD
updated: YYYY-MM-DD
sources: [source-file-1, source-file-2]   # references to /sources/ files
status: draft | reviewed | stable
tags: [tag1, tag2]
---
```

### Journal Frontmatter

```yaml
---
type: journal
title: "YYYY-MM-DD"
created: YYYY-MM-DD
tags: [journal, tag1]
---
```

## Status Lifecycle

### Source Status

```
unread → reading → processed
```

- `unread`: Ingested but not yet synthesized into wiki pages.
- `reading`: Agent is actively working with this source.
- `processed`: Source has been fully synthesized. All relevant wiki pages created or updated.

### Wiki Status

```
draft → reviewed → stable
```

- `draft`: Agent-created, not yet human-reviewed. Agent may modify freely.
- `reviewed`: Human has reviewed and approved. Agent must not modify without explicit instruction.
- `stable`: Long-standing, well-established page. Agent must not modify without explicit instruction and should treat the content as authoritative.

**The agent never changes a wiki page from `reviewed` or `stable` back to `draft`.** Only the human can downgrade status.

---

## Writing Rules

1. **Write in the user's voice.** Match their tone, vocabulary, and level of formality. If you don't know their voice yet, default to clear, direct, professional.

2. **No hedging.** Do not write "it seems that" or "one could argue." State what the sources say. If sources conflict, flag the contradiction.

3. **Cite sources.** Every claim in a wiki page must reference its source file. Use `[[source-filename]]` syntax for internal links.

4. **Use wikilinks.** Link to other wiki pages with `[[page-name]]` syntax. Link to sources with `[[source-filename]]`. This builds the knowledge graph.

5. **Flag contradictions.** When sources disagree, do not silently pick one. Create or update `/wiki/contradictions.md` with the conflict and wait for human resolution.

6. **No fabrication.** If the source doesn't say it, don't write it. If you're inferring, label it explicitly: `[inference]`.

7. **One concept per page.** Wiki pages should be atomic — one topic, one page. If a page grows too broad, split it.

---

## Tag Taxonomy

Tags are defined in `/schema/tags.md`. Use only tags from the taxonomy. If no existing tag fits, use the closest match and suggest a new tag to the human.

---

## Contradictions

When the agent discovers conflicting information across sources:

1. Do not silently resolve the conflict.
2. Add an entry to `/wiki/contradictions.md` with:
   - The conflicting claims
   - The sources for each claim
   - A suggested resolution (if the agent has enough context)
3. Set the wiki page status to `draft` and note the contradiction in the page body.
4. Wait for human resolution before marking the page `reviewed` or `stable`.

---

## Date/Time

**Always run `date +%Y-%m-%d` (or equivalent for your platform) to get the local system date before creating or updating any file.** Never infer the date from timestamps, session metadata, or internal clocks. The system clock is the single source of truth for dates.

When running on behalf of a human who may be in a different timezone, use the system date as-is — it reflects the machine's local time, which is correct for the vault's context.

Use this date for:
- `created` and `updated` fields in frontmatter
- Journal filenames (`YYYY-MM-DD.md`)
- Commit messages with dates

---

## Git Workflow

### Commit Discipline

- Commit after each meaningful unit of work (e.g., after ingesting a source, after creating a wiki page, after a journal entry).
- Write clear commit messages: `ingest: source-name`, `wiki: page-name`, `journal: YYYY-MM-DD`, `schema: update-tag-taxonomy`.
- Never commit empty or meaningless changes.

### Branching

For solo use, committing to `main` is fine. For collaborative vaults:
- Create a branch per session: `agent/YYYY-MM-DD-topic`
- Merge to `main` after human review.

### Sync

The `/sync` command or `scripts/sync.sh` handles: `git pull → git add → git commit → git push`.

---

## What the Agent Does NOT Do

- Delete files (only the human deletes)
- Modify `reviewed` or `stable` wiki pages without explicit instruction
- Change schema rules
- Push to remote without being asked
- Fabricate information not present in sources
- Resolve contradictions without human input
- Modify journal entries (except creating the daily scaffold via `/daily`)
