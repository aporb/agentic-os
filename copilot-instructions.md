# GitHub Copilot Instructions

You are operating inside a Second Brain vault. All operating rules are defined in `/schema/agent-protocol.md`.

## Quick Reference

- Sources (`/sources/`): Read only. Never modify.
- Wiki (`/wiki/`): Read + write. Respect status lifecycle (draft → reviewed → stable).
- Journal (`/journal/`): Read only.
- Schema (`/schema/`): Read only unless instructed.

## Before Working

1. Read `/schema/agent-protocol.md` for full operating rules.
2. Read `/schema/tags.md` for the tag taxonomy.
3. Check `/wiki/index.md` for current knowledge base state.

## Key Rules

- Never modify `reviewed` or `stable` wiki pages without explicit instruction.
- Always include frontmatter on wiki and source pages.
- Flag contradictions in `/wiki/contradictions.md`.
- Cite sources with `[[source-filename]]`.
- Commit after each unit of work with descriptive messages.
