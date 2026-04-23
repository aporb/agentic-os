# Wiki

Synthesized knowledge — the agent's domain.

## What Goes Here

- Concept pages — explanations synthesized from multiple sources
- Entity pages — people, organizations, technologies
- Source index — cross-reference of all sources and their wiki pages
- Contradictions — unresolved conflicts across sources

## Rules

- **Agent writes, human reviews.** The agent creates and updates pages here.
- Pages with `status: reviewed` or `status: stable` cannot be modified by the agent without explicit instruction.
- Every file needs frontmatter. Copy `_template.md` as a starting point.
- Every claim must cite its source with `[[source-filename]]`.
- Link to related pages with `[[page-name]]`.

## Status Lifecycle

```
draft → reviewed → stable
```

- `draft`: Agent-created, not yet human-reviewed. Agent may modify.
- `reviewed`: Human has reviewed. Agent must not modify without instruction.
- `stable`: Authoritative. Agent must not modify without instruction.

## Frontmatter

```yaml
---
type: wiki
title: ""
created: {date}
updated: {date}
sources: [source-file-1, source-file-2]
status: draft
tags: []
---
```

## Special Pages

- `index.md` — Table of contents for the wiki
- `contradictions.md` — Register of conflicting information across sources
